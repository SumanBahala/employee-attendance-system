/**
 * Geospatial distance utilities using the Haversine formula.
 */

const EARTH_RADIUS_METERS = 6371000; // Mean Earth radius in meters

/**
 * Calculates great-circle distance in meters between two lat/lng coordinates.
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in meters rounded to 1 decimal place
 */
export function calculateDistanceInMeters(lat1, lon1, lat2, lon2) {
  if (
    lat1 === undefined || lat1 === null ||
    lon1 === undefined || lon1 === null ||
    lat2 === undefined || lat2 === null ||
    lon2 === undefined || lon2 === null
  ) {
    return null;
  }

  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_METERS * c * 10) / 10;
}

/**
 * Checks whether user coordinates are within authorized geofence radius.
 * @param {number} userLat 
 * @param {number} userLng 
 * @param {number} officeLat 
 * @param {number} officeLng 
 * @param {number} radiusMeters 
 * @returns {boolean}
 */
export function checkIsWithinGeofence(userLat, userLng, officeLat, officeLng, radiusMeters = 250) {
  const distance = calculateDistanceInMeters(userLat, userLng, officeLat, officeLng);
  if (distance === null) return false;
  return distance <= radiusMeters;
}

/**
 * Formats meter distance into a human-readable string (e.g. "45 m" or "1.2 km")
 * @param {number} meters 
 * @returns {string}
 */
export function formatDistance(meters) {
  if (meters === null || meters === undefined || isNaN(meters)) return "—";
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}
