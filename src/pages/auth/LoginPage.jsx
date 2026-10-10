import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { NepalAnalogClock } from "../../components/common/NepalAnalogClock";
import "../../App.css";

export function LoginPage() {
  const { login, rememberedEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [userType, setUserType] = useState("Admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Pre-fill remembered email if saved
  useEffect(() => {
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
    setErrorMessage("");
  }, [rememberedEmail]);

  const handleRoleChange = (role) => {
    setUserType(role);
    setErrorMessage("");
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const result = await login({
        email,
        password,
        role: userType,
        rememberMe,
      });

      if (result.success) {
        // Redirect to intended route or default dashboard
        const from = location.state?.from?.pathname;
        if (result.user.role === "ADMIN") {
          navigate(from && from.startsWith("/admin") ? from : "/admin/dashboard", { replace: true });
        } else {
          navigate(from && from.startsWith("/employee") ? from : "/employee/dashboard", { replace: true });
        }
      } else {
        setErrorMessage(result.message || "Invalid credentials.");
      }
    } catch {
      setErrorMessage("An unexpected error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Brand Panel */}
      <div className="login-brand-panel">
        <div className="brand-top">
          <div className="brand-mini-logo">
            <span>EAS</span>
            <div className="brand-mini-check">✓</div>
          </div>

          <div className="brand-mini-text">
            <strong>Employee</strong>
            <span>Attendance System</span>
          </div>
        </div>

        <div className="brand-content">
          <span className="brand-overline">ATTENDANCE MANAGEMENT</span>

          <h1>
            Every day
            <br />
            <span>counts.</span>
          </h1>

          <p>
            A simple and organized way to manage employee attendance,
            working hours, and daily records.
          </p>

          <NepalAnalogClock />
        </div>

        <div className="company-footer">
          <span>Powered by</span>
          <strong>CodeedLabs Incorporated Pvt. Ltd.</strong>
          <a
            href="https://codeedinc.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="company-link"
            title="Visit CodeedLabs Official Website"
          >
            www.codeedinc.com
          </a>
        </div>
      </div>

      {/* Login Form Panel */}
      <div className="login-form-panel">
        <div className="login-container">
          <div className="login-heading">
            <span>WELCOME BACK</span>
            <h2>Sign in to EAS</h2>
            <p>Enter your credentials to access the system.</p>
          </div>

          {/* Role Section */}
          <div className="role-section">
            <label>SELECT ROLE</label>

            <div className="role-options">
              <button
                type="button"
                className={`role-card ${userType === "Admin" ? "active" : ""}`}
                onClick={() => handleRoleChange("Admin")}
              >
                <span className="role-icon">A</span>
                <span className="role-text">
                  <strong>Admin</strong>
                  <small>Manage system</small>
                </span>
              </button>

              <button
                type="button"
                className={`role-card ${userType === "Employee" ? "active" : ""}`}
                onClick={() => handleRoleChange("Employee")}
              >
                <span className="role-icon">E</span>
                <span className="role-text">
                  <strong>Employee</strong>
                  <small>View attendance</small>
                </span>
              </button>
            </div>
          </div>



          {/* Error Message */}
          {errorMessage && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                color: "#b91c1c",
                padding: "12px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                marginBottom: "18px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontWeight: "600" }}>
                <span>⚠</span>
                <span>{errorMessage}</span>
              </div>

            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">{userType.toUpperCase()} EMAIL ADDRESS</label>
              <input
                id="email"
                type="email"
                placeholder={userType === "Employee" ? "e.g. suman@gmail.com" : "e.g. admin@gmail.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <div className="password-label-row">
                <label htmlFor="password">PASSWORD</label>
                <Link to="/forgot-password" className="forgot-password">
                  Forgot password?
                </Link>
              </div>

              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={
                    userType === "Employee"
                      ? "Enter employee password (demo: employee123)"
                      : "Enter admin password (demo: admin123)"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="show-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <label className="remember-row">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me on this device</span>
            </label>

            {/* Login Button */}
            <button
              type="submit"
              className="login-button"
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Authenticating..." : "Continue"}
              <span>→</span>
            </button>
          </form>

          {/* Security */}
          <div className="security-note">
            <span>🔒</span>
            <p>Your connection is secure and your information is protected.</p>
          </div>


        </div>
      </div>
    </div>
  );
}
