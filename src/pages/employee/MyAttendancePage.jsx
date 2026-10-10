import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { StorageService } from "../../services/storageService";
import "../../styles/employee.css";
import "../../AdminDashboard.css";

export function MyAttendancePage() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState("2026-09");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchDate, setSearchDate] = useState("");
  const [viewMode, setViewMode] = useState("both"); // 'both' | 'calendar' | 'table'
  const [selectedDayDetail, setSelectedDayDetail] = useState(null);

  // Fetch all user attendance records
  const allRecords = useMemo(() => {
    if (!user) return [];
    const all = StorageService.getAttendance();
    return all.filter((a) => a.employeeId === user.id || a.employeeName === user.name);
  }, [user]);

  // Filter records by month, status, and search
  const filteredRecords = useMemo(() => {
    return allRecords.filter((rec) => {
      const matchMonth = rec.date.startsWith(selectedMonth);
      const matchStatus = statusFilter === "ALL" || rec.status.toUpperCase() === statusFilter.toUpperCase();
      const matchSearch = !searchDate || rec.date.includes(searchDate);
      return matchMonth && matchStatus && matchSearch;
    });
  }, [allRecords, selectedMonth, statusFilter, searchDate]);

  // Aggregate monthly stats
  const stats = useMemo(() => {
    const monthRecords = allRecords.filter((r) => r.date.startsWith(selectedMonth));
    const present = monthRecords.filter((r) => r.status === "Present").length;
    const late = monthRecords.filter((r) => r.status === "Late").length;
    const absent = monthRecords.filter((r) => r.status === "Absent").length;
    const leave = monthRecords.filter((r) => r.status === "Leave").length;
    const holiday = monthRecords.filter((r) => r.status === "Holiday").length;
    const totalRecorded = present + late + absent;
    const rate = totalRecorded > 0 ? Math.round(((present + late * 0.8) / totalRecorded) * 100) : 92;

    return { present, late, absent, leave, holiday, rate };
  }, [allRecords, selectedMonth]);

  // Build calendar matrix for selectedMonth (e.g. "2026-09")
  const calendarDays = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // 0-indexed

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Padding before 1st of month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ empty: true, id: `pad-${i}` });
    }

    // Days in month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayOfWeek = new Date(year, month, d).getDay();
      const isSaturday = dayOfWeek === 6; // Saturday is standard weekly off in Nepal

      const record = allRecords.find((r) => r.date === dateStr);
      let status = "Not Marked";
      if (record) {
        status = record.status;
      } else if (isSaturday) {
        status = "Weekend";
      }

      days.push({
        empty: false,
        dayNumber: d,
        date: dateStr,
        isSaturday,
        record,
        status,
        isToday: dateStr === "2026-09-30",
      });
    }
    return days;
  }, [selectedMonth, allRecords]);

  const monthNames = {
    "2026-08": "August 2026",
    "2026-09": "September 2026",
    "2026-10": "October 2026",
    "2026-11": "November 2026",
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
      {/* PAGE HEADER */}
      <div className="portal-page-header">
        <div className="portal-page-title">
          <span style={{ fontSize: "11px", fontWeight: "700", color: "#6366f1", letterSpacing: "1px" }}>
            ATTENDANCE RECORDS
          </span>
          <h1>My Attendance</h1>
          <p>Track your daily logs, working hours, and monthly attendance calendar.</p>
        </div>

        <div className="portal-header-actions">
          <Link
            to="/employee/mark-attendance"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 18px",
              background: "#10b981",
              color: "#ffffff",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "13px",
              textDecoration: "none",
            }}
          >
            ⏱ Mark Attendance
          </Link>
        </div>
      </div>

      {/* SUMMARY STATS ROW */}
      <div className="summary-cards-grid">
        <div className="summary-card present">
          <span className="summary-card-label">Present</span>
          <div className="summary-card-value">{stats.present}</div>
          <span className="summary-card-sub">Days logged on time</span>
        </div>

        <div className="summary-card late">
          <span className="summary-card-label">Late</span>
          <div className="summary-card-value">{stats.late}</div>
          <span className="summary-card-sub">Check-in after 09:15 AM</span>
        </div>

        <div className="summary-card absent">
          <span className="summary-card-label">Absent</span>
          <div className="summary-card-value">{stats.absent}</div>
          <span className="summary-card-sub">Unexcused missed days</span>
        </div>

        <div className="summary-card leave">
          <span className="summary-card-label">Approved Leave</span>
          <div className="summary-card-value">{stats.leave}</div>
          <span className="summary-card-sub">Official leave days</span>
        </div>

        <div className="summary-card holiday">
          <span className="summary-card-label">Holidays</span>
          <div className="summary-card-value">{stats.holiday + 4}</div>
          <span className="summary-card-sub">Nepal & Company holidays</span>
        </div>

        <div className="summary-card" style={{ background: "#0b1220", color: "#ffffff" }}>
          <span className="summary-card-label" style={{ color: "#a5b4fc" }}>Attendance Rate</span>
          <div className="summary-card-value" style={{ color: "#ffffff" }}>{stats.rate}%</div>
          <span className="summary-card-sub" style={{ color: "#94a3b8" }}>Target: &gt; 90%</span>
        </div>
      </div>

      {/* CONTROLS & FILTER BAR */}
      <div className="table-filter-bar">
        <div className="filter-group-left">
          {/* Month Dropdown */}
          <select
            className="filter-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="2026-08">August 2026</option>
            <option value="2026-09">September 2026</option>
            <option value="2026-10">October 2026</option>
            <option value="2026-11">November 2026</option>
          </select>

          {/* Status Filter */}
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="ABSENT">Absent</option>
            <option value="LEAVE">Leave</option>
            <option value="HOLIDAY">Holiday</option>
          </select>

          {/* Date Search */}
          <div className="search-input-wrapper">
            <span className="search-icon-pos">⌕</span>
            <input
              type="text"
              placeholder="Search date (e.g. 2026-09-28)..."
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
            />
          </div>
        </div>

        {/* View Toggle */}
        <div style={{ display: "flex", gap: "4px", background: "#f1f5f9", padding: "3px", borderRadius: "8px" }}>
          <button
            type="button"
            onClick={() => setViewMode("both")}
            style={{
              padding: "6px 12px",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              background: viewMode === "both" ? "#ffffff" : "transparent",
              color: viewMode === "both" ? "#0f172a" : "#64748b",
              boxShadow: viewMode === "both" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            Calendar & Table
          </button>
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            style={{
              padding: "6px 12px",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              background: viewMode === "calendar" ? "#ffffff" : "transparent",
              color: viewMode === "calendar" ? "#0f172a" : "#64748b",
              boxShadow: viewMode === "calendar" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            Calendar View
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            style={{
              padding: "6px 12px",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              background: viewMode === "table" ? "#ffffff" : "transparent",
              color: viewMode === "table" ? "#0f172a" : "#64748b",
              boxShadow: viewMode === "table" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            Table View
          </button>
        </div>
      </div>

      {/* MONTHLY CALENDAR VIEW */}
      {(viewMode === "both" || viewMode === "calendar") && (
        <div className="calendar-card">
          <div className="calendar-header">
            <div>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Monthly Attendance Calendar</h2>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                {monthNames[selectedMonth] || selectedMonth} • Saturday is official Nepal weekend
              </p>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", fontSize: "11px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span className="calendar-cell-badge badge-present">●</span> Present
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span className="calendar-cell-badge badge-late">●</span> Late
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span className="calendar-cell-badge badge-absent">●</span> Absent
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span className="calendar-cell-badge badge-leave">●</span> Leave
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span className="calendar-cell-badge badge-holiday">●</span> Holiday
              </span>
            </div>
          </div>

          <div className="calendar-grid">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
              <div
                key={day}
                className={`calendar-day-head ${idx === 6 ? "weekend" : ""}`}
              >
                {day}
              </div>
            ))}

            {calendarDays.map((item, idx) => {
              if (item.empty) {
                return <div key={`empty-${idx}`} className="calendar-cell empty"></div>;
              }

              const badgeClass =
                item.status === "Present"
                  ? "badge-present"
                  : item.status === "Late"
                  ? "badge-late"
                  : item.status === "Absent"
                  ? "badge-absent"
                  : item.status === "Leave"
                  ? "badge-leave"
                  : item.status === "Holiday"
                  ? "badge-holiday"
                  : "badge-weekend";

              return (
                <div
                  key={item.date}
                  className={`calendar-cell ${item.isToday ? "today" : ""} ${item.isSaturday ? "weekend" : ""} ${
                    selectedDayDetail?.date === item.date ? "selected" : ""
                  }`}
                  onClick={() => setSelectedDayDetail(item)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="calendar-cell-date">{item.dayNumber}</span>
                    {item.isToday && (
                      <span style={{ fontSize: "8px", fontWeight: "800", color: "#3b82f6" }}>TODAY</span>
                    )}
                  </div>

                  <div>
                    <span className={`calendar-cell-badge ${badgeClass}`}>
                      {item.status}
                    </span>
                    {item.record?.checkIn && item.record.checkIn !== "—" && (
                      <div style={{ fontSize: "9px", color: "#64748b", marginTop: "2px" }}>
                        {item.record.checkIn}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Day Quick Inspector */}
          {selectedDayDetail && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px 18px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div>
                <strong>Selected: {selectedDayDetail.date}</strong>
                <span style={{ marginLeft: "12px", color: "#64748b", fontSize: "12px" }}>
                  Status: <strong>{selectedDayDetail.status}</strong>
                  {selectedDayDetail.record && (
                    <> • Check In: {selectedDayDetail.record.checkIn} • Check Out: {selectedDayDetail.record.checkOut} • Hours: {selectedDayDetail.record.workingHours}</>
                  )}
                  {selectedDayDetail.record?.lateReason && (
                    <> • Note: "{selectedDayDetail.record.lateReason}"</>
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayDetail(null)}
                style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: "12px" }}
              >
                Close ✕
              </button>
            </div>
          )}
        </div>
      )}

      {/* ATTENDANCE RECORDS TABLE */}
      {(viewMode === "both" || viewMode === "table") && (
        <div className="employees-table-card" style={{ marginBottom: "32px" }}>
          <div className="employees-table-header">
            <div>
              <h2>Attendance Log Table</h2>
              <p>Detailed punch logs, durations, and status indicators</p>
            </div>
            <span className="employee-count">{filteredRecords.length} Records</span>
          </div>

          <div className="employees-table-wrapper">
            <table className="employees-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>CHECK IN</th>
                  <th>CHECK OUT</th>
                  <th>WORKING HOURS</th>
                  <th>STATUS</th>
                  <th>PUNCTUALITY</th>
                  <th>NOTES</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                      No attendance records found matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => {
                    const isLate = rec.status === "Late";
                    const isOnTime = rec.status === "Present";

                    return (
                      <tr key={rec.id}>
                        <td>
                          <strong>{rec.date}</strong>
                        </td>
                        <td>
                          <span style={{ fontVariantNumeric: "tabular-nums" }}>{rec.checkIn}</span>
                        </td>
                        <td>
                          <span style={{ fontVariantNumeric: "tabular-nums" }}>{rec.checkOut}</span>
                        </td>
                        <td>
                          <span style={{ fontWeight: "600", color: "#0f172a" }}>{rec.workingHours}</span>
                        </td>
                        <td>
                          <span className={`status ${rec.status.toLowerCase()}`}>
                            {rec.status}
                          </span>
                        </td>
                        <td>
                          {isOnTime ? (
                            <span style={{ color: "#16a34a", fontSize: "11px", fontWeight: "600" }}>
                              ● On Time
                            </span>
                          ) : isLate ? (
                            <span style={{ color: "#d97706", fontSize: "11px", fontWeight: "600" }}>
                              ▲ Late Arrival
                            </span>
                          ) : (
                            <span style={{ color: "#94a3b8", fontSize: "11px" }}>—</span>
                          )}
                        </td>
                        <td>
                          <span style={{ color: "#64748b", fontSize: "11px" }}>
                            {rec.lateReason || "Regular shift"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
