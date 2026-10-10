import React from "react";

/**
 * Method selection tabs for Employee Attendance
 * Supports: Manual Punch, QR Code Scan, and GPS Geofence
 */
export function AttendanceMethodTabs({ activeMethod, onChangeMethod, disabled = false }) {
  const methods = [
    {
      id: "manual",
      label: "Manual Punch",
      subtitle: "Web Portal Clock-In",
      icon: "🖐️",
    },
    {
      id: "qr",
      label: "QR Code Scan",
      subtitle: "Scan Office QR Terminal",
      icon: "📷",
    },
    {
      id: "gps",
      label: "GPS Geofence",
      subtitle: "Verify GPS Location",
      icon: "📍",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "10px",
        padding: "6px",
        background: "#f1f5f9",
        borderRadius: "14px",
        marginBottom: "24px",
      }}
      role="tablist"
      aria-label="Attendance Method Selection"
    >
      {methods.map((method) => {
        const isActive = activeMethod === method.id;
        return (
          <button
            key={method.id}
            role="tab"
            aria-selected={isActive}
            disabled={disabled}
            onClick={() => onChangeMethod(method.id)}
            style={{
              padding: "12px 10px",
              borderRadius: "10px",
              border: isActive ? "1px solid #c7d2fe" : "1px solid transparent",
              background: isActive
                ? "linear-gradient(180deg, #ffffff 0%, #f8faff 100%)"
                : "transparent",
              color: isActive ? "#1e40af" : "#64748b",
              fontWeight: isActive ? "700" : "600",
              boxShadow: isActive ? "0 4px 12px rgba(37, 99, 235, 0.12)" : "none",
              cursor: disabled ? "not-allowed" : "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              transition: "all 0.18s ease-in-out",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "18px" }}>{method.icon}</span>
              <span style={{ fontSize: "14px", fontWeight: isActive ? "800" : "600" }}>
                {method.label}
              </span>
            </div>
            <span
              style={{
                fontSize: "11px",
                color: isActive ? "#4338ca" : "#94a3b8",
                fontWeight: "500",
              }}
            >
              {method.subtitle}
            </span>
            {isActive && (
              <span
                style={{
                  position: "absolute",
                  bottom: "-6px",
                  width: "28px",
                  height: "3px",
                  background: "#4f46e5",
                  borderRadius: "2px",
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default AttendanceMethodTabs;
