import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "../../styles/admin.css";

export function ChangePasswordPage() {
  const { role, changePassword } = useAuth();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.currentPassword) {
      setError("Please enter your current password.");
      return;
    }

    if (form.newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      if (res.success) {
        setSuccess(res.message);
        setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setError(res.message || "Failed to update password.");
      }
    } catch {
      setError("An unexpected error occurred while changing password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <span className="overline">SECURITY</span>
          <h1>Change Password</h1>
          <p>Update your account password to ensure your EAS account remains secure.</p>
        </div>
      </div>

      <div className="detail-card" style={{ maxWidth: "560px" }}>
        <h3 className="detail-section-title">Update Account Password</h3>

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
          <div className="field-group">
            <label className="field-label">Current Password *</label>
            <input
              className="field-input"
              type="password"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              placeholder="Enter current password"
              required
            />
          </div>

          <div className="field-group">
            <label className="field-label">New Password *</label>
            <input
              className="field-input"
              type="password"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              placeholder="Minimum 6 characters"
              required
            />
          </div>

          <div className="field-group">
            <label className="field-label">Confirm New Password *</label>
            <input
              className="field-input"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="Re-enter new password"
              required
            />
          </div>

          <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
