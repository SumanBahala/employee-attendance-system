import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { StorageService } from "../../services/storageService";
import "../../styles/admin.css";

export function EmployeeLeaveHistoryPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("All");

  const allRequests = StorageService.getLeaveRequests();
  // Filter for current logged-in employee (or fallback to match ID)
  const myRequests = allRequests.filter(
    (r) => r.employeeId === user?.id || r.employeeName === user?.name || !user
  );

  const filtered = myRequests.filter((r) => {
    if (filter === "All") return true;
    return r.status.toLowerCase() === filter.toLowerCase();
  });

  const pending = myRequests.filter((r) => r.status === "Pending").length;
  const approved = myRequests.filter((r) => r.status === "Approved").length;
  const rejected = myRequests.filter((r) => r.status === "Rejected").length;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <span className="overline">LEAVE MANAGEMENT</span>
          <h1>My Leave History</h1>
          <p>Track the status of all your submitted leave applications.</p>
        </div>
        <div className="page-header-actions">
          <Link to="/employee/leave" className="btn-primary">
            + Apply for Leave
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total Applications", val: myRequests.length, color: "#6366f1" },
          { label: "Pending Approval", val: pending, color: "#f59e0b" },
          { label: "Approved Leaves", val: approved, color: "#10b981" },
          { label: "Rejected Requests", val: rejected, color: "#ef4444" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px 20px" }}>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>{s.label}</div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: s.color, marginTop: "6px" }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="toolbar">
        {["All", "Pending", "Approved", "Rejected"].map((status) => (
          <button
            key={status}
            className={`pagination-btn ${filter === status ? "active" : ""}`}
            style={{ padding: "8px 16px", fontWeight: "600" }}
            onClick={() => setFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Table Card */}
      <div className="table-card">
        <div className="table-card-header">
          <div>
            <h2>Application Records</h2>
            <p>Detailed list with duration, status, and remarks</p>
          </div>
          <span className="count-badge">{filtered.length} Records</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>REQUEST ID</th>
                <th>LEAVE TYPE</th>
                <th>FROM DATE</th>
                <th>TO DATE</th>
                <th>DURATION</th>
                <th>APPLIED ON</th>
                <th>STATUS</th>
                <th>ADMIN REMARKS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="empty-state">
                      <div className="empty-state-icon">📄</div>
                      <h3>No leave requests found</h3>
                      <p>You haven't submitted any leave applications matching this status.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <code style={{ fontSize: "11px", color: "#6366f1", background: "#f5f3ff", padding: "3px 6px", borderRadius: "4px", fontWeight: "700" }}>
                        {req.id}
                      </code>
                    </td>
                    <td><strong>{req.leaveType}</strong></td>
                    <td>{req.startDate}</td>
                    <td>{req.endDate}</td>
                    <td>
                      <span style={{ fontWeight: "700", color: "#0f172a" }}>{req.days}</span> {req.days === 1 ? "day" : "days"}
                    </td>
                    <td>{req.appliedDate}</td>
                    <td>
                      <span className={`badge badge-${req.status.toLowerCase()}`}>
                        {req.status}
                      </span>
                    </td>
                    <td style={{ color: "#64748b", fontSize: "12px", maxWidth: "200px" }}>
                      {req.adminComment || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
