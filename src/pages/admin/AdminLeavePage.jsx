import React, { useState } from "react";
import { StorageService } from "../../services/storageService";
import { useToast } from "../../context/ToastContext";
import "../../styles/admin.css";

const STATUSES = ["All", "Pending", "Approved", "Rejected"];
const LEAVE_TYPES = ["All Types", "Annual Leave", "Sick Leave", "Casual Leave", "Emergency Leave"];

const TYPE_STYLES = {
  "Annual Leave": { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  "Sick Leave": { color: "#e11d48", bg: "#fff1f2", border: "#fecdd3" },
  "Casual Leave": { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  "Emergency Leave": { color: "#dc2626", bg: "#fef2f2", border: "#fca5a5" },
};

const PRESET_REJECTION_REASONS = [
  "Critical client sprint deadline in progress.",
  "Staffing overlap — insufficient team coverage for selected dates.",
  "Insufficient leave balance available for this leave type.",
  "Notice period requirement of 48 hours was not met.",
];

export function AdminLeavePage() {
  const { showToast } = useToast();
  const [requests, setRequests] = useState(() => StorageService.getLeaveRequests());
  const [departments] = useState(() => StorageService.getDepartments());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [deptFilter, setDeptFilter] = useState("All");
  const [rejectModal, setRejectModal] = useState(null); // { id, name, days, leaveType }
  const [rejectReason, setRejectReason] = useState("");
  const [viewDetailModal, setViewDetailModal] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  const filtered = requests.filter((req) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      req.employeeName.toLowerCase().includes(q) ||
      req.id.toLowerCase().includes(q) ||
      (req.department && req.department.toLowerCase().includes(q));
    const matchStatus = statusFilter === "All" || req.status === statusFilter;
    const matchType = typeFilter === "All Types" || req.leaveType === typeFilter;
    const matchDept = deptFilter === "All" || req.department === deptFilter;
    return matchSearch && matchStatus && matchType && matchDept;
  });

  const sorted = [...filtered].sort((a, b) => b.appliedDate.localeCompare(a.appliedDate));
  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const paginated = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const updateStatus = (id, status, comment = "") => {
    const updated = requests.map((r) =>
      r.id === id ? { ...r, status, adminComment: comment } : r
    );
    setRequests(updated);
    StorageService.saveLeaveRequests(updated);
  };

  const handleApprove = (req) => {
    updateStatus(req.id, "Approved", "Approved by Administration.");
    showToast("success", `Approved ${req.days}-day leave for ${req.employeeName}.`);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    updateStatus(rejectModal.id, "Rejected", rejectReason.trim());
    showToast("info", `Rejected leave application for ${rejectModal.name}.`);
    setRejectModal(null);
    setRejectReason("");
  };

  const exportCSV = () => {
    const headers = ["ID,Employee,Department,Leave Type,Start Date,End Date,Days,Status,Applied Date,Reason,Admin Notes"];
    const rows = sorted.map((r) =>
      `"${r.id}","${r.employeeName}","${r.department}","${r.leaveType}","${r.startDate}","${r.endDate}",${r.days},"${r.status}","${r.appliedDate}","${(r.reason || "").replace(/"/g, '""')}","${(r.adminComment || "").replace(/"/g, '""')}"`
    );
    const blob = new Blob([[headers, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CodeedLabs_Leave_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("info", "Leave report exported as CSV.");
  };

  const pendingCount = requests.filter((r) => r.status === "Pending").length;
  const approvedCount = requests.filter((r) => r.status === "Approved").length;
  const rejectedCount = requests.filter((r) => r.status === "Rejected").length;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <span className="overline">WORKFORCE ABSENCE & LEAVE</span>
          <h1>Leave Management</h1>
          <p>Review leave requests, approve time-off applications, and maintain roster coverage.</p>
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn-secondary" onClick={exportCSV}>
            <span>⬇</span> Export CSV
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "rgba(99, 102, 241, 0.12)", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
            📋
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Total Requests</div>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a" }}>{requests.length} Submissions</div>
          </div>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #fde68a", borderRadius: "14px", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px", position: "relative" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
            ⏳
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#b45309", textTransform: "uppercase" }}>Pending Review</span>
              {pendingCount > 0 && (
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b", display: "inline-block", animation: "pulse-glow 1.5s infinite" }} />
              )}
            </div>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#d97706" }}>{pendingCount} Awaiting</div>
          </div>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.12)", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
            ✓
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Approved Requests</div>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#10b981" }}>{approvedCount} Granted</div>
          </div>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.12)", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
            ✕
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Declined</div>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#ef4444" }}>{rejectedCount} Rejected</div>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="toolbar" style={{ marginBottom: "20px", gap: "12px", flexWrap: "wrap" }}>
        <div className="toolbar-search" style={{ flex: "1 1 240px" }}>
          <span className="toolbar-search-icon">⌕</span>
          <input
            type="text"
            placeholder="Search employee, ID or reason..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          className="toolbar-select"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "All" ? "All Statuses" : s}
            </option>
          ))}
        </select>

        <select
          className="toolbar-select"
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
        >
          {LEAVE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          className="toolbar-select"
          value={deptFilter}
          onChange={(e) => {
            setDeptFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="All">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Leave Applications Table */}
      <div className="table-card">
        <div className="table-card-header">
          <div>
            <h2>Leave Applications</h2>
            <p>Submitted employee leave requests and administrative decisions</p>
          </div>
          <span className="count-badge">{filtered.length} Requests</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>EMPLOYEE</th>
                <th>REQUEST ID</th>
                <th>LEAVE TYPE</th>
                <th>PERIOD</th>
                <th>DAYS</th>
                <th>REASON</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="empty-state">
                      <div className="empty-state-icon">📝</div>
                      <h3>No leave requests found</h3>
                      <p>Try modifying your search or filter options.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((req) => {
                  const typeStyle = TYPE_STYLES[req.leaveType] || {
                    color: "#475569",
                    bg: "#f1f5f9",
                    border: "#cbd5e1",
                  };

                  return (
                    <tr key={req.id}>
                      <td>
                        <div className="cell-avatar-group">
                          <div
                            className="cell-avatar"
                            style={{
                              width: "32px",
                              height: "32px",
                              fontSize: "11px",
                              background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
                            }}
                          >
                            {req.avatar || "EP"}
                          </div>
                          <div>
                            <div className="cell-name" style={{ fontSize: "13px", fontWeight: "700" }}>
                              {req.employeeName}
                            </div>
                            <div className="cell-sub" style={{ fontSize: "11px", color: "#64748b" }}>
                              {req.department}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <code
                          style={{
                            fontSize: "11px",
                            color: "#4f46e5",
                            background: "#eef2ff",
                            padding: "3px 7px",
                            borderRadius: "4px",
                            fontWeight: "700",
                          }}
                        >
                          {req.id}
                        </code>
                      </td>

                      <td>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "700",
                            color: typeStyle.color,
                            background: typeStyle.bg,
                            border: `1px solid ${typeStyle.border}`,
                            padding: "3px 8px",
                            borderRadius: "6px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {req.leaveType}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontSize: "12px", fontWeight: "600", color: "#1e293b" }}>
                          {req.startDate === req.endDate ? req.startDate : `${req.startDate} → ${req.endDate}`}
                        </div>
                        <div style={{ fontSize: "10px", color: "#94a3b8" }}>Applied: {req.appliedDate}</div>
                      </td>

                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: "28px",
                            padding: "2px 8px",
                            background: "#f1f5f9",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "800",
                            color: "#0f172a",
                          }}
                        >
                          {req.days} {req.days === 1 ? "day" : "days"}
                        </span>
                      </td>

                      <td style={{ maxWidth: "220px" }}>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#475569",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            cursor: "pointer",
                          }}
                          title={req.reason}
                          onClick={() => setViewDetailModal(req)}
                        >
                          "{req.reason}"
                        </div>
                        {req.adminComment && (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#64748b",
                              fontStyle: "italic",
                              marginTop: "2px",
                            }}
                          >
                            Admin: {req.adminComment}
                          </div>
                        )}
                      </td>

                      <td>
                        <span className={`badge badge-${req.status.toLowerCase()}`}>
                          {req.status}
                        </span>
                      </td>

                      <td>
                        {req.status === "Pending" ? (
                          <div className="action-group">
                            <button
                              className="action-btn approve"
                              title="Approve Leave"
                              onClick={() => handleApprove(req)}
                            >
                              ✓
                            </button>
                            <button
                              className="action-btn reject"
                              title="Reject Leave"
                              onClick={() => {
                                setRejectModal(req);
                                setRejectReason("");
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ padding: "4px 8px", fontSize: "11px" }}
                            onClick={() => setViewDetailModal(req)}
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > PER_PAGE && (
          <div className="pagination">
            <span>
              Showing {Math.min((page - 1) * PER_PAGE + 1, sorted.length)}–
              {Math.min(page * PER_PAGE, sorted.length)} of {sorted.length}
            </span>
            <div className="pagination-btns">
              <button
                className="pagination-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  className={`pagination-btn ${page === n ? "active" : ""}`}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
              <button
                className="pagination-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal with Quick Presets */}
      {rejectModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setRejectModal(null)}>
          <div className="modal-box" style={{ maxWidth: "520px" }}>
            <div className="modal-header">
              <div>
                <h2>Reject Leave Request</h2>
                <p>
                  Declining {rejectModal.employeeName}'s {rejectModal.days}-day {rejectModal.leaveType}
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setRejectModal(null)}>
                ✕
              </button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label className="field-label" style={{ marginBottom: "8px", display: "block" }}>
                Select a quick reason or compose custom explanation:
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
                {PRESET_REJECTION_REASONS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectReason(preset)}
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      background: rejectReason === preset ? "#eff6ff" : "#f8fafc",
                      border: `1px solid ${rejectReason === preset ? "#3b82f6" : "#e2e8f0"}`,
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: rejectReason === preset ? "#1d4ed8" : "#334155",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    • {preset}
                  </button>
                ))}
              </div>

              <div className="field-group">
                <label className="field-label">Official Rejection Reason *</label>
                <textarea
                  className="field-textarea"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why this leave application cannot be approved at this time..."
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setRejectModal(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleReject}
                disabled={!rejectReason.trim()}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewDetailModal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setViewDetailModal(null)}
        >
          <div className="modal-box" style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <div>
                <h2>Leave Application Details</h2>
                <p>Application ID: {viewDetailModal.id}</p>
              </div>
              <button className="modal-close-btn" onClick={() => setViewDetailModal(null)}>
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "10px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#4f46e5", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800" }}>
                  {viewDetailModal.avatar || "EP"}
                </div>
                <div>
                  <div style={{ fontWeight: "800", color: "#0f172a" }}>{viewDetailModal.employeeName}</div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>{viewDetailModal.department}</div>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <span className={`badge badge-${viewDetailModal.status.toLowerCase()}`}>
                    {viewDetailModal.status}
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="detail-item">
                  <label>Leave Type</label>
                  <span>{viewDetailModal.leaveType}</span>
                </div>
                <div className="detail-item">
                  <label>Total Duration</label>
                  <span>{viewDetailModal.days} Days</span>
                </div>
                <div className="detail-item">
                  <label>Start Date</label>
                  <span>{viewDetailModal.startDate}</span>
                </div>
                <div className="detail-item">
                  <label>End Date</label>
                  <span>{viewDetailModal.endDate}</span>
                </div>
              </div>

              <div className="detail-item">
                <label>Employee Stated Reason</label>
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px", fontSize: "13px", color: "#334155", fontStyle: "italic", marginTop: "4px" }}>
                  "{viewDetailModal.reason}"
                </div>
              </div>

              {viewDetailModal.adminComment && (
                <div className="detail-item">
                  <label>Admin Remarks</label>
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px", fontSize: "13px", color: "#1e293b", marginTop: "4px" }}>
                    {viewDetailModal.adminComment}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setViewDetailModal(null)}>
                Close
              </button>
              {viewDetailModal.status === "Pending" && (
                <>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => {
                      setRejectModal(viewDetailModal);
                      setViewDetailModal(null);
                    }}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    className="btn-success"
                    onClick={() => {
                      handleApprove(viewDetailModal);
                      setViewDetailModal(null);
                    }}
                  >
                    Approve Leave
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
