/**
 * Geolocation Service for EAS
 * Provides real-time GPS acquisition, accuracy checks, watchPosition tracking,
 * and standard error categorization.
 */

export const GPS_ERROR_CODES = {
  UNSUPPORTED: "UNSUPPORTED",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  POSITION_UNAVAILABLE: "POSITION_UNAVAILABLE",
  TIMEOUT: "TIMEOUT",
  LOW_ACCURACY: "LOW_ACCURACY",
  UNKNOWN: "UNKNOWN",
};

/**
 * Maps GeolocationPositionError to EAS user-facing messages and codes
 * @param {GeolocationPositionError} err 
 * @returns {{ code: string, message: string }}
 */
export function parseGeolocationError(err) {
  if (!err) {
    return {
      code: GPS_ERROR_CODES.UNKNOWN,
      message: "An unknown GPS error occurred. Please try again.",
    };
  }

  switch (err.code) {
    case 1: // PERMISSION_DENIED
      return {
        code: GPS_ERROR_CODES.PERMISSION_DENIED,
        message: "Location permission denied. Please allow location access in your browser settings.",
      };
    case 2: // POSITION_UNAVAILABLE
      return {
        code: GPS_ERROR_CODES.POSITION_UNAVAILABLE,
        message: "Unable to determine your current location. Satellites / cellular towers unreachable.",
      };
    case 3: // TIMEOUT
      return {
        code: GPS_ERROR_CODES.TIMEOUT,
        message: "GPS request timed out. Please check your signal and try again.",
      };
    default:
      return {
        code: GPS_ERROR_CODES.UNKNOWN,
        message: err.message || "Failed to acquire location. Please try again.",
      };
  }
}

/**
 * Checks if Geolocation API is available in browser
 * @returns {boolean}
 */
export function isGeolocationSupported() {
  return typeof window !== "undefined" && "geolocation" in navigator;
}

/**
 * Queries current permission state using the Permissions API if supported
 * @returns {Promise<PermissionState|'prompt'>} 'granted' | 'denied' | 'prompt'
 */
export async function queryLocationPermission() {
  if (typeof navigator !== "undefined" && navigator.permissions && navigator.permissions.query) {
    try {
      const status = await navigator.permissions.query({ name: "geolocation" });
      return status.state; // 'granted', 'denied', or 'prompt'
    } catch {
      return "prompt";
    }
  }
  return "prompt";
}

/**
 * Single-shot high-accuracy position acquisition
 * @param {PositionOptions} customOptions 
 * @returns {Promise<{ latitude: number, longitude: number, accuracy: number, timestamp: number }>}
 */
export function getCurrentPosition(customOptions = {}) {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject({
        code: GPS_ERROR_CODES.UNSUPPORTED,
        message: "Your browser does not support location services.",
      });
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
      ...customOptions,
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy || 0),
          altitude: pos.coords.altitude,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
        });
      },
      (err) => {
        reject(parseGeolocationError(err));
      },
      options
    );
  });
}

/**
 * Continuous watch tracking with watchPosition
 * @param {Function} onPosition 
 * @param {Function} onError 
 * @param {PositionOptions} customOptions 
 * @returns {number|null} watchId
 */
export function watchPosition(onPosition, onError, customOptions = {}) {
  if (!isGeolocationSupported()) {
    if (onError) {
      onError({
        code: GPS_ERROR_CODES.UNSUPPORTED,
        message: "Your browser does not support location services.",
      });
    }
    return null;
  }

  const options = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0,
    ...customOptions,
  };

  try {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (onPosition) {
          onPosition({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy || 0),
            timestamp: pos.timestamp,
          });
        }
      },
      (err) => {
        if (onError) {
          onError(parseGeolocationError(err));
        }
      },
      options
    );
    return watchId;
  } catch (error) {
    console.error("Error setting up watchPosition:", error);
    if (onError) {
      onError(parseGeolocationError(error));
    }
    return null;
  }
}

/**
 * Clears an active watchPosition listener
 * @param {number|null} watchId 
 */
export function clearWatch(watchId) {
  if (watchId !== null && isGeolocationSupported()) {
    try {
      navigator.geolocation.clearWatch(watchId);
    } catch (e) {
      console.warn("Failed to clear geolocation watch:", e);
    }
  }
}

export const GeolocationService = {
  isGeolocationSupported,
  queryLocationPermission,
  getCurrentPosition,
  watchPosition,
  clearWatch,
  parseGeolocationError,
  GPS_ERROR_CODES,
};

export default GeolocationService;
