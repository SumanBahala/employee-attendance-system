// EAS Office Location Configuration
// Update latitude, longitude, and radiusMeters here to reconfigure the official geofence.

export const OFFICE_LOCATION = {
  name: "CodeedLabs HQ",
  organization: "CodeedLabs",
  city: "Kathmandu",
  country: "Nepal",
  address: "New Baneshwor, Kathmandu, Nepal",
  // Official office coordinates (configurable)
  latitude: 27.6915,
  longitude: 85.3420,
  // Authorized geofence radius in meters
  radiusMeters: 250,
  // Recommended accuracy threshold (in meters) for valid attendance
  maxAccuracyMeters: 150,
  timezone: "Asia/Kathmandu",
};

export default OFFICE_LOCATION;
