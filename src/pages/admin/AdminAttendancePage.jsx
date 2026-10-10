import React, { useState } from "react";
import { StorageService } from "../../services/storageService";
import { useToast } from "../../context/ToastContext";
import "../../styles/admin.css";

const DEPARTMENTS = ["All Departments","Web Development","UI / UX Design","Software Engineering","Mobile App Development","QA / Testing","Digital Marketing","Human Resources"];
const STATUSES = ["All Statuses","Present","Late","Absent","Leave","Holiday"];
const METHODS = ["All Methods", "Manual", "QR Code", "GPS Geofence"];

export function AdminAttendancePage() {
  const { showToast } = useToast();
  const [attendance, setAttendance] = useState(() => StorageService.getAttendance());
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [methodFilter, setMethodFilter] = useState("All Methods");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const handleExportCSV = () => {
    const headers = ["Employee ID,Name,Department,Date,Check In,Check Out,Working Hours,Method,Location,Status"];
    const rows = sorted.map(
      (r) =>
        `"${r.employeeId}","${r.employeeName}","${r.department}","${r.date}","${r.checkIn}","${r.checkOut}","${r.workingHours}","${r.method || "Manual"}","${(r.location || "Office (Kathmandu)").replace(/"/g, '""')}","${r.status}"`
    );
    const blob = new Blob([[headers, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CodeedLabs_Attendance_${dateFilter || "all"}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("success", "Attendance records exported to CSV.");
  };

  const filtered = attendance.filter((rec) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      rec.employeeName.toLowerCase().includes(q) ||
      rec.employeeId.toLowerCase().includes(q) ||
      rec.department.toLowerCase().includes(q);
    const matchDept = deptFilter === "All Departments" || rec.department === deptFilter;
    const matchStatus = statusFilter === "All Statuses" || rec.status === statusFilter;
    const matchMethod = methodFilter === "All Methods" || (rec.method || "Manual") === methodFilter;
    const matchDate = !dateFilter || rec.date.includes(dateFilter);
    return matchSearch && matchDept && matchStatus && matchMethod && matchDate;
  });

  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));
  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const paginated = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const presentCount = attendance.filter((a) => a.status === "Present" && a.date === "2026-09-30").length;
  const lateCount = attendance.filter((a) => a.status === "Late" && a.date === "2026-09-30").length;
  const absentCount = attendance.filter((a) => a.status === "Absent" && a.date === "2026-09-30").length;
  const total = presentCount + lateCount + absentCount;
  const rate = total > 0 ? Math.round(((presentCount + lateCount * 0.8) / total) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <span className="overline">ATTENDANCE MANAGEMENT</span>
          <h1>Attendance Records</h1>
          <p>Real-time tracking of employee check-ins across Manual, QR Code, and GPS methods.</p>
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn-secondary" onClick={handleExportCSV}>
            <span>⬇</span> Export CSV
          </button>
        </div>
      </div>

      {/* Today Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: "14px", marginBottom: "24px" }}>
        {[
          { label: "Present Today", value: presentCount, color: "#10b981" },
          { label: "Late Today", value: lateCount, color: "#f59e0b" },
          { label: "Absent Today", value: absentCount, color: "#ef4444" },
          { label: "Today's Rate", value: `${rate}%`, color: "#4f46e5" },
          { label: "Total Records", value: attendance.length, color: "#64748b" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px 18px" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>{s.label}</div>
            <div style={{ fontSize: "26px", fontWeight: "800", color: s.color, marginTop: "4px" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters Toolbar */}
      <div className="toolbar">
        <div className="toolbar-search">
          <span className="toolbar-search-icon">⌕</span>
          <input
            type="text"
            placeholder="Search employee name, ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <input
          type="date"
          className="toolbar-select"
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            setPage(1);
          }}
          style={{ padding: "9px 12px" }}
        />
        <select
          className="toolbar-select"
          value={deptFilter}
          onChange={(e) => {
            setDeptFilter(e.target.value);
            setPage(1);
          }}
        >
          {DEPARTMENTS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <select
          className="toolbar-select"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          className="toolbar-select"
          value={methodFilter}
          onChange={(e) => {
            setMethodFilter(e.target.value);
            setPage(1);
          }}
        >
          {METHODS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        {(search || dateFilter || deptFilter !== "All Departments" || statusFilter !== "All Statuses" || methodFilter !== "All Methods") && (
          <button
            className="btn-secondary"
            onClick={() => {
              setSearch("");
              setDateFilter("");
              setDeptFilter("All Departments");
              setStatusFilter("All Statuses");
              setMethodFilter("All Methods");
              setPage(1);
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-card-header">
          <div>
            <h2>Attendance Logs</h2>
            <p>All employee daily check-in and check-out records with method details</p>
          </div>
          <span className="count-badge">{filtered.length} Records</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>EMPLOYEE</th>
                <th>DATE</th>
                <th>CHECK IN</th>
                <th>CHECK OUT</th>
                <th>HOURS</th>
                <th>METHOD</th>
                <th>LOCATION</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="empty-state">
                      <div className="empty-state-icon">📋</div>
                      <h3>No records found</h3>
                      <p>No attendance records match your current filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((rec) => {
                  const method = rec.method || "Manual";
                  return (
                    <tr key={rec.id}>
                      <td>
                        <div className="cell-avatar-group">
                          <div className="cell-avatar" style={{ width: "30px", height: "30px", fontSize: "10px" }}>
                            {rec.avatar || rec.employeeName.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <div>
                            <div className="cell-name" style={{ fontSize: "12px" }}>{rec.employeeName}</div>
                            <div className="cell-sub" style={{ fontSize: "10px" }}>{rec.employeeId} • {rec.department}</div>
                          </div>
                        </div>
                      </td>
                      <td><strong>{rec.date}</strong></td>
                      <td style={{ fontVariantNumeric: "tabular-nums", fontSize: "12px" }}>{rec.checkIn}</td>
                      <td style={{ fontVariantNumeric: "tabular-nums", fontSize: "12px" }}>{rec.checkOut}</td>
                      <td style={{ fontWeight: "600", fontSize: "12px" }}>{rec.workingHours}</td>
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "600",
                            background:
                              method === "QR Code"
                                ? "#f5f3ff"
                                : method === "GPS Geofence"
                                ? "#eff6ff"
                                : "#f8fafc",
                            color:
                              method === "QR Code"
                                ? "#7c3aed"
                                : method === "GPS Geofence"
                                ? "#2563eb"
                                : "#475569",
                            border: `1px solid ${
                              method === "QR Code"
                                ? "#ddd6fe"
                                : method === "GPS Geofence"
                                ? "#bfdbfe"
                                : "#e2e8f0"
                            }`,
                          }}
                        >
                          <span>{method === "QR Code" ? "📷" : method === "GPS Geofence" ? "📍" : "🖐️"}</span>
                          <span>{method}</span>
                        </span>
                      </td>
                      <td style={{ fontSize: "11px", color: "#64748b", maxWidth: "160px" }}>
                        {rec.location || "Office (Kathmandu)"}
                      </td>
                      <td>
                        <span className={`badge badge-${rec.status.toLowerCase()}`}>{rec.status}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > PER_PAGE && (
          <div className="pagination">
            <span>Showing {Math.min((page - 1) * PER_PAGE + 1, sorted.length)}–{Math.min(page * PER_PAGE, sorted.length)} of {sorted.length}</span>
            <div className="pagination-btns">
              <button className="pagination-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((n) => (
                <button key={n} className={`pagination-btn ${page === n ? "active" : ""}`} onClick={() => setPage(n)}>{n}</button>
              ))}
              <button className="pagination-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
