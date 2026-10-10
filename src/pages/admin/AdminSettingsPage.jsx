import React, { useState } from "react";
import { StorageService } from "../../services/storageService";
import { useToast } from "../../context/ToastContext";
import "../../styles/admin.css";

export function AdminSettingsPage() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState(() => StorageService.getSettings());
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess("");

    setTimeout(() => {
      StorageService.saveSettings(settings);
      setSaving(false);
      setSuccess("System settings have been successfully updated!");
      showToast("success", "System settings have been saved successfully.");
      setTimeout(() => setSuccess(""), 4000);
    }, 400);
  };

  const handleResetData = () => {
    if (
      !window.confirm(
        "Are you sure you want to reset all mock records (attendance, employees, leaves, departments) back to factory defaults?"
      )
    )
      return;

    StorageService.resetToDefaults();
    setSettings(StorageService.getSettings());
    showToast("info", "Sample demo records restored to initial state.");
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <span className="overline">CONFIGURATION</span>
          <h1>System Settings</h1>
          <p>Configure company policies, working hours, attendance rules, and automated notifications.</p>
        </div>
      </div>

      {success && (
        <div className="alert alert-success" style={{ maxWidth: "850px" }}>
          <span>✓</span>
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSave} style={{ maxWidth: "850px" }}>
        {/* Company Identity */}
        <div className="detail-card">
          <h3 className="detail-section-title">Company Profile & Information</h3>
          <div className="form-grid-2">
            <div className="field-group">
              <label className="field-label">Company Legal Name</label>
              <input
                className="field-input"
                name="companyName"
                value={settings.companyName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="field-group">
              <label className="field-label">Tagline / Motto</label>
              <input
                className="field-input"
                name="companyTagline"
                value={settings.companyTagline}
                onChange={handleChange}
              />
            </div>
            <div className="field-group">
              <label className="field-label">Official Website</label>
              <input
                className="field-input"
                name="website"
                value={settings.website}
                onChange={handleChange}
              />
            </div>
            <div className="field-group">
              <label className="field-label">Primary Contact Email</label>
              <input
                className="field-input"
                type="email"
                name="email"
                value={settings.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="field-group">
              <label className="field-label">Phone Number</label>
              <input
                className="field-input"
                name="phone"
                value={settings.phone}
                onChange={handleChange}
              />
            </div>
            <div className="field-group">
              <label className="field-label">Physical Office Location</label>
              <input
                className="field-input"
                name="address"
                value={settings.address}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Working Hours & Grace Period */}
        <div className="detail-card">
          <h3 className="detail-section-title">Attendance & Shift Timings</h3>
          <div className="form-grid-3">
            <div className="field-group">
              <label className="field-label">Official Check-in Time</label>
              <input
                className="field-input"
                type="time"
                name="workStartTime"
                value={settings.workStartTime}
                onChange={handleChange}
              />
            </div>
            <div className="field-group">
              <label className="field-label">Official Check-out Time</label>
              <input
                className="field-input"
                type="time"
                name="workEndTime"
                value={settings.workEndTime}
                onChange={handleChange}
              />
            </div>
            <div className="field-group">
              <label className="field-label">Grace Period (Minutes)</label>
              <input
                className="field-input"
                type="number"
                name="gracePeriodMinutes"
                value={settings.gracePeriodMinutes}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="field-group">
              <label className="field-label">Late Threshold Time (Marked as Late after)</label>
              <input
                className="field-input"
                type="time"
                name="lateThresholdTime"
                value={settings.lateThresholdTime}
                onChange={handleChange}
              />
            </div>
            <div className="field-group">
              <label className="field-label">Standard Daily Working Hours</label>
              <input
                className="field-input"
                type="number"
                name="standardWorkingHours"
                value={settings.standardWorkingHours}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Annual Leave Allowances */}
        <div className="detail-card">
          <h3 className="detail-section-title">Annual Leave Allowances (Days / Year)</h3>
          <div className="form-grid-3">
            <div className="field-group">
              <label className="field-label">Annual Leave</label>
              <input
                className="field-input"
                type="number"
                name="annualLeaveAllowance"
                value={settings.annualLeaveAllowance}
                onChange={handleChange}
              />
            </div>
            <div className="field-group">
              <label className="field-label">Sick Leave</label>
              <input
                className="field-input"
                type="number"
                name="sickLeaveAllowance"
                value={settings.sickLeaveAllowance}
                onChange={handleChange}
              />
            </div>
            <div className="field-group">
              <label className="field-label">Casual Leave</label>
              <input
                className="field-input"
                type="number"
                name="casualLeaveAllowance"
                value={settings.casualLeaveAllowance}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Data Management & Factory Reset */}
        <div className="detail-card" style={{ border: "1px solid #fed7aa", background: "#fffaf5" }}>
          <h3 className="detail-section-title" style={{ color: "#9a3412" }}>
            Demo Data & Storage Management
          </h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px" }}>
            Restore all employees, today's real-time check-in logs, leave applications, department structures, and designations back to factory demo defaults.
          </p>
          <button
            type="button"
            className="btn-danger"
            onClick={handleResetData}
            style={{ padding: "10px 18px", fontSize: "13px" }}
          >
            <span>↻</span> Reset All Demo Data to Defaults
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving Changes..." : "Save System Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
