import React, { useEffect, useState } from "react";
import {
  createEmployeeBadgePayload,
  createOfficeTerminalPayload,
  generateQRCodeDataURL,
} from "../../services/qrService";
import { getNepalDateTimeString } from "../../utils/dateTimeUtils";

/**
 * QRBadge Component
 * Renders real dynamically generated QR codes for:
 * 1. Employee Digital ID Badge (to present to office kiosks)
 * 2. Official Office Terminal QR (for scanner demonstration & testing)
 */
export function QRBadge({ employee }) {
  const [badgePayload, setBadgePayload] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [badgeMode, setBadgeMode] = useState("employee"); // 'employee' | 'terminal'
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Generate badge whenever employee or badgeMode changes
  const generateBadge = async () => {
    if (!employee && badgeMode === "employee") return;
    setLoading(true);

    try {
      let payload;
      if (badgeMode === "employee") {
        payload = createEmployeeBadgePayload(employee);
      } else {
        payload = createOfficeTerminalPayload();
      }

      setBadgePayload(payload);
      const dataUrl = await generateQRCodeDataURL(payload, {
        width: 320,
        darkColor: badgeMode === "employee" ? "#0f172a" : "#1e3a8a",
        lightColor: "#ffffff",
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error("Failed to generate QR badge:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateBadge();
  }, [employee, badgeMode]);

  const handleCopyPayload = () => {
    if (!badgePayload) return;
    navigator.clipboard.writeText(JSON.stringify(badgePayload, null, 2));
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "18px",
        padding: "24px",
        boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
        textAlign: "center",
      }}
    >
      {/* Badge View Switcher */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "20px",
          background: "#f8fafc",
          padding: "4px",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
        }}
      >
        <button
          type="button"
          onClick={() => setBadgeMode("employee")}
          style={{
            flex: 1,
            padding: "8px 12px",
            fontSize: "12px",
            fontWeight: "700",
            borderRadius: "8px",
            border: "none",
            background: badgeMode === "employee" ? "#ffffff" : "transparent",
            color: badgeMode === "employee" ? "#2563eb" : "#64748b",
            boxShadow: badgeMode === "employee" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          🪪 My Employee QR
        </button>
        <button
          type="button"
          onClick={() => setBadgeMode("terminal")}
          style={{
            flex: 1,
            padding: "8px 12px",
            fontSize: "12px",
            fontWeight: "700",
            borderRadius: "8px",
            border: "none",
            background: badgeMode === "terminal" ? "#ffffff" : "transparent",
            color: badgeMode === "terminal" ? "#2563eb" : "#64748b",
            boxShadow: badgeMode === "terminal" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          🏢 Office Terminal QR
        </button>
      </div>

      {/* QR Code Container */}
      <div
        style={{
          width: "210px",
          height: "210px",
          margin: "0 auto 16px",
          background: "#ffffff",
          border: "2px solid #e2e8f0",
          borderRadius: "16px",
          padding: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 24px -4px rgba(0,0,0,0.08)",
          position: "relative",
        }}
      >
        {loading ? (
          <div style={{ color: "#64748b", fontSize: "12px", fontWeight: "600" }}>
            Generating dynamic QR...
          </div>
        ) : qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt="Dynamic EAS QR Code"
            style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "8px" }}
          />
        ) : (
          <div style={{ color: "#ef4444", fontSize: "12px" }}>Failed to generate QR</div>
        )}
      </div>

      {/* Metadata Badges */}
      <div style={{ marginBottom: "14px" }}>
        <div style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
          {badgeMode === "employee" ? employee?.name : "CodeedLabs Gate 1 Kiosk"}
        </div>
        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "3px" }}>
          {badgeMode === "employee" ? (
            <>
              ID: <code style={{ fontWeight: "700", color: "#2563eb" }}>{employee?.id}</code> • {employee?.department}
            </>
          ) : (
            <>Terminal ID: <code style={{ fontWeight: "700", color: "#2563eb" }}>TERM-KTM-01</code> • New Baneshwor</>
          )}
        </div>
      </div>

      {/* Timestamps & Security Details */}
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "12px",
          fontSize: "11px",
          textAlign: "left",
          marginBottom: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#64748b" }}>Status:</span>
          <span style={{ color: "#059669", fontWeight: "700" }}>● Active / Verified</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#64748b" }}>Generated:</span>
          <span style={{ color: "#334155", fontWeight: "600" }}>
            {badgePayload ? badgePayload.displayGeneratedTime || getNepalDateTimeString(new Date(badgePayload.generatedAt)) : "—"}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#64748b" }}>Expires:</span>
          <span style={{ color: "#b45309", fontWeight: "600" }}>
            {badgePayload ? badgePayload.displayExpiryTime || getNepalDateTimeString(new Date(badgePayload.expiresAt)) : "—"}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed #e2e8f0", paddingTop: "5px" }}>
          <span style={{ color: "#64748b" }}>Token Hash:</span>
          <code style={{ fontSize: "10px", color: "#6366f1" }}>
            {badgePayload?.token ? badgePayload.token.substring(0, 18) + "..." : "—"}
          </code>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          type="button"
          onClick={generateBadge}
          disabled={loading}
          style={{
            flex: 1,
            padding: "9px 12px",
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "600",
            color: "#334155",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
          }}
        >
          🔄 Refresh QR
        </button>

        <button
          type="button"
          onClick={handleCopyPayload}
          style={{
            flex: 1,
            padding: "9px 12px",
            background: copyFeedback ? "#ecfdf5" : "#ffffff",
            border: copyFeedback ? "1px solid #10b981" : "1px solid #cbd5e1",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "600",
            color: copyFeedback ? "#065f46" : "#334155",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
          }}
        >
          {copyFeedback ? "✓ Copied JSON" : "📋 Copy Payload"}
        </button>
      </div>

      <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "14px", lineHeight: "1.4" }}>
        {badgeMode === "employee"
          ? "Show this QR code to the entrance kiosk camera or peer scanner to verify attendance."
          : "Point another device's camera or this terminal's scanner to test terminal QR detection."}
      </p>
    </div>
  );
}

export default QRBadge;
