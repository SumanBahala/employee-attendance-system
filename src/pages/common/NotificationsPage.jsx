import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { StorageService } from "../../services/storageService";
import "../../styles/admin.css";

export function NotificationsPage() {
  const { role } = useAuth();
  const isAdmin = role === "ADMIN";

  const [notifications, setNotifications] = useState(() => StorageService.getNotifications());
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "announcement",
    forRole: "ALL",
  });

  // Filter relevant notifications
  const relevant = notifications.filter(
    (n) => n.forRole === "ALL" || (isAdmin ? n.forRole === "ADMIN" : n.forRole === "EMPLOYEE")
  );

  const toggleRead = (id) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: !n.read } : n
    );
    setNotifications(updated);
    StorageService.saveNotifications(updated);
  };

  const handleCreateAnnouncement = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;

    const newNotif = {
      id: `NOTIF-${String(notifications.length + 1).padStart(2, "0")}`,
      ...form,
      date: new Date().toISOString().split("T")[0],
      time: "Just now",
      read: false,
    };

    const updated = [newNotif, ...notifications];
    setNotifications(updated);
    StorageService.saveNotifications(updated);
    setShowModal(false);
    setForm({ title: "", message: "", type: "announcement", forRole: "ALL" });
  };

  const handleDelete = (id) => {
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    StorageService.saveNotifications(updated);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <span className="overline">COMMUNICATION</span>
          <h1>{isAdmin ? "Announcements & Broadcasts" : "Notifications"}</h1>
          <p>
            {isAdmin
              ? "Publish company-wide announcements and track system alerts."
              : "Stay up to date with official organization announcements and your activity updates."}
          </p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + New Announcement
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "850px" }}>
        {relevant.length === 0 ? (
          <div className="detail-card">
            <div className="empty-state">
              <div className="empty-state-icon">🔔</div>
              <h3>No notifications yet</h3>
              <p>You have caught up with all company announcements.</p>
            </div>
          </div>
        ) : (
          relevant.map((n) => (
            <div
              key={n.id}
              style={{
                background: "#ffffff",
                border: "1px solid",
                borderColor: n.read ? "#e2e8f0" : "#93c5fd",
                borderRadius: "14px",
                padding: "20px 24px",
                display: "flex",
                gap: "16px",
                alignItems: "flex-start",
                boxShadow: n.read ? "none" : "0 4px 12px rgba(59, 130, 246, 0.08)",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background:
                    n.type === "holiday"
                      ? "#eff6ff"
                      : n.type === "leave"
                      ? "#ecfdf5"
                      : "#f5f3ff",
                  color:
                    n.type === "holiday"
                      ? "#2563eb"
                      : n.type === "leave"
                      ? "#059669"
                      : "#7c3aed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  flexShrink: 0,
                }}
              >
                {n.type === "holiday" ? "🎉" : n.type === "leave" ? "📝" : "📢"}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>
                    {n.title}
                  </h3>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                    {n.time} • {n.date}
                  </span>
                </div>
                <p style={{ margin: "6px 0 10px", fontSize: "13px", color: "#475569", lineHeight: "1.5" }}>
                  {n.message}
                </p>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button
                    onClick={() => toggleRead(n.id)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      fontSize: "12px",
                      color: "#2563eb",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    {n.read ? "Mark as unread" : "Mark as read"}
                  </button>

                  {isAdmin && (
                    <>
                      <span style={{ color: "#cbd5e1" }}>•</span>
                      <button
                        onClick={() => handleDelete(n.id)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          fontSize: "12px",
                          color: "#ef4444",
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Admin New Announcement Modal */}
      {showModal && isAdmin && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <div>
                <h2>Create Announcement</h2>
                <p>Broadcast a message to company employees or administrators.</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateAnnouncement}>
              <div className="field-group">
                <label className="field-label">Headline / Title *</label>
                <input
                  className="field-input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Office Relocation Notice"
                  required
                />
              </div>

              <div className="form-grid-2">
                <div className="field-group">
                  <label className="field-label">Category</label>
                  <select
                    className="field-select"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option value="announcement">General Announcement</option>
                    <option value="holiday">Holiday Notice</option>
                    <option value="leave">Leave / HR Policy</option>
                    <option value="admin">System Alert</option>
                  </select>
                </div>

                <div className="field-group">
                  <label className="field-label">Target Audience</label>
                  <select
                    className="field-select"
                    value={form.forRole}
                    onChange={(e) => setForm({ ...form, forRole: e.target.value })}
                  >
                    <option value="ALL">Everyone (All Employees & Admin)</option>
                    <option value="EMPLOYEE">Employees Only</option>
                    <option value="ADMIN">Admins Only</option>
                  </select>
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Announcement Content *</label>
                <textarea
                  className="field-textarea"
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Detailed message description..."
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Broadcast Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
