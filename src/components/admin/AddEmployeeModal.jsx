import React, { useState } from "react";
import { StorageService } from "../../services/storageService";

const DEPARTMENTS = [
  "Web Development", "UI / UX Design", "Software Engineering",
  "Mobile App Development", "QA / Testing", "Digital Marketing", "Human Resources", "Administration"
];

const POSITIONS = [
  "Frontend Developer", "Backend Developer", "Full Stack Developer", "UI/UX Designer",
  "Software Engineer", "QA Tester", "Marketing Executive", "HR Officer",
  "System Administrator", "Project Manager", "Senior Developer", "Software Intern"
];

export function AddEmployeeModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", address: "", dob: "", gender: "Male",
    department: "Web Development", position: "Frontend Developer",
    joined: new Date().toISOString().split("T")[0], employmentStatus: "Full-Time",
    manager: "", bloodGroup: "O+", emergencyContact: "",
    password: "employee123",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError("Full name, email, and phone number are required.");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 350));

    const employees = StorageService.getEmployees();

    // Check email uniqueness
    if (employees.some((emp) => emp.email.toLowerCase() === form.email.toLowerCase())) {
      setError("An employee with this email address already exists.");
      setLoading(false);
      return;
    }

    // Auto-generate next EAS ID
    const maxIdNum = employees.reduce((max, emp) => {
      const num = parseInt(emp.id.replace("EAS-", ""), 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    const newId = `EAS-${String(maxIdNum + 1).padStart(3, "0")}`;

    const newEmployee = {
      ...form,
      id: newId,
      status: "Active",
      password: form.password ? form.password.trim() : "employee123",
      avatar: form.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2),
    };

    StorageService.saveEmployees([...employees, newEmployee]);
    setLoading(false);
    onSaved(newEmployee);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box large" style={{ maxHeight: "90vh", overflowY: "auto" }}>
        <div className="modal-header">
          <div>
            <h2>Add New Employee</h2>
            <p>Enter employee details to register them in the EAS system.</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <p style={{ fontSize: "11px", fontWeight: "700", color: "#6366f1", marginBottom: "14px" }}>
            PERSONAL DETAILS
          </p>

          <div className="form-grid-2">
            <div className="field-group">
              <label className="field-label">Full Name *</label>
              <input className="field-input" name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Rajan Thapa" />
            </div>
            <div className="field-group">
              <label className="field-label">Email Address *</label>
              <input className="field-input" type="email" name="email" value={form.email} onChange={handleChange} required placeholder="e.g. rajan@gmail.com" />
            </div>
            <div className="field-group">
              <label className="field-label">Phone Number *</label>
              <input className="field-input" name="phone" value={form.phone} onChange={handleChange} required placeholder="+977 98XXXXXXXX" />
            </div>
            <div className="field-group">
              <label className="field-label">Gender</label>
              <select className="field-select" name="gender" value={form.gender} onChange={handleChange}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
                <option>Prefer not to say</option>
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Date of Birth</label>
              <input className="field-input" type="date" name="dob" value={form.dob} onChange={handleChange} />
            </div>
            <div className="field-group">
              <label className="field-label">Blood Group</label>
              <select className="field-select" name="bloodGroup" value={form.bloodGroup} onChange={handleChange}>
                {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Residential Address</label>
            <input className="field-input" name="address" value={form.address} onChange={handleChange} placeholder="e.g. Baneshwor, Kathmandu, Nepal" />
          </div>

          <div className="field-group">
            <label className="field-label">Emergency Contact & Relation</label>
            <input className="field-input" name="emergencyContact" value={form.emergencyContact} onChange={handleChange} placeholder="e.g. +977 9811234567 (Father)" />
          </div>

          <p style={{ fontSize: "11px", fontWeight: "700", color: "#6366f1", margin: "20px 0 14px" }}>
            EMPLOYMENT DETAILS
          </p>

          <div className="form-grid-2">
            <div className="field-group">
              <label className="field-label">Department</label>
              <select className="field-select" name="department" value={form.department} onChange={handleChange}>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Position / Designation</label>
              <select className="field-select" name="position" value={form.position} onChange={handleChange}>
                {POSITIONS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Joining Date</label>
              <input className="field-input" type="date" name="joined" value={form.joined} onChange={handleChange} required />
            </div>
            <div className="field-group">
              <label className="field-label">Employment Type</label>
              <select className="field-select" name="employmentStatus" value={form.employmentStatus} onChange={handleChange}>
                <option>Full-Time</option>
                <option>Part-Time</option>
                <option>Contract</option>
                <option>Internship</option>
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Reporting Manager</label>
              <input className="field-input" name="manager" value={form.manager} onChange={handleChange} placeholder="e.g. Suresh Poudel" />
            </div>
            <div className="field-group">
              <label className="field-label">Login Password</label>
              <input
                className="field-input"
                type="text"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Default: employee123"
              />
              <small style={{ color: "#64748b", fontSize: "11px", marginTop: "4px", display: "block" }}>
                Employee will use this password to sign in. (Default: <code>employee123</code>)
              </small>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Adding..." : "Add Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
