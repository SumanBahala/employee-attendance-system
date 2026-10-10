import React, { useState } from "react";
import "./AdminDashboard.css";
import codeedlabsLogo from "./assets/CD-logo-color.png";


/* EMPLOYEES PAGE */

function EmployeesPage() {
  const employees = [
    {
      id: "EAS-001",
      name: "Suman Bahala",
      email: "suman@gmail.com",
      department: "Web Development",
      position: "Frontend Developer",
      joined: "2026-01-15",
      status: "Active",
    },
    {
      id: "EAS-002",
      name: "Riya Sharma",
      email: "riya@gmail.com",
      department: "UI / UX Design",
      position: "UI/UX Designer",
      joined: "2026-02-10",
      status: "Active",
    },
    {
      id: "EAS-003",
      name: "Aayush Shrestha",
      email: "aayush@gmail.com",
      department: "Software Engineering",
      position: "Software Engineer",
      joined: "2026-02-05",
      status: "Active",
    },
    {
      id: "EAS-004",
      name: "Prabin Karki",
      email: "prabin@gmail.com",
      department: "QA / Testing",
      position: "QA Tester",
      joined: "2026-03-01",
      status: "Active",
    },
    {
      id: "EAS-005",
      name: "Anisha Rai",
      email: "anisha@gmail.com",
      department: "Digital Marketing",
      position: "Marketing Executive",
      joined: "2026-03-18",
      status: "Inactive",
    },
  ];

  return (
    <section className="employees-page">

      <div className="employees-header">

        <div>
          <span className="page-overline">
            ORGANIZATION
          </span>

          <h1>Employees</h1>

          <p>
            Manage employee information and organization members.
          </p>
        </div>

        <button className="add-employee-button">
          + Add Employee
        </button>

      </div>


      <div className="employee-toolbar">

        <div className="employee-search">

          <span>⌕</span>

          <input
            type="text"
            placeholder="Search employees..."
          />

        </div>


        <select className="department-filter">

          <option>All Departments</option>
          <option>Web Development</option>
          <option>UI / UX Design</option>
          <option>Software Engineering</option>
          <option>Mobile App Development</option>
          <option>QA / Testing</option>
          <option>Digital Marketing</option>

        </select>

      </div>


      <div className="employee-summary">

        <div>
          <strong>50</strong>
          <span>Total Employees</span>
        </div>

        <div>
          <strong>47</strong>
          <span>Active</span>
        </div>

        <div>
          <strong>3</strong>
          <span>Inactive</span>
        </div>

      </div>


      <div className="employees-table-card">

        <div className="employees-table-header">

          <div>
            <h2>Employee Directory</h2>
            <p>All registered employees</p>
          </div>

          <span className="employee-count">
            50 Employees
          </span>

        </div>


        <div className="employees-table-wrapper">

          <table className="employees-table">

            <thead>

              <tr>
                <th>EMPLOYEE</th>
                <th>ID</th>
                <th>DEPARTMENT</th>
                <th>POSITION</th>
                <th>JOINED</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>

            </thead>


            <tbody>

              {employees.map((employee) => (

                <tr key={employee.id}>

                  <td>

                    <div className="employee-profile">

                      <div className="employee-table-avatar">

                        {employee.name
                          .split(" ")
                          .map((word) => word[0])
                          .join("")}

                      </div>


                      <div>

                        <strong>
                          {employee.name}
                        </strong>

                        <span>
                          {employee.email}
                        </span>

                      </div>

                    </div>

                  </td>


                  <td>

                    <span className="employee-id">
                      {employee.id}
                    </span>

                  </td>


                  <td>
                    {employee.department}
                  </td>


                  <td>
                    {employee.position}
                  </td>


                  <td>
                    {employee.joined}
                  </td>


                  <td>

                    <span
                      className={`employee-status ${employee.status.toLowerCase()}`}
                    >
                      {employee.status}
                    </span>

                  </td>


                  <td>

                    <div className="employee-actions">

                      <button title="View">
                        ↗
                      </button>

                      <button title="Edit">
                        ✎
                      </button>

                      <button title="Delete">
                        ×
                      </button>

                    </div>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </section>
  );
}


/* ADMIN DASHBOARD */

function AdminDashboard() {

  const [activeMenu, setActiveMenu] = useState("Dashboard");


  const today = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kathmandu",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());


  /* SIDEBAR MENU */

  const menuItems = [
    { name: "Dashboard", icon: "⌂" },
    { name: "Employees", icon: "♙" },
    { name: "Attendance", icon: "✓" },
    { name: "Leave Management", icon: "▤" },
    { name: "Departments", icon: "▦" },
    { name: "History", icon: "◷" },
    { name: "Reports", icon: "▥" },
    { name: "Settings", icon: "⚙" },
  ];


  /* ATTENDANCE DATA */

  const attendanceData = [
    {
      day: "MON",
      present: 82,
      absent: 10,
      late: 8,
    },
    {
      day: "TUE",
      present: 88,
      absent: 7,
      late: 5,
    },
    {
      day: "WED",
      present: 84,
      absent: 9,
      late: 7,
    },
    {
      day: "THU",
      present: 91,
      absent: 5,
      late: 4,
    },
    {
      day: "FRI",
      present: 86,
      absent: 8,
      late: 6,
    },
    {
      day: "SAT",
      present: 72,
      absent: 15,
      late: 13,
    },
  ];


  /* DEPARTMENTS */

  const departments = [
    {
      name: "Web Development",
      employees: 12,
      percentage: 92,
      short: "WD",
    },
    {
      name: "UI / UX Design",
      employees: 8,
      percentage: 88,
      short: "UX",
    },
    {
      name: "Software Engineering",
      employees: 10,
      percentage: 95,
      short: "SE",
    },
    {
      name: "Mobile App Development",
      employees: 7,
      percentage: 86,
      short: "MA",
    },
  ];


  /* RECENT ATTENDANCE */

  const recentAttendance = [
    {
      name: "Suman Bahala",
      department: "Web Development",
      time: "09:02 AM",
      status: "Present",
      avatar: "SB",
    },
    {
      name: "Riya Sharma",
      department: "UI / UX Design",
      time: "08:55 AM",
      status: "Present",
      avatar: "RS",
    },
    {
      name: "Aayush Shrestha",
      department: "Software Engineering",
      time: "09:18 AM",
      status: "Late",
      avatar: "AS",
    },
    {
      name: "Prabin Karki",
      department: "QA / Testing",
      time: "08:48 AM",
      status: "Present",
      avatar: "PK",
    },
    {
      name: "Anisha Rai",
      department: "Digital Marketing",
      time: "—",
      status: "Absent",
      avatar: "AR",
    },
  ];


  /* LEAVE REQUESTS */

  const leaveRequests = [
    {
      name: "Suman Bahala",
      type: "Personal Leave",
      date: "Sep 30 - Oct 01",
      status: "Pending",
      avatar: "SB",
    },
    {
      name: "Riya Sharma",
      type: "Sick Leave",
      date: "Oct 02",
      status: "Approved",
      avatar: "RS",
    },
    {
      name: "Aayush Shrestha",
      type: "Casual Leave",
      date: "Oct 03",
      status: "Pending",
      avatar: "AS",
    },
  ];


  return (

    <div className="admin-dashboard">


      {/* SIDEBAR */}

      <aside className="sidebar">


        <div className="company-brand">

          <img
            src={codeedlabsLogo}
            alt="CodeedLabs"
            className="codeedlabs-logo"
          />

        </div>


        {/* EAS BRAND */}

        <div className="eas-brand">

          <div className="eas-symbol">

            <span>E</span>
            <span>A</span>
            <span>S</span>

            <div className="eas-check">
              ✓
            </div>

          </div>


          <div className="eas-brand-text">

            <h1>EAS</h1>

            <p>
              Employee Attendance
            </p>

            <p>
              Management
            </p>

          </div>

        </div>


        <div className="nav-title">
          WORKSPACE
        </div>


        {/* SIDEBAR NAVIGATION */}

        <nav className="sidebar-nav">

          {menuItems.map((item) => (

            <button
              key={item.name}
              className={`nav-item ${
                activeMenu === item.name
                  ? "active"
                  : ""
              }`}
              onClick={() => setActiveMenu(item.name)}
            >

              <span className="nav-icon">
                {item.icon}
              </span>

              <span>
                {item.name}
              </span>


              {activeMenu === item.name && (

                <span className="active-arrow">
                  ›
                </span>

              )}

            </button>

          ))}

        </nav>


        {/* SIDEBAR BOTTOM */}

        <div className="sidebar-bottom">


          <div className="admin-mini-profile">

            <div className="admin-avatar">
              AD
            </div>


            <div className="admin-mini-info">

              <strong>
                Administrator
              </strong>

              <span>
                System Admin
              </span>

            </div>

          </div>


          <button className="logout-button">

            <span>
              ↪
            </span>

            Logout

          </button>

        </div>

      </aside>


      {/* MAIN CONTENT */}

      <main className="main-content">


        {/* TOP BAR */}

        <header className="topbar">

          <div className="topbar-left">


            <div className="mobile-eas">
              EAS
            </div>


            <div>

              <span className="topbar-label">
                ADMINISTRATION
              </span>

              <h2>
                Employee Attendance Management
              </h2>

            </div>

          </div>

        </header>


        {/* ================================================== */}
        {/* DASHBOARD PAGE */}
        {/* ================================================== */}

        {activeMenu === "Dashboard" && (

          <section className="dashboard-content">


            {/* HERO */}

            <div className="dashboard-hero">

              <div>

                <span className="hero-overline">
                  WELCOME BACK, ADMINISTRATOR
                </span>

                <h1>
                  Dashboard
                </h1>

                <p>
                  Monitor employee attendance and manage your organization.
                </p>

              </div>


              <div className="hero-date">

                <span>
                  TODAY
                </span>

                <strong>
                  {today}
                </strong>

              </div>

            </div>


            {/* TOP STATISTICS */}

            <div className="stats-grid">


              {/* TOTAL EMPLOYEES */}

              <div className="main-stat">

                <div className="main-stat-top">

                  <span className="main-stat-label">
                    TOTAL EMPLOYEES
                  </span>

                  <span className="growth">
                    +8.2%
                  </span>

                </div>


                <div className="main-stat-number">
                  50
                </div>


                <div className="main-stat-bottom">
                  Active employees
                </div>

              </div>


              {/* PRESENT */}

              <div className="stat-card">

                <div className="stat-icon blue">
                  ✓
                </div>


                <div>

                  <span>
                    Present Today
                  </span>

                  <strong>
                    42
                  </strong>

                </div>


                <small>
                  84% attendance
                </small>

              </div>


              {/* ABSENT */}

              <div className="stat-card">

                <div className="stat-icon red">
                  !
                </div>


                <div>

                  <span>
                    Absent Today
                  </span>

                  <strong>
                    5
                  </strong>

                </div>


                <small>
                  10% of employees
                </small>

              </div>


              {/* PENDING LEAVES */}

              <div className="stat-card">

                <div className="stat-icon orange">
                  ▤
                </div>


                <div>

                  <span>
                    Pending Leaves
                  </span>

                  <strong>
                    3
                  </strong>

                </div>


                <small>
                  Needs review
                </small>

              </div>

            </div>


            {/* MAIN ANALYTICS */}

            <div className="main-analytics">


              {/* ATTENDANCE TREND */}

              <div className="trend-panel">


                <div className="section-header">

                  <div>

                    <h2>
                      Attendance Trend
                    </h2>

                    <p>
                      Weekly attendance performance
                    </p>

                  </div>


                  <button className="period-button">
                    This Week ▾
                  </button>

                </div>


                <div className="chart-container">


                  <div className="chart-y-axis">

                    <span>100%</span>
                    <span>75%</span>
                    <span>50%</span>
                    <span>25%</span>
                    <span>0%</span>

                  </div>


                  <div className="chart-area">


                    <div className="chart-grid-lines">

                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>

                    </div>


                    <div className="bars">

                      {attendanceData.map((item) => (

                        <div
                          className="bar-group"
                          key={item.day}
                        >

                          <div className="bar-value">
                            {item.present}%
                          </div>


                          <div className="bar-wrapper">


                            <div
                              className="bar present"
                              style={{
                                height: `${item.present}%`,
                              }}
                            ></div>


                            <div
                              className="bar late"
                              style={{
                                height: `${item.late}%`,
                              }}
                            ></div>


                            <div
                              className="bar absent"
                              style={{
                                height: `${item.absent}%`,
                              }}
                            ></div>

                          </div>


                          <span className="bar-day">
                            {item.day}
                          </span>

                        </div>

                      ))}

                    </div>

                  </div>

                </div>


                <div className="chart-legend">


                  <span>

                    <i className="legend-blue"></i>

                    Present

                  </span>


                  <span>

                    <i className="legend-orange"></i>

                    Late

                  </span>


                  <span>

                    <i className="legend-red"></i>

                    Absent

                  </span>


                </div>

              </div>


              {/* TODAY'S PULSE */}

              <div className="pulse-panel">


                <div className="section-header">

                  <div>

                    <h2>
                      Today's Pulse
                    </h2>

                    <p>
                      Attendance distribution
                    </p>

                  </div>


                  <span className="live-badge">
                    ● LIVE
                  </span>

                </div>


                <div className="pulse-content">


                  <div className="pulse-ring">

                    <div className="pulse-inner">

                      <strong>
                        84%
                      </strong>

                      <span>
                        Attendance
                      </span>

                    </div>

                  </div>


                  <div className="pulse-stats">


                    <div>

                      <span>

                        <i className="dot blue"></i>

                        Present

                      </span>

                      <strong>
                        42
                      </strong>

                    </div>


                    <div>

                      <span>

                        <i className="dot orange"></i>

                        Late

                      </span>

                      <strong>
                        3
                      </strong>

                    </div>


                    <div>

                      <span>

                        <i className="dot red"></i>

                        Absent

                      </span>

                      <strong>
                        5
                      </strong>

                    </div>


                  </div>

                </div>

              </div>

            </div>


            {/* LOWER AREA */}

            <div className="lower-grid">


              {/* RECENT ATTENDANCE */}

              <div className="attendance-panel">


                <div className="section-header">

                  <div>

                    <h2>
                      Recent Attendance
                    </h2>

                    <p>
                      Latest employee activity
                    </p>

                  </div>


                  <button className="text-button">
                    View All →
                  </button>

                </div>


                <div className="attendance-table-wrapper">


                  <table className="attendance-table">


                    <thead>

                      <tr>

                        <th>
                          EMPLOYEE
                        </th>

                        <th>
                          DEPARTMENT
                        </th>

                        <th>
                          CHECK IN
                        </th>

                        <th>
                          STATUS
                        </th>

                      </tr>

                    </thead>


                    <tbody>


                      {recentAttendance.map((person) => (

                        <tr key={person.name}>


                          <td>

                            <div className="employee-cell">


                              <div className="employee-avatar">
                                {person.avatar}
                              </div>


                              <strong>
                                {person.name}
                              </strong>

                            </div>

                          </td>


                          <td>
                            {person.department}
                          </td>


                          <td>
                            {person.time}
                          </td>


                          <td>

                            <span
                              className={`status ${person.status.toLowerCase()}`}
                            >
                              {person.status}
                            </span>

                          </td>


                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              </div>


              {/* LEAVE REQUESTS */}

              <div className="leave-panel">


                <div className="section-header">

                  <div>

                    <h2>
                      Leave Requests
                    </h2>

                    <p>
                      Requests awaiting action
                    </p>

                  </div>


                  <span className="request-count">
                    3
                  </span>

                </div>


                <div className="leave-list">


                  {leaveRequests.map((leave) => (

                    <div
                      className="leave-item"
                      key={leave.name}
                    >


                      <div className="leave-person">


                        <div className="leave-avatar">
                          {leave.avatar}
                        </div>


                        <div>

                          <strong>
                            {leave.name}
                          </strong>

                          <span>
                            {leave.type}
                          </span>

                          <small>
                            {leave.date}
                          </small>

                        </div>

                      </div>


                      <span
                        className={`status ${leave.status.toLowerCase()}`}
                      >
                        {leave.status}
                      </span>

                    </div>

                  ))}

                </div>

              </div>

            </div>


            {/* DEPARTMENTS */}

            <div className="department-section">


              <div className="section-header">


                <div>

                  <h2>
                    Department Overview
                  </h2>

                  <p>
                    Attendance performance by department
                  </p>

                </div>


                <button className="text-button">
                  All Departments →
                </button>

              </div>


              <div className="department-grid">


                {departments.map((department) => (

                  <div
                    className="department-card"
                    key={department.name}
                  >


                    <div className="department-icon">
                      {department.short}
                    </div>


                    <div className="department-info">

                      <h3>
                        {department.name}
                      </h3>

                      <span>
                        {department.employees} employees
                      </span>

                    </div>


                    <strong className="department-percentage">
                      {department.percentage}%
                    </strong>


                    <div className="department-progress">

                      <div
                        style={{
                          width: `${department.percentage}%`,
                        }}
                      ></div>

                    </div>

                  </div>

                ))}

              </div>

            </div>


            {/* FOOTER */}

            <footer className="dashboard-footer">

              <span>
                © {new Date().getFullYear()} Employee Attendance System
              </span>

              <span>
                Powered by <strong>CodeedLabs</strong>
              </span>

            </footer>


          </section>

        )}


        {/* ================================================== */}
        {/* EMPLOYEES PAGE */}
        {/* ================================================== */}

        {activeMenu === "Employees" && (

          <EmployeesPage />

        )}


        {/* ================================================== */}
        {/* OTHER PAGES - TEMPORARY */}
        {/* ================================================== */}

        {activeMenu === "Attendance" && (

          <div className="employees-page">

            <div className="employees-header">

              <div>

                <span className="page-overline">
                  WORKSPACE
                </span>

                <h1>
                  Attendance
                </h1>

                <p>
                  Manage employee attendance records.
                </p>

              </div>

            </div>

          </div>

        )}


        {activeMenu === "Leave Management" && (

          <div className="employees-page">

            <div className="employees-header">

              <div>

                <span className="page-overline">
                  WORKSPACE
                </span>

                <h1>
                  Leave Management
                </h1>

                <p>
                  Manage employee leave requests.
                </p>

              </div>

            </div>

          </div>

        )}


        {activeMenu === "Departments" && (

          <div className="employees-page">

            <div className="employees-header">

              <div>

                <span className="page-overline">
                  ORGANIZATION
                </span>

                <h1>
                  Departments
                </h1>

                <p>
                  Manage organization departments.
                </p>

              </div>

            </div>

          </div>

        )}


        {activeMenu === "History" && (

          <div className="employees-page">

            <div className="employees-header">

              <div>

                <span className="page-overline">
                  RECORDS
                </span>

                <h1>
                  History
                </h1>

                <p>
                  View previous attendance records.
                </p>

              </div>

            </div>

          </div>

        )}


        {activeMenu === "Reports" && (

          <div className="employees-page">

            <div className="employees-header">

              <div>

                <span className="page-overline">
                  ANALYTICS
                </span>

                <h1>
                  Reports
                </h1>

                <p>
                  Generate employee attendance reports.
                </p>

              </div>

            </div>

          </div>

        )}


        {activeMenu === "Settings" && (

          <div className="employees-page">

            <div className="employees-header">

              <div>

                <span className="page-overline">
                  SYSTEM
                </span>

                <h1>
                  Settings
                </h1>

                <p>
                  Manage system settings and preferences.
                </p>

              </div>

            </div>

          </div>

        )}

      </main>

    </div>
  );
}

export default AdminDashboard;