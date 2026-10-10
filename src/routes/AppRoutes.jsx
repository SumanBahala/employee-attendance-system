import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AdminLayout } from "../layouts/AdminLayout";
import { EmployeeLayout } from "../layouts/EmployeeLayout";

// Auth Pages
import { LoginPage } from "../pages/auth/LoginPage";
import { ForgotPasswordPage } from "../pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "../pages/auth/ResetPasswordPage";

// Admin Pages
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import { EmployeesPage } from "../pages/admin/EmployeesPage";
import { EmployeeDetailPage } from "../pages/admin/EmployeeDetailPage";
import { AdminAttendancePage } from "../pages/admin/AdminAttendancePage";
import { AdminLeavePage } from "../pages/admin/AdminLeavePage";
import { DepartmentsPage } from "../pages/admin/DepartmentsPage";
import { DesignationsPage } from "../pages/admin/DesignationsPage";
import { AdminSchedulesPage } from "../pages/admin/AdminSchedulesPage";
import { AdminReportsPage } from "../pages/admin/AdminReportsPage";
import { AnalyticsPage } from "../pages/admin/AnalyticsPage";
import { AdminSettingsPage } from "../pages/admin/AdminSettingsPage";
import { AdminProfilePage } from "../pages/admin/AdminProfilePage";

// Employee Pages
import { EmployeeDashboardPage } from "../pages/employee/EmployeeDashboardPage";
import { MyAttendancePage } from "../pages/employee/MyAttendancePage";
import { MarkAttendancePage } from "../pages/employee/MarkAttendancePage";
import { EmployeeProfilePage } from "../pages/employee/EmployeeProfilePage";
import { ApplyLeavePage } from "../pages/employee/ApplyLeavePage";
import { EmployeeLeaveHistoryPage } from "../pages/employee/EmployeeLeaveHistoryPage";
import { EmployeeSchedulePage } from "../pages/employee/EmployeeSchedulePage";

// Common Pages
import { HolidaysPage } from "../pages/common/HolidaysPage";
import { NotificationsPage } from "../pages/common/NotificationsPage";
import { ChangePasswordPage } from "../pages/common/ChangePasswordPage";

// Guard
import { ProtectedRoute } from "./ProtectedRoute";

// Root Redirection based on active authentication and role
function RootRedirect() {
  const { role, isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role === "ADMIN") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/employee/dashboard" replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Root */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Admin Portal (Protected: ADMIN only) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="employees/:id" element={<EmployeeDetailPage />} />
        <Route path="attendance" element={<AdminAttendancePage />} />
        <Route path="leave" element={<AdminLeavePage />} />
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="designations" element={<DesignationsPage />} />
        <Route path="schedules" element={<AdminSchedulesPage />} />
        <Route path="holidays" element={<HolidaysPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="profile" element={<AdminProfilePage />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
      </Route>

      {/* Employee Portal (Protected: EMPLOYEE only) */}
      <Route
        path="/employee"
        element={
          <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
            <EmployeeLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/employee/dashboard" replace />} />
        <Route path="dashboard" element={<EmployeeDashboardPage />} />
        <Route path="my-attendance" element={<MyAttendancePage />} />
        <Route path="attendance" element={<Navigate to="/employee/my-attendance" replace />} />
        <Route path="mark-attendance" element={<MarkAttendancePage />} />
        <Route path="profile" element={<EmployeeProfilePage />} />
        <Route path="leave" element={<ApplyLeavePage />} />
        <Route path="leave-history" element={<EmployeeLeaveHistoryPage />} />
        <Route path="schedule" element={<EmployeeSchedulePage />} />
        <Route path="holidays" element={<HolidaysPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
      </Route>

      {/* Catch-all Not Found Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
