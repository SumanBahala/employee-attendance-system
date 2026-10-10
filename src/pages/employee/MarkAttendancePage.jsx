import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { StorageService } from "../../services/storageService";
import { AttendanceService, ATTENDANCE_METHODS } from "../../services/attendanceService";
import {
  calculateWorkingHours,
  getNepalDateString,
  getNepalISODate,
  getNepalTimeString,
} from "../../utils/dateTimeUtils";
import { AttendanceMethodTabs } from "../../components/attendance/AttendanceMethodTabs";
import { QRScanner } from "../../components/attendance/QRScanner";
import { QRBadge } from "../../components/attendance/QRBadge";
import { GPSGeofence } from "../../components/attendance/GPSGeofence";
import { OFFICE_LOCATION } from "../../data/officeLocation";
import "../../styles/employee.css";
import "../../styles/admin.css";

// Synthesize pleasant audio chime for check-in / check-out confirmation
function playAttendanceChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "triangle";
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc1.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.12); // G5
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.05); // E5
    osc2.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.22); // C6

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime + 0.05);
    osc1.stop(ctx.currentTime + 0.35);
    osc2.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Autoplay prevented
  }
}

export function MarkAttendancePage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeMethod, setActiveMethod] = useState("manual"); // 'manual' | 'qr' | 'gps'
  const [qrMode, setQrMode] = useState("scan"); // 'scan' | 'badge'
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [todayRecord, setTodayRecord] = useState(null);
  const [notification, setNotification] = useState(null);

  // Late arrival modal
  const [showLateModal, setShowLateModal] = useState(false);
  const [lateReason, setLateReason] = useState("");
  const [pendingCheckIn, setPendingCheckIn] = useState(null);

  // Live Nepal Time ticker (Asia/Kathmandu)
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(getNepalTimeString(new Date(), true));
      setCurrentDate(getNepalDateString(new Date()));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch today's record for active employee
  const loadTodayRecord = () => {
    if (!user) return;
    const all = StorageService.getAttendance();
    const todayDate = getNepalISODate(new Date());

    // Check today's date first
    const record = all.find(
      (a) => (a.employeeId === user.id || a.employeeName === user.name) && a.date === todayDate
    );
    setTodayRecord(record || null);
  };

  useEffect(() => {
    loadTodayRecord();
  }, [user]);

  // Initiate check in
  const initiateCheckIn = (method = "Manual", extraData = {}) => {
    setNotification(null);

    // Verify employee account is active (Part 9 Requirement 5)
    if (user?.status && user.status.toLowerCase() !== "active") {
      const msg = "Your employee account is marked as Inactive. Attendance punch is disabled.";
      setNotification({ type: "error", text: msg });
      showToast("error", msg);
      return;
    }

    if (todayRecord?.checkIn && todayRecord.checkIn !== "—") {
      const msg = `You have already checked in today at ${todayRecord.checkIn}. Multiple check-ins are not permitted.`;
      setNotification({ type: "warning", text: msg });
      showToast("warning", msg);
      return;
    }

    const timeStr = getNepalTimeString(new Date(), false);
    const isLate = AttendanceService.isLateCheckInTime(timeStr);

    if (isLate) {
      setPendingCheckIn({ method, extraData, timeStr });
      setShowLateModal(true);
      return;
    }

    executeCheckIn(timeStr, "Present", "", method, extraData);
  };

  const executeCheckIn = (timeStr, status, reason, method = "Manual", extraData = {}) => {
    const newRecord = AttendanceService.markCheckIn({
      user,
      method:
        method === "QR Code" || method === ATTENDANCE_METHODS.QR
          ? ATTENDANCE_METHODS.QR
          : method === "GPS Geofence" || method === ATTENDANCE_METHODS.GPS
          ? ATTENDANCE_METHODS.GPS
          : ATTENDANCE_METHODS.MANUAL,
      status: status,
      lateReason: reason || "",
      qrData: extraData.qrData || null,
      gpsData: extraData.gpsData || null,
      distanceFromOffice: extraData.distanceFromOffice ?? null,
    });

    setTodayRecord(newRecord);
    setShowLateModal(false);
    playAttendanceChime();

    const msg = `Checked in via [${method}] at ${timeStr}. Attendance status: "${status}".`;
    setNotification({ type: "success", text: msg });
    showToast("success", msg);
  };

  const submitLateCheckIn = () => {
    if (!pendingCheckIn) return;
    executeCheckIn(
      pendingCheckIn.timeStr,
      "Late",
      lateReason.trim() || "Late arrival",
      pendingCheckIn.method,
      pendingCheckIn.extraData
    );
  };

  // Check out
  const handleCheckOut = () => {
    setNotification(null);

    if (!todayRecord || !todayRecord.checkIn || todayRecord.checkIn === "—") {
      const msg = "Cannot check out: You have not checked in for today yet.";
      setNotification({ type: "error", text: msg });
      showToast("error", msg);
      return;
    }

    if (todayRecord.checkOut && todayRecord.checkOut !== "—") {
      const msg = `You have already checked out today at ${todayRecord.checkOut}. Record is closed.`;
      setNotification({ type: "warning", text: msg });
      showToast("warning", msg);
      return;
    }

    const updated = AttendanceService.markCheckOut(todayRecord);
    setTodayRecord(updated);
    playAttendanceChime();

    const msg = `Checked out at ${updated.checkOut}. Working duration today: ${updated.workingHours}.`;
    setNotification({ type: "success", text: msg });
    showToast("success", msg);
  };

  // Reset today's record (developer/testing utility)
  const handleResetToday = () => {
    if (!user) return;
    const all = StorageService.getAttendance();
    const todayDate = getNepalISODate(new Date());
    const filtered = all.filter(
      (a) => !(a.employeeId === user.id && a.date === todayDate)
    );
    StorageService.saveAttendance(filtered);
    setTodayRecord(null);
    setNotification(null);
    showToast("info", "Today's record reset. You can test checking in again.");
  };

  const isCheckedIn = !!todayRecord?.checkIn && todayRecord.checkIn !== "—";
  const isCheckedOut = !!todayRecord?.checkOut && todayRecord.checkOut !== "—";

  return (
    <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
      {/* Header */}
      <div className="portal-page-header">
        <div className="portal-page-title">
          <span style={{ fontSize: "11px", fontWeight: "700", color: "#6366f1", letterSpacing: "1px" }}>
            SMART ATTENDANCE TERMINAL
          </span>
          <h1>Mark Attendance</h1>
          <p>Punch your daily arrival and departure using Manual, QR Code, or GPS Geofencing.</p>
        </div>

        <div className="portal-header-actions">
          <Link
            to="/employee/my-attendance"
            style={{
              padding: "9px 16px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              color: "#334155",
              textDecoration: "none",
            }}
          >
            ← My Attendance Log
          </Link>
        </div>
      </div>

      {/* Notification banner */}
      {notification && (
        <div
          style={{
            padding: "14px 20px",
            borderRadius: "12px",
            marginBottom: "24px",
            fontSize: "14px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background:
              notification.type === "success"
                ? "#ecfdf5"
                : notification.type === "error"
                ? "#fef2f2"
                : "#fffbeb",
            color:
              notification.type === "success"
                ? "#065f46"
                : notification.type === "error"
                ? "#991b1b"
                : "#92400e",
            border: `1px solid ${
              notification.type === "success"
                ? "#a7f3d0"
                : notification.type === "error"
                ? "#fecaca"
                : "#fde68a"
            }`,
          }}
        >
          <span>{notification.type === "success" ? "✓" : "⚠"}</span>
          <span>{notification.text}</span>
        </div>
      )}

      {/* Main Terminal Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.45fr 1fr", gap: "24px", marginBottom: "28px" }}>
        {/* Left Column: Multi-Method Punch Terminal */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "18px",
            padding: "26px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          }}
        >
          {/* Enhanced Method Selection Tabs (Part 12) */}
          <AttendanceMethodTabs
            activeMethod={activeMethod}
            onChangeMethod={(newMethod) => {
              setActiveMethod(newMethod);
            }}
          />

          {/* METHOD 1: MANUAL PUNCH */}
          {activeMethod === "manual" && (
            <div>
              {/* Nepal Digital Clock Display */}
              <div
                style={{
                  background: "linear-gradient(135deg, #090e24 0%, #151e44 100%)",
                  borderRadius: "16px",
                  padding: "24px",
                  textAlign: "center",
                  color: "#ffffff",
                  marginBottom: "24px",
                  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.2)",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#818cf8", letterSpacing: "1.5px" }}>
                  NEPAL STANDARD TIME (UTC +05:45)
                </div>
                <div
                  style={{
                    fontSize: "36px",
                    fontWeight: "800",
                    fontFamily: "monospace",
                    letterSpacing: "2px",
                    margin: "10px 0 4px",
                    color: "#ffffff",
                  }}
                >
                  {currentTime || "--:--:-- --"}
                </div>
                <div style={{ fontSize: "13px", color: "#94a3b8" }}>{currentDate}</div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <button
                  type="button"
                  onClick={() => initiateCheckIn("Manual")}
                  disabled={isCheckedIn}
                  style={{
                    padding: "20px 16px",
                    borderRadius: "14px",
                    border: "none",
                    background: isCheckedIn
                      ? "#f1f5f9"
                      : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: isCheckedIn ? "#94a3b8" : "#ffffff",
                    fontSize: "15px",
                    fontWeight: "700",
                    cursor: isCheckedIn ? "not-allowed" : "pointer",
                    boxShadow: isCheckedIn ? "none" : "0 8px 20px rgba(16, 185, 129, 0.25)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.2s ease",
                  }}
                >
                  <span style={{ fontSize: "24px" }}>📥</span>
                  <span>{isCheckedIn ? "Checked In Today" : "Check In Now"}</span>
                  <span style={{ fontSize: "11px", fontWeight: "500", opacity: 0.85 }}>
                    {isCheckedIn ? `At ${todayRecord.checkIn}` : "Mark Arrival"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleCheckOut}
                  disabled={!isCheckedIn || isCheckedOut}
                  style={{
                    padding: "20px 16px",
                    borderRadius: "14px",
                    border: "none",
                    background:
                      !isCheckedIn || isCheckedOut
                        ? "#f1f5f9"
                        : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                    color: !isCheckedIn || isCheckedOut ? "#94a3b8" : "#ffffff",
                    fontSize: "15px",
                    fontWeight: "700",
                    cursor: !isCheckedIn || isCheckedOut ? "not-allowed" : "pointer",
                    boxShadow:
                      !isCheckedIn || isCheckedOut
                        ? "none"
                        : "0 8px 20px rgba(239, 68, 68, 0.25)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.2s ease",
                  }}
                >
                  <span style={{ fontSize: "24px" }}>📤</span>
                  <span>{isCheckedOut ? "Checked Out Today" : "Check Out Now"}</span>
                  <span style={{ fontSize: "11px", fontWeight: "500", opacity: 0.85 }}>
                    {isCheckedOut ? `At ${todayRecord.checkOut}` : "Mark Departure"}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* METHOD 2: QR CODE SCAN & BADGE */}
          {activeMethod === "qr" && (
            <div>
              {/* QR Submode Switcher */}
              <div style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
                <button
                  className={`pagination-btn ${qrMode === "scan" ? "active" : ""}`}
                  style={{ flex: 1, padding: "9px 12px", fontWeight: "700", borderRadius: "10px" }}
                  onClick={() => setQrMode("scan")}
                >
                  📷 Scan Office QR Terminal
                </button>
                <button
                  className={`pagination-btn ${qrMode === "badge" ? "active" : ""}`}
                  style={{ flex: 1, padding: "9px 12px", fontWeight: "700", borderRadius: "10px" }}
                  onClick={() => setQrMode("badge")}
                >
                  🪪 My QR Badge (Show to Kiosk)
                </button>
              </div>

              {qrMode === "scan" ? (
                /* Real Continuous Camera QR Scanner (Part 1) */
                <QRScanner
                  currentUser={user}
                  isCheckedIn={isCheckedIn}
                  onScanSuccess={({ qrData, employee }) => {
                    initiateCheckIn("QR Code", { qrData, employee });
                  }}
                  onSwitchToManual={() => setActiveMethod("manual")}
                />
              ) : (
                /* Real Dynamically Generated Employee QR Badge (Part 2) */
                <QRBadge employee={user} />
              )}
            </div>
          )}

          {/* METHOD 3: GPS GEOFENCE WITH LEAFLET NEPAL MAP (Parts 4-11) */}
          {activeMethod === "gps" && (
            <div>
              <GPSGeofence
                currentUser={user}
                isCheckedIn={isCheckedIn}
                onPunchSuccess={({ gpsData, distanceFromOffice, isDemo }) => {
                  initiateCheckIn("GPS Geofence", {
                    gpsData,
                    distanceFromOffice,
                    isDemo,
                  });
                }}
              />
            </div>
          )}
        </div>

        {/* Right Column: Today Status, Rules, and Testing Helper */}
        <div>
          {/* Status Overview Card */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "18px",
              padding: "24px",
              marginBottom: "20px",
              boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>
                Today's Punch Summary
              </h3>
              {isCheckedIn && (
                <button
                  onClick={handleResetToday}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    fontSize: "11px",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                  title="Reset today's record to test check-in again"
                >
                  Reset (Demo)
                </button>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ fontSize: "13px", color: "#64748b" }}>Date (Nepal):</span>
                <strong style={{ fontSize: "13px", color: "#334155" }}>
                  {todayRecord?.date || getNepalISODate(new Date())}
                </strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ fontSize: "13px", color: "#64748b" }}>Check In:</span>
                <strong style={{ fontSize: "13px", color: todayRecord?.checkIn ? "#10b981" : "#94a3b8" }}>
                  {todayRecord?.checkIn || "Not marked yet"}
                </strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ fontSize: "13px", color: "#64748b" }}>Check Out:</span>
                <strong style={{ fontSize: "13px", color: todayRecord?.checkOut ? "#ef4444" : "#94a3b8" }}>
                  {todayRecord?.checkOut || "Not marked yet"}
                </strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ fontSize: "13px", color: "#64748b" }}>Method Used:</span>
                <span className="badge badge-active">{todayRecord?.method || activeMethod.toUpperCase()}</span>
              </div>

              {todayRecord?.location && (
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>Terminal / Location:</span>
                  <span style={{ fontSize: "12px", color: "#1e40af", fontWeight: "600", maxWidth: "160px", textAlign: "right" }}>
                    {todayRecord.location}
                  </span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ fontSize: "13px", color: "#64748b" }}>Duration Worked:</span>
                <strong style={{ fontSize: "13px", color: "#2563eb" }}>
                  {todayRecord?.workingHours || "0h 0m"}
                </strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", color: "#64748b" }}>Attendance Status:</span>
                <span className={`badge badge-${todayRecord?.status ? todayRecord.status.toLowerCase() : "pending"}`}>
                  {todayRecord?.status || "Pending"}
                </span>
              </div>
            </div>
          </div>

          {/* Guidelines Card */}
          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "18px",
              padding: "20px",
              fontSize: "12px",
              color: "#1e40af",
              lineHeight: "1.6",
            }}
          >
            <h4 style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: "700" }}>Smart Verification Rules</h4>
            <ul style={{ margin: 0, paddingLeft: "16px" }}>
              <li>Official check-in begins at 09:00 AM NST.</li>
              <li>Grace period is provided until 09:15 AM NST.</li>
              <li>Arrivals after 09:15 AM require a late notice reason.</li>
              <li>
                <strong>QR Scanner:</strong> Points device camera at authorized terminal QR kiosk.
              </li>
              <li>
                <strong>GPS Geofence:</strong> Requires employee to be within {OFFICE_LOCATION.radiusMeters}m of {OFFICE_LOCATION.name}.
              </li>
              <li>High-accuracy GPS fix is required to prevent coordinate spoofing.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Late Arrival Reason Modal */}
      {showLateModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <div>
                <h2>Late Arrival Notice</h2>
                <p>The current time is past the 09:15 AM grace threshold.</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowLateModal(false)}>
                ✕
              </button>
            </div>
            <div className="field-group">
              <label className="field-label">Reason for Late Arrival *</label>
              <textarea
                className="field-textarea"
                rows={4}
                value={lateReason}
                onChange={(e) => setLateReason(e.target.value)}
                placeholder="e.g. Heavy traffic along Ring Road, vehicle breakdown, emergency appointment..."
              />
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowLateModal(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={submitLateCheckIn}
                disabled={!lateReason.trim()}
              >
                Confirm Late Check-In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarkAttendancePage;
