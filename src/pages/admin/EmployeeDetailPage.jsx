import React, { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { StorageService } from "../../services/storageService";
import "../../styles/admin.css";

const TABS = ["Personal Info", "Employment", "Attendance", "Leave"];

export function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Personal Info");

  const employee = StorageService.getEmployeeById(id);

  const allAttendance = StorageService.getAttendance();
  const empAttendance = allAttendance.filter((a) => a.employeeId === id);

  const allLeaves = StorageService.getLeaveRequests();
  const empLeaves = allLeaves.filter((l) => l.employeeId === id);

  if (!employee) {
    return (
      <div>
        <div className="page-header">
          <div className="page-header-text">
            <h1>Employee Not Found</h1>
            <p>No employee found with ID: {id}</p>
          </div>
          <Link to="/admin/employees" className="btn-secondary">← Back to Employees</Link>
        </div>
        <div className="detail-card">
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>Employee record does not exist</h3>
            <p>The employee with ID "{id}" could not be found in the system.</p>
          </div>
        </div>
      </div>
    );
  }

  const presentCount = empAttendance.filter((a) => a.status === "Present").length;
  const lateCount = empAttendance.filter((a) => a.status === "Late").length;
  const absentCount = empAttendance.filter((a) => a.status === "Absent").length;
  const totalRecords = presentCount + lateCount + absentCount;
  const attendanceRate = totalRecords > 0 ? Math.round(((presentCount + lateCount * 0.8) / totalRecords) * 100) : 94;

  return (
    <div>
      {/* Back navigation + header */}
      <div className="page-header">
        <div className="page-header-text">
          <span className="overline">EMPLOYEE PROFILE</span>
          <h1>{employee.name}</h1>
          <p>{employee.position} • {employee.department} • {employee.id}</p>
        </div>
        <div className="page-header-actions">
          <Link to="/admin/employees" className="btn-secondary">← Back</Link>
          <button className="btn-primary" onClick={() => alert("Edit modal coming in Phase 6.")}>✎ Edit</button>
        </div>
      </div>

      {/* Profile Top Card */}
      <div style={{ background: "linear-gradient(135deg, #0c1230 0%, #172554 100%)", borderRadius: "18px", padding: "28px 32px", color: "#ffffff", marginBottom: "24px", display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
        <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "800", flexShrink: 0 }}>
          {employee.avatar || employee.name.split(" ").map(n=>n[0]).join("")}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "22px", fontWeight: "800" }}>{employee.name}</div>
          <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "2px" }}>{employee.position} — {employee.department}</div>
          <div style={{ marginTop: "12px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ background: "rgba(255,255,255,0.1)", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "600" }}>{employee.id}</span>
            <span style={{ background: employee.status === "Active" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)", color: employee.status === "Active" ? "#34d399" : "#f87171", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" }}>{employee.status}</span>
            <span style={{ background: "rgba(255,255,255,0.08)", padding: "4px 12px", borderRadius: "20px", fontSize: "11px" }}>{employee.employmentStatus || "Full-Time"}</span>
          </div>
        </div>

        {/* Mini Stats */}
        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
          {[
            { label: "Attendance Rate", value: `${attendanceRate}%`, color: "#34d399" },
            { label: "Days Present", value: presentCount, color: "#60a5fa" },
            { label: "Days Late", value: lateCount, color: "#fbbf24" },
            { label: "Leave Requests", value: empLeaves.length, color: "#a78bfa" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "22px", fontWeight: "800", color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "2px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-nav">
        {TABS.map((tab) => (
          <button key={tab} className={`tab-btn ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      {/* TAB: Personal Info */}
      {activeTab === "Personal Info" && (
        <div className="detail-card">
          <h3 className="detail-section-title">Personal Information</h3>
          <div className="detail-grid">
            <div className="detail-item"><label>Full Name</label><span>{employee.name}</span></div>
            <div className="detail-item"><label>Email Address</label><span>{employee.email}</span></div>
            <div className="detail-item"><label>Phone</label><span>{employee.phone || "—"}</span></div>
            <div className="detail-item"><label>Date of Birth</label><span>{employee.dob || "—"}</span></div>
            <div className="detail-item"><label>Gender</label><span>{employee.gender || "—"}</span></div>
            <div className="detail-item"><label>Blood Group</label><span>{employee.bloodGroup || "—"}</span></div>
            <div className="detail-item"><label>Address</label><span>{employee.address || "—"}</span></div>
            <div className="detail-item"><label>Emergency Contact</label><span>{employee.emergencyContact || "—"}</span></div>
          </div>
        </div>
      )}

      {/* TAB: Employment */}
      {activeTab === "Employment" && (
        <div className="detail-card">
          <h3 className="detail-section-title">Employment Information</h3>
          <div className="detail-grid">
            <div className="detail-item"><label>Employee ID</label><span>{employee.id}</span></div>
            <div className="detail-item"><label>Department</label><span>{employee.department}</span></div>
            <div className="detail-item"><label>Position</label><span>{employee.position}</span></div>
            <div className="detail-item"><label>Employment Type</label><span>{employee.employmentStatus || "Full-Time"}</span></div>
            <div className="detail-item"><label>Joining Date</label><span>{employee.joined}</span></div>
            <div className="detail-item"><label>Reporting Manager</label><span>{employee.manager || "—"}</span></div>
            <div className="detail-item"><label>Status</label><span>{employee.status}</span></div>
            <div className="detail-item"><label>Organization</label><span>CodeedLabs Incorporated Pvt. Ltd.</span></div>
          </div>
        </div>
      )}

      {/* TAB: Attendance */}
      {activeTab === "Attendance" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: "14px", marginBottom: "20px" }}>
            {[
              { label: "Present", value: presentCount, cls: "badge-present" },
              { label: "Late", value: lateCount, cls: "badge-late" },
              { label: "Absent", value: absentCount, cls: "badge-absent" },
              { label: "Attendance Rate", value: `${attendanceRate}%`, cls: "badge-active" },
            ].map(s => (
              <div key={s.label} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px 18px" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>{s.label}</div>
                <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="table-card">
            <div className="table-card-header">
              <div><h2>Attendance History</h2><p>All recorded daily logs</p></div>
              <span className="count-badge">{empAttendance.length} Records</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>DATE</th><th>CHECK IN</th><th>CHECK OUT</th><th>WORKING HOURS</th><th>STATUS</th><th>NOTES</th>
                  </tr>
                </thead>
                <tbody>
                  {empAttendance.length === 0 ? (
                    <tr><td colSpan="6"><div className="empty-state"><div className="empty-state-icon">📋</div><h3>No attendance records</h3><p>No logs have been recorded for this employee yet.</p></div></td></tr>
                  ) : (
                    empAttendance.map((rec) => (
                      <tr key={rec.id}>
                        <td><strong>{rec.date}</strong></td>
                        <td>{rec.checkIn}</td>
                        <td>{rec.checkOut}</td>
                        <td>{rec.workingHours}</td>
                        <td><span className={`badge badge-${rec.status.toLowerCase()}`}>{rec.status}</span></td>
                        <td style={{ color: "#64748b", fontSize: "12px" }}>{rec.lateReason || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Leave */}
      {activeTab === "Leave" && (
        <div className="table-card">
          <div className="table-card-header">
            <div><h2>Leave Requests</h2><p>All submitted leave applications</p></div>
            <span className="count-badge">{empLeaves.length} Requests</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>REQUEST ID</th><th>TYPE</th><th>FROM</th><th>TO</th><th>DAYS</th><th>REASON</th><th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {empLeaves.length === 0 ? (
                  <tr><td colSpan="7"><div className="empty-state"><div className="empty-state-icon">📝</div><h3>No leave requests</h3><p>This employee has not submitted any leave applications.</p></div></td></tr>
                ) : (
                  empLeaves.map((l) => (
                    <tr key={l.id}>
                      <td><code style={{ fontSize: "11px", color: "#6366f1" }}>{l.id}</code></td>
                      <td>{l.leaveType}</td>
                      <td>{l.startDate}</td>
                      <td>{l.endDate}</td>
                      <td>{l.days}</td>
                      <td style={{ maxWidth: "200px", fontSize: "12px", color: "#475569" }}>{l.reason}</td>
                      <td><span className={`badge badge-${l.status.toLowerCase()}`}>{l.status}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
