import QRCode from "qrcode";
import { StorageService } from "./storageService";
import { OFFICE_LOCATION } from "../data/officeLocation";
import { getNepalDateTimeString, getNepalISODate } from "../utils/dateTimeUtils";

/**
 * QR Code Service for Employee Attendance System (EAS)
 * Handles token generation, QR payload creation, QR image generation,
 * and secure payload validation.
 * 
 * NOTE ON SECURITY:
 * This is currently a client-side prototype. In a production deployment,
 * token signing (e.g. HMAC-SHA256 or asymmetric JWT) and validation MUST
 * be performed server-side via POST /api/attendance/qr-scan to prevent
 * client-side tampering and replay attacks.
 */

// Badge validity duration in minutes
export const BADGE_EXPIRY_MINUTES = 60;

/**
 * Generates an encrypted/tokenized employee badge payload
 * @param {Object} employee 
 * @returns {Object} payload
 */
export function createEmployeeBadgePayload(employee) {
  if (!employee) return null;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + BADGE_EXPIRY_MINUTES * 60 * 1000);

  // Simulated secure payload token incorporating employee metadata and salt
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const token = `eas_emp_v1_${employee.id}_${now.getTime()}_${randomSuffix}`;

  return {
    type: "EAS_EMPLOYEE",
    version: "1.0",
    employeeId: employee.id,
    employeeName: employee.name,
    department: employee.department || "General",
    office: OFFICE_LOCATION.organization,
    token: token,
    generatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    displayGeneratedTime: getNepalDateTimeString(now),
    displayExpiryTime: getNepalDateTimeString(expiresAt),
  };
}

/**
 * Generates an Official Office Terminal Kiosk QR payload
 * Employees scan this terminal QR to mark attendance at office entry.
 * @returns {Object} payload
 */
export function createOfficeTerminalPayload() {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24hr terminal rotation

  return {
    type: "EAS_TERMINAL",
    version: "1.0",
    terminalId: "TERM-KTM-01",
    terminalName: "Gate 1 - Reception Terminal",
    office: OFFICE_LOCATION.organization,
    officeName: OFFICE_LOCATION.name,
    address: OFFICE_LOCATION.address,
    coordinates: {
      lat: OFFICE_LOCATION.latitude,
      lng: OFFICE_LOCATION.longitude,
    },
    token: `eas_term_ktm_${now.toISOString().split("T")[0]}_sec`,
    generatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Generates a high-resolution QR Code Data URL (PNG)
 * @param {Object|string} payload 
 * @param {Object} options 
 * @returns {Promise<string>} dataURL
 */
export async function generateQRCodeDataURL(payload, options = {}) {
  try {
    const text = typeof payload === "string" ? payload : JSON.stringify(payload);
    const dataUrl = await QRCode.toDataURL(text, {
      width: options.width || 320,
      margin: options.margin || 2,
      color: {
        dark: options.darkColor || "#0f172a",
        light: options.lightColor || "#ffffff",
      },
      errorCorrectionLevel: "H", // High error correction
    });
    return dataUrl;
  } catch (error) {
    console.error("Failed to generate QR code:", error);
    throw error;
  }
}

/**
 * Validates any scanned QR payload (supports both Terminal QR and Employee Badge QR)
 * Corresponds to future backend API: POST /api/attendance/qr-scan
 * 
 * @param {string} rawData - Scanned string from the camera
 * @param {Object} currentUser - Active logged-in user
 * @returns {Promise<{ valid: boolean, errorType?: string, message: string, payload?: Object, employee?: Object }>}
 */
export async function validateEmployeeQR(rawData, currentUser = null) {
  // Artificial network latency simulation for backend API readiness
  await new Promise((resolve) => setTimeout(resolve, 350));

  if (!rawData || typeof rawData !== "string") {
    return {
      valid: false,
      errorType: "INVALID",
      message: "Invalid EAS QR Code. No data detected.",
    };
  }

  let payload;
  try {
    payload = JSON.parse(rawData);
  } catch (err) {
    return {
      valid: false,
      errorType: "INVALID",
      message: "Invalid EAS QR Code format. Non-JSON payload.",
    };
  }

  // Check QR Type
  if (!payload || (payload.type !== "EAS_EMPLOYEE" && payload.type !== "EAS_TERMINAL")) {
    return {
      valid: false,
      errorType: "INVALID",
      message: "Invalid EAS QR Code. Unrecognized terminal or badge signature.",
    };
  }

  // Check Expiration
  if (payload.expiresAt) {
    const expiresTime = new Date(payload.expiresAt).getTime();
    if (isNaN(expiresTime) || Date.now() > expiresTime) {
      return {
        valid: false,
        errorType: "EXPIRED",
        message: "QR Code Expired. Please refresh your badge or rescan an active terminal.",
        payload,
      };
    }
  }

  // Handle Terminal QR (Employee scanning the Office Terminal)
  if (payload.type === "EAS_TERMINAL") {
    if (!currentUser) {
      return {
        valid: false,
        errorType: "AUTH_REQUIRED",
        message: "No active employee session found.",
      };
    }

    // Verify employee status
    const allEmployees = StorageService.getEmployees();
    const activeEmp = allEmployees.find(
      (e) => e.id === currentUser.id || e.email === currentUser.email
    );

    if (!activeEmp) {
      return {
        valid: false,
        errorType: "NOT_FOUND",
        message: "Employee profile not found in active records.",
      };
    }

    if (activeEmp.status && activeEmp.status.toLowerCase() !== "active") {
      return {
        valid: false,
        errorType: "INACTIVE",
        message: "Employee account is inactive. Please contact HR.",
      };
    }

    return {
      valid: true,
      mode: "TERMINAL_SCAN",
      message: "Terminal QR Verified Successfully",
      employee: activeEmp,
      terminal: payload,
      payload,
    };
  }

  // Handle Employee Badge QR (Kiosk scanning employee badge OR peer check)
  if (payload.type === "EAS_EMPLOYEE") {
    if (!payload.employeeId) {
      return {
        valid: false,
        errorType: "INVALID",
        message: "Invalid EAS QR Code. Missing Employee ID.",
      };
    }

    const allEmployees = StorageService.getEmployees();
    const matchedEmployee = allEmployees.find((e) => e.id === payload.employeeId);

    if (!matchedEmployee) {
      return {
        valid: false,
        errorType: "NOT_FOUND",
        message: `Employee ID ${payload.employeeId} does not exist in EAS records.`,
      };
    }

    if (matchedEmployee.status && matchedEmployee.status.toLowerCase() !== "active") {
      return {
        valid: false,
        errorType: "INACTIVE",
        message: `Employee ${matchedEmployee.name} is marked as Inactive. Attendance denied.`,
      };
    }

    return {
      valid: true,
      mode: "EMPLOYEE_BADGE",
      message: "Employee QR Badge Verified Successfully",
      employee: matchedEmployee,
      payload,
    };
  }

  return {
    valid: false,
    errorType: "INVALID",
    message: "Invalid EAS QR Code.",
  };
}

export const QRService = {
  createEmployeeBadgePayload,
  createOfficeTerminalPayload,
  generateQRCodeDataURL,
  validateEmployeeQR,
};

export default QRService;
