import {
  INITIAL_ATTENDANCE,
  INITIAL_DEPARTMENTS,
  INITIAL_DESIGNATIONS,
  INITIAL_EMPLOYEES,
  INITIAL_HOLIDAYS,
  INITIAL_LEAVE_BALANCES,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SCHEDULES,
  INITIAL_SETTINGS,
} from "./mockData";

const KEYS = {
  EMPLOYEES: "eas_employees",
  ATTENDANCE: "eas_attendance",
  LEAVE_REQUESTS: "eas_leave_requests",
  LEAVE_BALANCES: "eas_leave_balances",
  DEPARTMENTS: "eas_departments",
  DESIGNATIONS: "eas_designations",
  SCHEDULES: "eas_schedules",
  HOLIDAYS: "eas_holidays",
  NOTIFICATIONS: "eas_notifications",
  SETTINGS: "eas_settings",
  CURRENT_USER: "eas_current_user",
  REMEMBERED_EMAIL: "eas_remembered_email",
};

// Safe getItem with fallback
function getStoredItem(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return defaultValue;
  }
}

// Safe setItem
function setStoredItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to localStorage:`, err);
  }
}

export const StorageService = {
  // Employees
  getEmployees: () => getStoredItem(KEYS.EMPLOYEES, INITIAL_EMPLOYEES),
  saveEmployees: (data) => setStoredItem(KEYS.EMPLOYEES, data),
  getEmployeeById: (id) => {
    const list = StorageService.getEmployees();
    return list.find((e) => e.id === id || e.email === id);
  },

  // Attendance
  getAttendance: () => getStoredItem(KEYS.ATTENDANCE, INITIAL_ATTENDANCE),
  saveAttendance: (data) => setStoredItem(KEYS.ATTENDANCE, data),

  // Leaves
  getLeaveRequests: () => getStoredItem(KEYS.LEAVE_REQUESTS, INITIAL_LEAVE_REQUESTS),
  saveLeaveRequests: (data) => setStoredItem(KEYS.LEAVE_REQUESTS, data),
  getLeaveBalances: () => getStoredItem(KEYS.LEAVE_BALANCES, INITIAL_LEAVE_BALANCES),
  saveLeaveBalances: (data) => setStoredItem(KEYS.LEAVE_BALANCES, data),

  // Departments & Designations
  getDepartments: () => getStoredItem(KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS),
  saveDepartments: (data) => setStoredItem(KEYS.DEPARTMENTS, data),
  getDesignations: () => getStoredItem(KEYS.DESIGNATIONS, INITIAL_DESIGNATIONS),
  saveDesignations: (data) => setStoredItem(KEYS.DESIGNATIONS, data),

  // Schedules & Holidays
  getSchedules: () => getStoredItem(KEYS.SCHEDULES, INITIAL_SCHEDULES),
  saveSchedules: (data) => setStoredItem(KEYS.SCHEDULES, data),
  getHolidays: () => getStoredItem(KEYS.HOLIDAYS, INITIAL_HOLIDAYS),
  saveHolidays: (data) => setStoredItem(KEYS.HOLIDAYS, data),

  // Notifications
  getNotifications: () => getStoredItem(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS),
  saveNotifications: (data) => setStoredItem(KEYS.NOTIFICATIONS, data),

  // Settings
  getSettings: () => getStoredItem(KEYS.SETTINGS, INITIAL_SETTINGS),
  saveSettings: (data) => setStoredItem(KEYS.SETTINGS, data),

  // Auth User
  getCurrentUser: () => {
    try {
      const raw = localStorage.getItem(KEYS.CURRENT_USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setCurrentUser: (user) => {
    if (user) {
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(KEYS.CURRENT_USER);
    }
  },

  // Remembered Email
  getRememberedEmail: () => localStorage.getItem(KEYS.REMEMBERED_EMAIL) || "",
  setRememberedEmail: (email) => {
    if (email) {
      localStorage.setItem(KEYS.REMEMBERED_EMAIL, email);
    } else {
      localStorage.removeItem(KEYS.REMEMBERED_EMAIL);
    }
  },

  // Admin Password
  getAdminPassword: () => localStorage.getItem("eas_admin_password") || "admin123",
  setAdminPassword: (pw) => {
    if (pw) {
      localStorage.setItem("eas_admin_password", pw);
    } else {
      localStorage.removeItem("eas_admin_password");
    }
  },

  // Reset all data to factory demo defaults
  resetToDefaults: () => {
    localStorage.removeItem("eas_admin_password");
    setStoredItem(KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    setStoredItem(KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    setStoredItem(KEYS.LEAVE_REQUESTS, INITIAL_LEAVE_REQUESTS);
    setStoredItem(KEYS.LEAVE_BALANCES, INITIAL_LEAVE_BALANCES);
    setStoredItem(KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    setStoredItem(KEYS.DESIGNATIONS, INITIAL_DESIGNATIONS);
    setStoredItem(KEYS.SCHEDULES, INITIAL_SCHEDULES);
    setStoredItem(KEYS.HOLIDAYS, INITIAL_HOLIDAYS);
    setStoredItem(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    setStoredItem(KEYS.SETTINGS, INITIAL_SETTINGS);
  },
};
