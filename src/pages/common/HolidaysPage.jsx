import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { StorageService } from "../../services/storageService";
import "../../styles/admin.css";

export function HolidaysPage() {
  const { role } = useAuth();
  const { showToast } = useToast();
  const isAdmin = role === "ADMIN";

  const [holidays, setHolidays] = useState(() => StorageService.getHolidays());
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const [form, setForm] = useState({
    name: "",
    date: "",
    day: "Sunday",
    type: "Public / National Holiday",
    description: "",
  });

  const filtered = holidays.filter(
    (h) =>
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.type.toLowerCase().includes(search.toLowerCase()) ||
      h.date.includes(search)
  );

  const openAdd = () => {
    setEditItem(null);
    setForm({
      name: "",
      date: new Date().toISOString().split("T")[0],
      day: "Sunday",
      type: "Public / National Holiday",
      description: "",
    });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name,
      date: item.date,
      day: item.day,
      type: item.type,
      description: item.description || "",
    });
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.date) return;

    const dateObj = new Date(form.date);
    const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });

    let updated;
    if (editItem) {
      updated = holidays.map((h) =>
        h.id === editItem.id ? { ...h, ...form, day: dayName } : h
      );
    } else {
      const newHol = {
        id: `HOL-${String(holidays.length + 1).padStart(2, "0")}`,
        ...form,
        day: dayName,
      };
      updated = [...holidays, newHol];
    }

    setHolidays(updated);
    StorageService.saveHolidays(updated);
    showToast("success", editItem ? `Holiday "${form.name}" updated.` : `Added holiday: "${form.name}".`);
    setShowModal(false);
  };

  const handleDelete = (id, name) => {
    if (!window.confirm(`Delete holiday: ${name}?`)) return;
    const updated = holidays.filter((h) => h.id !== id);
    setHolidays(updated);
    StorageService.saveHolidays(updated);
    showToast("info", `Holiday "${name}" was removed.`);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <span className="overline">CALENDAR & FESTIVALS</span>
          <h1>Nepal & Company Holidays</h1>
          <p>Official Nepal national holidays and CodeedLabs company holidays for 2026.</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={openAdd}>
            + Add Holiday
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-search">
          <span className="toolbar-search-icon">⌕</span>
          <input
            type="text"
            placeholder="Search holiday name, date, or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Holiday Table Card */}
      <div className="table-card">
        <div className="table-card-header">
          <div>
            <h2>Holiday Calendar</h2>
            <p>Official non-working days scheduled for 2026</p>
          </div>
          <span className="count-badge">{filtered.length} Holidays</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>HOLIDAY NAME</th>
                <th>DATE</th>
                <th>DAY</th>
                <th>TYPE</th>
                <th>DESCRIPTION</th>
                {isAdmin && <th>ACTIONS</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5}>
                    <div className="empty-state">
                      <div className="empty-state-icon">🎉</div>
                      <h3>No holidays found</h3>
                      <p>Try searching another keyword or add a holiday.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                    </td>
                    <td>
                      <code style={{ fontSize: "12px", color: "#2563eb", background: "#eff6ff", padding: "3px 8px", borderRadius: "6px", fontWeight: "700" }}>
                        {item.date}
                      </code>
                    </td>
                    <td>{item.day}</td>
                    <td>
                      <span className={`badge ${item.type.includes("Company") ? "badge-holiday" : "badge-leave"}`}>
                        {item.type}
                      </span>
                    </td>
                    <td style={{ fontSize: "12px", color: "#64748b", maxWidth: "280px" }}>
                      {item.description || "—"}
                    </td>
                    {isAdmin && (
                      <td>
                        <div className="action-group">
                          <button
                            className="action-btn edit"
                            onClick={() => openEdit(item)}
                            title="Edit"
                          >
                            ✎
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => handleDelete(item.id, item.name)}
                            title="Delete"
                          >
                            ×
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Add/Edit Modal */}
      {showModal && isAdmin && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="modal-box">
            <div className="modal-header">
              <div>
                <h2>{editItem ? "Edit Holiday" : "Add Holiday"}</h2>
                <p>Configure holiday date and description.</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="field-group">
                <label className="field-label">Holiday Name *</label>
                <input
                  className="field-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="e.g. Dashain / Vijaya Dashami"
                />
              </div>

              <div className="form-grid-2">
                <div className="field-group">
                  <label className="field-label">Date *</label>
                  <input
                    className="field-input"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Holiday Type</label>
                  <select
                    className="field-select"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option>Public / National Holiday</option>
                    <option>National Holiday</option>
                    <option>Company Holiday</option>
                    <option>Religious / Cultural Holiday</option>
                  </select>
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Description / Significance</label>
                <textarea
                  className="field-textarea"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Additional details regarding the holiday..."
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editItem ? "Save Changes" : "Add Holiday"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
