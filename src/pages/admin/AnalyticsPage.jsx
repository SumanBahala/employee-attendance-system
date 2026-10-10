import React, { useState } from "react";
import { StorageService } from "../../services/storageService";
import "../../styles/admin.css";

// Radar chart for department comparison
function RadarChart({ data }) {
  const n = data.length;
  const cx = 120, cy = 120, r = 90;
  const angles = data.map((_, i) => ((2 * Math.PI * i) / n) - Math.PI / 2);
  const toPoint = (angle, radius) => ({
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  });

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const valuePoints = data.map((d, i) => toPoint(angles[i], (d.value / 100) * r));
  const valuePath = valuePoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + "Z";

  return (
    <svg viewBox="0 0 240 240" width="200" height="200">
      <defs>
        <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      {/* Grid */}
      {gridLevels.map((level, li) => {
        const pts = angles.map((a) => toPoint(a, level * r));
        const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + "Z";
        return <path key={li} d={path} fill="none" stroke="#e2e8f0" strokeWidth="1" />;
      })}
      {/* Spokes */}
      {angles.map((angle, i) => {
        const pt = toPoint(angle, r);
        return <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="#e2e8f0" strokeWidth="1" />;
      })}
      {/* Data area */}
      <path d={valuePath} fill="url(#radarFill)" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" />
      {/* Dots */}
      {valuePoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#fff" stroke="#6366f1" strokeWidth="2" />
      ))}
      {/* Labels */}
      {data.map((d, i) => {
        const pt = toPoint(angles[i], r + 18);
        return (
          <text
            key={i}
            x={pt.x}
            y={pt.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="9"
            fontWeight="700"
            fill="#475569"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

// Horizontal stacked bar
function StackedBar({ label, segments, total }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
        <span style={{ fontSize: "12px", fontWeight: "600", color: "#334155" }}>{label}</span>
        <span style={{ fontSize: "12px", color: "#64748b" }}>{total} records</span>
      </div>
      <div style={{ height: "10px", background: "#f1f5f9", borderRadius: "8px", overflow: "hidden", display: "flex" }}>
        {segments.map((seg, i) => (
          <div
            key={i}
            style={{
              width: `${(seg.value / total) * 100}%`,
              background: seg.color,
              height: "100%",
              transition: "width 1.2s ease",
            }}
            title={`${seg.label}: ${seg.value}`}
          />
        ))}
      </div>
      <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
        {segments.map((seg, i) => (
          <span key={i} style={{ fontSize: "10px", color: seg.color, fontWeight: "700" }}>
            {seg.label}: {seg.value}
          </span>
        ))}
      </div>
    </div>
  );
}

// KPI card
function KPICard({ title, value, change, positive, icon, sub, color }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "18px 20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        borderTop: `3px solid ${color}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
        <span style={{ fontSize: "22px" }}>{icon}</span>
        <span
          style={{
            fontSize: "11px",
            fontWeight: "700",
            color: positive ? "#15803d" : "#b91c1c",
            background: positive ? "#dcfce7" : "#fee2e2",
            padding: "3px 8px",
            borderRadius: "10px",
          }}
        >
          {positive ? "↑" : "↓"} {change}
        </span>
      </div>
      <div style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a" }}>{value}</div>
      <div style={{ fontSize: "13px", fontWeight: "600", color: "#475569", margin: "4px 0 2px" }}>{title}</div>
      <div style={{ fontSize: "11px", color: "#94a3b8" }}>{sub}</div>
    </div>
  );
}

export function AnalyticsPage() {
  const employees = StorageService.getEmployees();
  const attendance = StorageService.getAttendance();
  const leaveRequests = StorageService.getLeaveRequests();
  const departments = StorageService.getDepartments();
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  // Stats
  const totalPresent = attendance.filter((a) => a.status === "Present").length;
  const totalAbsent = attendance.filter((a) => a.status === "Absent").length;
  const totalLate = attendance.filter((a) => a.status === "Late").length;
  const totalRecords = attendance.length || 1;
  const avgAttendance = Math.round((totalPresent / totalRecords) * 100);
  const approvedLeaves = leaveRequests.filter((l) => l.status === "Approved").length;
  const pendingLeaves = leaveRequests.filter((l) => l.status === "Pending").length;

  // Per-employee breakdown
  const empStats = employees.map((emp) => {
    const records = attendance.filter((a) => a.employeeId === emp.id);
    const present = records.filter((a) => a.status === "Present").length;
    const late = records.filter((a) => a.status === "Late").length;
    const absent = records.filter((a) => a.status === "Absent").length;
    const rate = records.length ? Math.round((present / records.length) * 100) : 0;
    return { ...emp, records: records.length, present, late, absent, rate };
  });

  // Radar data
  const radarData = [
    { label: "Present", value: avgAttendance },
    { label: "On-Time", value: Math.round((totalPresent / Math.max(totalPresent + totalLate, 1)) * 100) },
    { label: "Leave Use", value: Math.min(approvedLeaves * 10, 100) },
    { label: "Coverage", value: Math.round((employees.filter((e) => e.status === "Active").length / employees.length) * 100) },
    { label: "Compliance", value: 88 },
    { label: "Retention", value: 94 },
  ];

  // Leave type breakdown
  const leaveTypes = {};
  leaveRequests.forEach((l) => {
    leaveTypes[l.leaveType] = (leaveTypes[l.leaveType] || 0) + l.days;
  });

  // Method analysis
  const methods = [
    { name: "Manual Portal", value: attendance.filter((a) => !a.method || a.method === "Manual").length, color: "#3b82f6", icon: "🖥" },
    { name: "QR Code Scan", value: attendance.filter((a) => a.method === "QR Code").length, color: "#8b5cf6", icon: "📱" },
    { name: "GPS Geofence", value: attendance.filter((a) => a.method === "GPS Geofence").length, color: "#10b981", icon: "📍" },
  ];
  const totalMethod = methods.reduce((s, m) => s + m.value, 0) || 1;

  const insightCards = [
    {
      icon: "🌟",
      title: "Top Performer",
      desc: `${empStats.sort((a, b) => b.rate - a.rate)[0]?.name || "—"} leads with highest attendance rate`,
      color: "#f59e0b",
      bg: "#fffbeb",
    },
    {
      icon: "⚠️",
      title: "Attention Required",
      desc: `${pendingLeaves} leave requests still pending admin approval`,
      color: "#ef4444",
      bg: "#fef2f2",
    },
    {
      icon: "📈",
      title: "Trend Insight",
      desc: "Tuesdays show the highest average attendance rate (96%) this week",
      color: "#6366f1",
      bg: "#eff6ff",
    },
    {
      icon: "⏱",
      title: "Peak Check-in",
      desc: "Most employees check in between 8:55 AM – 9:10 AM (NPT)",
      color: "#10b981",
      bg: "#f0fdf4",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-text">
          <div className="overline">ANALYTICS & INSIGHTS</div>
          <h1>Workforce Analytics</h1>
          <p>Deep-dive insights into attendance patterns, leave trends, and employee performance</p>
        </div>
        <div className="page-header-actions">
          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "10px", padding: "3px" }}>
            {["week", "month", "quarter"].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                style={{
                  padding: "7px 14px",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  background: selectedPeriod === p ? "#ffffff" : "transparent",
                  color: selectedPeriod === p ? "#0f172a" : "#64748b",
                  boxShadow: selectedPeriod === p ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                  textTransform: "capitalize",
                  transition: "all 0.2s ease",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <KPICard title="Average Attendance" value={`${avgAttendance}%`} change="3.2%" positive icon="📊" sub="This period vs last" color="#6366f1" />
        <KPICard title="Total Present Days" value={totalPresent} change="5.1%" positive icon="✅" sub="Across all employees" color="#10b981" />
        <KPICard title="Late Arrivals" value={totalLate} change="12%" positive={false} icon="⏰" sub="Need attention" color="#f59e0b" />
        <KPICard title="Total Absences" value={totalAbsent} change="2.4%" positive={false} icon="❌" sub="Unexcused absences" color="#ef4444" />
        <KPICard title="Leaves Approved" value={approvedLeaves} change="8.3%" positive icon="🏖" sub="Total days granted" color="#8b5cf6" />
      </div>

      {/* Middle Row: Radar + Insights */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "20px", marginBottom: "20px" }}>
        {/* Radar Chart */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "18px",
            padding: "24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <h2 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>
            Workforce Scorecard
          </h2>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "#64748b" }}>
            Multi-dimensional performance radar
          </p>
          <RadarChart data={radarData} />
          <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
            {radarData.map((d) => (
              <span key={d.label} style={{ fontSize: "11px", background: "#f8fafc", padding: "3px 8px", borderRadius: "8px", color: "#475569", fontWeight: "600" }}>
                {d.label}: {d.value}%
              </span>
            ))}
          </div>
        </div>

        {/* AI-Style Insights */}
        <div>
          <h2 style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>
            🤖 Smart Insights
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {insightCards.map((card) => (
              <div
                key={card.title}
                style={{
                  background: card.bg,
                  border: `1px solid ${card.color}28`,
                  borderRadius: "14px",
                  padding: "16px 18px",
                }}
              >
                <div style={{ fontSize: "20px", marginBottom: "8px" }}>{card.icon}</div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", marginBottom: "4px" }}>{card.title}</div>
                <div style={{ fontSize: "12px", color: "#475569", lineHeight: 1.5 }}>{card.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Check-in Method Analysis */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "18px",
          padding: "24px",
          marginBottom: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <h2 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>
          Check-in Method Analysis
        </h2>
        <p style={{ margin: "0 0 20px", fontSize: "12px", color: "#64748b" }}>
          Usage distribution across authentication channels
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {methods.map((m) => {
            const pct = Math.round((m.value / totalMethod) * 100);
            return (
              <div
                key={m.name}
                style={{
                  background: "#f8fafc",
                  borderRadius: "14px",
                  padding: "20px",
                  border: "1px solid #e2e8f0",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>{m.icon}</div>
                <div style={{ fontSize: "28px", fontWeight: "800", color: m.color }}>{pct}%</div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", margin: "4px 0" }}>{m.name}</div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>{m.value} check-ins</div>
                <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "6px", marginTop: "12px", overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: m.color, borderRadius: "6px" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-Employee Breakdown */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "18px",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          marginBottom: "20px",
        }}
      >
        <div className="table-card-header">
          <div>
            <h2>Employee-Level Attendance Breakdown</h2>
            <p>Detailed per-employee status distribution for the period</p>
          </div>
        </div>
        <div style={{ padding: "16px 24px" }}>
          {empStats.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <h3>No data available</h3>
              <p>No employee attendance records found.</p>
            </div>
          ) : (
            empStats.map((emp) => (
              <StackedBar
                key={emp.id}
                label={`${emp.name} (${emp.department})`}
                total={Math.max(emp.records, 1)}
                segments={[
                  { label: "Present", value: emp.present, color: "#10b981" },
                  { label: "Late", value: emp.late, color: "#f59e0b" },
                  { label: "Absent", value: emp.absent, color: "#ef4444" },
                ]}
              />
            ))
          )}
        </div>
      </div>

      {/* Leave Type Distribution */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "18px",
          padding: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>
          Leave Type Distribution
        </h2>
        <p style={{ margin: "0 0 20px", fontSize: "12px", color: "#64748b" }}>
          Days taken per leave category across all employees
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
          {Object.entries(leaveTypes).map(([type, days], i) => {
            const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];
            const color = colors[i % colors.length];
            return (
              <div
                key={type}
                style={{
                  background: `${color}10`,
                  border: `1px solid ${color}30`,
                  borderRadius: "14px",
                  padding: "16px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "26px", fontWeight: "800", color }}>{days}</div>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#334155", marginTop: "4px" }}>{type}</div>
                <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>days total</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b, #312e81)",
          borderRadius: "18px",
          padding: "24px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#818cf8", letterSpacing: "1px", marginBottom: "6px" }}>
            REPORTING PERIOD SUMMARY
          </div>
          <div style={{ fontSize: "18px", fontWeight: "800", color: "#ffffff" }}>
            Overall workforce attendance: {avgAttendance}%
          </div>
          <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>
            Across {employees.length} employees, {departments.length} departments — Sep 2026
          </div>
        </div>
        <div style={{ display: "flex", gap: "20px" }}>
          {[
            { label: "Data Points", value: totalRecords },
            { label: "Leave Requests", value: leaveRequests.length },
            { label: "Active Depts", value: departments.filter((d) => d.status === "Active").length },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "22px", fontWeight: "800", color: "#ffffff" }}>{s.value}</div>
              <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
