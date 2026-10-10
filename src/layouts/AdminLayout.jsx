import React, { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import codeedlabsLogo from "../assets/CD-logo-color.png";
import "../styles/layout.css";

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const time = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kathmandu",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(new Date());
      setCurrentTime(time);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { path: "/admin/dashboard", label: "Dashboard", icon: "⌂" },
    { path: "/admin/employees", label: "Employees", icon: "👥" },
    { path: "/admin/attendance", label: "Attendance", icon: "✓" },
    { path: "/admin/leave", label: "Leave Management", icon: "▤" },
    { path: "/admin/departments", label: "Departments", icon: "🏢" },
    { path: "/admin/designations", label: "Designations", icon: "🏷" },
    { path: "/admin/schedules", label: "Schedules", icon: "📅" },
    { path: "/admin/holidays", label: "Holidays", icon: "🎉" },
    { path: "/admin/reports", label: "Reports", icon: "📊" },
    { path: "/admin/analytics", label: "Analytics", icon: "📈" },
    { path: "/admin/notifications", label: "Notifications", icon: "🔔" },
    { path: "/admin/settings", label: "Settings", icon: "⚙" },
  ];

  return (
    <div className="app-layout">
      {/* Mobile Backdrop */}
      <div
        className={`sidebar-backdrop ${mobileOpen ? "active" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`app-sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          {/* CodeedLabs Logo */}
          <div style={{ marginBottom: "14px", paddingBottom: "10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <img
              src={codeedlabsLogo}
              alt="CodeedLabs"
              style={{ width: "120px", height: "auto", display: "block" }}
            />
          </div>

          {/* EAS Symbol */}
          <div className="sidebar-logo-row">
            <div className="sidebar-eas-badge">
              <span>EAS</span>
              <div className="sidebar-eas-check">✓</div>
            </div>
            <div className="sidebar-brand-info">
              <h2>EAS Admin</h2>
              <p>Employee Attendance System</p>
            </div>
          </div>
          <div className="sidebar-powered-tag">
            Powered by <strong>CodeedLabs</strong>
          </div>
        </div>

        <div className="sidebar-section-title">ADMINISTRATION</div>

        <nav>
          <ul className="sidebar-nav-list">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === "/admin/dashboard"}
                  className={({ isActive }) =>
                    `sidebar-nav-link ${isActive ? "active" : ""}`
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="sidebar-nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  <span className="sidebar-nav-arrow">›</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Profile Card & Logout */}
        <div className="sidebar-footer">
          <Link
            to="/admin/profile"
            className="sidebar-profile-card"
            onClick={() => setMobileOpen(false)}
            title="View Admin Profile"
          >
            <div className="sidebar-profile-avatar">
              {user?.avatar || "AD"}
            </div>
            <div className="sidebar-profile-details">
              <div className="sidebar-profile-name">{user?.name || "Administrator"}</div>
              <div className="sidebar-profile-role">{user?.position || "System Admin"}</div>
            </div>
          </Link>

          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogout}
          >
            <span>↪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="app-main">
        {/* Topbar */}
        <header className="app-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              ☰
            </button>
            <div className="topbar-title-group">
              <h1>Admin Management Portal</h1>
              <p>Employee Attendance System • CodeedLabs</p>
            </div>
          </div>

          <div className="topbar-right">
            {/* Real-time Nepal Clock */}
            <div className="topbar-clock">
              <span className="clock-icon-dot"></span>
              <span className="clock-text">{currentTime || "--:--:--"}</span>
              <span className="clock-zone-badge">NEPAL TIME</span>
            </div>

            <span className="role-badge admin">Admin</span>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
