// Nepal (Asia/Kathmandu) Timezone Utilities

export const NEPAL_TIMEZONE = "Asia/Kathmandu";

/**
 * Returns formatted Nepal current date and time string
 */
export function getNepalDateTimeString(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const day = new Intl.DateTimeFormat("en-GB", { timeZone: NEPAL_TIMEZONE, day: "numeric" }).format(d);
  const month = new Intl.DateTimeFormat("en-GB", { timeZone: NEPAL_TIMEZONE, month: "long" }).format(d);
  const year = new Intl.DateTimeFormat("en-GB", { timeZone: NEPAL_TIMEZONE, year: "numeric" }).format(d);
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: NEPAL_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(d);
  return `${day} ${month} ${year}, ${time}`;
}

/**
 * Returns formatted Nepal date (e.g., "Wednesday, September 30, 2026")
 */
export function getNepalDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: NEPAL_TIMEZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Returns formatted Nepal time (e.g., "09:30:15 AM")
 */
export function getNepalTimeString(date = new Date(), includeSeconds = true) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: NEPAL_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: includeSeconds ? "2-digit" : undefined,
    hour12: true,
  }).format(date);
}

/**
 * Returns ISO date in Nepal timezone (YYYY-MM-DD)
 */
export function getNepalISODate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: NEPAL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return parts; // Returns YYYY-MM-DD
}

/**
 * Calculate working hours between check-in and check-out strings (e.g. "09:05 AM" to "05:15 PM")
 */
export function calculateWorkingHours(checkInTime, checkOutTime) {
  if (!checkInTime) return "0h 0m";
  if (!checkOutTime || checkOutTime === "—") return "In Progress";

  try {
    const parseTime = (timeStr) => {
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return null;
      let [_, h, m, meridiem] = match;
      h = parseInt(h, 10);
      m = parseInt(m, 10);
      if (meridiem.toUpperCase() === "PM" && h < 12) h += 12;
      if (meridiem.toUpperCase() === "AM" && h === 12) h = 0;
      return h * 60 + m;
    };

    const startMinutes = parseTime(checkInTime);
    const endMinutes = parseTime(checkOutTime);

    if (startMinutes === null || endMinutes === null || endMinutes < startMinutes) {
      return "—";
    }

    const diff = endMinutes - startMinutes;
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours}h ${minutes}m`;
  } catch {
    return "—";
  }
}
