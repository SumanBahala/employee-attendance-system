import React, { useState } from "react";
import { StorageService } from "../../services/storageService";
import { useToast } from "../../context/ToastContext";
import "../../styles/admin.css";

export function AdminSchedulesPage() {
  const { showToast } = useToast();
  const [schedules, setSchedules] = useState(() => StorageService.getSchedules());
  const [employees] = useState(() => StorageService.getEmployees());
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    shiftName: "General Day Shift",
    employeeId: "EAS-001",
    date: "Monday - Friday",
    startTime: "09:00 AM",
    endTime: "05:00 PM",
    breakDuration: "1 hour (01:00 PM - 02:00 PM)",
    status: "Active",
  });

  const filtered = schedules.filter(
    (s) =>
      s.shiftName.toLowerCase().includes(search.toLowerCase()) ||
      s.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
      s.department?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditItem(null);
    setForm({
      shiftName: "General Day Shift",
      employeeId: employees[0]?.id || "EAS-001",
      date: "Monday - Friday",
      startTime: "09:00 AM",
      endTime: "05:00 PM",
      breakDuration: "1 hour (01:00 PM - 02:00 PM)",
      status: "Active",
    });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      shiftName: item.shiftName,
      employeeId: item.employeeId,
      date: item.date,
      startTime: item.startTime,
      endTime: item.endTime,
      breakDuration: item.breakDuration,
      status: item.status,
    });
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === form.employeeId);
    let updated;
    if (editItem) {
      updated = schedules.map((s) =>
        s.id === editItem.id
          ? {
              ...s,
              ...form,
              employeeName: emp ? emp.name : s.employeeName,
              department: emp ? emp.department : s.department,
            }
          : s
      );
    } else {
      const newSchedule = {
        id: `SCH-${String(schedules.length + 1).padStart(2, "0")}`,
        ...form,
        employeeName: emp ? emp.name : "Employee",
        department: emp ? emp.department : "General",
      };
      updated = [...schedules, newSchedule];
    }
    setSchedules(updated);
    StorageService.saveSchedules(updated);
    showToast("success", editItem ? `Shift schedule updated.` : `New shift schedule assigned.`);
    setShowModal(false);
  };

  const handleDelete = (id, name) => {
    if (!window.confirm(`Delete shift schedule for ${name}?`)) return;
    const updated = schedules.filter((s) => s.id !== id);
    setSchedules(updated);
    StorageService.saveSchedules(updated);
    showToast("info", `Shift schedule for ${name} was deleted.`);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <span className="overline">ROSTER & TIMINGS</span>
          <h1>Work Schedules</h1>
          <p>Configure shifts, working hours, and shift assignments across teams.</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          + Assign Schedule
        </button>
      </div>

      <div className="toolbar">
        <div className="toolbar-search">
          <span className="toolbar-search-icon">⌕</span>
          <input
            type="text"
            placeholder="Search shift, employee, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-card">
        <div className="table-card-header">
          <div>
            <h2>Assigned Schedules</h2>
            <p>Active employee shift plans and break hours</p>
          </div>
          <span className="count-badge">{filtered.length} Schedules</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>SHIFT NAME</th>
                <th>EMPLOYEE</th>
                <th>DAYS</th>
                <th>TIMING</th>
                <th>BREAK DURATION</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">
                      <div className="empty-state-icon">⏰</div>
                      <h3>No schedules found</h3>
                      <p>Try searching or assign a new shift schedule.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.shiftName}</strong>
                    </td>
                    <td>
                      <div className="cell-name">{item.employeeName}</div>
                      <div className="cell-sub">{item.department}</div>
                    </td>
                    <td>{item.date}</td>
                    <td>
                      <span style={{ fontWeight: "700", color: "#2563eb" }}>
                        {item.startTime}
                      </span>{" "}
                      –{" "}
                      <span style={{ fontWeight: "700", color: "#2563eb" }}>
                        {item.endTime}
                      </span>
                    </td>
                    <td style={{ fontSize: "12px", color: "#64748b" }}>
                      {item.breakDuration}
                    </td>
                    <td>
                      <span className={`badge badge-${item.status.toLowerCase()}`}>
                        {item.status}
                      </span>
                    </td>
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
                          onClick={() => handleDelete(item.id, item.employeeName)}
                          title="Delete"
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="modal-box">
            <div className="modal-header">
              <div>
                <h2>{editItem ? "Edit Schedule" : "Assign New Schedule"}</h2>
                <p>Configure working hours and assigned employee.</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="field-group">
                <label className="field-label">Shift Name *</label>
                <input
                  className="field-input"
                  value={form.shiftName}
                  onChange={(e) => setForm({ ...form, shiftName: e.target.value })}
                  required
                />
              </div>

              <div className="field-group">
                <label className="field-label">Assigned Employee *</label>
                <select
                  className="field-select"
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.department} - {emp.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-grid-2">
                <div className="field-group">
                  <label className="field-label">Start Time</label>
                  <input
                    className="field-input"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    placeholder="09:00 AM"
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">End Time</label>
                  <input
                    className="field-input"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    placeholder="05:00 PM"
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Working Days</label>
                <input
                  className="field-input"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  placeholder="Monday - Friday"
                />
              </div>

              <div className="field-group">
                <label className="field-label">Break Duration</label>
                <input
                  className="field-input"
                  value={form.breakDuration}
                  onChange={(e) => setForm({ ...form, breakDuration: e.target.value })}
                  placeholder="1 hour (01:00 PM - 02:00 PM)"
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
                  {editItem ? "Save Changes" : "Assign Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
