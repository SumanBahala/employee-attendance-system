import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { StorageService } from "../../services/storageService";
import "../../styles/employee.css";

export function EmployeeProfilePage() {
  const { user, updateProfile } = useAuth();

  // Retrieve complete employee record
  const employeeData = StorageService.getEmployeeById(user?.id) || {
    id: user?.id || "EAS-001",
    name: user?.name || "Suman Bahala",
    email: user?.email || "suman@gmail.com",
    phone: "+977 9841234567",
    address: "Baneshwor, Kathmandu, Nepal",
    department: user?.department || "Web Development",
    position: user?.position || "Frontend Developer",
    joined: "2026-01-15",
    manager: "Suresh Poudel",
    employmentStatus: "Full-Time",
    dob: "1998-05-12",
    gender: "Male",
    bloodGroup: "O+",
    emergencyContact: "+977 9811234567 (Father)",
    avatar: user?.avatar || "SB",
  };

  const [formData, setFormData] = useState({
    phone: employeeData.phone || "",
    address: employeeData.address || "",
    emergencyContact: employeeData.emergencyContact || "",
    bloodGroup: employeeData.bloodGroup || "O+",
    bio: employeeData.bio || "Dedicated frontend engineer at CodeedLabs building modern web experiences.",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    // Update active user context and persistent storage
    updateProfile(formData);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* PAGE HEADER */}
      <div className="portal-page-header">
        <div className="portal-page-title">
          <span style={{ fontSize: "11px", fontWeight: "700", color: "#6366f1", letterSpacing: "1px" }}>
            MY ACCOUNT
          </span>
          <h1>My Profile</h1>
          <p>View your employment details and keep your personal contact information up to date.</p>
        </div>

        <div className="portal-header-actions">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              style={{
                padding: "9px 18px",
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              ✎ Edit Personal Info
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              style={{
                padding: "9px 18px",
                background: "#f1f5f9",
                color: "#475569",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div
          style={{
            padding: "12px 18px",
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: "10px",
            color: "#065f46",
            fontSize: "13px",
            fontWeight: "600",
            marginBottom: "20px",
          }}
        >
          ✓ Your personal information has been updated successfully!
        </div>
      )}

      {/* TWO-COLUMN PROFILE LAYOUT */}
      <div className="profile-grid-layout">
        {/* LEFT COLUMN: IDENTITY CARD */}
        <div className="profile-card-side">
          <div className="profile-big-avatar">
            {employeeData.avatar || user?.avatar || "SB"}
          </div>

          <h2 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>
            {employeeData.name}
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
            {employeeData.position}
          </p>

          <div
            style={{
              display: "inline-block",
              marginTop: "12px",
              padding: "4px 10px",
              background: "#eff6ff",
              color: "#2563eb",
              borderRadius: "20px",
              fontSize: "11px",
              fontWeight: "700",
            }}
          >
            {employeeData.id}
          </div>

          <div
            style={{
              marginTop: "24px",
              borderTop: "1px solid #f1f5f9",
              paddingTop: "20px",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              fontSize: "13px",
            }}
          >
            <div>
              <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>EMAIL</span>
              <strong style={{ color: "#1e293b" }}>{employeeData.email}</strong>
            </div>

            <div>
              <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>DEPARTMENT</span>
              <strong style={{ color: "#1e293b" }}>{employeeData.department}</strong>
            </div>

            <div>
              <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>JOINING DATE</span>
              <strong style={{ color: "#1e293b" }}>{employeeData.joined}</strong>
            </div>

            <div>
              <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>REPORTING MANAGER</span>
              <strong style={{ color: "#1e293b" }}>{employeeData.manager}</strong>
            </div>

            <div>
              <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>STATUS</span>
              <span
                style={{
                  display: "inline-block",
                  padding: "3px 8px",
                  background: "#dcfce7",
                  color: "#15803d",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: "700",
                  marginTop: "2px",
                }}
              >
                {employeeData.employmentStatus || "Active Full-Time"}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: EDITABLE DETAILS & EMPLOYMENT SPECIFICATIONS */}
        <div className="profile-card-main">
          {/* PERSONAL INFORMATION */}
          <h3 className="profile-section-title">Personal Information</h3>

          <form onSubmit={handleSave}>
            <div className="form-two-col">
              <div className="form-group">
                <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "6px" }}>
                  CONTACT PHONE NUMBER
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "13px",
                    background: isEditing ? "#ffffff" : "#f8fafc",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "6px" }}>
                  RESIDENTIAL ADDRESS
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={!isEditing}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "13px",
                    background: isEditing ? "#ffffff" : "#f8fafc",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "6px" }}>
                  EMERGENCY CONTACT & RELATION
                </label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="e.g. +977 9811234567 (Father)"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "13px",
                    background: isEditing ? "#ffffff" : "#f8fafc",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "6px" }}>
                  BLOOD GROUP
                </label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  disabled={!isEditing}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "13px",
                    background: isEditing ? "#ffffff" : "#f8fafc",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: "16px" }}>
              <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "6px" }}>
                ABOUT / BIO
              </label>
              <textarea
                name="bio"
                rows={3}
                value={formData.bio}
                onChange={handleChange}
                disabled={!isEditing}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "13px",
                  background: isEditing ? "#ffffff" : "#f8fafc",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {isEditing && (
              <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{
                    padding: "10px 18px",
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 24px",
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Save Changes
                </button>
              </div>
            )}
          </form>

          {/* EMPLOYMENT DETAILS (READ-ONLY) */}
          <h3 className="profile-section-title" style={{ marginTop: "36px" }}>
            Employment Information <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "normal" }}>(Admin Managed)</span>
          </h3>

          <div className="form-two-col">
            <div style={{ background: "#f8fafc", padding: "14px 16px", borderRadius: "10px" }}>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>ORGANIZATION</span>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>
                CodeedLabs Incorporated Pvt. Ltd.
              </div>
            </div>

            <div style={{ background: "#f8fafc", padding: "14px 16px", borderRadius: "10px" }}>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>EMPLOYEE ID</span>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>
                {employeeData.id}
              </div>
            </div>

            <div style={{ background: "#f8fafc", padding: "14px 16px", borderRadius: "10px" }}>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>DEPARTMENT</span>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>
                {employeeData.department}
              </div>
            </div>

            <div style={{ background: "#f8fafc", padding: "14px 16px", borderRadius: "10px" }}>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>POSITION / DESIGNATION</span>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>
                {employeeData.position}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
