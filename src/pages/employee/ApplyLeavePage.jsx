import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { StorageService } from "../../services/storageService";
import "../../styles/admin.css";

const LEAVE_TYPES = [
  { type: "Annual Leave", max: 14, used: 4, color: "#3b82f6" },
  { type: "Sick Leave", max: 10, used: 2, color: "#ef4444" },
  { type: "Casual Leave", max: 6, used: 1, color: "#10b981" },
  { type: "Emergency Leave", max: 4, used: 0, color: "#f59e0b" },
];

export function ApplyLeavePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    leaveType: "Annual Leave",
    startDate: "",
    endDate: "",
    reason: "",
    emergencyContact: user?.phone || "+977 9841234567",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const calculateDays = () => {
    if (!form.startDate || !form.endDate) return 0;
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (end < start) return 0;
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const daysRequested = calculateDays();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.startDate || !form.endDate) {
      setError("Please select both start date and end date.");
      return;
    }

    if (new Date(form.endDate) < new Date(form.startDate)) {
      setError("End date cannot be earlier than start date.");
      return;
    }

    if (!form.reason.trim()) {
      setError("Please provide a reason for your leave request.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const existing = StorageService.getLeaveRequests();
      const newRequest = {
        id: `LR-${String(existing.length + 1).padStart(3, "0")}`,
        employeeId: user?.id || "EAS-001",
        employeeName: user?.name || "Suman Shrestha",
        department: user?.department || "Web Development",
        avatar: user?.avatar || "SS",
        leaveType: form.leaveType,
        startDate: form.startDate,
        endDate: form.endDate,
        days: daysRequested,
        reason: form.reason.trim(),
        appliedDate: new Date().toISOString().split("T")[0],
        status: "Pending",
        adminComment: "",
      };

      StorageService.saveLeaveRequests([newRequest, ...existing]);
      setLoading(false);
      setSuccess("Your leave application has been submitted successfully for admin review!");

      setTimeout(() => {
        navigate("/employee/leave-history");
      }, 1500);
    }, 400);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <span className="overline">LEAVE MANAGEMENT</span>
          <h1>Apply for Leave</h1>
          <p>Submit a formal leave application for review and approval by administration.</p>
        </div>
      </div>

      {/* Leave Balance Overview Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {LEAVE_TYPES.map((lt) => {
          const remaining = lt.max - lt.used;
          return (
            <div key={lt.type} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px 20px" }}>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>{lt.type}</div>
              <div style={{ fontSize: "28px", fontWeight: "800", color: lt.color, marginTop: "6px" }}>
                {remaining} <span style={{ fontSize: "13px", fontWeight: "500", color: "#94a3b8" }}>/ {lt.max} left</span>
              </div>
              <div style={{ marginTop: "8px", height: "6px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${((lt.max - remaining) / lt.max) * 100}%`,
                    height: "100%",
                    background: lt.color,
                    borderRadius: "4px",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Form Card */}
      <div className="detail-card" style={{ maxWidth: "750px" }}>
        <h3 className="detail-section-title">New Leave Application</h3>

        {error && (
          <div className="alert alert-error">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <span>✓</span>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <div className="field-group">
              <label className="field-label">Leave Type *</label>
              <select
                className="field-select"
                value={form.leaveType}
                onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
              >
                {LEAVE_TYPES.map((lt) => (
                  <option key={lt.type} value={lt.type}>{lt.type}</option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <label className="field-label">Emergency Contact During Leave</label>
              <input
                className="field-input"
                type="text"
                value={form.emergencyContact}
                onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                placeholder="+977 98XXXXXXXX"
              />
            </div>

            <div className="field-group">
              <label className="field-label">Start Date *</label>
              <input
                className="field-input"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </div>

            <div className="field-group">
              <label className="field-label">End Date *</label>
              <input
                className="field-input"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          {daysRequested > 0 && (
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "12px 16px", marginBottom: "18px", color: "#1e40af", fontSize: "13px", fontWeight: "600" }}>
              Total Duration: <strong>{daysRequested} working {daysRequested === 1 ? "day" : "days"}</strong>
            </div>
          )}

          <div className="field-group">
            <label className="field-label">Reason for Leave *</label>
            <textarea
              className="field-textarea"
              rows={4}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Please provide a clear and detailed explanation for your leave request..."
              required
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/employee/leave-history")}
            >
              View History
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
