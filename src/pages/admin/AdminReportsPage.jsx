import React, { useState } from "react";
import { StorageService } from "../../services/storageService";
import { useToast } from "../../context/ToastContext";
import "../../styles/admin.css";

export function AdminReportsPage() {
  const { showToast } = useToast();
  const [reportType, setReportType] = useState("attendance"); // 'attendance' | 'leave' | 'employee'
  const [month, setMonth] = useState("2026-09");

  const attendance = StorageService.getAttendance();
  const employees = StorageService.getEmployees();
  const leaves = StorageService.getLeaveRequests();

  // Filter attendance by month
  const filteredAttendance = attendance.filter((a) => a.date.startsWith(month));

  const presentCount = filteredAttendance.filter((a) => a.status === "Present").length;
  const lateCount = filteredAttendance.filter((a) => a.status === "Late").length;
  const absentCount = filteredAttendance.filter((a) => a.status === "Absent").length;
  const leaveCount = filteredAttendance.filter((a) => a.status === "Leave").length;

  // Export CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";

    if (reportType === "attendance") {
      csvContent += "ID,Employee Name,Department,Date,Check In,Check Out,Working Hours,Status,Notes\r\n";
      filteredAttendance.forEach((row) => {
        csvContent += `"${row.employeeId}","${row.employeeName}","${row.department}","${row.date}","${row.checkIn}","${row.checkOut}","${row.workingHours}","${row.status}","${row.lateReason || ""}"\r\n`;
      });
    } else if (reportType === "leave") {
      csvContent += "Request ID,Employee ID,Employee Name,Leave Type,Start Date,End Date,Days,Status,Admin Comment\r\n";
      leaves.forEach((l) => {
        csvContent += `"${l.id}","${l.employeeId}","${l.employeeName}","${l.leaveType}","${l.startDate}","${l.endDate}","${l.days}","${l.status}","${l.adminComment || ""}"\r\n`;
      });
    } else {
      csvContent += "ID,Name,Email,Phone,Department,Position,Joined,Type,Status\r\n";
      employees.forEach((e) => {
        csvContent += `"${e.id}","${e.name}","${e.email}","${e.phone || ""}","${e.department}","${e.position}","${e.joined}","${e.employmentStatus || "Full-Time"}","${e.status}"\r\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `eas_${reportType}_report_${month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("success", `Generated and downloaded ${reportType} CSV report.`);
  };

  const handlePrint = () => {
    showToast("info", "Opening print view for audit records...");
    window.print();
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <span className="overline">ANALYTICS & EXPORTS</span>
          <h1>Reports & Analytics</h1>
          <p>Generate, filter, print, and export CSV reports for organizational auditing.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-secondary" onClick={handlePrint}>
            🖨 Print Report
          </button>
          <button className="btn-primary" onClick={handleExportCSV}>
            📥 Export to CSV
          </button>
        </div>
      </div>

      {/* Report Type Selector + Month Filter */}
      <div className="toolbar" style={{ background: "#ffffff", padding: "16px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", flex: 1 }}>
          {[
            { id: "attendance", label: "Attendance Report" },
            { id: "leave", label: "Leave Summary Report" },
            { id: "employee", label: "Employee Directory Report" },
          ].map((r) => (
            <button
              key={r.id}
              className={`pagination-btn ${reportType === r.id ? "active" : ""}`}
              style={{ padding: "8px 18px", fontWeight: "700" }}
              onClick={() => setReportType(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>

        {reportType === "attendance" && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Month:</span>
            <input
              type="month"
              className="toolbar-select"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      {reportType === "attendance" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", margin: "20px 0" }}>
          {[
            { label: "Total Logs", val: filteredAttendance.length, color: "#6366f1" },
            { label: "Present Marked", val: presentCount, color: "#10b981" },
            { label: "Late Check-ins", val: lateCount, color: "#f59e0b" },
            { label: "Absences", val: absentCount, color: "#ef4444" },
            { label: "On Approved Leave", val: leaveCount, color: "#8b5cf6" },
          ].map((k) => (
            <div key={k.label} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px 18px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>{k.label}</div>
              <div style={{ fontSize: "24px", fontWeight: "800", color: k.color, marginTop: "4px" }}>{k.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Main Table View */}
      <div className="table-card" style={{ marginTop: reportType !== "attendance" ? "20px" : "0" }}>
        <div className="table-card-header">
          <div>
            <h2>
              {reportType === "attendance" && `Monthly Attendance Records (${month})`}
              {reportType === "leave" && "Comprehensive Leave Report"}
              {reportType === "employee" && "Active Employee Master Roster"}
            </h2>
            <p>Generated on {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
          <span className="count-badge">
            {reportType === "attendance" && `${filteredAttendance.length} Records`}
            {reportType === "leave" && `${leaves.length} Applications`}
            {reportType === "employee" && `${employees.length} Staff Members`}
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          {reportType === "attendance" && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>EMPLOYEE</th>
                  <th>DEPARTMENT</th>
                  <th>DATE</th>
                  <th>CHECK IN</th>
                  <th>CHECK OUT</th>
                  <th>HOURS</th>
                  <th>STATUS</th>
                  <th>REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <strong>{a.employeeName}</strong>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>{a.employeeId}</div>
                    </td>
                    <td>{a.department}</td>
                    <td>{a.date}</td>
                    <td>{a.checkIn}</td>
                    <td>{a.checkOut}</td>
                    <td style={{ fontWeight: "600" }}>{a.workingHours}</td>
                    <td>
                      <span className={`badge badge-${a.status.toLowerCase()}`}>{a.status}</span>
                    </td>
                    <td style={{ fontSize: "12px", color: "#64748b" }}>{a.lateReason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === "leave" && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>REQUEST ID</th>
                  <th>EMPLOYEE</th>
                  <th>TYPE</th>
                  <th>FROM</th>
                  <th>TO</th>
                  <th>DAYS</th>
                  <th>STATUS</th>
                  <th>ADMIN COMMENT</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l) => (
                  <tr key={l.id}>
                    <td><code>{l.id}</code></td>
                    <td>
                      <strong>{l.employeeName}</strong>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>{l.department}</div>
                    </td>
                    <td>{l.leaveType}</td>
                    <td>{l.startDate}</td>
                    <td>{l.endDate}</td>
                    <td><strong>{l.days}</strong></td>
                    <td>
                      <span className={`badge badge-${l.status.toLowerCase()}`}>{l.status}</span>
                    </td>
                    <td style={{ fontSize: "12px", color: "#64748b" }}>{l.adminComment || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === "employee" && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>EMPLOYEE</th>
                  <th>ID</th>
                  <th>DEPARTMENT</th>
                  <th>POSITION</th>
                  <th>TYPE</th>
                  <th>JOINED</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <strong>{e.name}</strong>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>{e.email}</div>
                    </td>
                    <td><code>{e.id}</code></td>
                    <td>{e.department}</td>
                    <td>{e.position}</td>
                    <td>{e.employmentStatus || "Full-Time"}</td>
                    <td>{e.joined}</td>
                    <td>
                      <span className={`badge badge-${e.status.toLowerCase()}`}>{e.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
