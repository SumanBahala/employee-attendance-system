import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import { NepalAnalogClock } from "../../components/common/NepalAnalogClock";
import "../../App.css";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email] = useState(location.state?.email || "your account");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Compute password strength
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: "None", color: "#e2e8f0" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score, label: "Weak", color: "#ef4444" };
    if (score <= 4) return { score, label: "Good", color: "#f59e0b" };
    return { score, label: "Strong", color: "#10b981" };
  };

  const strength = getPasswordStrength(newPassword);

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters long." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const targetEmail = location.state?.email || email;
      const res = await authService.resetPassword(targetEmail, newPassword);
      if (res.success) {
        setMessage({ type: "success", text: res.message });
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setMessage({ type: "error", text: res.message });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to reset password. Please try again." });
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
          <span className="brand-overline">SECURITY CREDENTIALS</span>
          <h1>
            New
            <br />
            <span>password.</span>
          </h1>
          <p>
            Create a robust password to keep your attendance data and work logs protected.
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

      {/* Form Panel */}
      <div className="login-form-panel">
        <div className="login-container">
          <div className="login-heading">
            <span>CREDENTIAL RECOVERY</span>
            <h2>Reset Password</h2>
            <p>Set a new password for {email}.</p>
          </div>

          {message && (
            <div
              style={{
                background: message.type === "success" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                border: message.type === "success" ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
                color: message.type === "success" ? "#16a34a" : "#dc2626",
                padding: "12px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                marginBottom: "20px",
              }}
            >
              <strong>{message.type === "success" ? "✓" : "⚠"}</strong> {message.text}
            </div>
          )}

          <form onSubmit={handleReset}>
            {/* New Password */}
            <div className="form-group">
              <label htmlFor="newPassword">NEW PASSWORD</label>
              <div className="password-wrapper">
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password (min. 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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

              {/* Password strength indicator */}
              {newPassword && (
                <div style={{ marginTop: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                    <span style={{ color: "#64748b" }}>Strength:</span>
                    <strong style={{ color: strength.color }}>{strength.label}</strong>
                  </div>
                  <div style={{ height: "4px", width: "100%", background: "#e2e8f0", borderRadius: "2px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${(strength.score / 5) * 100}%`,
                        background: strength.color,
                        transition: "all 0.3s ease",
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirmPassword">CONFIRM NEW PASSWORD</label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Updating..." : "Reset Password & Login"}
              <span>→</span>
            </button>

            <div style={{ marginTop: "24px", textAlign: "center" }}>
              <Link
                to="/login"
                style={{
                  color: "#4f46e5",
                  fontSize: "13px",
                  fontWeight: "600",
                  textDecoration: "none",
                }}
              >
                ← Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
