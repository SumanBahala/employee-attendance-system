import React from "react";
import { Link } from "react-router-dom";

export function UnderConstruction({ title, subtitle, backLink, backLabel = "Back to Dashboard" }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        padding: "48px 32px",
        textAlign: "center",
        maxWidth: "600px",
        margin: "40px auto",
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
      }}
    >
      <div
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "16px",
          background: "rgba(99, 102, 241, 0.1)",
          color: "#4f46e5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "28px",
          margin: "0 auto 20px",
        }}
      >
        ⚙
      </div>
      <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", margin: "0 0 8px" }}>
        {title || "Feature In Development"}
      </h2>
      <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 24px", lineHeight: "1.5" }}>
        {subtitle || "This section is actively being set up as part of the EAS implementation phases."}
      </p>
      {backLink && (
        <Link
          to={backLink}
          style={{
            display: "inline-block",
            padding: "10px 20px",
            background: "#2563eb",
            color: "#ffffff",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "600",
            textDecoration: "none",
          }}
        >
          {backLabel}
        </Link>
      )}
    </div>
  );
}
