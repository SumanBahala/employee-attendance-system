import { StorageService } from "./storageService";
import { OFFICE_LOCATION } from "../data/officeLocation";
import {
  calculateWorkingHours,
  getNepalISODate,
  getNepalTimeString,
  getNepalDateTimeString,
} from "../utils/dateTimeUtils";

/**
 * Attendance Service for EAS
 * Implements centralized record management, check-in validation,
 * late arrival rules, and extended metadata schema supporting
 * MANUAL, QR, GPS, and QR_GPS methods.
 */

// Attendance Methods
export const ATTENDANCE_METHODS = {
  MANUAL: "MANUAL",
  QR: "QR",
  GPS: "GPS",
  QR_GPS: "QR_GPS",
};

/**
 * Determines current date in Nepal standard timezone (YYYY-MM-DD)
 * @returns {string}
 */
export function getCurrentAttendanceDate() {
  return getNepalISODate(new Date());
}

/**
 * Retrieves today's attendance record for an employee
 * Checks current Nepal date first; if empty and during demo mock testing,
 * checks today's or yesterday's record for initial state display.
 * @param {string} employeeId 
 * @returns {Object|null}
 */
export function getTodayAttendanceRecord(employeeId) {
  if (!employeeId) return null;
  const all = StorageService.getAttendance();
  const todayDate = getCurrentAttendanceDate();

  // Exact today match
  const todayRecord = all.find(
    (a) => a.employeeId === employeeId && a.date === todayDate
  );
  if (todayRecord) return todayRecord;

  // Fallback for mock environment if no record exists for today
  return null;
}

/**
 * Validates whether the employee can perform check-in today
 * @param {Object|null} todayRecord 
 * @returns {{ allowed: boolean, message?: string }}
 */
export function validateCheckInEligibility(todayRecord) {
  if (todayRecord && todayRecord.checkIn && todayRecord.checkIn !== "—") {
    return {
      allowed: false,
      message: `You have already checked in today at ${todayRecord.checkIn}. Multiple check-ins are not permitted.`,
    };
  }
  return { allowed: true };
}

/**
 * Checks if current time is considered late arrival (after 09:15 AM NST)
 * @param {string} [timeStr] 
 * @returns {boolean}
 */
export function isLateCheckInTime(timeStr) {
  const formatted = timeStr || getNepalTimeString(new Date(), false);
  const match = formatted.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return false;

  let [_, h, m, meridiem] = match;
  let hours = parseInt(h, 10);
  const minutes = parseInt(m, 10);

  if (meridiem.toUpperCase() === "PM" && hours < 12) hours += 12;
  if (meridiem.toUpperCase() === "AM" && hours === 12) hours = 0;

  // Grace period threshold: 09:15 AM
  return hours > 9 || (hours === 9 && minutes > 15);
}

/**
 * Creates and saves a verified attendance check-in record
 * 
 * Supports Part 13 schema requirements:
 * {
 *   employeeId,
 *   method,
 *   timestamp,
 *   qrVerified,
 *   gpsVerified,
 *   latitude,
 *   longitude,
 *   gpsAccuracy,
 *   distanceFromOffice,
 *   officeId,
 *   deviceInfo,
 *   status
 * }
 * 
 * @param {Object} params
 * @returns {Object} savedRecord
 */
export function markCheckIn({
  user,
  method = ATTENDANCE_METHODS.MANUAL,
  status = "Present",
  lateReason = "",
  qrData = null,
  gpsData = null,
  distanceFromOffice = null,
  deviceInfo = null,
}) {
  const now = new Date();
  const timeStr = getNepalTimeString(now, false);
  const dateStr = getCurrentAttendanceDate();
  const timestamp = now.toISOString();

  const isQr = method === ATTENDANCE_METHODS.QR || method === "QR Code";
  const isGps = method === ATTENDANCE_METHODS.GPS || method === "GPS Geofence";
  const isCombined = method === ATTENDANCE_METHODS.QR_GPS;

  // Determine human-readable location tag
  let locationLabel = "CodeedLabs Portal";
  if (isGps || isCombined) {
    locationLabel = `${OFFICE_LOCATION.name} (${Math.round(distanceFromOffice || 0)}m distance)`;
  } else if (isQr) {
    locationLabel = qrData?.terminalName || "Office Terminal Kiosk (QR Verified)";
  }

  // Device info signature
  const detectedDevice = deviceInfo || {
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Browser",
    platform: typeof navigator !== "undefined" ? navigator.platform : "Desktop",
    screen: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "Unknown",
  };

  const newRecord = {
    id: `ATT-${dateStr.replace(/-/g, "")}-${Date.now().toString().slice(-4)}`,
    employeeId: user.id,
    employeeName: user.name,
    department: user.department || "General",
    avatar: user.avatar || user.name.split(" ").map((n) => n[0]).join(""),
    date: dateStr,
    checkIn: timeStr,
    checkOut: "—",
    workingHours: "In Progress",
    status: status, // 'Present' or 'Late'
    method: isCombined ? "QR_GPS" : isGps ? "GPS" : isQr ? "QR" : "MANUAL",
    location: locationLabel,
    lateReason: lateReason || "",

    // Security & Verification metadata (Part 13)
    qrVerified: !!isQr || !!isCombined,
    gpsVerified: !!isGps || !!isCombined,
    qrPayload: qrData || null,
    latitude: gpsData?.latitude ?? null,
    longitude: gpsData?.longitude ?? null,
    gpsAccuracy: gpsData?.accuracy ?? null,
    distanceFromOffice: distanceFromOffice !== null ? Math.round(distanceFromOffice) : null,
    officeId: OFFICE_LOCATION.name,
    deviceInfo: detectedDevice,
    timestamp: timestamp,
    verifiedAtNepalTime: getNepalDateTimeString(now),
  };

  const all = StorageService.getAttendance();
  // Filter out any existing record for this user today
  const nextList = all.filter(
    (a) => !(a.employeeId === user.id && a.date === dateStr)
  );

  StorageService.saveAttendance([newRecord, ...nextList]);
  return newRecord;
}

/**
 * Marks check-out for the current todayRecord
 * @param {Object} todayRecord 
 * @returns {Object} updatedRecord
 */
export function markCheckOut(todayRecord) {
  const now = new Date();
  const timeStr = getNepalTimeString(now, false);
  const hours = calculateWorkingHours(todayRecord.checkIn, timeStr);

  const updatedRecord = {
    ...todayRecord,
    checkOut: timeStr,
    workingHours: hours,
  };

  const all = StorageService.getAttendance();
  const nextList = all.map((a) => (a.id === todayRecord.id ? updatedRecord : a));
  StorageService.saveAttendance(nextList);

  return updatedRecord;
}

export const AttendanceService = {
  ATTENDANCE_METHODS,
  getCurrentAttendanceDate,
  getTodayAttendanceRecord,
  validateCheckInEligibility,
  isLateCheckInTime,
  markCheckIn,
  markCheckOut,
};

export default AttendanceService;
