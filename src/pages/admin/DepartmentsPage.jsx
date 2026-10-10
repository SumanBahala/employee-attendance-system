import React, { useState } from "react";
import { StorageService } from "../../services/storageService";
import { useToast } from "../../context/ToastContext";
import "../../styles/admin.css";

const DEPT_COLORS = [
  { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", bar: "#3b82f6" },
  { bg: "#f5f3ff", border: "#ddd6fe", text: "#6d28d9", bar: "#8b5cf6" },
  { bg: "#ecfdf5", border: "#a7f3d0", text: "#047857", bar: "#10b981" },
  { bg: "#fff7ed", border: "#fed7aa", text: "#c2410c", bar: "#f97316" },
  { bg: "#fdf2f8", border: "#fbcfe8", text: "#be185d", bar: "#ec4899" },
  { bg: "#f0fdfa", border: "#99f6e4", text: "#0f766e", bar: "#14b8a6" },
  { bg: "#f8fafc", border: "#cbd5e1", text: "#334155", bar: "#64748b" },
];

export function DepartmentsPage() {
  const { showToast } = useToast();
  const [departments, setDepartments] = useState(() => StorageService.getDepartments());
  const [employees] = useState(() => StorageService.getEmployees());
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: "", code: "", head: "", status: "Active" });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState("cards"); // 'cards' | 'table'

  // Dynamic headcount per department from actual employee records + mock count
  const getDeptEmployeeCount = (deptName, fallbackCount) => {
    const realCount = employees.filter((e) => e.department === deptName && e.status === "Active").length;
    return realCount > 0 ? Math.max(realCount, fallbackCount || 0) : (fallbackCount || 0);
  };

  const filtered = departments.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase()) ||
      (d.head && d.head.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "All" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalHeadcount = departments.reduce(
    (acc, d) => acc + getDeptEmployeeCount(d.name, d.employeesCount),
    0
  );

  const largestDept = [...departments].sort(
    (a, b) => getDeptEmployeeCount(b.name, b.employeesCount) - getDeptEmployeeCount(a.name, a.employeesCount)
  )[0];

  const activeCount = departments.filter((d) => d.status === "Active").length;
  const activePercent = Math.round((activeCount / Math.max(1, departments.length)) * 100);

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: "", code: "", head: "", status: "Active" });
    setShowModal(true);
  };

  const openEdit = (dept) => {
    setEditItem(dept);
    setForm({ name: dept.name, code: dept.code, head: dept.head || "", status: dept.status });
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      showToast("warning", "Please provide both department name and code.");
      return;
    }

    let updated;
    if (editItem) {
      updated = departments.map((d) => (d.id === editItem.id ? { ...d, ...form } : d));
      showToast("success", `Department "${form.name}" updated successfully.`);
    } else {
      const newDept = {
        id: `DEP-${String(departments.length + 1).padStart(2, "0")}`,
        ...form,
        employeesCount: 0,
      };
      updated = [...departments, newDept];
      showToast("success", `Department "${form.name}" created successfully.`);
    }

    setDepartments(updated);
    StorageService.saveDepartments(updated);
    setShowModal(false);
  };

  const handleDelete = (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the "${name}" department?`)) return;
    const updated = departments.filter((d) => d.id !== id);
    setDepartments(updated);
    StorageService.saveDepartments(updated);
    showToast("info", `Department "${name}" was deleted.`);
  };

  const maxDeptStaff = largestDept ? getDeptEmployeeCount(largestDept.name, largestDept.employeesCount) : 1;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <span className="overline">ORGANIZATIONAL ARCHITECTURE</span>
          <h1>Departments</h1>
          <p>Configure operational units, track team sizes, and assign department leads.</p>
        </div>
        <div className="page-header-actions">
          <div style={{ display: "flex", background: "#e2e8f0", padding: "3px", borderRadius: "8px", gap: "2px" }}>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              style={{
                border: "none",
                background: viewMode === "cards" ? "#ffffff" : "transparent",
                color: viewMode === "cards" ? "#0f172a" : "#64748b",
                fontWeight: "700",
                fontSize: "12px",
                padding: "6px 12px",
                borderRadius: "6px",
                boxShadow: viewMode === "cards" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <span>▦</span> Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              style={{
                border: "none",
                background: viewMode === "table" ? "#ffffff" : "transparent",
                color: viewMode === "table" ? "#0f172a" : "#64748b",
                fontWeight: "700",
                fontSize: "12px",
                padding: "6px 12px",
                borderRadius: "6px",
                boxShadow: viewMode === "table" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <span>≡</span> Table
            </button>
          </div>
          <button className="btn-primary" onClick={openAdd}>
            <span>+</span> Add Department
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "rgba(99, 102, 241, 0.12)", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
            🏢
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Total Departments</div>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a" }}>{departments.length} Units</div>
          </div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.12)", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
            👥
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Active Headcount</div>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a" }}>{totalHeadcount} Members</div>
          </div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.12)", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
            🏆
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Largest Department</div>
            <div style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {largestDept ? largestDept.name : "N/A"}
            </div>
            <div style={{ fontSize: "11px", color: "#64748b" }}>
              {largestDept ? `${getDeptEmployeeCount(largestDept.name, largestDept.employeesCount)} personnel` : ""}
            </div>
          </div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "rgba(59, 130, 246, 0.12)", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
            ⚡
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Operational Health</div>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#10b981" }}>{activePercent}% Active</div>
          </div>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="toolbar" style={{ marginBottom: "20px" }}>
        <div className="toolbar-search">
          <span className="toolbar-search-icon">⌕</span>
          <input
            type="text"
            placeholder="Search departments by name, code or lead..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="toolbar-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active Only</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* View Content */}
      {viewMode === "cards" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "20px",
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                gridColumn: "1 / -1",
                background: "#ffffff",
                padding: "60px 20px",
                borderRadius: "16px",
                textAlign: "center",
                border: "1px solid #e2e8f0",
              }}
            >
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>🏢</div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                No departments found
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
                Try adjusting your search query or filter.
              </p>
            </div>
          ) : (
            filtered.map((dept, index) => {
              const count = getDeptEmployeeCount(dept.name, dept.employeesCount);
              const colorTheme = DEPT_COLORS[index % DEPT_COLORS.length];
              const percent = Math.min(100, Math.round((count / Math.max(1, maxDeptStaff)) * 100));

              return (
                <div
                  key={dept.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    padding: "22px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02), 0 10px 20px -5px rgba(0,0,0,0.02)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.boxShadow = "0 12px 24px -6px rgba(0,0,0,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)";
                  }}
                >
                  <div>
                    {/* Header: Code Badge + Status */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <div
                        style={{
                          background: colorTheme.bg,
                          border: `1px solid ${colorTheme.border}`,
                          color: colorTheme.text,
                          fontSize: "12px",
                          fontWeight: "800",
                          padding: "4px 10px",
                          borderRadius: "8px",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {dept.code} • {dept.id}
                      </div>
                      <span className={`badge badge-${dept.status.toLowerCase()}`}>
                        {dept.status}
                      </span>
                    </div>

                    {/* Department Name */}
                    <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px" }}>
                      {dept.name}
                    </h3>

                    {/* Department Lead */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                      <div
                        style={{
                          width: "26px",
                          height: "26px",
                          borderRadius: "50%",
                          background: "#e0e7ff",
                          color: "#4338ca",
                          fontSize: "11px",
                          fontWeight: "700",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {dept.head ? dept.head.charAt(0) : "?"}
                      </div>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        Lead: <strong style={{ color: "#334155" }}>{dept.head || "Unassigned"}</strong>
                      </span>
                    </div>

                    {/* Capacity Progress Bar */}
                    <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #f1f5f9", marginBottom: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                        <span>TEAM ALLOCATION</span>
                        <span style={{ color: colorTheme.text }}>{count} Members</span>
                      </div>
                      <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${percent}%`,
                            height: "100%",
                            background: colorTheme.bar,
                            borderRadius: "4px",
                            transition: "width 0.6s ease-in-out",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "8px",
                      paddingTop: "14px",
                      borderTop: "1px solid #f1f5f9",
                    }}
                  >
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: "6px 12px", fontSize: "12px" }}
                      onClick={() => openEdit(dept)}
                    >
                      ✎ Edit Details
                    </button>
                    <button
                      type="button"
                      className="btn-danger"
                      style={{ padding: "6px 12px", fontSize: "12px" }}
                      onClick={() => handleDelete(dept.id, dept.name)}
                    >
                      × Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Table View */
        <div className="table-card">
          <div className="table-card-header">
            <div>
              <h2>Department Directory</h2>
              <p>Tabular view of organizational structures and heads</p>
            </div>
            <span className="count-badge">{filtered.length} Departments</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>DEPT CODE</th>
                  <th>DEPARTMENT NAME</th>
                  <th>HEADCOUNT</th>
                  <th>DEPT LEAD</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">
                        <div className="empty-state-icon">🏢</div>
                        <h3>No departments found</h3>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((dept) => {
                    const count = getDeptEmployeeCount(dept.name, dept.employeesCount);
                    return (
                      <tr key={dept.id}>
                        <td>
                          <code
                            style={{
                              fontSize: "12px",
                              color: "#4f46e5",
                              background: "#eef2ff",
                              padding: "3px 8px",
                              borderRadius: "6px",
                              fontWeight: "700",
                            }}
                          >
                            {dept.code}
                          </code>
                        </td>
                        <td>
                          <strong>{dept.name}</strong>
                          <div style={{ fontSize: "11px", color: "#94a3b8" }}>{dept.id}</div>
                        </td>
                        <td>
                          <span style={{ fontWeight: "700", color: "#1e293b" }}>{count}</span>{" "}
                          <span style={{ fontSize: "11px", color: "#64748b" }}>staff</span>
                        </td>
                        <td>
                          {dept.head ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span
                                style={{
                                  width: "22px",
                                  height: "22px",
                                  borderRadius: "50%",
                                  background: "#f1f5f9",
                                  fontSize: "10px",
                                  fontWeight: "700",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {dept.head.charAt(0)}
                              </span>
                              <span>{dept.head}</span>
                            </div>
                          ) : (
                            <span style={{ color: "#94a3b8" }}>— Unassigned</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge badge-${dept.status.toLowerCase()}`}>
                            {dept.status}
                          </span>
                        </td>
                        <td>
                          <div className="action-group">
                            <button
                              className="action-btn edit"
                              onClick={() => openEdit(dept)}
                              title="Edit"
                            >
                              ✎
                            </button>
                            <button
                              className="action-btn delete"
                              onClick={() => handleDelete(dept.id, dept.name)}
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
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="modal-box">
            <div className="modal-header">
              <div>
                <h2>{editItem ? "Edit Department" : "Add New Department"}</h2>
                <p>
                  {editItem
                    ? "Update operational details for this department."
                    : "Create an organizational division within CodeedLabs EAS."}
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-grid-2">
                <div className="field-group">
                  <label className="field-label">Department Name *</label>
                  <input
                    className="field-input"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    required
                    placeholder="e.g. Cloud Operations"
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Department Code *</label>
                  <input
                    className="field-input"
                    value={form.code}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))
                    }
                    required
                    placeholder="e.g. CLD"
                    maxLength={4}
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Department Head / Manager</label>
                  <input
                    className="field-input"
                    value={form.head}
                    onChange={(e) => setForm((p) => ({ ...p, head: e.target.value }))}
                    placeholder="e.g. Aayush Shrestha"
                  />
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
                  {editItem ? "Save Changes" : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
