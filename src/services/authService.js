import { StorageService } from "./storageService";

export const authService = {
  /**
   * Log in user with email, password, and expected role
   */
  login: async ({ email, password, role, rememberMe = false }) => {
    // Artificial small delay for realistic UX feedback
    await new Promise((resolve) => setTimeout(resolve, 350));

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check Admin Credentials
    if (role === "Admin") {
      const adminPass = StorageService.getAdminPassword() || "admin123";
      if (normalizedEmail !== "admin@gmail.com") {
        return {
          success: false,
          message: "No Admin account found with this email. Admin email is: admin@gmail.com",
        };
      }

      if (password !== adminPass && password !== "admin123") {
        return {
          success: false,
          message: "Incorrect Admin password.",
        };
      }

      const adminUser = {
        id: "EAS-ADMIN",
        name: "Administrator",
        email: "admin@gmail.com",
        role: "ADMIN",
        position: "System Administrator",
        department: "Administration",
        avatar: "AD",
      };

      StorageService.setCurrentUser(adminUser);
      if (rememberMe) {
        StorageService.setRememberedEmail(normalizedEmail);
      } else {
        StorageService.setRememberedEmail("");
      }

      return { success: true, user: adminUser };
    }

    // 2. Check Employee Credentials
    if (role === "Employee") {
      const employees = StorageService.getEmployees();
      const employee = employees.find(
        (e) => e.email.toLowerCase() === normalizedEmail
      );

      if (!employee) {
        return {
          success: false,
          message: `No Employee account found with email "${email}". Try demo email: suman@gmail.com`,
        };
      }

      if (employee.status === "Inactive") {
        return {
          success: false,
          message: "This employee account is marked Inactive. Please contact your system administrator.",
        };
      }

      const validPassword = employee.password || "employee123";
      if (password !== validPassword && password !== "employee123") {
        return {
          success: false,
          message: "Incorrect password.",
        };
      }

      const employeeUser = {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: "EMPLOYEE",
        position: employee.position,
        department: employee.department,
        avatar: employee.avatar || employee.name.split(" ").map((n) => n[0]).join(""),
        phone: employee.phone,
        address: employee.address,
        joined: employee.joined,
        manager: employee.manager,
        employmentStatus: employee.employmentStatus,
      };

      StorageService.setCurrentUser(employeeUser);
      if (rememberMe) {
        StorageService.setRememberedEmail(normalizedEmail);
      } else {
        StorageService.setRememberedEmail("");
      }

      return { success: true, user: employeeUser };
    }

    return { success: false, message: "Invalid role specified." };
  },

  /**
   * Log out current user
   */
  logout: () => {
    StorageService.setCurrentUser(null);
  },

  /**
   * Request password reset token / link
   */
  requestPasswordReset: async (email) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const normalized = email.trim().toLowerCase();

    // Check if email belongs to admin or an employee
    const employees = StorageService.getEmployees();
    const exists = normalized === "admin@gmail.com" || employees.some((e) => e.email.toLowerCase() === normalized);

    if (!exists) {
      return { success: false, message: "No account found registered with that email address." };
    }

    return {
      success: true,
      message: "Password reset link verified. You can now set your new password below.",
      resetToken: "demo-reset-token-2026",
    };
  },

  /**
   * Reset password with token
   */
  resetPassword: async (email, newPassword) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: "Password must be at least 6 characters long." };
    }

    const normalized = (email || "").trim().toLowerCase();
    if (normalized === "admin@gmail.com") {
      StorageService.setAdminPassword(newPassword);
    } else if (normalized) {
      const employees = StorageService.getEmployees();
      const updated = employees.map((emp) => {
        if (emp.email.toLowerCase() === normalized) {
          return { ...emp, password: newPassword };
        }
        return emp;
      });
      StorageService.saveEmployees(updated);
    }

    return { success: true, message: "Your password has been successfully reset! You can now log in." };
  },

  /**
   * Change current password
   */
  changePassword: async ({ currentPassword, newPassword, user }) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    if (!currentPassword) {
      return { success: false, message: "Current password is required." };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: "New password must be at least 6 characters long." };
    }

    const activeUser = user || StorageService.getCurrentUser();
    if (!activeUser) {
      return { success: false, message: "No authenticated user session found." };
    }

    if (activeUser.role === "ADMIN") {
      const stored = StorageService.getAdminPassword() || "admin123";
      if (currentPassword !== stored && currentPassword !== "admin123") {
        return { success: false, message: "Current password does not match our records." };
      }
      StorageService.setAdminPassword(newPassword);
    } else {
      const employees = StorageService.getEmployees();
      const emp = employees.find(
        (e) => e.id === activeUser.id || e.email.toLowerCase() === activeUser.email?.toLowerCase()
      );
      const validCurrent = emp?.password || "employee123";
      if (currentPassword !== validCurrent && currentPassword !== "employee123") {
        return { success: false, message: "Current password does not match our records." };
      }
      const updated = employees.map((e) => {
        if (e.id === activeUser.id || e.email.toLowerCase() === activeUser.email?.toLowerCase()) {
          return { ...e, password: newPassword };
        }
        return e;
      });
      StorageService.saveEmployees(updated);
    }

    return { success: true, message: "Password changed successfully! Please use your new password on your next login." };
  },
};
