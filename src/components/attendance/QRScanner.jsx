import React, { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { validateEmployeeQR } from "../../services/qrService";
import { getNepalDateTimeString, getNepalTimeString } from "../../utils/dateTimeUtils";

export const QR_SCAN_STATES = {
  IDLE: "IDLE",
  REQUESTING_CAMERA: "REQUESTING_CAMERA",
  SCANNING: "SCANNING",
  QR_DETECTED: "QR_DETECTED",
  VERIFYING: "VERIFYING",
  SUCCESS: "SUCCESS",
  INVALID: "INVALID",
  EXPIRED: "EXPIRED",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  ERROR: "ERROR",
};

// Unique DOM id to mount the html5-qrcode scanner
const QR_READER_ID = "eas-qr-reader-container";

/**
 * Real-time continuous QR Scanner using html5-qrcode (html5-qrcode library)
 * Properly handles camera lifecycle, permission states, QR validation,
 * and cleanup on unmount / method change.
 */
export function QRScanner({
  currentUser,
  isCheckedIn,
  onScanSuccess,
  onSwitchToManual,
}) {
  const [scanState, setScanState] = useState(QR_SCAN_STATES.IDLE);
  const [errorMessage, setErrorMessage] = useState("");
  const [verifiedData, setVerifiedData] = useState(null);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [facingMode, setFacingMode] = useState("environment");

  // Refs so callbacks always access latest values without re-render loops
  const scannerRef = useRef(null);
  const isScanningRef = useRef(false);
  const isCooldownRef = useRef(false);
  const scanStateRef = useRef(QR_SCAN_STATES.IDLE);

  // Keep scanStateRef in sync
  useEffect(() => {
    scanStateRef.current = scanState;
  }, [scanState]);

  // Cleanup on unmount or when user navigates away
  useEffect(() => {
    return () => {
      performHardStop();
    };
  }, []);

  /**
   * Hard stop: terminates all video tracks immediately (turns off camera LED)
   * and destroys the html5-qrcode instance.
   */
  const performHardStop = async () => {
    isScanningRef.current = false;

    // Kill all active media stream tracks in the container
    try {
      const container = document.getElementById(QR_READER_ID);
      if (container) {
        const videos = container.querySelectorAll("video");
        videos.forEach((video) => {
          if (video && video.srcObject) {
            const stream = video.srcObject;
            stream.getTracks().forEach((track) => {
              try { track.stop(); } catch (_) {}
            });
            video.srcObject = null;
          }
        });
      }
    } catch (_) {}

    // Stop and clear the html5-qrcode scanner instance
    if (scannerRef.current) {
      try {
        const scanner = scannerRef.current;
        scannerRef.current = null;
        if (scanner.isScanning) {
          await scanner.stop();
        }
        scanner.clear();
      } catch (e) {
        console.warn("Scanner stop warning:", e);
      }
    }
  };

  /**
   * User-initiated stop: stops scanner and returns to IDLE
   */
  const handleStopCamera = async () => {
    await performHardStop();
    setScanState(QR_SCAN_STATES.IDLE);
    setErrorMessage("");
  };

  /**
   * Start the real camera QR scanner
   */
  const startCamera = useCallback(async (cameraIdOverride = "") => {
    // Don't start if already running
    if (isScanningRef.current) {
      await performHardStop();
      await new Promise((r) => setTimeout(r, 200));
    }

    setScanState(QR_SCAN_STATES.REQUESTING_CAMERA);
    setErrorMessage("");
    setVerifiedData(null);
    isCooldownRef.current = false;

    // Give React time to render the container div before mounting scanner
    await new Promise((r) => setTimeout(r, 150));

    try {
      const html5QrCode = new Html5Qrcode(QR_READER_ID, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scannerRef.current = html5QrCode;

      // Enumerate cameras after user initiates (respects permission requirement)
      let cameraId = cameraIdOverride || selectedCameraId;
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setAvailableCameras(devices);
          if (!cameraId) {
            // Prefer back/rear camera on mobile
            const backCam = devices.find((d) =>
              /back|rear|environment/i.test(d.label)
            );
            cameraId = backCam ? backCam.id : devices[0].id;
            setSelectedCameraId(cameraId);
          }
        }
      } catch {
        // Camera enumeration may fail on some browsers before permission is granted; use facingMode fallback
      }

      const cameraConfig = cameraId
        ? { deviceId: { exact: cameraId } }
        : { facingMode };

      // Responsive qrbox size: 75% of the smaller dimension
      const qrConfig = {
        fps: 10,
        qrbox: (vfWidth, vfHeight) => {
          const edge = Math.min(vfWidth, vfHeight);
          const size = Math.max(160, Math.floor(edge * 0.72));
          return { width: size, height: size };
        },
        aspectRatio: 1.0,
        disableFlip: false,
        // Suppress the default html5-qrcode controls/buttons UI
        showTorchButtonIfSupported: false,
      };

      await html5QrCode.start(
        cameraConfig,
        qrConfig,
        onQrCodeDetected,
        () => { /* per-frame error — normal during scanning */ }
      );

      // Hide the default html5-qrcode header/close button (they are injected into DOM)
      suppressHtml5QrcodeDefaultUI();

      isScanningRef.current = true;
      setScanState(QR_SCAN_STATES.SCANNING);
    } catch (err) {
      console.error("Camera start error:", err);
      isScanningRef.current = false;
      scannerRef.current = null;
      await performHardStop();

      const errStr = String(err).toLowerCase();
      if (
        errStr.includes("notallowed") ||
        errStr.includes("permission") ||
        errStr.includes("denied")
      ) {
        setScanState(QR_SCAN_STATES.PERMISSION_DENIED);
        setErrorMessage("Camera access was denied.");
      } else if (errStr.includes("notfound") || errStr.includes("no camera")) {
        setScanState(QR_SCAN_STATES.ERROR);
        setErrorMessage("No camera device found. Please connect a camera.");
      } else if (errStr.includes("https") || errStr.includes("secure")) {
        setScanState(QR_SCAN_STATES.ERROR);
        setErrorMessage(
          "Camera requires a secure connection (HTTPS or localhost)."
        );
      } else {
        setScanState(QR_SCAN_STATES.ERROR);
        setErrorMessage(
          err.message ||
            "Failed to start camera. Make sure it is not in use by another app."
        );
      }
    }
  }, [selectedCameraId, facingMode]);

  /**
   * Remove the default html5-qrcode injected UI elements (header bar, close/stop buttons)
   * so our custom overlay is the only UI.
   */
  const suppressHtml5QrcodeDefaultUI = () => {
    setTimeout(() => {
      const container = document.getElementById(QR_READER_ID);
      if (!container) return;

      // Hide the "Scan QR Code" header bar
      const h2Elements = container.querySelectorAll("div[style*='padding-top']");
      h2Elements.forEach((el) => {
        if (el.textContent.trim().startsWith("Scan") || el.querySelector("img")) {
          el.style.display = "none";
        }
      });

      // Hide button row typically at bottom of the default UI
      const btns = container.querySelectorAll("button");
      btns.forEach((btn) => {
        if (!btn.id || !btn.id.startsWith("eas-custom")) {
          btn.style.display = "none";
        }
      });

      // Remove img icons injected by html5-qrcode
      const imgs = container.querySelectorAll("img");
      imgs.forEach((img) => img.remove());
    }, 200);
  };

  /**
   * Called by html5-qrcode when it successfully decodes a QR frame
   */
  const onQrCodeDetected = async (decodedText) => {
    // Guard: prevent duplicate processing during cooldown or non-scanning state
    if (isCooldownRef.current || !isScanningRef.current) return;
    isCooldownRef.current = true;

    setScanState(QR_SCAN_STATES.QR_DETECTED);

    // Immediately stop the camera stream
    await performHardStop();

    setScanState(QR_SCAN_STATES.VERIFYING);

    try {
      const validation = await validateEmployeeQR(decodedText, currentUser);

      if (!validation.valid) {
        if (validation.errorType === "EXPIRED") {
          setScanState(QR_SCAN_STATES.EXPIRED);
          setErrorMessage(
            validation.message || "QR Code Expired. Please refresh your badge."
          );
        } else {
          setScanState(QR_SCAN_STATES.INVALID);
          setErrorMessage(
            validation.message ||
              "Invalid EAS QR Code. Attendance was not marked."
          );
        }
        // Allow re-scanning after 2 seconds
        setTimeout(() => {
          isCooldownRef.current = false;
        }, 2000);
        return;
      }

      // QR is valid!
      const employee = validation.employee || currentUser;
      const successPayload = {
        employee,
        office: "CodeedLabs",
        timeNepal: getNepalDateTimeString(new Date()),
        timeShort: getNepalTimeString(new Date(), false),
        qrPayload: validation.payload,
        mode: validation.mode,
      };

      setVerifiedData(successPayload);
      setScanState(QR_SCAN_STATES.SUCCESS);

      // Notify parent to mark attendance
      if (onScanSuccess) {
        onScanSuccess({
          qrData: validation.payload,
          employee,
        });
      }
    } catch (err) {
      console.error("QR verification error:", err);
      setScanState(QR_SCAN_STATES.ERROR);
      setErrorMessage("System error during verification. Please try again.");
      setTimeout(() => {
        isCooldownRef.current = false;
      }, 2000);
    }
  };

  /**
   * Developer/demo helper: simulate a valid terminal QR scan without real camera
   */
  const handleTestTerminalQR = async () => {
    if (isCheckedIn) return;
    const samplePayload = JSON.stringify({
      type: "EAS_TERMINAL",
      version: "1.0",
      terminalId: "TERM-KTM-01",
      terminalName: "Gate 1 - Reception Terminal",
      office: "CodeedLabs HQ",
      token: `eas_term_ktm_${new Date().toISOString().split("T")[0]}_sec`,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    });
    await onQrCodeDetected(samplePayload);
  };

  /**
   * Flip between front and back cameras (mobile)
   */
  const handleFlipCamera = async () => {
    if (availableCameras.length < 2) return;
    const currentIndex = availableCameras.findIndex(
      (c) => c.id === selectedCameraId
    );
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextCamera = availableCameras[nextIndex];
    setSelectedCameraId(nextCamera.id);
    await performHardStop();
    startCamera(nextCamera.id);
  };

  // ─── Render helpers ───────────────────────────────────────────────────────

  const isInTerminalOrError =
    scanState === QR_SCAN_STATES.SUCCESS ||
    scanState === QR_SCAN_STATES.PERMISSION_DENIED;

  const showViewfinder =
    !isInTerminalOrError &&
    scanState !== QR_SCAN_STATES.INVALID &&
    scanState !== QR_SCAN_STATES.EXPIRED;

  return (
    <div
      style={{
        background: "radial-gradient(ellipse at top, #0f172a 0%, #020617 100%)",
        borderRadius: "18px",
        padding: "24px 20px",
        textAlign: "center",
        color: "#ffffff",
        boxShadow: "0 16px 36px -10px rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.08)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── SUCCESS STATE ──────────────────────────────────────────────── */}
      {scanState === QR_SCAN_STATES.SUCCESS && verifiedData && (
        <div
          style={{
            background:
              "linear-gradient(180deg, rgba(16,185,129,0.15) 0%, rgba(6,78,59,0.3) 100%)",
            border: "1px solid #10b981",
            borderRadius: "16px",
            padding: "24px 20px",
            animation: "easFadeIn 0.35s ease",
          }}
        >
          {/* Checkmark */}
          <div
            style={{
              width: "64px",
              height: "64px",
              margin: "0 auto 16px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #10b981, #059669)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "30px",
              boxShadow: "0 0 28px rgba(16,185,129,0.6)",
            }}
          >
            ✓
          </div>

          <div
            style={{
              fontSize: "13px",
              fontWeight: "800",
              color: "#34d399",
              letterSpacing: "2.5px",
              marginBottom: "18px",
            }}
          >
            QR VERIFIED
          </div>

          {/* Info grid */}
          <div
            style={{
              background: "rgba(15,23,42,0.75)",
              borderRadius: "12px",
              padding: "16px",
              fontSize: "13px",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: "9px",
              marginBottom: "20px",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {[
              ["Employee", verifiedData.employee?.name || currentUser?.name],
              ["Employee ID", verifiedData.employee?.id || currentUser?.id, "#38bdf8"],
              ["Office", "CodeedLabs"],
              ["Time (NST)", verifiedData.timeNepal, "#fbbf24"],
            ].map(([label, value, color]) => (
              <div
                key={label}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}
              >
                <span style={{ color: "#94a3b8", flexShrink: 0 }}>{label}:</span>
                <strong style={{ color: color || "#ffffff", textAlign: "right" }}>
                  {value}
                </strong>
              </div>
            ))}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderTop: "1px solid rgba(255,255,255,0.1)",
                paddingTop: "8px",
              }}
            >
              <span style={{ color: "#94a3b8" }}>Attendance:</span>
              <strong style={{ color: "#34d399" }}>✓ Checked In</strong>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="btn-primary"
              onClick={() => {
                setVerifiedData(null);
                startCamera();
              }}
              style={{
                flex: 1,
                padding: "12px",
                fontSize: "13px",
                background: "linear-gradient(135deg, #2563eb, #4f46e5)",
                justifyContent: "center",
              }}
            >
              🔄 Scan Again
            </button>
            <button
              onClick={onSwitchToManual}
              style={{
                flex: 1,
                padding: "12px",
                background: "rgba(255,255,255,0.1)",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              🖐️ Manual Punch
            </button>
          </div>
        </div>
      )}

      {/* ── PERMISSION DENIED ─────────────────────────────────────────── */}
      {scanState === QR_SCAN_STATES.PERMISSION_DENIED && (
        <div
          style={{
            background: "rgba(239,68,68,0.15)",
            border: "1px solid #ef4444",
            borderRadius: "16px",
            padding: "28px 20px",
            animation: "easFadeIn 0.3s ease",
          }}
        >
          <div style={{ fontSize: "44px", marginBottom: "12px" }}>🚫</div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: "800",
              color: "#fca5a5",
              marginBottom: "10px",
            }}
          >
            Camera access was denied.
          </div>
          <p
            style={{
              fontSize: "13px",
              color: "#cbd5e1",
              margin: "0 auto 20px",
              maxWidth: "360px",
              lineHeight: "1.6",
            }}
          >
            To use QR scanning, please allow camera access. Look for the 🔒
            padlock or 📷 camera icon in your browser address bar and enable
            Camera permissions, then click <strong>Try Again</strong>.
          </p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button
              className="btn-primary"
              onClick={() => startCamera()}
              style={{
                padding: "11px 22px",
                fontSize: "13px",
                background: "#ef4444",
                border: "none",
              }}
            >
              🔄 Try Again
            </button>
            <button
              onClick={onSwitchToManual}
              style={{
                padding: "11px 18px",
                background: "rgba(255,255,255,0.1)",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Use Manual Punch
            </button>
          </div>
        </div>
      )}

      {/* ── INVALID / EXPIRED QR ─────────────────────────────────────── */}
      {(scanState === QR_SCAN_STATES.INVALID ||
        scanState === QR_SCAN_STATES.EXPIRED) && (
        <div
          style={{
            background: "rgba(245,158,11,0.15)",
            border: "1px solid #f59e0b",
            borderRadius: "16px",
            padding: "24px 20px",
            marginBottom: "16px",
            animation: "easFadeIn 0.3s ease",
          }}
        >
          <div style={{ fontSize: "44px", marginBottom: "12px" }}>
            {scanState === QR_SCAN_STATES.EXPIRED ? "⏳" : "⚠️"}
          </div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: "800",
              color: "#fcd34d",
              marginBottom: "8px",
            }}
          >
            {scanState === QR_SCAN_STATES.EXPIRED
              ? "QR Code Expired"
              : "Invalid EAS QR Code"}
          </div>
          <p
            style={{
              fontSize: "13px",
              color: "#cbd5e1",
              margin: "0 auto 20px",
              maxWidth: "360px",
              lineHeight: "1.5",
            }}
          >
            {errorMessage ||
              "Attendance was not marked. Please scan an authorized CodeedLabs terminal or refresh your badge."}
          </p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button
              className="btn-primary"
              onClick={() => startCamera()}
              style={{
                padding: "10px 20px",
                fontSize: "13px",
                background: "#f59e0b",
                border: "none",
              }}
            >
              🔄 Scan Again
            </button>
            <button
              onClick={onSwitchToManual}
              style={{
                padding: "10px 18px",
                background: "rgba(255,255,255,0.1)",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Manual Punch
            </button>
          </div>
        </div>
      )}

      {/* ── GENERAL ERROR ─────────────────────────────────────────────── */}
      {scanState === QR_SCAN_STATES.ERROR && (
        <div
          style={{
            background: "rgba(239,68,68,0.15)",
            border: "1px solid #ef4444",
            borderRadius: "14px",
            padding: "20px",
            marginBottom: "14px",
            animation: "easFadeIn 0.3s ease",
          }}
        >
          <div style={{ fontSize: "28px", marginBottom: "8px" }}>❌</div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "700",
              color: "#fca5a5",
              marginBottom: "12px",
            }}
          >
            {errorMessage || "Scanner encountered an error."}
          </div>
          <button
            onClick={() => startCamera()}
            style={{
              padding: "9px 18px",
              background: "#ef4444",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            🔄 Retry Camera
          </button>
        </div>
      )}

      {/* ── VIEWFINDER + CONTROLS (IDLE / REQUESTING / SCANNING / VERIFYING) ── */}
      {showViewfinder && (
        <div>
          {/* Camera viewfinder frame */}
          <div
            style={{
              width: "100%",
              maxWidth: "300px",
              aspectRatio: "1",
              margin: "0 auto 20px",
              position: "relative",
              borderRadius: "18px",
              overflow: "hidden",
              border: "2px solid rgba(56,189,248,0.35)",
              background: "#000",
              boxShadow:
                scanState === QR_SCAN_STATES.SCANNING
                  ? "0 0 0 1px rgba(56,189,248,0.2), 0 0 24px rgba(56,189,248,0.15)"
                  : "none",
            }}
          >
            {/* html5-qrcode mounts the actual <video> element here */}
            <div
              id={QR_READER_ID}
              style={{
                width: "100%",
                height: "100%",
                position: "absolute",
                inset: 0,
                // Only visible while scanning; hidden otherwise to avoid flicker
                opacity: scanState === QR_SCAN_STATES.SCANNING ? 1 : 0,
                transition: "opacity 0.3s ease",
              }}
            />

            {/* Standby / loading placeholder shown when not actively scanning */}
            {scanState !== QR_SCAN_STATES.SCANNING && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    scanState === QR_SCAN_STATES.REQUESTING_CAMERA ||
                    scanState === QR_SCAN_STATES.VERIFYING ||
                    scanState === QR_SCAN_STATES.QR_DETECTED
                      ? "rgba(15,23,42,0.92)"
                      : "rgba(15,23,42,0.88)",
                  padding: "20px",
                  zIndex: 5,
                }}
              >
                {/* Spinner for loading states */}
                {(scanState === QR_SCAN_STATES.REQUESTING_CAMERA ||
                  scanState === QR_SCAN_STATES.VERIFYING ||
                  scanState === QR_SCAN_STATES.QR_DETECTED) ? (
                  <>
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        border: "3px solid rgba(56,189,248,0.25)",
                        borderTop: "3px solid #38bdf8",
                        borderRadius: "50%",
                        animation: "easSpin 0.8s linear infinite",
                        marginBottom: "14px",
                      }}
                    />
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "#38bdf8",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {scanState === QR_SCAN_STATES.REQUESTING_CAMERA
                        ? "Requesting camera access..."
                        : scanState === QR_SCAN_STATES.QR_DETECTED
                        ? "QR Code Detected!"
                        : "Verifying QR Payload..."}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#64748b",
                        marginTop: "6px",
                      }}
                    >
                      {scanState === QR_SCAN_STATES.REQUESTING_CAMERA
                        ? "Please grant permission in browser prompt"
                        : "Please wait..."}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Idle state icon */}
                    <div
                      style={{
                        fontSize: "48px",
                        marginBottom: "12px",
                        filter: "drop-shadow(0 0 12px rgba(56,189,248,0.3))",
                      }}
                    >
                      📷
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "#38bdf8",
                      }}
                    >
                      Camera Ready
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#64748b",
                        marginTop: "4px",
                      }}
                    >
                      Click button below to begin
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Corner reticle brackets (always visible) ─────────── */}
            {[
              { top: "12px", left: "12px", borderTop: "3px solid #38bdf8", borderLeft: "3px solid #38bdf8", borderRadius: "4px 0 0 0" },
              { top: "12px", right: "12px", borderTop: "3px solid #38bdf8", borderRight: "3px solid #38bdf8", borderRadius: "0 4px 0 0" },
              { bottom: "12px", left: "12px", borderBottom: "3px solid #38bdf8", borderLeft: "3px solid #38bdf8", borderRadius: "0 0 0 4px" },
              { bottom: "12px", right: "12px", borderBottom: "3px solid #38bdf8", borderRight: "3px solid #38bdf8", borderRadius: "0 0 4px 0" },
            ].map((style, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: "26px",
                  height: "26px",
                  pointerEvents: "none",
                  zIndex: 10,
                  ...style,
                }}
              />
            ))}

            {/* ── Animated laser scanline ─────────────────────────── */}
            {scanState === QR_SCAN_STATES.SCANNING && (
              <div
                style={{
                  position: "absolute",
                  left: "14px",
                  right: "14px",
                  height: "2px",
                  background:
                    "linear-gradient(90deg, transparent 0%, #10b981 50%, transparent 100%)",
                  boxShadow: "0 0 12px #10b981, 0 0 20px #34d399",
                  animation: "easLaserScan 2s ease-in-out infinite alternate",
                  pointerEvents: "none",
                  zIndex: 10,
                }}
              />
            )}

            {/* ── Camera status badge ─────────────────────────────── */}
            <div
              style={{
                position: "absolute",
                bottom: "10px",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(4px)",
                padding: "4px 10px",
                borderRadius: "20px",
                pointerEvents: "none",
                zIndex: 15,
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background:
                    scanState === QR_SCAN_STATES.SCANNING
                      ? "#10b981"
                      : "#64748b",
                  boxShadow:
                    scanState === QR_SCAN_STATES.SCANNING
                      ? "0 0 6px #10b981"
                      : "none",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: "800",
                  color:
                    scanState === QR_SCAN_STATES.SCANNING ? "#10b981" : "#64748b",
                  letterSpacing: "1.2px",
                }}
              >
                {scanState === QR_SCAN_STATES.SCANNING
                  ? "SCANNING..."
                  : "STANDBY"}
              </span>
            </div>
          </div>

          {/* Instruction */}
          <p
            style={{
              fontSize: "13px",
              color: "#94a3b8",
              margin: "0 auto 20px",
              maxWidth: "340px",
              lineHeight: "1.55",
            }}
          >
            {scanState === QR_SCAN_STATES.SCANNING
              ? "Hold the CodeedLabs Office Terminal QR steady inside the brackets."
              : "Click the button below, then align the office terminal QR code within the viewfinder."}
          </p>

          {/* ── Action buttons ─────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {scanState !== QR_SCAN_STATES.SCANNING ? (
              <button
                className="btn-primary"
                onClick={() => startCamera()}
                disabled={
                  isCheckedIn ||
                  scanState === QR_SCAN_STATES.REQUESTING_CAMERA ||
                  scanState === QR_SCAN_STATES.QR_DETECTED ||
                  scanState === QR_SCAN_STATES.VERIFYING
                }
                style={{
                  width: "100%",
                  justifyContent: "center",
                  padding: "14px",
                  fontSize: "14px",
                  background:
                    isCheckedIn
                      ? "#475569"
                      : "linear-gradient(135deg, #2563eb, #4f46e5)",
                  boxShadow: isCheckedIn
                    ? "none"
                    : "0 8px 20px rgba(37,99,235,0.35)",
                  transition: "all 0.2s ease",
                }}
              >
                {isCheckedIn
                  ? "✓ Already Checked In Today"
                  : "📸 Start QR Scanner"}
              </button>
            ) : (
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={handleStopCamera}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#ef4444",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: "pointer",
                    transition: "background 0.2s ease",
                  }}
                >
                  ⏹ Stop Scanner
                </button>

                {availableCameras.length > 1 && (
                  <button
                    onClick={handleFlipCamera}
                    style={{
                      padding: "12px 16px",
                      background: "rgba(255,255,255,0.1)",
                      color: "#ffffff",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "10px",
                      fontSize: "13px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                    title="Switch Camera"
                  >
                    🔄 Flip
                  </button>
                )}
              </div>
            )}

            {/* Demo / testing helper */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={handleTestTerminalQR}
                disabled={isCheckedIn}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  fontSize: "11px",
                  textDecoration: "underline",
                  cursor: isCheckedIn ? "not-allowed" : "pointer",
                  opacity: isCheckedIn ? 0.5 : 1,
                }}
              >
                ⚡ Test: Simulate Valid Terminal QR
              </button>
              <span style={{ color: "#334155" }}>•</span>
              <button
                type="button"
                onClick={onSwitchToManual}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  fontSize: "11px",
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                Use Manual Punch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Keyframe animations ─────────────────────────────────────────── */}
      <style>{`
        @keyframes easLaserScan {
          0%   { top: 14px; }
          100% { top: calc(100% - 18px); }
        }
        @keyframes easSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes easFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        /* Strip default html5-qrcode UI injections */
        #${QR_READER_ID} > div:first-child {
          display: none !important;
        }
        #${QR_READER_ID} img {
          display: none !important;
        }
        #${QR_READER_ID} button {
          display: none !important;
        }
        #${QR_READER_ID} select {
          display: none !important;
        }
        #${QR_READER_ID} br {
          display: none !important;
        }
        /* Make the video fill the container */
        #${QR_READER_ID} video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 0 !important;
        }
        /* Hide any injected border */
        #${QR_READER_ID} > div {
          border: none !important;
        }
      `}</style>
    </div>
  );
}

export default QRScanner;
