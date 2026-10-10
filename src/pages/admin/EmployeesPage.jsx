import React, { useState } from "react";
import { Link } from "react-router-dom";
import { StorageService } from "../../services/storageService";
import { AddEmployeeModal } from "../../components/admin/AddEmployeeModal";
import "../../styles/admin.css";
import "../../AdminDashboard.css";

const DEPARTMENTS = ["All Departments","Web Development","UI / UX Design","Software Engineering",
  "Mobile App Development","QA / Testing","Digital Marketing","Human Resources","Administration"];
const STATUSES = ["All Statuses","Active","Inactive"];

export function EmployeesPage() {
  const [employees, setEmployees] = useState(() => StorageService.getEmployees());
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [showAddModal, setShowAddModal] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)
      || e.id.toLowerCase().includes(q) || e.position.toLowerCase().includes(q);
    const matchDept = deptFilter === "All Departments" || e.department === deptFilter;
    const matchStatus = statusFilter === "All Statuses" || e.status === statusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleDelete = (id, name) => {
    if (!window.confirm(`Permanently remove ${name} from the system?`)) return;
    const updated = employees.filter((e) => e.id !== id);
    setEmployees(updated);
    StorageService.saveEmployees(updated);
  };

  const handleToggleStatus = (id) => {
    const updated = employees.map((e) =>
      e.id === id ? { ...e, status: e.status === "Active" ? "Inactive" : "Active" } : e
    );
    setEmployees(updated);
    StorageService.saveEmployees(updated);
  };

  const handleSaved = (newEmployee) => {
    const refreshed = StorageService.getEmployees();
    setEmployees(refreshed);
    setShowAddModal(false);
  };

  const activeCount = employees.filter((e) => e.status === "Active").length;
  const inactiveCount = employees.filter((e) => e.status === "Inactive").length;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-text">
          <span className="overline">ORGANIZATION</span>
          <h1>Employees</h1>
          <p>Manage all registered organization employees, their roles, and employment details.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            + Add Employee
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: "14px", marginBottom: "20px" }}>
        {[
          { label: "Total Employees", value: employees.length, color: "#4f46e5" },
          { label: "Active", value: activeCount, color: "#10b981" },
          { label: "Inactive", value: inactiveCount, color: "#ef4444" },
          { label: "Showing Now", value: filtered.length, color: "#f59e0b" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px 18px" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>{s.label}</div>
            <div style={{ fontSize: "26px", fontWeight: "800", color: s.color, marginTop: "4px" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-search">
          <span className="toolbar-search-icon">⌕</span>
          <input
            type="text"
            placeholder="Search by name, email, ID, or position..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="toolbar-select" value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}>
          {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
        </select>
        <select className="toolbar-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-card-header">
          <div>
            <h2>Employee Directory</h2>
            <p>All registered employees with employment and contact details</p>
          </div>
          <span className="count-badge">{filtered.length} Employees</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>EMPLOYEE</th>
                <th>ID</th>
                <th>DEPARTMENT</th>
                <th>POSITION</th>
                <th>JOINED</th>
                <th>TYPE</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="empty-state">
                      <div className="empty-state-icon">👥</div>
                      <h3>No employees found</h3>
                      <p>Try adjusting your filters or add a new employee.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div className="cell-avatar-group">
                        <div className="cell-avatar">{emp.avatar || emp.name.split(" ").map(n=>n[0]).join("")}</div>
                        <div>
                          <div className="cell-name">{emp.name}</div>
                          <div className="cell-sub">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><code style={{ fontSize: "11px", color: "#6366f1", background: "#f5f3ff", padding: "2px 6px", borderRadius: "4px" }}>{emp.id}</code></td>
                    <td>{emp.department}</td>
                    <td>{emp.position}</td>
                    <td>{emp.joined}</td>
                    <td>
                      <span className={`badge ${emp.employmentStatus === "Full-Time" ? "badge-fulltime" : "badge-contract"}`}>
                        {emp.employmentStatus || "Full-Time"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${emp.status === "Active" ? "badge-active" : "badge-inactive"}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-group">
                        <Link to={`/admin/employees/${emp.id}`} className="action-btn view" title="View Details">↗</Link>
                        <button className="action-btn edit" title={emp.status === "Active" ? "Deactivate" : "Activate"} onClick={() => handleToggleStatus(emp.id)}>
                          {emp.status === "Active" ? "⊘" : "✓"}
                        </button>
                        <button className="action-btn delete" title="Delete Employee" onClick={() => handleDelete(emp.id, emp.name)}>×</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > PER_PAGE && (
          <div className="pagination">
            <span>Showing {Math.min((page-1)*PER_PAGE+1, filtered.length)}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}</span>
            <div className="pagination-btns">
              <button className="pagination-btn" onClick={() => setPage(p => Math.max(1,p-1))} disabled={page === 1}>← Prev</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i+1} className={`pagination-btn ${page === i+1 ? "active" : ""}`} onClick={() => setPage(i+1)}>{i+1}</button>
              ))}
              <button className="pagination-btn" onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page === totalPages}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {showAddModal && <AddEmployeeModal onClose={() => setShowAddModal(false)} onSaved={handleSaved} />}
    </div>
  );
}
