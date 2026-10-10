import React from "react";
import { useAuth } from "../../context/AuthContext";
import { StorageService } from "../../services/storageService";
import "../../styles/admin.css";

const WEEKDAYS = [
  { day: "Monday", status: "Workday", hours: "09:00 AM – 05:00 PM", break: "1:00 PM - 2:00 PM" },
  { day: "Tuesday", status: "Workday", hours: "09:00 AM – 05:00 PM", break: "1:00 PM - 2:00 PM" },
  { day: "Wednesday", status: "Workday", hours: "09:00 AM – 05:00 PM", break: "1:00 PM - 2:00 PM" },
  { day: "Thursday", status: "Workday", hours: "09:00 AM – 05:00 PM", break: "1:00 PM - 2:00 PM" },
  { day: "Friday", status: "Workday", hours: "09:00 AM – 05:00 PM", break: "1:00 PM - 2:00 PM" },
  { day: "Saturday", status: "Weekly Off", hours: "Off", break: "—" },
  { day: "Sunday", status: "Weekly Off", hours: "Off", break: "—" },
];

export function EmployeeSchedulePage() {
  const { user } = useAuth();
  const schedules = StorageService.getSchedules();

  // Find user's assigned schedule or default to standard shift
  const mySchedule =
    schedules.find((s) => s.employeeId === user?.id || s.employeeName === user?.name) ||
    schedules[0] || {
      shiftName: "General Day Shift",
      startTime: "09:00 AM",
      endTime: "05:00 PM",
      breakDuration: "1 hour (01:00 PM - 02:00 PM)",
      date: "Monday - Friday",
    };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <span className="overline">ROSTER & TIMINGS</span>
          <h1>My Work Schedule</h1>
          <p>Check your assigned shift timings, break periods, and weekly roster.</p>
        </div>
      </div>

      {/* Main Shift Hero Card */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
          borderRadius: "18px",
          padding: "32px",
          color: "#ffffff",
          marginBottom: "24px",
          boxShadow: "0 10px 25px rgba(67, 56, 202, 0.2)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span style={{ background: "rgba(255,255,255,0.15)", padding: "4px 12px", borderRadius: "16px", fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase" }}>
              CURRENT ASSIGNED SHIFT
            </span>
            <h2 style={{ margin: "12px 0 4px", fontSize: "28px", fontWeight: "800" }}>{mySchedule.shiftName}</h2>
            <p style={{ margin: 0, color: "#c7d2fe", fontSize: "14px" }}>
              CodeedLabs Standard Office Shift ({mySchedule.date})
            </p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "12px", padding: "16px 24px", textAlign: "right" }}>
            <div style={{ fontSize: "11px", color: "#c7d2fe", fontWeight: "600" }}>SHIFT TIMING</div>
            <div style={{ fontSize: "22px", fontWeight: "800", marginTop: "4px" }}>
              {mySchedule.startTime} – {mySchedule.endTime}
            </div>
            <div style={{ fontSize: "11px", color: "#a5b4fc", marginTop: "4px" }}>
              Break: {mySchedule.breakDuration}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "16px", marginTop: "28px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.15)" }}>
          {[
            { label: "Standard Hours", val: "8 Hours / Day" },
            { label: "Grace Period", val: "15 Minutes (09:15 AM)" },
            { label: "Weekly Working Days", val: "5 Days (Mon - Fri)" },
            { label: "Timezone", val: "Asia/Kathmandu (NPT)" },
          ].map((item) => (
            <div key={item.label}>
              <div style={{ fontSize: "11px", color: "#c7d2fe" }}>{item.label}</div>
              <div style={{ fontSize: "14px", fontWeight: "700", marginTop: "2px" }}>{item.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Roster Table */}
      <div className="table-card">
        <div className="table-card-header">
          <div>
            <h2>Weekly Roster</h2>
            <p>Your day-by-day scheduled schedule</p>
          </div>
          <span className="count-badge">5 Workdays / 2 Off</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>DAY</th>
                <th>STATUS</th>
                <th>WORK HOURS</th>
                <th>BREAK PERIOD</th>
                <th>LOCATION</th>
              </tr>
            </thead>
            <tbody>
              {WEEKDAYS.map((w) => (
                <tr key={w.day}>
                  <td>
                    <strong>{w.day}</strong>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        w.status === "Workday" ? "badge-active" : "badge-leave"
                      }`}
                    >
                      {w.status}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: w.status === "Workday" ? "600" : "400", color: w.status === "Workday" ? "#0f172a" : "#94a3b8" }}>
                      {w.hours}
                    </span>
                  </td>
                  <td style={{ fontSize: "12px", color: "#64748b" }}>{w.break}</td>
                  <td style={{ fontSize: "12px", color: "#64748b" }}>
                    {w.status === "Workday" ? "Kathmandu Office / Onsite" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
