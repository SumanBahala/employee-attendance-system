import React, { useState } from "react";
import { StorageService } from "../../services/storageService";
import { useToast } from "../../context/ToastContext";
import "../../styles/admin.css";

const LEVELS = ["Intern", "Associate", "Mid", "Senior", "Lead", "Manager", "Director"];

const LEVEL_COLORS = {
  Intern: { color: "#64748b", bg: "#f1f5f9", dot: "#94a3b8" },
  Associate: { color: "#059669", bg: "#ecfdf5", dot: "#10b981" },
  Mid: { color: "#2563eb", bg: "#eff6ff", dot: "#3b82f6" },
  Senior: { color: "#7c3aed", bg: "#f5f3ff", dot: "#8b5cf6" },
  Lead: { color: "#d97706", bg: "#fffbeb", dot: "#f59e0b" },
  Manager: { color: "#e11d48", bg: "#fff1f2", dot: "#f43f5e" },
  Director: { color: "#0f172a", bg: "#f8fafc", dot: "#334155" },
};

export function DesignationsPage() {
  const { showToast } = useToast();
  const [designations, setDesignations] = useState(() => StorageService.getDesignations());
  const [departments] = useState(() => StorageService.getDepartments());
  const [employees] = useState(() => StorageService.getEmployees());

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    title: "",
    department: departments[0]?.name || "Web Development",
    level: "Mid",
    status: "Active",
  });

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [levelFilter, setLevelFilter] = useState("All");

  const filtered = designations.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q || d.title.toLowerCase().includes(q) || d.department.toLowerCase().includes(q);
    const matchDept = deptFilter === "All Departments" || d.department === deptFilter;
    const matchLevel = levelFilter === "All" || d.level === levelFilter;
    return matchSearch && matchDept && matchLevel;
  });

  // Calculate count of staff holding this position
  const getEmployeeCountByRole = (roleTitle) => {
    return employees.filter((e) => e.position === roleTitle && e.status === "Active").length;
  };

  const seniorCount = designations.filter(
    (d) => d.level === "Senior" || d.level === "Lead" || d.level === "Manager" || d.level === "Director"
  ).length;

  const associateInternCount = designations.filter(
    (d) => d.level === "Associate" || d.level === "Intern"
  ).length;

  const uniqueDeptsWithRoles = new Set(designations.map((d) => d.department)).size;

  const openAdd = () => {
    setEditItem(null);
    setForm({
      title: "",
      department: departments[0]?.name || "Web Development",
      level: "Mid",
      status: "Active",
    });
    setShowModal(true);
  };

  const openEdit = (des) => {
    setEditItem(des);
    setForm({
      title: des.title,
      department: des.department,
      level: des.level,
      status: des.status,
    });
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast("warning", "Please provide a valid job designation title.");
      return;
    }

    let updated;
    if (editItem) {
      updated = designations.map((d) => (d.id === editItem.id ? { ...d, ...form } : d));
      showToast("success", `Designation "${form.title}" updated successfully.`);
    } else {
      const newDes = {
        id: `DES-${String(designations.length + 1).padStart(2, "0")}`,
        ...form,
      };
      updated = [...designations, newDes];
      showToast("success", `Designation "${form.title}" created successfully.`);
    }

    setDesignations(updated);
    StorageService.saveDesignations(updated);
    setShowModal(false);
  };

  const handleDelete = (id, title) => {
    if (!window.confirm(`Are you sure you want to delete designation: "${title}"?`)) return;
    const updated = designations.filter((d) => d.id !== id);
    setDesignations(updated);
    StorageService.saveDesignations(updated);
    showToast("info", `Designation "${title}" removed.`);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <span className="overline">ROLE HIERARCHY</span>
          <h1>Job Designations</h1>
          <p>Standardize job positions, seniority grades, and department role alignments.</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <span>+</span> Add Designation
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "rgba(99, 102, 241, 0.12)", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
            🏷
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Registered Roles</div>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a" }}>{designations.length} Titles</div>
          </div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "rgba(139, 92, 246, 0.12)", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
            ⭐
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Senior & Leadership</div>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#7c3aed" }}>{seniorCount} Roles</div>
          </div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.12)", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
            🌱
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Growth / Intern Roles</div>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#059669" }}>{associateInternCount} Positions</div>
          </div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "rgba(59, 130, 246, 0.12)", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
            🏢
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Dept Coverage</div>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#2563eb" }}>{uniqueDeptsWithRoles} Depts</div>
          </div>
        </div>
      </div>

      {/* Seniority Level Filter Pills */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", overflowX: "auto", paddingBottom: "12px", marginBottom: "12px" }}>
        <button
          type="button"
          onClick={() => setLevelFilter("All")}
          style={{
            border: "none",
            background: levelFilter === "All" ? "#0f172a" : "#ffffff",
            color: levelFilter === "All" ? "#ffffff" : "#475569",
            fontWeight: "700",
            fontSize: "12px",
            padding: "6px 14px",
            borderRadius: "20px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "all 0.15s ease",
          }}
        >
          All Seniority Levels ({designations.length})
        </button>
        {LEVELS.map((lvl) => {
          const count = designations.filter((d) => d.level === lvl).length;
          const active = levelFilter === lvl;
          return (
            <button
              key={lvl}
              type="button"
              onClick={() => setLevelFilter(lvl)}
              style={{
                border: active ? "none" : "1px solid #e2e8f0",
                background: active ? LEVEL_COLORS[lvl]?.color || "#2563eb" : "#ffffff",
                color: active ? "#ffffff" : "#475569",
                fontWeight: "700",
                fontSize: "12px",
                padding: "6px 14px",
                borderRadius: "20px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s ease",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: active ? "#ffffff" : LEVEL_COLORS[lvl]?.dot,
                }}
              />
              <span>{lvl}</span>
              <span style={{ opacity: 0.75, fontSize: "11px" }}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Toolbar Filters */}
      <div className="toolbar" style={{ marginBottom: "20px" }}>
        <div className="toolbar-search">
          <span className="toolbar-search-icon">⌕</span>
          <input
            type="text"
            placeholder="Search designations by job title or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="toolbar-select"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="All Departments">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Directory Table */}
      <div className="table-card">
        <div className="table-card-header">
          <div>
            <h2>Designation Directory</h2>
            <p>Authorized corporate positions and compensation grades</p>
          </div>
          <span className="count-badge">{filtered.length} Roles</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>DESIGNATION / TITLE</th>
                <th>DEPARTMENT</th>
                <th>SENIORITY LEVEL</th>
                <th>ACTIVE TALENT</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state">
                      <div className="empty-state-icon">🏷</div>
                      <h3>No designations found</h3>
                      <p>Try clearing your filters or add a new job designation.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((des) => {
                  const theme = LEVEL_COLORS[des.level] || LEVEL_COLORS.Mid;
                  const activeTalentCount = getEmployeeCountByRole(des.title);

                  return (
                    <tr key={des.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              background: theme.bg,
                              color: theme.color,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "800",
                              fontSize: "12px",
                              border: `1px solid ${theme.dot}33`,
                            }}
                          >
                            {des.title.charAt(0)}
                          </div>
                          <div>
                            <strong style={{ color: "#0f172a", fontSize: "14px" }}>{des.title}</strong>
                            <div style={{ fontSize: "11px", color: "#94a3b8" }}>{des.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: "600", color: "#334155" }}>{des.department}</span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "11px",
                            fontWeight: "800",
                            color: theme.color,
                            background: theme.bg,
                            padding: "4px 10px",
                            borderRadius: "6px",
                            border: `1px solid ${theme.dot}44`,
                            letterSpacing: "0.4px",
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: theme.dot,
                            }}
                          />
                          {des.level.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: "700", color: activeTalentCount > 0 ? "#0f172a" : "#94a3b8" }}>
                          {activeTalentCount}
                        </span>{" "}
                        <span style={{ fontSize: "11px", color: "#64748b" }}>assigned</span>
                      </td>
                      <td>
                        <span className={`badge badge-${des.status.toLowerCase()}`}>
                          {des.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-group">
                          <button
                            className="action-btn edit"
                            onClick={() => openEdit(des)}
                            title="Edit Designation"
                          >
                            ✎
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => handleDelete(des.id, des.title)}
                            title="Delete"
                          >
                            ×
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="modal-box">
            <div className="modal-header">
              <div>
                <h2>{editItem ? "Edit Designation" : "Add Job Designation"}</h2>
                <p>
                  {editItem
                    ? "Update position specs and tier classification."
                    : "Register a new standardized role title for CodeedLabs."}
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="field-group">
                <label className="field-label">Job Title / Designation *</label>
                <input
                  className="field-input"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  required
                  placeholder="e.g. Lead Cloud Architect"
                />
              </div>

              <div className="form-grid-3">
                <div className="field-group">
                  <label className="field-label">Department *</label>
                  <select
                    className="field-select"
                    value={form.department}
                    onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field-group">
                  <label className="field-label">Seniority Grade</label>
                  <select
                    className="field-select"
                    value={form.level}
                    onChange={(e) => setForm((p) => ({ ...p, level: e.target.value }))}
                  >
                    {LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field-group">
                  <label className="field-label">Status</label>
                  <select
                    className="field-select"
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
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
                  {editItem ? "Save Changes" : "Create Designation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
