import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import AdminLogin from "./AdminLogin";
import { KeyRound, Lock, Eye, EyeOff, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";

const API_BASE = "http://localhost:5000/api";

export default function AdminProtectedRoute({
  children,
  onBackToStore,
  currentPath = "/admin"
}) {
  const [authState, setAuthState] = useState({
    status: "checking", // 'checking' | 'authenticated' | 'unauthenticated'
    adminUser: null,
    adminToken: null,
    accessDeniedReason: ""
  });

  // Password change form state when mustChangePassword === true
  const [passwordChangeData, setPasswordChangeData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [pwdChangeLoading, setPwdChangeLoading] = useState(false);
  const [pwdChangeError, setPwdChangeError] = useState("");

  const verifyAdminSession = useCallback(async () => {
    const storedToken = localStorage.getItem("techzone_admin_token");
    let storedUser = null;
    try {
      const u = localStorage.getItem("techzone_admin_user");
      if (u) storedUser = JSON.parse(u);
    } catch (e) {}

    // Check if user is logged into the storefront as a normal customer only
    let customerUser = null;
    try {
      const cu = localStorage.getItem("techzone_user");
      if (cu) customerUser = JSON.parse(cu);
    } catch (e) {}

    try {
      const headers = {};
      if (storedToken) {
        headers.Authorization = `Bearer ${storedToken}`;
      }

      const response = await axios.get(`${API_BASE}/admin/verify`, {
        headers,
        withCredentials: true
      });

      const role = response.data?.admin?.role;
      if (response.data?.success && (role === "admin" || role === "superadmin")) {
        setAuthState({
          status: "authenticated",
          adminUser: response.data.admin,
          adminToken: storedToken,
          accessDeniedReason: ""
        });
        localStorage.setItem("techzone_admin_user", JSON.stringify(response.data.admin));
        return;
      }

      throw new Error("Invalid admin verification response.");
    } catch (err) {
      localStorage.removeItem("techzone_admin_token");
      localStorage.removeItem("techzone_admin_user");

      let notice = "";
      if (err.response?.status === 403 || (customerUser && customerUser.role !== "admin" && customerUser.role !== "superadmin")) {
        notice = err.response?.data?.message || "Access Denied: Customer accounts are not authorized to view the Admin Console. Please sign in with administrator credentials.";
      } else if (storedToken) {
        notice = "Your administrator session has expired. Please sign in again.";
      }

      setAuthState({
        status: "unauthenticated",
        adminUser: null,
        adminToken: null,
        accessDeniedReason: notice
      });
    }
  }, []);

  useEffect(() => {
    verifyAdminSession();
  }, [verifyAdminSession]);

  const handleLoginSuccess = (admin, token) => {
    setAuthState({
      status: "authenticated",
      adminUser: admin,
      adminToken: token,
      accessDeniedReason: ""
    });
  };

  const handleAdminLogout = async () => {
    try {
      await axios.post(`${API_BASE}/admin/logout`, {}, { withCredentials: true });
    } catch (e) {
      console.error("Admin logout error:", e);
    } finally {
      localStorage.removeItem("techzone_admin_token");
      localStorage.removeItem("techzone_admin_user");

      setAuthState({
        status: "unauthenticated",
        adminUser: null,
        adminToken: null,
        accessDeniedReason: "You have been logged out of the Admin Console."
      });

      if (window.history && window.history.pushState) {
        window.history.pushState({}, "", "/admin");
      }
    }
  };

  // Submit Password Change for New Admin
  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setPwdChangeError("");

    if (!passwordChangeData.newPassword || passwordChangeData.newPassword.length < 6) {
      setPwdChangeError("New password must be at least 6 characters long.");
      return;
    }

    if (passwordChangeData.newPassword !== passwordChangeData.confirmPassword) {
      setPwdChangeError("New passwords do not match. Please verify.");
      return;
    }

    setPwdChangeLoading(true);

    try {
      const headers = {
        "Content-Type": "application/json",
        ...(authState.adminToken ? { Authorization: `Bearer ${authState.adminToken}` } : {})
      };

      const res = await axios.post(
        `${API_BASE}/admin/change-password`,
        {
          currentPassword: passwordChangeData.currentPassword,
          newPassword: passwordChangeData.newPassword
        },
        { headers, withCredentials: true }
      );

      if (res.data?.success) {
        const updatedAdmin = res.data.admin;
        const freshToken = res.data.token || authState.adminToken;

        if (freshToken) localStorage.setItem("techzone_admin_token", freshToken);
        if (updatedAdmin) localStorage.setItem("techzone_admin_user", JSON.stringify(updatedAdmin));

        setAuthState((prev) => ({
          ...prev,
          adminUser: updatedAdmin,
          adminToken: freshToken
        }));
      } else {
        setPwdChangeError(res.data?.message || "Failed to update password.");
      }
    } catch (err) {
      setPwdChangeError(err.response?.data?.message || "Error setting new password.");
    } finally {
      setPwdChangeLoading(false);
    }
  };

  // 1. Loading State
  if (authState.status === "checking") {
    return (
      <div className="admin-checking-screen">
        <div className="admin-checking-loader" />
        <div className="admin-checking-title">Verifying Administrator Access...</div>
        <div style={{ fontSize: 12, color: "#64748b" }}>Securing TechZone Admin Gateway</div>
      </div>
    );
  }

  // 2. Unauthenticated State -> Show Admin Login
  if (authState.status === "unauthenticated" || !authState.adminUser) {
    return (
      <AdminLogin
        onLoginSuccess={handleLoginSuccess}
        onBackToStore={onBackToStore}
        initialMessage={authState.accessDeniedReason}
      />
    );
  }

  // 3. First Login Password Change Guard (Enforces requirement 4)
  if (authState.adminUser?.mustChangePassword) {
    return (
      <div className="admin-login-wrapper">
        <div className="admin-login-grid-bg" />
        <div className="admin-login-card" style={{ maxWidth: 480 }}>
          <div className="admin-login-header">
            <div className="admin-login-badge" style={{ borderColor: "rgba(245, 158, 11, 0.4)", color: "#fbbf24" }}>
              <span className="live-dot" style={{ background: "#f59e0b" }} />
              First Login Security Check
            </div>

            <div className="admin-login-icon-box" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
              <KeyRound size={32} />
            </div>

            <h1 className="admin-login-title">Choose Permanent Password</h1>
            <p className="admin-login-subtitle">
              Hello, <strong>{authState.adminUser.name}</strong>. A temporary password was issued for your account by the Super Administrator. You must set a permanent security password to continue.
            </p>
          </div>

          {pwdChangeError && (
            <div className="admin-login-alert alert-error" role="alert" id="admin-pwd-error">
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{pwdChangeError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChangeSubmit}>
            <div className="admin-field-group">
              <label className="admin-field-label">Current Temporary Password</label>
              <div className="admin-input-container">
                <input
                  type="password"
                  className="admin-input"
                  placeholder="Enter temporary password"
                  value={passwordChangeData.currentPassword}
                  onChange={(e) => setPasswordChangeData({ ...passwordChangeData, currentPassword: e.target.value })}
                  required
                />
                <Lock className="admin-input-icon" size={18} />
              </div>
            </div>

            <div className="admin-field-group">
              <label className="admin-field-label">New Permanent Password</label>
              <div className="admin-input-container">
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="admin-input has-toggle"
                  placeholder="At least 6 characters"
                  value={passwordChangeData.newPassword}
                  onChange={(e) => setPasswordChangeData({ ...passwordChangeData, newPassword: e.target.value })}
                  required
                />
                <Lock className="admin-input-icon" size={18} />
                <button
                  type="button"
                  className="admin-password-toggle"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="admin-field-group">
              <label className="admin-field-label">Confirm New Password</label>
              <div className="admin-input-container">
                <input
                  type="password"
                  className="admin-input"
                  placeholder="Re-enter new password"
                  value={passwordChangeData.confirmPassword}
                  onChange={(e) => setPasswordChangeData({ ...passwordChangeData, confirmPassword: e.target.value })}
                  required
                />
                <Lock className="admin-input-icon" size={18} />
              </div>
            </div>

            <button
              type="submit"
              className="admin-submit-btn"
              disabled={pwdChangeLoading}
              id="admin-set-permanent-pwd-btn"
            >
              {pwdChangeLoading ? (
                <>
                  <div className="admin-spinner" />
                  <span>Securing Account...</span>
                </>
              ) : (
                <>
                  <KeyRound size={17} />
                  <span>Save Password & Enter Console</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: "center" }}>
            <button
              type="button"
              className="admin-back-store-btn"
              onClick={handleAdminLogout}
            >
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authenticated State -> Render Protected Admin Children
  if (typeof children === "function") {
    return children({
      adminUser: authState.adminUser,
      adminToken: authState.adminToken,
      onAdminLogout: handleAdminLogout
    });
  }

  return React.cloneElement(children, {
    adminUser: authState.adminUser,
    adminToken: authState.adminToken,
    onAdminLogout: handleAdminLogout,
    onLogout: handleAdminLogout
  });
}
