import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { OFFICE_LOCATION } from "../../data/officeLocation";
import {
  calculateDistanceInMeters,
  formatDistance,
} from "../../utils/distance";
import {
  clearWatch,
  getCurrentPosition,
  GPS_ERROR_CODES,
  isGeolocationSupported,
  watchPosition,
} from "../../services/geolocationService";
import { getNepalDateTimeString } from "../../utils/dateTimeUtils";

// ─── Fix Leaflet's broken default icon paths in Vite/webpack builds ───────────
// Without this, marker images 404 and pins are invisible.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── GPS State Machine ────────────────────────────────────────────────────────
export const GPS_STATUS_STATES = {
  IDLE: "IDLE",
  REQUESTING_PERMISSION: "REQUESTING_PERMISSION",
  LOCATING: "LOCATING",
  INSIDE_GEOFENCE: "INSIDE_GEOFENCE",
  OUTSIDE_GEOFENCE: "OUTSIDE_GEOFENCE",
  LOW_ACCURACY: "LOW_ACCURACY",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  POSITION_UNAVAILABLE: "POSITION_UNAVAILABLE",
  TIMEOUT: "TIMEOUT",
  UNSUPPORTED: "UNSUPPORTED",
  ERROR: "ERROR",
};

// ─── Custom animated Leaflet DivIcon: Office ─────────────────────────────────
function createOfficeMarkerIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;width:40px;height:40px;border-radius:50%;background:rgba(79,70,229,0.22);animation:easMapPing 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
      <div style="position:relative;width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#4f46e5,#6366f1);border:2.5px solid #fff;box-shadow:0 4px 14px rgba(79,70,229,0.55);display:flex;align-items:center;justify-content:center;font-size:16px;">🏢</div>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
}

// ─── Custom animated Leaflet DivIcon: User ───────────────────────────────────
function createUserMarkerIcon(isInside = false) {
  const color = isInside ? "#10b981" : "#f59e0b";
  const ring = isInside ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)";
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;width:36px;height:36px;border-radius:50%;background:${ring};animation:easMapPing 1.8s cubic-bezier(0,0,0.2,1) infinite;"></div>
      <div style="position:relative;width:22px;height:22px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
        <div style="width:6px;height:6px;border-radius:50%;background:#fff;"></div>
      </div>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
export function GPSGeofence({ currentUser, isCheckedIn, onPunchSuccess }) {
  const [gpsStatus, setGpsStatus] = useState(GPS_STATUS_STATES.IDLE);
  const [coords, setCoords] = useState(null);
  const [distance, setDistance] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [verifiedSummary, setVerifiedSummary] = useState(null);

  // Leaflet map refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const officeMarkerRef = useRef(null);
  const geofenceCircleRef = useRef(null);
  const userMarkerRef = useRef(null);
  const accuracyCircleRef = useRef(null);
  const distanceLineRef = useRef(null);
  const watchIdRef = useRef(null);

  // ── Initialize Leaflet map once on mount ───────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const { latitude: oLat, longitude: oLng, radiusMeters } = OFFICE_LOCATION;

    const map = L.map(mapContainerRef.current, {
      center: [oLat, oLng],
      zoom: 16,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Office marker
    const officeMarker = L.marker([oLat, oLng], {
      icon: createOfficeMarkerIcon(),
      title: OFFICE_LOCATION.name,
      zIndexOffset: 200,
    })
      .addTo(map)
      .bindPopup(
        `<div style="font-family:inherit;padding:4px 2px;min-width:160px;">
          <strong style="color:#1e3a8a;font-size:13px;">${OFFICE_LOCATION.name}</strong><br/>
          <span style="font-size:11px;color:#64748b;">${OFFICE_LOCATION.address}</span><br/>
          <span style="font-size:11px;color:#059669;font-weight:700;">Geofence: ${radiusMeters}m radius</span>
        </div>`
      );
    officeMarkerRef.current = officeMarker;

    // Geofence boundary circle
    const circle = L.circle([oLat, oLng], {
      radius: radiusMeters,
      color: "#10b981",
      fillColor: "#10b981",
      fillOpacity: 0.1,
      weight: 2,
      dashArray: "6 5",
    }).addTo(map);
    geofenceCircleRef.current = circle;

    mapInstanceRef.current = map;

    // Invalidate size after render to ensure tiles load correctly
    setTimeout(() => map.invalidateSize(), 300);

    // Auto-start GPS acquisition
    acquireRealGpsLocation();

    return () => {
      // Cleanup: stop GPS watch and destroy map
      if (watchIdRef.current !== null) {
        clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      // Reset refs so new instances aren't blocked
      officeMarkerRef.current = null;
      geofenceCircleRef.current = null;
      userMarkerRef.current = null;
      accuracyCircleRef.current = null;
      distanceLineRef.current = null;
    };
  }, []);

  // ── Sync map whenever coordinates or distance changes ─────────────────────
  useEffect(() => {
    if (!mapInstanceRef.current || !coords) return;

    const map = mapInstanceRef.current;
    const { latitude: uLat, longitude: uLng, accuracy } = coords;
    const { latitude: oLat, longitude: oLng } = OFFICE_LOCATION;
    const isInside =
      distance !== null && distance <= OFFICE_LOCATION.radiusMeters;

    // 1. User marker
    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker([uLat, uLng], {
        icon: createUserMarkerIcon(isInside),
        title: "Your Current Location",
        zIndexOffset: 300,
      })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:inherit;padding:4px 2px;min-width:160px;">
            <strong style="color:#0f172a;font-size:13px;">Your Location</strong><br/>
            <span style="font-size:11px;color:#64748b;">Accuracy: ±${Math.round(accuracy)}m</span><br/>
            <span style="font-size:11px;font-weight:700;color:${isInside ? "#059669" : "#d97706"};">
              ${isInside ? "✓ Inside Office Geofence" : "⚠ Outside Geofence"}
            </span>
          </div>`
        );
    } else {
      userMarkerRef.current.setLatLng([uLat, uLng]);
      userMarkerRef.current.setIcon(createUserMarkerIcon(isInside));
      userMarkerRef.current
        .getPopup()
        ?.setContent(
          `<div style="font-family:inherit;padding:4px 2px;min-width:160px;">
            <strong style="color:#0f172a;font-size:13px;">Your Location</strong><br/>
            <span style="font-size:11px;color:#64748b;">Accuracy: ±${Math.round(accuracy)}m</span><br/>
            <span style="font-size:11px;font-weight:700;color:${isInside ? "#059669" : "#d97706"};">
              ${isInside ? "✓ Inside Office Geofence" : "⚠ Outside Geofence"}
            </span>
          </div>`
        );
    }

    // 2. GPS accuracy circle around user
    const accRadius = Math.max(accuracy, 8);
    if (!accuracyCircleRef.current) {
      accuracyCircleRef.current = L.circle([uLat, uLng], {
        radius: accRadius,
        color: isInside ? "#3b82f6" : "#f59e0b",
        fillColor: isInside ? "#3b82f6" : "#f59e0b",
        fillOpacity: 0.07,
        weight: 1,
      }).addTo(map);
    } else {
      accuracyCircleRef.current.setLatLng([uLat, uLng]);
      accuracyCircleRef.current.setRadius(accRadius);
      accuracyCircleRef.current.setStyle({
        color: isInside ? "#3b82f6" : "#f59e0b",
        fillColor: isInside ? "#3b82f6" : "#f59e0b",
      });
    }

    // 3. Dashed line from user to office (visual distance indicator)
    if (!distanceLineRef.current) {
      distanceLineRef.current = L.polyline(
        [[uLat, uLng], [oLat, oLng]],
        {
          color: isInside ? "#10b981" : "#f59e0b",
          weight: 2,
          dashArray: "5 8",
          opacity: 0.75,
        }
      ).addTo(map);
    } else {
      distanceLineRef.current.setLatLngs([[uLat, uLng], [oLat, oLng]]);
      distanceLineRef.current.setStyle({
        color: isInside ? "#10b981" : "#f59e0b",
      });
    }

    // 4. Geofence circle color reflects inside/outside
    if (geofenceCircleRef.current) {
      geofenceCircleRef.current.setStyle({
        color: isInside ? "#10b981" : "#94a3b8",
        fillColor: isInside ? "#10b981" : "#94a3b8",
      });
    }

    // 5. Fit map bounds to show both user and office markers
    try {
      map.fitBounds(
        L.latLngBounds([[uLat, uLng], [oLat, oLng]]),
        { padding: [55, 55], maxZoom: 17, animate: true }
      );
    } catch (_) {}
  }, [coords, distance]);

  // ── Real GPS acquisition ───────────────────────────────────────────────────
  const acquireRealGpsLocation = async () => {
    setIsDemoMode(false);
    setVerifiedSummary(null);

    if (!isGeolocationSupported()) {
      setGpsStatus(GPS_STATUS_STATES.UNSUPPORTED);
      setStatusMessage("Your browser does not support location services.");
      return;
    }

    // Stop any existing watcher first
    if (watchIdRef.current !== null) {
      clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setGpsStatus(GPS_STATUS_STATES.REQUESTING_PERMISSION);
    setStatusMessage("Requesting location permission...");

    try {
      // Single high-accuracy fix first
      setGpsStatus(GPS_STATUS_STATES.LOCATING);
      setStatusMessage("Acquiring your GPS location...");

      const pos = await getCurrentPosition();
      processPositionUpdate(pos);

      // Then start continuous tracking
      watchIdRef.current = watchPosition(
        (updatedPos) => processPositionUpdate(updatedPos),
        (watchErr) => console.warn("watchPosition error:", watchErr)
      );
    } catch (err) {
      handleGpsError(err);
    }
  };

  // ── Process any position update ───────────────────────────────────────────
  const processPositionUpdate = (position) => {
    const { latitude: lat, longitude: lng, accuracy = 15 } = position;

    const dist = calculateDistanceInMeters(
      lat, lng,
      OFFICE_LOCATION.latitude, OFFICE_LOCATION.longitude
    );

    setCoords({ latitude: lat, longitude: lng, accuracy });
    setDistance(dist);

    // Accuracy check
    if (accuracy > OFFICE_LOCATION.maxAccuracyMeters) {
      setGpsStatus(GPS_STATUS_STATES.LOW_ACCURACY);
      setStatusMessage(
        `GPS accuracy is too low (±${Math.round(accuracy)}m). Move to an open area and retry.`
      );
      return;
    }

    const isInside = dist !== null && dist <= OFFICE_LOCATION.radiusMeters;
    if (isInside) {
      setGpsStatus(GPS_STATUS_STATES.INSIDE_GEOFENCE);
      setStatusMessage("You are within the authorized office area.");
    } else {
      setGpsStatus(GPS_STATUS_STATES.OUTSIDE_GEOFENCE);
      setStatusMessage(
        `You are ${formatDistance(dist)} away. Move closer to the authorized office location.`
      );
    }
  };

  // ── GPS error handler ─────────────────────────────────────────────────────
  const handleGpsError = (err) => {
    const code = err?.code;
    switch (code) {
      case GPS_ERROR_CODES.PERMISSION_DENIED:
      case "PERMISSION_DENIED":
        setGpsStatus(GPS_STATUS_STATES.PERMISSION_DENIED);
        setStatusMessage(
          "Location permission denied. Please allow location access in your browser settings."
        );
        break;
      case GPS_ERROR_CODES.POSITION_UNAVAILABLE:
      case "POSITION_UNAVAILABLE":
        setGpsStatus(GPS_STATUS_STATES.POSITION_UNAVAILABLE);
        setStatusMessage("Unable to determine your current location.");
        break;
      case GPS_ERROR_CODES.TIMEOUT:
      case "TIMEOUT":
        setGpsStatus(GPS_STATUS_STATES.TIMEOUT);
        setStatusMessage("GPS request timed out. Please try again.");
        break;
      default:
        setGpsStatus(GPS_STATUS_STATES.ERROR);
        setStatusMessage(err?.message || "Failed to acquire GPS location.");
    }
  };

  // ── Demo GPS mode (clearly labelled, never confused with real GPS) ─────────
  const handleToggleDemoMode = (targetType = "inside") => {
    if (watchIdRef.current !== null) {
      clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsDemoMode(true);
    setVerifiedSummary(null);

    // Simulated coords relative to CodeedLabs HQ
    const { latitude: oLat, longitude: oLng } = OFFICE_LOCATION;
    let simLat, simLng, simAcc;
    if (targetType === "inside") {
      // ~25m NE of office
      simLat = oLat + 0.00015;
      simLng = oLng + 0.00015;
      simAcc = 8;
    } else {
      // ~3 km SW (Patan area)
      simLat = oLat - 0.018;
      simLng = oLng - 0.017;
      simAcc = 12;
    }

    processPositionUpdate({ latitude: simLat, longitude: simLng, accuracy: simAcc });
  };

  // ── Handle GPS punch-in ───────────────────────────────────────────────────
  const handlePunchIn = () => {
    if (gpsStatus !== GPS_STATUS_STATES.INSIDE_GEOFENCE || !coords || distance === null) return;
    if (distance > OFFICE_LOCATION.radiusMeters) return;

    const summary = {
      employeeName: currentUser?.name || "Employee",
      officeName: OFFICE_LOCATION.name,
      distance: formatDistance(distance),
      distanceRaw: distance,
      accuracy: Math.round(coords.accuracy),
      nepalTime: getNepalDateTimeString(new Date()),
      latitude: coords.latitude.toFixed(6),
      longitude: coords.longitude.toFixed(6),
    };

    setVerifiedSummary(summary);

    if (onPunchSuccess) {
      onPunchSuccess({
        gpsData: coords,
        distanceFromOffice: distance,
        isDemo: isDemoMode,
      });
    }
  };

  const isPunchEnabled =
    gpsStatus === GPS_STATUS_STATES.INSIDE_GEOFENCE &&
    !isCheckedIn &&
    coords !== null &&
    distance !== null &&
    distance <= OFFICE_LOCATION.radiusMeters;

  // ─── Helper: geofence status banner colors ────────────────────────────────
  const getStatusColors = () => {
    switch (gpsStatus) {
      case GPS_STATUS_STATES.INSIDE_GEOFENCE:
        return { bg: "#ecfdf5", border: "#a7f3d0", text: "#065f46", icon: "🎯" };
      case GPS_STATUS_STATES.OUTSIDE_GEOFENCE:
        return { bg: "#fffbeb", border: "#fde68a", text: "#92400e", icon: "⚠️" };
      case GPS_STATUS_STATES.LOCATING:
      case GPS_STATUS_STATES.REQUESTING_PERMISSION:
        return { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af", icon: "📡" };
      case GPS_STATUS_STATES.LOW_ACCURACY:
        return { bg: "#fff7ed", border: "#fed7aa", text: "#9a3412", icon: "📶" };
      case GPS_STATUS_STATES.PERMISSION_DENIED:
        return { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", icon: "🔒" };
      default:
        return { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", icon: "🚫" };
    }
  };

  const statusColors = getStatusColors();

  const getStatusTitle = () => {
    switch (gpsStatus) {
      case GPS_STATUS_STATES.INSIDE_GEOFENCE:    return "✓ INSIDE GEOFENCE";
      case GPS_STATUS_STATES.OUTSIDE_GEOFENCE:   return "⚠ OUTSIDE GEOFENCED AREA";
      case GPS_STATUS_STATES.LOCATING:           return "Acquiring GPS...";
      case GPS_STATUS_STATES.REQUESTING_PERMISSION: return "Requesting Permission...";
      case GPS_STATUS_STATES.LOW_ACCURACY:       return "Low GPS Accuracy";
      case GPS_STATUS_STATES.PERMISSION_DENIED:  return "Location Permission Denied";
      case GPS_STATUS_STATES.POSITION_UNAVAILABLE: return "Location Unavailable";
      case GPS_STATUS_STATES.TIMEOUT:            return "GPS Timeout";
      case GPS_STATUS_STATES.UNSUPPORTED:        return "Location Not Supported";
      default:                                   return "Location Error";
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── DEMO MODE NOTICE ─────────────────────────────────────────── */}
      {isDemoMode && (
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "12px",
            padding: "10px 16px",
            marginBottom: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                background: "#d97706",
                color: "#fff",
                padding: "2px 8px",
                borderRadius: "4px",
                fontWeight: "800",
                fontSize: "10px",
                letterSpacing: "1.2px",
                flexShrink: 0,
              }}
            >
              DEMO MODE
            </span>
            <span style={{ color: "#92400e", fontWeight: "600", fontSize: "12px" }}>
              Simulated coordinates active for testing. Not real GPS.
            </span>
          </div>
          <button
            type="button"
            onClick={acquireRealGpsLocation}
            style={{
              background: "none",
              border: "none",
              color: "#2563eb",
              fontWeight: "700",
              fontSize: "11px",
              cursor: "pointer",
              textDecoration: "underline",
              flexShrink: 0,
            }}
          >
            Switch to Real GPS
          </button>
        </div>
      )}

      {/* ── GPS PUNCH SUCCESS CARD ───────────────────────────────────── */}
      {verifiedSummary && (
        <div
          style={{
            background: "linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%)",
            border: "1px solid #10b981",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "18px",
            boxShadow: "0 8px 24px rgba(16,185,129,0.15)",
            animation: "easGpsFadeIn 0.4s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "linear-gradient(135deg,#10b981,#059669)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                boxShadow: "0 4px 12px rgba(16,185,129,0.4)",
                flexShrink: 0,
              }}
            >
              ✓
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: "800", color: "#065f46" }}>
                GPS Location Verified
              </div>
              <div style={{ fontSize: "12px", color: "#047857" }}>
                Attendance recorded in Nepal Standard Time.
              </div>
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "14px",
              fontSize: "12px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              border: "1px solid #a7f3d0",
            }}
          >
            <div>
              <span style={{ color: "#64748b" }}>Employee:</span>
              <div style={{ fontWeight: "700", color: "#0f172a" }}>
                {verifiedSummary.employeeName}
              </div>
            </div>
            <div>
              <span style={{ color: "#64748b" }}>Office Location:</span>
              <div style={{ fontWeight: "700", color: "#0f172a" }}>
                {verifiedSummary.officeName}
              </div>
            </div>
            <div>
              <span style={{ color: "#64748b" }}>Distance from Office:</span>
              <div style={{ fontWeight: "700", color: "#059669" }}>
                {verifiedSummary.distance}
              </div>
            </div>
            <div>
              <span style={{ color: "#64748b" }}>GPS Accuracy:</span>
              <div style={{ fontWeight: "700", color: "#2563eb" }}>
                ±{verifiedSummary.accuracy}m
              </div>
            </div>
            <div style={{ gridColumn: "span 2", borderTop: "1px solid #f1f5f9", paddingTop: "8px" }}>
              <span style={{ color: "#64748b" }}>Verified (NST):</span>
              <div style={{ fontWeight: "700", color: "#d97706" }}>
                {verifiedSummary.nepalTime}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── REAL LEAFLET MAP CONTAINER ──────────────────────────────── */}
      <div
        style={{
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid #cbd5e1",
          boxShadow: "0 8px 24px rgba(0,0,0,0.07)",
          marginBottom: "16px",
          position: "relative",
          background: "#e8edf2",
        }}
      >
        {/* Leaflet mounts here */}
        <div
          ref={mapContainerRef}
          style={{ width: "100%", height: "320px", zIndex: 1 }}
        />

        {/* Map legend overlay */}
        <div
          style={{
            position: "absolute",
            bottom: "10px",
            right: "10px",
            zIndex: 1000,
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(6px)",
            padding: "8px 12px",
            borderRadius: "10px",
            fontSize: "11px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            border: "1px solid rgba(0,0,0,0.07)",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            pointerEvents: "none",
          }}
        >
          {[
            { color: "#4f46e5", label: "CodeedLabs Office" },
            {
              color:
                gpsStatus === GPS_STATUS_STATES.INSIDE_GEOFENCE
                  ? "#10b981"
                  : "#f59e0b",
              label: "Your Location",
            },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontWeight: "600", color: "#334155" }}>{label}</span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "12px",
                height: "0px",
                borderTop: "2px dashed #10b981",
                flexShrink: 0,
              }}
            />
            <span style={{ fontWeight: "600", color: "#334155" }}>
              Geofence ({OFFICE_LOCATION.radiusMeters}m)
            </span>
          </div>
        </div>

        {/* Locating overlay */}
        {(gpsStatus === GPS_STATUS_STATES.LOCATING ||
          gpsStatus === GPS_STATUS_STATES.REQUESTING_PERMISSION) && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 999,
              background: "rgba(15,23,42,0.6)",
              backdropFilter: "blur(3px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                border: "3px solid rgba(56,189,248,0.25)",
                borderTop: "3px solid #38bdf8",
                borderRadius: "50%",
                animation: "easGpsSpinner 0.9s linear infinite",
                marginBottom: "12px",
              }}
            />
            <div style={{ fontSize: "14px", fontWeight: "700" }}>
              Acquiring your GPS location...
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
              Using high-accuracy device triangulation
            </div>
          </div>
        )}

        {/* IDLE overlay */}
        {gpsStatus === GPS_STATUS_STATES.IDLE && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 999,
              background: "rgba(15,23,42,0.55)",
              backdropFilter: "blur(2px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              gap: "10px",
            }}
          >
            <div style={{ fontSize: "40px" }}>📍</div>
            <div style={{ fontSize: "14px", fontWeight: "700" }}>
              GPS Geofence Verification
            </div>
            <div style={{ fontSize: "12px", color: "#94a3b8" }}>
              Location acquisition starting...
            </div>
          </div>
        )}
      </div>

      {/* ── GEOFENCE STATUS BANNER ───────────────────────────────────── */}
      <div
        style={{
          background: statusColors.bg,
          border: `1px solid ${statusColors.border}`,
          borderRadius: "14px",
          padding: "14px 18px",
          marginBottom: "14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
          <span style={{ fontSize: "24px", flexShrink: 0 }}>{statusColors.icon}</span>
          <div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: "800",
                color: statusColors.text,
              }}
            >
              {getStatusTitle()}
            </div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
              {statusMessage}
            </div>
          </div>
        </div>
        <button
          className="btn-secondary"
          onClick={acquireRealGpsLocation}
          disabled={
            gpsStatus === GPS_STATUS_STATES.LOCATING ||
            gpsStatus === GPS_STATUS_STATES.REQUESTING_PERMISSION
          }
          style={{ fontSize: "11px", padding: "7px 14px", flexShrink: 0 }}
        >
          {gpsStatus === GPS_STATUS_STATES.LOCATING ||
          gpsStatus === GPS_STATUS_STATES.REQUESTING_PERMISSION
            ? "Locating..."
            : "↻ Retry GPS"}
        </button>
      </div>

      {/* ── COORDINATES CARD ────────────────────────────────────────── */}
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "14px",
          padding: "14px 16px",
          marginBottom: "16px",
          fontSize: "12px",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          {/* Office info */}
          <div>
            <span style={{ color: "#64748b", fontWeight: "600" }}>
              Office Destination:
            </span>
            <div style={{ fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>
              {OFFICE_LOCATION.name}
            </div>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
              {OFFICE_LOCATION.latitude.toFixed(6)}° N,{" "}
              {OFFICE_LOCATION.longitude.toFixed(6)}° E
            </div>
            <div style={{ fontSize: "11px", color: "#059669", fontWeight: "600", marginTop: "2px" }}>
              Authorized radius: {OFFICE_LOCATION.radiusMeters}m
            </div>
          </div>

          {/* User location */}
          <div>
            <span style={{ color: "#64748b", fontWeight: "600" }}>
              Your Location:
            </span>
            <div style={{ fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>
              {coords
                ? `${coords.latitude.toFixed(6)}° N`
                : "Awaiting GPS..."}
            </div>
            {coords && (
              <div style={{ fontSize: "11px", color: "#64748b" }}>
                {coords.longitude.toFixed(6)}° E
              </div>
            )}
            <div style={{ fontSize: "11px", color: "#2563eb", fontWeight: "600", marginTop: "2px" }}>
              Accuracy: {coords ? `±${Math.round(coords.accuracy)}m` : "—"}
            </div>
            <div style={{ fontSize: "11px", color: "#d97706", fontWeight: "600", marginTop: "1px" }}>
              Distance: {distance !== null ? formatDistance(distance) : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* ── PUNCH IN BUTTON ─────────────────────────────────────────── */}
      <button
        className="btn-primary"
        onClick={handlePunchIn}
        disabled={!isPunchEnabled}
        style={{
          width: "100%",
          justifyContent: "center",
          padding: "16px",
          fontSize: "14px",
          background: isPunchEnabled
            ? "linear-gradient(135deg, #059669 0%, #10b981 100%)"
            : "#cbd5e1",
          color: isPunchEnabled ? "#fff" : "#64748b",
          boxShadow: isPunchEnabled
            ? "0 8px 20px rgba(16,185,129,0.35)"
            : "none",
          cursor: isPunchEnabled ? "pointer" : "not-allowed",
          transition: "all 0.25s ease",
          borderRadius: "12px",
          border: "none",
          fontWeight: "700",
        }}
      >
        {isCheckedIn
          ? "✓ Already Checked In Today"
          : isPunchEnabled
          ? "📍 Punch In via Verified GPS Geofence"
          : gpsStatus === GPS_STATUS_STATES.OUTSIDE_GEOFENCE
          ? "⚠ Outside Geofenced Area — Attendance Disabled"
          : gpsStatus === GPS_STATUS_STATES.LOCATING ||
            gpsStatus === GPS_STATUS_STATES.REQUESTING_PERMISSION
          ? "Acquiring GPS Position..."
          : "📍 GPS Geofence Verification Required"}
      </button>

      {/* ── EVALUATOR DEMO CONTROLS ──────────────────────────────────── */}
      <div
        style={{
          marginTop: "14px",
          padding: "10px 14px",
          background: "#f1f5f9",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          flexWrap: "wrap",
          fontSize: "11px",
        }}
      >
        <span style={{ color: "#475569", fontWeight: "600" }}>
          🧪 Evaluator Demo Simulation:
        </span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={() => handleToggleDemoMode("inside")}
            style={{
              padding: "4px 10px",
              background: "#fff",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              color: "#059669",
              fontSize: "11px",
            }}
          >
            Inside HQ (~25m)
          </button>
          <button
            type="button"
            onClick={() => handleToggleDemoMode("outside")}
            style={{
              padding: "4px 10px",
              background: "#fff",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              color: "#d97706",
              fontSize: "11px",
            }}
          >
            Outside HQ (~3km)
          </button>
        </div>
      </div>

      {/* ── Animation keyframes ──────────────────────────────────────── */}
      <style>{`
        @keyframes easMapPing {
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes easGpsSpinner {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes easGpsFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        /* Ensure Leaflet containers are properly stacked */
        .leaflet-container {
          z-index: 1 !important;
        }
        .leaflet-pane,
        .leaflet-tile-pane,
        .leaflet-overlay-pane,
        .leaflet-marker-pane {
          z-index: 1 !important;
        }
        .leaflet-control-container .leaflet-control {
          z-index: 800 !important;
        }
        .leaflet-popup-pane {
          z-index: 700 !important;
        }
      `}</style>
    </div>
  );
}

export default GPSGeofence;
