import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { StorageService } from "../../services/storageService";
import "../../styles/admin.css";

export function AdminProfilePage() {
  const { user, setUser } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || "Administrator",
    email: user?.email || "admin@gmail.com",
    phone: user?.phone || "+977 9801234567",
    department: "Executive Management",
    role: "System Administrator",
    address: "Kathmandu, Nepal",
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess("");

    setTimeout(() => {
      const updatedUser = {
        ...user,
        name: form.name,
        email: form.email,
        phone: form.phone,
      };

      if (setUser) {
        setUser(updatedUser);
      }
      StorageService.setCurrentUser(updatedUser);
      setSaving(false);
      setSuccess("Administrator profile details updated successfully!");
      setTimeout(() => setSuccess(""), 4000);
    }, 400);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <span className="overline">ACCOUNT</span>
          <h1>Admin Profile</h1>
          <p>Manage your administrative profile and contact details.</p>
        </div>
      </div>

      {success && (
        <div className="alert alert-success" style={{ maxWidth: "800px" }}>
          <span>✓</span>
          <span>{success}</span>
        </div>
      )}

      {/* Hero Badge */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          borderRadius: "18px",
          padding: "28px 32px",
          color: "#ffffff",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "20px",
          maxWidth: "800px",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "22px",
            fontWeight: "800",
          }}
        >
          AD
        </div>
        <div>
          <div style={{ fontSize: "20px", fontWeight: "800" }}>{form.name}</div>
          <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "2px" }}>
            {form.role} • CodeedLabs Incorporated
          </div>
          <div style={{ marginTop: "8px", display: "inline-block", background: "rgba(59, 130, 246, 0.2)", color: "#60a5fa", padding: "2px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" }}>
            SUPERADMIN PRIVILEGES
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="detail-card" style={{ maxWidth: "800px" }}>
        <h3 className="detail-section-title">Edit Profile Information</h3>
        <form onSubmit={handleSave}>
          <div className="form-grid-2">
            <div className="field-group">
              <label className="field-label">Full Name *</label>
              <input
                className="field-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="field-group">
              <label className="field-label">Official Email *</label>
              <input
                className="field-input"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="field-group">
              <label className="field-label">Phone Number</label>
              <input
                className="field-input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="field-group">
              <label className="field-label">Location / Address</label>
              <input
                className="field-input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div className="field-group">
              <label className="field-label">Department (Fixed)</label>
              <input className="field-input" value={form.department} disabled />
            </div>

            <div className="field-group">
              <label className="field-label">System Role (Fixed)</label>
              <input className="field-input" value={form.role} disabled />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving Changes..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
