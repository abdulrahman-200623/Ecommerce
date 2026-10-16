import React, { useState } from "react";
import axios from "axios";
import {
  ShieldAlert,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Crown,
  KeyRound
} from "lucide-react";
import "./superadmin.css";

const API_BASE = "http://localhost:5000/api";

export default function SuperAdminLogin({ onLoginSuccess, onBackToStore, initialMessage = "" }) {
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
      setErrorMessage("Please enter your Super Administrator email address.");
      return;
    }

    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setErrorMessage("Please enter a valid email format.");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your Super Administrator master password.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE}/superadmin/login`,
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
        const { token, user } = response.data;
        if (token) {
          localStorage.setItem("techzone_superadmin_token", token);
        }
        if (user) {
          localStorage.setItem("techzone_superadmin_user", JSON.stringify(user));
        }

        setSuccessMessage("Super Administrator authenticated. Initializing Console...");

        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(user, token);
          } else {
            window.location.href = "/superadmin/dashboard";
          }
        }, 400);
      } else {
        setErrorMessage(response.data?.message || "Authentication failed. Please verify credentials.");
      }
    } catch (err) {
      console.error("Super Admin login error:", err);
      if (err.response) {
        if (err.response.status === 403) {
          setErrorMessage(
            err.response.data?.message ||
              "Access denied. This account does not possess Super Administrator privileges."
          );
        } else if (err.response.status === 429) {
          setErrorMessage(
            err.response.data?.message ||
              "Too many failed login attempts. Gateway locked for 15 minutes."
          );
        } else if (err.response.status === 401) {
          setErrorMessage(
            err.response.data?.message ||
              "Invalid Super Administrator credentials. Please verify your email and password."
          );
        } else {
          setErrorMessage(err.response.data?.message || "Authentication error. Please try again.");
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
    setEmail("superadmin@techzone.com");
    setPassword("SuperAdmin@TechZone2026!");
    setErrorMessage("");
  };

  return (
    <div className="sa-login-wrapper">
      <div className="sa-login-grid-bg" />

      <div className="sa-login-card">
        {/* Header */}
        <div className="sa-login-header">
          <div className="sa-crown-badge">
            <Crown size={14} />
            Root Authority Console
          </div>

          <div className="sa-login-icon-box">
            <Crown size={36} />
          </div>

          <h1 className="sa-login-title">
            Tech<span>Zone</span> Super Admin
          </h1>
          <p className="sa-login-subtitle">
            Enterprise administration gateway. Strictly authorized root administrators only.
          </p>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="sa-alert sa-alert-error" role="alert" id="sa-login-error">
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="sa-alert sa-alert-success" role="alert">
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="sa-field-group">
            <label className="sa-label" htmlFor="sa-email-input">
              <span>Super Admin Email</span>
            </label>
            <div className="sa-input-box">
              <input
                id="sa-email-input"
                type="email"
                className="sa-input"
                placeholder="superadmin@techzone.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                disabled={loading}
                required
              />
              <Mail className="sa-input-icon" size={18} />
            </div>
          </div>

          <div className="sa-field-group">
            <label className="sa-label" htmlFor="sa-password-input">
              <span>Master Security Password</span>
            </label>
            <div className="sa-input-box">
              <input
                id="sa-password-input"
                type={showPassword ? "text" : "password"}
                className="sa-input has-toggle"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
                required
              />
              <Lock className="sa-input-icon" size={18} />
              <button
                type="button"
                className="sa-toggle-pwd"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="sa-submit-btn"
            disabled={loading}
            id="sa-login-submit-btn"
          >
            {loading ? (
              <>
                <div className="sa-spinner" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <KeyRound size={17} />
                <span>Access Super Admin Console</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        {/* Local Dev Autofill Helper */}
        <div style={{ marginTop: 20, padding: "12px 14px", background: "rgba(255, 255, 255, 0.02)", border: "1px dashed rgba(255, 255, 255, 0.08)", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>
            <div>Email: <span style={{ color: "#c084fc" }}>superadmin@techzone.com</span></div>
            <div>Password: <span style={{ color: "#c084fc" }}>SuperAdmin@TechZone2026!</span></div>
          </div>
          <button
            type="button"
            className="sa-preset-btn"
            onClick={handleQuickFill}
            style={{ fontSize: 11, padding: "4px 10px" }}
          >
            Autofill
          </button>
        </div>

        {/* Footer */}
        <div className="sa-login-footer">
          <button
            type="button"
            className="sa-link-btn"
            onClick={onBackToStore || (() => (window.location.href = "/"))}
          >
            <ArrowLeft size={14} />
            <span>Return to TechZone Storefront</span>
          </button>
        </div>
      </div>
    </div>
  );
}
