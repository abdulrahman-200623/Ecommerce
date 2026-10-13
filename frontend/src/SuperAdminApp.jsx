import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import SuperAdminLogin from "./SuperAdminLogin";
import SuperAdminLayout from "./SuperAdminLayout";
import SuperAdminDashboard from "./SuperAdminDashboard";
import SuperAdminCreateAdmin from "./SuperAdminCreateAdmin";
import SuperAdminManageAdmins from "./SuperAdminManageAdmins";
import SuperAdminPermissions from "./SuperAdminPermissions";
import SuperAdminActivityLogs from "./SuperAdminActivityLogs";
import SuperAdminSettings from "./SuperAdminSettings";
import "./superadmin.css";

const API_BASE = "http://localhost:5000/api";

export default function SuperAdminApp({ currentPath, onNavigate, onBackToStore }) {
  const [authState, setAuthState] = useState({
    status: "checking", // 'checking' | 'authenticated' | 'unauthenticated'
    superAdminUser: null,
    token: null,
    errorMessage: ""
  });

  // Verify Super Admin session on load
  const verifySession = useCallback(async () => {
    const storedToken = localStorage.getItem("techzone_superadmin_token");
    let storedUser = null;
    try {
      const u = localStorage.getItem("techzone_superadmin_user");
      if (u) storedUser = JSON.parse(u);
    } catch (e) {}

    try {
      const headers = {};
      if (storedToken) {
        headers.Authorization = `Bearer ${storedToken}`;
      }

      const response = await axios.get(`${API_BASE}/superadmin/verify`, {
        headers,
        withCredentials: true
      });

      if (response.data?.success && response.data?.user?.role === "superadmin") {
        setAuthState({
          status: "authenticated",
          superAdminUser: response.data.user,
          token: storedToken,
          errorMessage: ""
        });
        localStorage.setItem("techzone_superadmin_user", JSON.stringify(response.data.user));
        return;
      }

      throw new Error("Invalid superadmin verification response.");
    } catch (err) {
      localStorage.removeItem("techzone_superadmin_token");
      localStorage.removeItem("techzone_superadmin_user");

      let notice = "";
      if (err.response?.status === 403) {
        notice = "Access Denied: Standard user or administrator accounts cannot access the Super Admin Console.";
      } else if (storedToken) {
        notice = "Your Super Administrator session has expired. Please sign in again.";
      }

      setAuthState({
        status: "unauthenticated",
        superAdminUser: null,
        token: null,
        errorMessage: notice
      });
    }
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  const handleLoginSuccess = (user, token) => {
    setAuthState({
      status: "authenticated",
      superAdminUser: user,
      token,
      errorMessage: ""
    });
    if (onNavigate) {
      onNavigate("/superadmin/dashboard");
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE}/superadmin/logout`, {}, { withCredentials: true });
    } catch (e) {
      console.error("Super Admin logout error:", e);
    } finally {
      localStorage.removeItem("techzone_superadmin_token");
      localStorage.removeItem("techzone_superadmin_user");

      setAuthState({
        status: "unauthenticated",
        superAdminUser: null,
        token: null,
        errorMessage: "You have been signed out of the Super Admin Console."
      });

      if (onNavigate) {
        onNavigate("/superadmin");
      }
    }
  };

  // Determine active view based on path
  const getActiveView = () => {
    const p = currentPath || window.location.pathname;
    if (p === "/superadmin/create-admin") return "create-admin";
    if (p === "/superadmin/manage-admins") return "manage-admins";
    if (p === "/superadmin/permissions") return "permissions";
    if (p === "/superadmin/activity-logs") return "activity-logs";
    if (p === "/superadmin/settings") return "settings";
    return "dashboard";
  };

  // 1. Loading screen
  if (authState.status === "checking") {
    return (
      <div className="sa-login-wrapper">
        <div style={{ textAlign: "center" }}>
          <div className="sa-spinner" style={{ width: 40, height: 40, borderWidth: 3, margin: "0 auto 16px" }} />
          <div style={{ color: "#ffffff", fontWeight: 700, fontSize: 16 }}>Verifying Super Administrator Access...</div>
          <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>Securing TechZone Root Console</div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated screen -> Super Admin Login
  if (authState.status === "unauthenticated" || !authState.superAdminUser) {
    return (
      <SuperAdminLogin
        onLoginSuccess={handleLoginSuccess}
        onBackToStore={onBackToStore}
        initialMessage={authState.errorMessage}
      />
    );
  }

  // 3. Authenticated screen -> Render SuperAdminLayout with active view
  const activeView = getActiveView();

  return (
    <SuperAdminLayout
      activeView={activeView}
      onNavigate={onNavigate}
      superAdminUser={authState.superAdminUser}
      onLogout={handleLogout}
      onBackToStore={onBackToStore}
    >
      {activeView === "dashboard" && (
        <SuperAdminDashboard
          token={authState.token}
          superAdminUser={authState.superAdminUser}
          onNavigate={onNavigate}
        />
      )}
      {activeView === "create-admin" && (
        <SuperAdminCreateAdmin
          token={authState.token}
          superAdminUser={authState.superAdminUser}
          onNavigate={onNavigate}
        />
      )}
      {activeView === "manage-admins" && (
        <SuperAdminManageAdmins
          token={authState.token}
          superAdminUser={authState.superAdminUser}
          onNavigate={onNavigate}
        />
      )}
      {activeView === "permissions" && (
        <SuperAdminPermissions
          token={authState.token}
          superAdminUser={authState.superAdminUser}
          onNavigate={onNavigate}
        />
      )}
      {activeView === "activity-logs" && (
        <SuperAdminActivityLogs
          token={authState.token}
          superAdminUser={authState.superAdminUser}
          onNavigate={onNavigate}
        />
      )}
      {activeView === "settings" && (
        <SuperAdminSettings
          token={authState.token}
          superAdminUser={authState.superAdminUser}
          onUpdateUser={(updated) =>
            setAuthState((prev) => ({ ...prev, superAdminUser: updated }))
          }
        />
      )}
    </SuperAdminLayout>
  );
}
