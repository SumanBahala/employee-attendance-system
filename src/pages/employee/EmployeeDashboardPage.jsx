import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { StorageService } from "../../services/storageService";
import { calculateWorkingHours, getNepalDateString, getNepalTimeString } from "../../utils/dateTimeUtils";
import "../../AdminDashboard.css";
import "../../styles/employee.css";

// Circular progress ring component
function ProgressRing({ percent, color, size = 90, strokeWidth = 9, label, value }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>{value}</span>
        </div>
      </div>
      <span style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", textAlign: "center" }}>{label}</span>
    </div>
  );
}

// Quick Action tile
function QuickAction({ icon, label, to, color, bg }) {
  return (
    <Link
      to={to}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
        padding: "20px 14px",
        background: bg,
        border: `1px solid ${color}30`,
        borderRadius: "16px",
        textDecoration: "none",
        color: "#0f172a",
        transition: "all 0.2s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${color}30`; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <span
        style={{
          width: "44px",
          height: "44px",
          background: `${color}18`,
          borderRadius: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
        }}
      >
        {icon}
      </span>
      <span style={{ fontSize: "12px", fontWeight: "700", color: "#334155", textAlign: "center" }}>{label}</span>
    </Link>
  );
}

export function EmployeeDashboardPage() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(getNepalTimeString(new Date(), true));
      setCurrentDate(getNepalDateString(new Date()));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;
    const allAttendance = StorageService.getAttendance();
    const userAttendance = allAttendance.filter(
      (a) => a.employeeId === user.id || a.employeeName === user.name
    );
    setAttendanceList(userAttendance);
    const todayRecord = userAttendance.find((a) => a.date === "2026-09-30");
    setTodayAttendance(todayRecord || null);
    const allBalances = StorageService.getLeaveBalances();
    setLeaveBalances(allBalances[user.id] || {
      annual: { total: 14, used: 2, available: 12 },
      sick: { total: 12, used: 1, available: 11 },
      casual: { total: 8, used: 1, available: 7 },
      emergency: { total: 5, used: 0, available: 5 },
    });
    const allHolidays = StorageService.getHolidays();
    setHolidays(allHolidays.slice(0, 4));
    const allNotifs = StorageService.getNotifications();
    setNotifications(allNotifs.slice(0, 4));
    const allLeaves = StorageService.getLeaveRequests();
    setLeaveRequests(allLeaves.filter((l) => l.employeeId === user.id || l.employeeName === user.name));
    setTimeout(() => setMounted(true), 50);
  }, [user]);

  const handleQuickCheckIn = () => {
    const timeStr = getNepalTimeString(new Date(), false);
    const updated = {
      id: `ATT-${Date.now()}`,
      employeeId: user.id,
      employeeName: user.name,
      department: user.department,
      avatar: user.avatar,
      date: "2026-09-30",
      checkIn: timeStr,
      checkOut: "—",
      workingHours: "In Progress",
      status: "Present",
      method: "Manual",
      lateReason: "",
    };
    setTodayAttendance(updated);
    const all = StorageService.getAttendance();
    const filtered = all.filter((a) => !(a.employeeId === user.id && a.date === "2026-09-30"));
    StorageService.saveAttendance([updated, ...filtered]);
  };

  const handleQuickCheckOut = () => {
    if (!todayAttendance?.checkIn) {
      alert("Please check in first before checking out.");
      return;
    }
    const timeStr = getNepalTimeString(new Date(), false);
    const hours = calculateWorkingHours(todayAttendance.checkIn, timeStr);
    const updated = { ...todayAttendance, checkOut: timeStr, workingHours: hours };
    setTodayAttendance(updated);
    const all = StorageService.getAttendance();
    const nextList = all.map((a) => a.id === todayAttendance.id ? updated : a);
    StorageService.saveAttendance(nextList);
  };

  // Attendance stats
  const totalDays = attendanceList.length;
  const presentDays = attendanceList.filter((a) => a.status === "Present").length;
  const lateDays = attendanceList.filter((a) => a.status === "Late").length;
  const absentDays = attendanceList.filter((a) => a.status === "Absent").length;
  const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
  const onTimePct = totalDays > 0 ? Math.round((presentDays / (presentDays + lateDays || 1)) * 100) : 0;

  const checkedIn = todayAttendance?.checkIn && todayAttendance.checkIn !== "—";
  const checkedOut = todayAttendance?.checkOut && todayAttendance.checkOut !== "—";
  const statusColor = todayAttendance?.status === "Present" ? "#10b981" : todayAttendance?.status === "Late" ? "#f59e0b" : "#94a3b8";

  const notifBadge = notifications.filter((n) => !n.read).length;
  const pendingLeaves = leaveRequests.filter((l) => l.status === "Pending");

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", animation: "fadeIn 0.4s ease" }}>
      {/* HERO BANNER */}
      <div
        style={{
          background: "linear-gradient(135deg, #0c1230 0%, #1e1b4b 50%, #2d1b69 100%)",
          borderRadius: "20px",
          padding: "30px 36px",
          color: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "24px",
          boxShadow: "0 12px 40px rgba(12, 18, 48, 0.3)",
          marginBottom: "24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative */}
        <div style={{ position: "absolute", top: "-30px", right: "140px", width: "180px", height: "180px", background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1.2px", color: "#a5b4fc", marginBottom: "8px" }}>
            ● EMPLOYEE WORKSPACE • CODEEDLABS EAS
          </div>
          <h1 style={{ fontSize: "26px", margin: "0 0 6px", fontWeight: "800", letterSpacing: "-0.5px" }}>
            Welcome back, {user?.name?.split(" ")[0] || "Team Member"}! 👋
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "#cbd5e1", maxWidth: "500px" }}>
            "Every day counts." — Your attendance, leaves, and schedule at a glance.
          </p>
          <div style={{ marginTop: "16px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {[
              { label: "Mark Attendance", to: "/employee/mark-attendance", icon: "📍" },
              { label: "Apply Leave", to: "/employee/leave", icon: "📋" },
              { label: "My Schedule", to: "/employee/schedule", icon: "📅" },
              { label: "History", to: "/employee/my-attendance", icon: "🕐" },
            ].map((q) => (
              <Link
                key={q.to}
                to={q.to}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 14px",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "20px",
                  color: "#e2e8f0",
                  fontSize: "12px",
                  fontWeight: "600",
                  textDecoration: "none",
                }}
              >
                <span>{q.icon}</span>
                {q.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Live clock */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.07)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "18px 24px",
            borderRadius: "16px",
            textAlign: "right",
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: "10px", color: "#a5b4fc", fontWeight: "700", letterSpacing: "1px", marginBottom: "6px" }}>
            KATHMANDU TIME (NPT)
          </div>
          <div style={{ fontSize: "26px", fontWeight: "800", color: "#fff", fontVariantNumeric: "tabular-nums" }}>
            {currentTime || "--:--:--"}
          </div>
          <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>{currentDate}</div>
          <div style={{ marginTop: "10px" }}>
            <span
              style={{
                fontSize: "10px",
                fontWeight: "700",
                background: checkedIn ? "rgba(16,185,129,0.2)" : "rgba(99,102,241,0.2)",
                color: checkedIn ? "#34d399" : "#a5b4fc",
                padding: "3px 10px",
                borderRadius: "12px",
                border: `1px solid ${checkedIn ? "rgba(16,185,129,0.3)" : "rgba(99,102,241,0.3)"}`,
              }}
            >
              {checkedIn ? (checkedOut ? "✓ Checked Out" : "● Active Session") : "◌ Not Checked In"}
            </span>
          </div>
        </div>
      </div>

      {/* TODAY ATTENDANCE CARD */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "18px",
          padding: "24px",
          marginBottom: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: "17px", fontWeight: "800", color: "#0f172a" }}>Today's Attendance</h2>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>{currentDate} — Quick check-in/out panel</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={handleQuickCheckIn}
              disabled={checkedIn}
              style={{
                padding: "10px 20px",
                background: checkedIn ? "#e2e8f0" : "linear-gradient(135deg, #10b981, #059669)",
                color: checkedIn ? "#94a3b8" : "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontWeight: "700",
                fontSize: "13px",
                cursor: checkedIn ? "not-allowed" : "pointer",
                boxShadow: checkedIn ? "none" : "0 4px 12px rgba(16,185,129,0.3)",
                transition: "all 0.2s ease",
              }}
            >
              ✓ Check In
            </button>
            <button
              type="button"
              onClick={handleQuickCheckOut}
              disabled={!checkedIn || checkedOut}
              style={{
                padding: "10px 20px",
                background: !checkedIn || checkedOut ? "#e2e8f0" : "linear-gradient(135deg, #ef4444, #dc2626)",
                color: !checkedIn || checkedOut ? "#94a3b8" : "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontWeight: "700",
                fontSize: "13px",
                cursor: !checkedIn || checkedOut ? "not-allowed" : "pointer",
                boxShadow: !checkedIn || checkedOut ? "none" : "0 4px 12px rgba(239,68,68,0.3)",
                transition: "all 0.2s ease",
              }}
            >
              ↪ Check Out
            </button>
            <Link
              to="/employee/mark-attendance"
              style={{
                padding: "10px 20px",
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontWeight: "700",
                fontSize: "13px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
              }}
            >
              📍 Advanced
            </Link>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
          {[
            {
              label: "STATUS",
              value: todayAttendance?.status || "Not Checked In",
              color: statusColor,
              bg: `${statusColor}10`,
            },
            { label: "CHECK IN", value: todayAttendance?.checkIn || "—", color: "#10b981", bg: "#f0fdf4" },
            { label: "CHECK OUT", value: checkedOut ? todayAttendance.checkOut : "—", color: "#ef4444", bg: "#fef2f2" },
            { label: "WORKING HOURS", value: todayAttendance?.workingHours || "0h 0m", color: "#3b82f6", bg: "#eff6ff" },
            { label: "METHOD", value: todayAttendance?.method || "—", color: "#8b5cf6", bg: "#ede9fe" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: stat.bg,
                padding: "14px 16px",
                borderRadius: "12px",
                border: `1px solid ${stat.color}20`,
              }}
            >
              <div style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", marginBottom: "6px", letterSpacing: "0.5px" }}>
                {stat.label}
              </div>
              <div style={{ fontSize: "16px", fontWeight: "800", color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PROGRESS RINGS + LEAVE BALANCES */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
        {/* Attendance Performance */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "18px",
            padding: "24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <h3 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>
            Attendance Performance
          </h3>
          <p style={{ margin: "0 0 20px", fontSize: "12px", color: "#64748b" }}>
            Your monthly stats at a glance
          </p>
          <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "16px" }}>
            <ProgressRing
              percent={attendancePct}
              color="#10b981"
              label="Attendance Rate"
              value={`${attendancePct}%`}
            />
            <ProgressRing
              percent={onTimePct}
              color="#3b82f6"
              label="On-Time Rate"
              value={`${onTimePct}%`}
            />
            <ProgressRing
              percent={totalDays > 0 ? Math.round((absentDays / totalDays) * 100) : 0}
              color="#ef4444"
              label="Absence Rate"
              value={absentDays}
            />
          </div>

          <div style={{ marginTop: "20px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
            {[
              { label: "Total Days", value: totalDays, color: "#64748b" },
              { label: "Present", value: presentDays, color: "#10b981" },
              { label: "Late", value: lateDays, color: "#f59e0b" },
              { label: "Absent", value: absentDays, color: "#ef4444" },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center", padding: "10px", background: "#f8fafc", borderRadius: "10px" }}>
                <div style={{ fontSize: "20px", fontWeight: "800", color: s.color }}>{s.value}</div>
                <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "600", marginTop: "2px" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Leave Balances */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "18px",
            padding: "24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>
              Leave Balances
            </h3>
            <Link to="/employee/leave" style={{ fontSize: "12px", color: "#2563eb", fontWeight: "600", textDecoration: "none" }}>
              Apply Leave →
            </Link>
          </div>
          <p style={{ margin: "0 0 20px", fontSize: "12px", color: "#64748b" }}>Remaining days by category</p>

          {leaveBalances && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                { key: "annual", label: "Annual Leave", color: "#6366f1", icon: "🏖" },
                { key: "sick", label: "Sick Leave", color: "#ef4444", icon: "🏥" },
                { key: "casual", label: "Casual Leave", color: "#f59e0b", icon: "☕" },
                { key: "emergency", label: "Emergency", color: "#10b981", icon: "🚨" },
              ].map(({ key, label, color, icon }) => {
                const bal = leaveBalances[key];
                if (!bal) return null;
                const pct = Math.round((bal.available / bal.total) * 100);
                return (
                  <div key={key}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>{icon}</span>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>{label}</span>
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: "700", color }}>
                        {bal.available}/{bal.total}
                      </span>
                    </div>
                    <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "6px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: mounted ? `${pct}%` : "0%",
                          height: "100%",
                          background: `linear-gradient(90deg, ${color}cc, ${color})`,
                          borderRadius: "6px",
                          transition: "width 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                        }}
                      />
                    </div>
                    <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "2px" }}>
                      {bal.used} used · {bal.available} remaining · {bal.pending || 0} pending
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {pendingLeaves.length > 0 && (
            <div
              style={{
                marginTop: "16px",
                padding: "10px 14px",
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: "10px",
                fontSize: "12px",
                color: "#92400e",
              }}
            >
              ⏳ You have {pendingLeaves.length} pending leave request{pendingLeaves.length > 1 ? "s" : ""} awaiting approval.
            </div>
          )}
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "18px",
          padding: "24px",
          marginBottom: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>
          Quick Actions
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "12px" }}>
          <QuickAction icon="📍" label="Mark Attendance" to="/employee/mark-attendance" color="#6366f1" bg="#f5f3ff" />
          <QuickAction icon="📋" label="Apply Leave" to="/employee/leave" color="#8b5cf6" bg="#ede9fe" />
          <QuickAction icon="📅" label="My Schedule" to="/employee/schedule" color="#3b82f6" bg="#eff6ff" />
          <QuickAction icon="📊" label="Attendance Log" to="/employee/my-attendance" color="#10b981" bg="#f0fdf4" />
          <QuickAction icon="🏖" label="Leave History" to="/employee/leave-history" color="#f59e0b" bg="#fffbeb" />
          <QuickAction icon="🎉" label="Holidays" to="/employee/holidays" color="#ec4899" bg="#fdf2f8" />
          <QuickAction icon="🔔" label={`Notifications${notifBadge > 0 ? ` (${notifBadge})` : ""}`} to="/employee/notifications" color="#06b6d4" bg="#ecfeff" />
          <QuickAction icon="👤" label="My Profile" to="/employee/profile" color="#64748b" bg="#f8fafc" />
        </div>
      </div>

      {/* BOTTOM: RECENT ATTENDANCE + NOTIFICATIONS + HOLIDAYS */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "20px" }}>
        {/* Attendance Table */}
        <div className="table-card">
          <div className="table-card-header">
            <div>
              <h2>Recent Attendance Logs</h2>
              <p>Your last {Math.min(attendanceList.length, 5)} attendance records</p>
            </div>
            <Link to="/employee/my-attendance" style={{ fontSize: "12px", color: "#2563eb", fontWeight: "600", textDecoration: "none" }}>
              Full History →
            </Link>
          </div>
          {attendanceList.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No records yet</h3>
              <p>Your attendance logs will appear here.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceList.slice(0, 5).map((log) => (
                  <tr key={log.id}>
                    <td><strong style={{ fontSize: "13px", color: "#0f172a" }}>{log.date}</strong></td>
                    <td style={{ fontSize: "13px" }}>{log.checkIn}</td>
                    <td style={{ fontSize: "13px" }}>{log.checkOut}</td>
                    <td style={{ fontSize: "13px", fontWeight: "600", color: "#2563eb" }}>{log.workingHours}</td>
                    <td>
                      <span className={`badge badge-${log.status?.toLowerCase()}`}>{log.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Notifications + Upcoming Holidays stacked */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Notifications */}
          <div className="table-card" style={{ flex: 1 }}>
            <div className="table-card-header">
              <div>
                <h2>Notifications</h2>
                <p>{notifBadge} unread alerts</p>
              </div>
              <Link to="/employee/notifications" style={{ fontSize: "12px", color: "#2563eb", fontWeight: "600", textDecoration: "none" }}>
                All →
              </Link>
            </div>
            <div style={{ padding: "8px 16px 16px" }}>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    background: n.read ? "#f8fafc" : "rgba(99, 102, 241, 0.05)",
                    border: n.read ? "1px solid #f1f5f9" : "1px solid rgba(99, 102, 241, 0.18)",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    marginBottom: "8px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#0f172a" }}>{n.title}</span>
                    <span style={{ fontSize: "10px", color: "#94a3b8", whiteSpace: "nowrap" }}>{n.time}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "11px", color: "#475569", lineHeight: 1.45 }}>{n.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Holidays */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "16px",
              padding: "16px 20px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>🎉 Upcoming Holidays</h3>
              <Link to="/employee/holidays" style={{ fontSize: "11px", color: "#2563eb", fontWeight: "600", textDecoration: "none" }}>
                View All →
              </Link>
            </div>
            {holidays.map((h) => (
              <div key={h.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#1e293b" }}>{h.name}</div>
                  <div style={{ fontSize: "10px", color: "#64748b", marginTop: "1px" }}>{h.type}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#3b82f6" }}>{h.date}</div>
                  <div style={{ fontSize: "10px", color: "#94a3b8" }}>{h.day}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
