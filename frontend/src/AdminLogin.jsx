import React, { useState } from "react";
import axios from "axios";
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
  KeyRound
} from "lucide-react";
import "./admin_login.css";

const API_BASE = "http://localhost:5000/api";

export default function AdminLogin({ onLoginSuccess, onBackToStore, initialMessage = "" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(initialMessage || "");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage("Please enter your administrator email address.");
      return;
    }

    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setErrorMessage("Please enter a valid administrator email format.");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your administrator security password.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE}/admin/login`,
        {
          email: cleanEmail,
          password
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data && response.data.success) {
        const { token, admin } = response.data;
        // Persist admin session
        if (token) {
          localStorage.setItem("techzone_admin_token", token);
        }
        if (admin) {
          localStorage.setItem("techzone_admin_user", JSON.stringify(admin));
        }

        setSuccessMessage("Authentication successful. Opening Admin Console...");
        
        // Notify parent / route handler
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(admin, token);
          } else {
            window.location.href = "/admin";
          }
        }, 400);
      } else {
        setErrorMessage(response.data?.message || "Authentication failed. Please verify credentials.");
      }
    } catch (err) {
      console.error("Admin login error:", err);
      if (err.response) {
        if (err.response.status === 403) {
          setErrorMessage(
            err.response.data?.message ||
              "Access denied. This account does not possess administrator privileges."
          );
        } else if (err.response.status === 429) {
          setErrorMessage(
            err.response.data?.message ||
              "Too many failed login attempts. Account temporarily locked for 15 minutes."
          );
        } else if (err.response.status === 401) {
          setErrorMessage(
            err.response.data?.message ||
              "Invalid administrator credentials. Please verify your email and password."
          );
        } else {
          setErrorMessage(err.response.data?.message || "Server authentication error. Please try again.");
        }
      } else if (err.request) {
        setErrorMessage("Cannot connect to backend server on port 5000. Please ensure the backend is running.");
      } else {
        setErrorMessage(err.message || "An unexpected error occurred during login.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setEmail("admin@techzone.com");
    setPassword("ChangeThisAdminPassword123!");
    setErrorMessage("");
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-grid-bg" />

      <div className="admin-login-card">
        {/* Header */}
        <div className="admin-login-header">
          <div className="admin-login-badge">
            <span className="live-dot" />
            Protected Gateway
          </div>

          <div className="admin-login-icon-box">
            <ShieldCheck size={32} />
          </div>

          <h1 className="admin-login-title">
            Tech<span>Zone</span> Admin
          </h1>
          <p className="admin-login-subtitle">
            Secure administrative console. Authorized store managers and administrators only.
          </p>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="admin-login-alert alert-error" role="alert" id="admin-login-error">
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="admin-login-alert alert-success" role="alert">
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form className="admin-login-form" onSubmit={handleSubmit} noValidate>
          {/* Email Field */}
          <div className="admin-field-group">
            <label className="admin-field-label" htmlFor="admin-email-input">
              <span>Administrator Email</span>
            </label>
            <div className="admin-input-container">
              <input
                id="admin-email-input"
                type="email"
                className="admin-input"
                placeholder="admin@techzone.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                disabled={loading}
                required
              />
              <Mail className="admin-input-icon" size={18} />
            </div>
          </div>

          {/* Password Field */}
          <div className="admin-field-group">
            <label className="admin-field-label" htmlFor="admin-password-input">
              <span>Security Password</span>
            </label>
            <div className="admin-input-container">
              <input
                id="admin-password-input"
                type={showPassword ? "text" : "password"}
                className="admin-input has-toggle"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
                required
              />
              <Lock className="admin-input-icon" size={18} />
              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="admin-submit-btn"
            disabled={loading}
            id="admin-login-submit-btn"
          >
            {loading ? (
              <>
                <div className="admin-spinner" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <KeyRound size={17} />
                <span>Authenticate & Enter Console</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        {/* Dev Quick-Fill Helper for Local Testing */}
        <div className="admin-dev-box">
          <div className="admin-dev-header">
            <span>Local Dev Credentials</span>
            <button
              type="button"
              className="admin-dev-fill-btn"
              onClick={handleQuickFill}
              title="Autofill development credentials"
            >
              Autofill
            </button>
          </div>
          <div className="admin-dev-details">
            <div>Email: <span>admin@techzone.com</span></div>
            <div>Password: <span>ChangeThisAdminPassword123!</span></div>
          </div>
        </div>

        {/* Footer & Back Link */}
        <div className="admin-login-footer">
          <button
            type="button"
            className="admin-back-store-btn"
            onClick={onBackToStore || (() => (window.location.href = "/"))}
          >
            <ArrowLeft size={15} />
            <span>Return to TechZone Storefront</span>
          </button>

          <div className="admin-security-note">
            <ShieldAlert size={13} />
            <span>256-bit Encrypted Session • HttpOnly Cookie • Role-Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}
