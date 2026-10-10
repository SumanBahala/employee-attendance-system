import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import { NepalAnalogClock } from "../../components/common/NepalAnalogClock";
import "../../App.css";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setStatusMessage({ type: "error", text: "Please enter your registered email address." });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await authService.requestPasswordReset(email);
      if (res.success) {
        setStatusMessage({
          type: "success",
          text: res.message,
        });
      } else {
        setStatusMessage({
          type: "error",
          text: res.message,
        });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Something went wrong. Please try again." });
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
          <span className="brand-overline">ACCOUNT RECOVERY</span>
          <h1>
            Secure
            <br />
            <span>access.</span>
          </h1>
          <p>
            Recover your account quickly and safely to manage your attendance and work schedules.
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
            <span>RECOVER PASSWORD</span>
            <h2>Forgot password?</h2>
            <p>Enter your email to receive password reset instructions.</p>
          </div>

          {statusMessage && (
            <div
              style={{
                background: statusMessage.type === "success" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                border: statusMessage.type === "success" ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
                color: statusMessage.type === "success" ? "#16a34a" : "#dc2626",
                padding: "12px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                marginBottom: "20px",
                lineHeight: "1.4",
              }}
            >
              <strong>{statusMessage.type === "success" ? "✓ Success:" : "⚠ Note:"}</strong> {statusMessage.text}
            </div>
          )}

          {statusMessage?.type === "success" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
              <button
                type="button"
                className="login-button"
                onClick={() => navigate("/reset-password", { state: { email } })}
              >
                Set New Password Now →
              </button>
              <Link
                to="/login"
                style={{
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: "13px",
                  textDecoration: "none",
                  marginTop: "8px",
                }}
              >
                ← Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">REGISTERED EMAIL ADDRESS</label>
                <input
                  id="email"
                  type="email"
                  placeholder="e.g. admin@gmail.com or suman@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={loading}
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Sending link..." : "Send Reset Instructions"}
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
          )}

          <div className="security-note" style={{ marginTop: "32px" }}>
            <span>🔒</span>
            <p>Verification links are secure and expire automatically after 24 hours.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
