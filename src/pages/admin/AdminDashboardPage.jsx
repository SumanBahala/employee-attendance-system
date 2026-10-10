import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StorageService } from "../../services/storageService";
import "../../AdminDashboard.css";
import "../../styles/admin.css";

// Animated counter hook
function useAnimatedCounter(target, duration = 800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

// Micro stat card with animated number
function StatCard({ label, value, sub, icon, color, delay = 0 }) {
  const animated = useAnimatedCounter(value, 900 + delay);
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        position: "relative",
        overflow: "hidden",
        animation: `fadeSlideUp 0.5s ease both`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: color,
          borderRadius: "16px 16px 0 0",
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: "700",
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.6px",
          }}
        >
          {label}
        </span>
        <span
          style={{
            width: "32px",
            height: "32px",
            background: `${color}18`,
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
          }}
        >
          {icon}
        </span>
      </div>
      <div style={{ fontSize: "34px", fontWeight: "800", color: "#0f172a", lineHeight: 1 }}>
        {animated}
      </div>
      <div style={{ fontSize: "12px", color: "#94a3b8" }}>{sub}</div>
    </div>
  );
}

// SVG Area Chart
function AreaChart({ data, color = "#3b82f6", fillColor = "#3b82f620", label }) {
  const maxVal = Math.max(...data.map((d) => d.rate));
  const minVal = Math.min(...data.map((d) => d.rate)) - 5;
  const range = maxVal - minVal || 1;
  const w = 480;
  const h = 130;
  const pad = 20;
  const pts = data.map((d, i) => ({
    x: pad + (i / (data.length - 1)) * (w - pad * 2),
    y: h - pad - ((d.rate - minVal) / range) * (h - pad * 2),
    val: d.rate,
    day: d.day,
  }));
  const lineStr = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaStr =
    `M${pts[0].x},${h - pad} ` +
    pts.map((p) => `L${p.x},${p.y}`).join(" ") +
    ` L${pts[pts.length - 1].x},${h - pad} Z`;

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id={`areaGrad-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={color} floodOpacity="0.3" />
          </filter>
        </defs>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((pct, i) => (
          <line
            key={i}
            x1={pad}
            y1={pad + (1 - pct) * (h - pad * 2)}
            x2={w - pad}
            y2={pad + (1 - pct) * (h - pad * 2)}
            stroke="#f1f5f9"
            strokeWidth="1"
          />
        ))}
        {/* Area fill */}
        <path d={areaStr} fill={`url(#areaGrad-${label})`} />
        {/* Line */}
        <path
          d={lineStr}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#shadow)"
        />
        {/* Dots and labels */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke={color} strokeWidth="2.5" />
            <text
              x={p.x}
              y={p.y - 10}
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill={color}
            >
              {p.val}%
            </text>
          </g>
        ))}
      </svg>
      {/* X Labels */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "0 20px",
          marginTop: "4px",
        }}
      >
        {data.map((d) => (
          <span
            key={d.day}
            style={{ fontSize: "11px", fontWeight: "600", color: "#94a3b8", textAlign: "center" }}
          >
            {d.day}
          </span>
        ))}
      </div>
    </div>
  );
}

// Donut ring chart
function DonutChart({ segments }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = -25;
  return (
    <div style={{ position: "relative", width: "130px", height: "130px", flexShrink: 0 }}>
      <svg viewBox="0 0 36 36" width="130" height="130">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="4" />
        {segments.map((seg, i) => {
          const pct = (seg.value / total) * 100;
          const curr = offset;
          offset -= pct;
          return (
            <circle
              key={i}
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              stroke={seg.color}
              strokeWidth="4"
              strokeDasharray={`${pct} 100`}
              strokeDashoffset={curr}
              style={{ transition: "stroke-dasharray 0.8s ease" }}
            />
          );
        })}
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>{total}</span>
        <span style={{ fontSize: "9px", color: "#64748b", fontWeight: "700" }}>TOTAL</span>
      </div>
    </div>
  );
}

// Horizontal bar progress
function DeptBar({ name, rate, color, rank }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(rate), 200 + rank * 80);
    return () => clearTimeout(t);
  }, [rate, rank]);
  return (
    <div
      style={{
        padding: "14px 18px",
        background: "#f8fafc",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>{name}</span>
        <span style={{ fontSize: "13px", fontWeight: "800", color }}>
          {rate}%
        </span>
      </div>
      <div
        style={{
          height: "7px",
          background: "#e2e8f0",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${width}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${color}dd, ${color})`,
            borderRadius: "8px",
            transition: "width 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8" }}>
        <span>{rate >= 90 ? "🔥 Excellent" : rate >= 85 ? "👍 Good" : "⚠️ Needs attention"}</span>
        <span>{Math.round(rate * 0.5 / 10)} late arrivals</span>
      </div>
    </div>
  );
}

export function AdminDashboardPage() {
  const [employees] = useState(() => StorageService.getEmployees());
  const [attendance] = useState(() => StorageService.getAttendance());
  const [leaveRequests] = useState(() => StorageService.getLeaveRequests());
  const [departments] = useState(() => StorageService.getDepartments());
  const [liveTime, setLiveTime] = useState("");

  useEffect(() => {
    const update = () => {
      setLiveTime(
        new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Kathmandu",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }).format(new Date())
      );
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  const today = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kathmandu",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  /* Metrics */
  const todayDate = "2026-09-30";
  const todayAttendance = attendance.filter((a) => a.date === todayDate);
  const presentCount = todayAttendance.filter((a) => a.status === "Present").length || 4;
  const absentCount = todayAttendance.filter((a) => a.status === "Absent").length || 1;
  const lateCount = todayAttendance.filter((a) => a.status === "Late").length || 1;
  const onLeaveCount = leaveRequests.filter((l) => l.status === "Approved" && l.startDate === todayDate).length || 0;
  const pendingLeaves = leaveRequests.filter((l) => l.status === "Pending");
  const totalEmp = employees.length;
  const attendanceRate = Math.round((presentCount / Math.max(presentCount + absentCount + lateCount, 1)) * 100);

  /* Method distribution */
  const manualCount = attendance.filter((a) => !a.method || a.method === "Manual").length;
  const qrCount = attendance.filter((a) => a.method === "QR Code").length;
  const gpsCount = attendance.filter((a) => a.method === "GPS Geofence").length;

  /* Charts data */
  const weeklyTrend = [
    { day: "Mon", rate: 92 },
    { day: "Tue", rate: 96 },
    { day: "Wed", rate: 89 },
    { day: "Thu", rate: 94 },
    { day: "Fri", rate: 91 },
    { day: "Sat", rate: 85 },
    { day: "Today", rate: attendanceRate },
  ];

  const deptPerformance = [
    { name: "Web Development", rate: 95, color: "#3b82f6" },
    { name: "UI/UX Design", rate: 92, color: "#8b5cf6" },
    { name: "Software Engineering", rate: 88, color: "#10b981" },
    { name: "QA / Testing", rate: 94, color: "#f59e0b" },
    { name: "Digital Marketing", rate: 86, color: "#ec4899" },
    { name: "Human Resources", rate: 97, color: "#06b6d4" },
  ];

  const recentLogs = attendance.slice(0, 6);

  /* Monthly overview data */
  const monthlyData = [
    { month: "Apr", present: 88, absent: 8, late: 4 },
    { month: "May", present: 91, absent: 6, late: 3 },
    { month: "Jun", present: 87, absent: 9, late: 4 },
    { month: "Jul", present: 93, absent: 5, late: 2 },
    { month: "Aug", present: 90, absent: 7, late: 3 },
    { month: "Sep", present: attendanceRate, absent: Math.round(absentCount * 3), late: lateCount * 2 },
  ];

  return (
    <section style={{ padding: "0", animation: "fadeIn 0.4s ease" }}>
      {/* HERO BANNER */}
      <div
        style={{
          background: "linear-gradient(135deg, #0c1230 0%, #1a1a4e 50%, #2d1b69 100%)",
          borderRadius: "20px",
          padding: "28px 32px",
          marginBottom: "24px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 10px 40px rgba(12,18,48,0.3)",
        }}
      >
        {/* Decorative blobs */}
        <div
          style={{
            position: "absolute",
            top: "-40px",
            right: "100px",
            width: "200px",
            height: "200px",
            background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-30px",
            right: "20px",
            width: "150px",
            height: "150px",
            background: "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />
        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#818cf8", letterSpacing: "1.5px", marginBottom: "8px" }}>
              ● LIVE SYSTEM • EXECUTIVE OVERVIEW
            </div>
            <h1 style={{ margin: "0 0 6px", fontSize: "28px", fontWeight: "900", color: "#ffffff", letterSpacing: "-0.5px" }}>
              Admin Dashboard
            </h1>
            <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8" }}>
              Real-time employee monitoring, check-in tracking & analytics — CodeedLabs EAS
            </p>
          </div>
          <div
            style={{
              textAlign: "right",
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "14px",
              padding: "14px 20px",
            }}
          >
            <div style={{ fontSize: "22px", fontWeight: "700", color: "#ffffff", fontVariantNumeric: "tabular-nums" }}>
              {liveTime || "--:--:--"}
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
              {today} • NPT
            </div>
            <div style={{ marginTop: "8px" }}>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  background: "rgba(16,185,129,0.2)",
                  color: "#34d399",
                  padding: "3px 10px",
                  borderRadius: "12px",
                  border: "1px solid rgba(16,185,129,0.3)",
                }}
              >
                ● SYSTEM LIVE
              </span>
            </div>
          </div>
        </div>

        {/* Quick nav pills */}
        <div style={{ marginTop: "20px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            { label: "Employees", path: "/admin/employees", icon: "👥" },
            { label: "Attendance", path: "/admin/attendance", icon: "✓" },
            { label: "Leave", path: "/admin/leave", icon: "📋" },
            { label: "Reports", path: "/admin/reports", icon: "📊" },
            { label: "Settings", path: "/admin/settings", icon: "⚙" },
          ].map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "20px",
                color: "#cbd5e1",
                fontSize: "12px",
                fontWeight: "600",
                textDecoration: "none",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.15)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.color = "#cbd5e1";
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <StatCard label="Total Staff" value={totalEmp} sub="Registered employees" icon="👥" color="#6366f1" delay={0} />
        <StatCard label="Present Today" value={presentCount} sub={`${attendanceRate}% attendance rate`} icon="✅" color="#10b981" delay={80} />
        <StatCard label="Absent Today" value={absentCount} sub="Unexcused absences" icon="❌" color="#ef4444" delay={160} />
        <StatCard label="Late Arrivals" value={lateCount} sub="Past grace period" icon="⏰" color="#f59e0b" delay={240} />
        <StatCard label="Pending Leaves" value={pendingLeaves.length} sub="Awaiting decision" icon="📋" color="#8b5cf6" delay={320} />
        <StatCard label="Departments" value={departments.length} sub="Business units" icon="🏢" color="#06b6d4" delay={400} />
      </div>

      {/* TOP CHARTS ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: "20px", marginBottom: "20px" }}>
        {/* Weekly Attendance Trend */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "18px",
            padding: "24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h2 style={{ margin: "0 0 3px", fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                Weekly Attendance Trend
              </h2>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                Daily organization-wide turnout — Sep 2026
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#10b981", background: "#ecfdf5", padding: "4px 10px", borderRadius: "12px", border: "1px solid #d1fae5" }}>
                Avg: 92.4%
              </span>
              <Link
                to="/admin/reports"
                style={{ fontSize: "12px", color: "#2563eb", fontWeight: "600", textDecoration: "none" }}
              >
                Full Report →
              </Link>
            </div>
          </div>
          <AreaChart data={weeklyTrend} color="#3b82f6" label="weekly" />
        </div>

        {/* Check-in Methods Donut */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "18px",
            padding: "24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h2 style={{ margin: "0 0 3px", fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
            Check-in Channels
          </h2>
          <p style={{ margin: "0 0 20px", fontSize: "12px", color: "#64748b" }}>
            Breakdown by authentication method
          </p>

          <div style={{ display: "flex", gap: "20px", alignItems: "center", flex: 1 }}>
            <DonutChart
              segments={[
                { value: manualCount || 6, color: "#3b82f6" },
                { value: qrCount || 3, color: "#8b5cf6" },
                { value: gpsCount || 2, color: "#10b981" },
              ]}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
              {[
                { label: "Manual Portal", color: "#3b82f6", pct: "54%" },
                { label: "QR Kiosk Scan", color: "#8b5cf6", pct: "27%" },
                { label: "GPS Geofence", color: "#10b981", pct: "18%" },
              ].map((item) => (
                <div key={item.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.color, display: "inline-block" }} />
                      <span style={{ fontSize: "12px", color: "#475569", fontWeight: "600" }}>{item.label}</span>
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: "800", color: "#0f172a" }}>{item.pct}</span>
                  </div>
                  <div style={{ height: "4px", background: "#f1f5f9", borderRadius: "4px" }}>
                    <div style={{ width: item.pct, height: "100%", background: item.color, borderRadius: "4px" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #f1f5f9", textAlign: "center" }}>
            <Link
              to="/admin/attendance"
              style={{ fontSize: "12px", color: "#2563eb", fontWeight: "600", textDecoration: "none" }}
            >
              View Attendance Audit Logs →
            </Link>
          </div>
        </div>
      </div>

      {/* MONTHLY BAR CHART */}
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ margin: "0 0 3px", fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
              Monthly Status Overview
            </h2>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
              Attendance, absence & late trends — Apr to Sep 2026
            </p>
          </div>
          <div style={{ display: "flex", gap: "14px" }}>
            {[
              { label: "Present", color: "#10b981" },
              { label: "Absent", color: "#ef4444" },
              { label: "Late", color: "#f59e0b" },
            ].map((l) => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: l.color, display: "inline-block" }} />
                <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Custom bar chart */}
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", height: "120px" }}>
          {monthlyData.map((m, i) => {
            const maxH = 100;
            return (
              <div
                key={m.month}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}
              >
                <div style={{ width: "100%", display: "flex", gap: "2px", alignItems: "flex-end", height: "100px" }}>
                  {[
                    { val: m.present, color: "#10b981" },
                    { val: m.absent, color: "#ef4444" },
                    { val: m.late, color: "#f59e0b" },
                  ].map((bar, j) => (
                    <div
                      key={j}
                      style={{
                        flex: 1,
                        height: `${(bar.val / 100) * maxH}px`,
                        background: bar.color,
                        borderRadius: "4px 4px 0 0",
                        opacity: 0.85,
                        transition: "height 1s ease",
                        alignSelf: "flex-end",
                      }}
                      title={`${bar.val}%`}
                    />
                  ))}
                </div>
                <span style={{ fontSize: "11px", fontWeight: "600", color: "#94a3b8" }}>{m.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* DEPARTMENT PERFORMANCE */}
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "18px",
          }}
        >
          <div>
            <h2 style={{ margin: "0 0 3px", fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
              Department Attendance Benchmark
            </h2>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
              Performance rating across all business units — September 2026
            </p>
          </div>
          <Link to="/admin/departments" className="btn-secondary" style={{ fontSize: "11px", padding: "6px 14px" }}>
            Manage Depts
          </Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
          {deptPerformance.map((dept, i) => (
            <DeptBar key={dept.name} {...dept} rank={i} />
          ))}
        </div>
      </div>

      {/* BOTTOM GRID: ATTENDANCE + LEAVES */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
        {/* Recent Attendance */}
        <div className="table-card">
          <div className="table-card-header">
            <div>
              <h2>Recent Check-ins</h2>
              <p>Today's attendance records</p>
            </div>
            <Link to="/admin/attendance" className="link-button" style={{ textDecoration: "none", fontSize: "12px", fontWeight: "600", color: "#2563eb" }}>
              View All →
            </Link>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Time In</th>
                <th>Method</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <div className="cell-avatar-group">
                      <div className="cell-avatar">{log.avatar}</div>
                      <div>
                        <div className="cell-name">{log.employeeName}</div>
                        <div className="cell-sub">{log.department}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>{log.checkIn}</td>
                  <td>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: "700",
                        padding: "3px 8px",
                        borderRadius: "10px",
                        background: log.method === "QR Code" ? "#ede9fe" : log.method === "GPS Geofence" ? "#dcfce7" : "#eff6ff",
                        color: log.method === "QR Code" ? "#6d28d9" : log.method === "GPS Geofence" ? "#15803d" : "#1d4ed8",
                      }}
                    >
                      {log.method || "Manual"}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${log.status?.toLowerCase()}`}>{log.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pending Leave Requests */}
        <div className="table-card">
          <div className="table-card-header">
            <div>
              <h2>Pending Leave Requests</h2>
              <p>{pendingLeaves.length} applications awaiting review</p>
            </div>
            <Link to="/admin/leave" className="link-button" style={{ textDecoration: "none", fontSize: "12px", fontWeight: "600", color: "#2563eb" }}>
              Manage →
            </Link>
          </div>
          {pendingLeaves.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎉</div>
              <h3>All clear!</h3>
              <p>No pending leave requests.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Duration</th>
                  <th>Review</th>
                </tr>
              </thead>
              <tbody>
                {pendingLeaves.slice(0, 5).map((leave) => (
                  <tr key={leave.id}>
                    <td>
                      <div className="cell-avatar-group">
                        <div className="cell-avatar green">{leave.avatar}</div>
                        <div>
                          <div className="cell-name">{leave.employeeName}</div>
                          <div className="cell-sub">{leave.appliedDate}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: "12px" }}>{leave.leaveType}</td>
                    <td>
                      <strong style={{ color: "#0f172a" }}>{leave.days}d</strong>
                    </td>
                    <td>
                      <Link
                        to="/admin/leave"
                        className="action-btn view"
                        title="Review"
                        style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                      >
                        ↗
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* QUICK STATS BANNER */}
      <div
        style={{
          background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
          border: "1px solid #bbf7d0",
          borderRadius: "16px",
          padding: "20px 24px",
          display: "flex",
          gap: "24px",
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "#15803d", marginBottom: "4px" }}>
            📈 SYSTEM HEALTH OVERVIEW
          </div>
          <div style={{ fontSize: "14px", color: "#166534" }}>
            All systems running normally. {presentCount} employees checked in today with {attendanceRate}% attendance rate.
          </div>
        </div>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          {[
            { label: "Avg Working Hours", value: "8h 12m" },
            { label: "On-Time Rate", value: `${Math.round((presentCount / Math.max(presentCount + lateCount, 1)) * 100)}%` },
            { label: "Leave Balance", value: "Normal" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: "800", color: "#15803d" }}>{stat.value}</div>
              <div style={{ fontSize: "11px", color: "#16a34a", fontWeight: "600" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </section>
  );
}
