import React, { createContext, useContext, useEffect, useState } from "react";
import { authService } from "../services/authService";
import { StorageService } from "../services/storageService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rememberedEmail, setRememberedEmail] = useState("");

  useEffect(() => {
    // Restore session on mount
    try {
      const storedUser = StorageService.getCurrentUser();
      if (storedUser) {
        setUser(storedUser);
      }
      const savedEmail = StorageService.getRememberedEmail();
      if (savedEmail) {
        setRememberedEmail(savedEmail);
      }
    } catch (err) {
      console.error("Failed to restore session:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async ({ email, password, role, rememberMe }) => {
    const res = await authService.login({ email, password, role, rememberMe });
    if (res.success) {
      setUser(res.user);
      if (rememberMe) {
        setRememberedEmail(email);
      }
    }
    return res;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateProfile = (updatedFields) => {
    if (!user) return;
    const updated = { ...user, ...updatedFields };
    setUser(updated);
    StorageService.setCurrentUser(updated);

    // If employee, also update in employees list
    if (user.role === "EMPLOYEE") {
      const employees = StorageService.getEmployees();
      const nextEmployees = employees.map((e) =>
        e.id === user.id ? { ...e, ...updatedFields } : e
      );
      StorageService.saveEmployees(nextEmployees);
    }
  };

  const changePassword = async ({ currentPassword, newPassword }) => {
    return authService.changePassword({ currentPassword, newPassword, user });
  };

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated: !!user,
    loading,
    rememberedEmail,
    login,
    logout,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
