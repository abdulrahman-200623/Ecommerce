import React, { useState } from "react";
import {
  X,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles
} from "lucide-react";
import axios from "axios";
import "./account.css";

const API_BASE = "http://localhost:5000/api";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi NCR",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal"
];

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialTab = "login" }) {
  const [tab, setTab] = useState(initialTab); // "login" | "register"
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });

  // Register form state
  const [regForm, setRegForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    street: "",
    city: "",
    state: "Maharashtra",
    pincode: ""
  });

  if (!isOpen) return null;

  const handleDemoFill = () => {
    setLoginForm({
      email: "ahabdulrahmanknr@gmail.com",
      password: "password123"
    });
    setError("");
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!loginForm.email.trim() || !loginForm.password) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/users/login`, {
        email: loginForm.email.trim(),
        password: loginForm.password
      });

      if (res.data?.success && res.data.token) {
        localStorage.setItem("techzone_token", res.data.token);
        localStorage.setItem("techzone_user", JSON.stringify(res.data.user));

        // Sync legacy customer name/email if desired
        localStorage.setItem("techzone_customer_name", res.data.user.name);
        localStorage.setItem("techzone_customer_email", res.data.user.email);
        if (res.data.user.phone) localStorage.setItem("techzone_customer_phone", res.data.user.phone);

        setSuccessMsg("Logged in successfully! Redirecting...");
        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess(res.data.user, res.data.token);
          onClose();
        }, 500);
      } else {
        throw new Error(res.data?.message || "Invalid credentials.");
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Login failed. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!regForm.name.trim() || regForm.name.trim().length < 2) {
      setError("Full name must be at least 2 characters.");
      return;
    }
    if (!regForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regForm.email.trim())) {
      setError("Please provide a valid email address.");
      return;
    }
    if (!regForm.password || regForm.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (regForm.phone.trim() && !/^(\+91[\-\s]?)?[6-9]\d{9}$/.test(regForm.phone.trim().replace(/\s+/g, ""))) {
      setError("Please provide a valid 10-digit mobile number.");
      return;
    }
    if (regForm.pincode.trim() && !/^\d{6}$/.test(regForm.pincode.trim())) {
      setError("PIN code must be a 6-digit number.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: regForm.name.trim(),
        email: regForm.email.trim(),
        password: regForm.password,
        phone: regForm.phone.trim(),
        address: {
          street: regForm.street.trim(),
          city: regForm.city.trim(),
          state: regForm.state.trim(),
          pincode: regForm.pincode.trim()
        }
      };

      const res = await axios.post(`${API_BASE}/users/register`, payload);

      if (res.data?.success && res.data.token) {
        localStorage.setItem("techzone_token", res.data.token);
        localStorage.setItem("techzone_user", JSON.stringify(res.data.user));

        setSuccessMsg("Account created successfully! Welcome to TechZone.");
        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess(res.data.user, res.data.token);
          onClose();
        }, 600);
      } else {
        throw new Error(res.data?.message || "Failed to create account.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <h3>
            <User size={20} color="#38bdf8" />
            {tab === "login" ? "Sign In to TechZone" : "Create TechZone Account"}
          </h3>
          <button className="auth-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab-btn ${tab === "login" ? "active" : ""}`}
            onClick={() => {
              setTab("login");
              setError("");
            }}
          >
            Sign In
          </button>
          <button
            className={`auth-tab-btn ${tab === "register" ? "active" : ""}`}
            onClick={() => {
              setTab("register");
              setError("");
            }}
          >
            Create Account
          </button>
        </div>

        <div className="auth-modal-body">
          {error && (
            <div className="alert-banner error" role="alert">
              <AlertCircle size={18} />
              <div>{error}</div>
            </div>
          )}

          {successMsg && (
            <div className="alert-banner success" role="status">
              <CheckCircle2 size={18} />
              <div>{successMsg}</div>
            </div>
          )}

          {tab === "login" ? (
            <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="auth-demo-box">
                <span>Want to test quickly?</span>
                <button type="button" className="auth-demo-btn" onClick={handleDemoFill}>
                  <Sparkles size={11} style={{ display: "inline", marginRight: "3px" }} />
                  Fill Demo Credentials
                </button>
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">
                  <Mail size={14} /> Email Address <span className="req">*</span>
                </label>
                <input
                  type="email"
                  className="edit-form-input"
                  placeholder="your.email@example.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">
                  <Lock size={14} /> Password <span className="req">*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="edit-form-input"
                    placeholder="Enter your account password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "0",
                      color: "#94a3b8",
                      cursor: "pointer"
                    }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: "10px", width: "100%", justifyContent: "center" }} disabled={loading}>
                {loading ? <Loader2 size={18} className="spinner-icon" /> : "Sign In to My Account"}
              </button>

              <div style={{ textAlign: "center", fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>
                Don't have an account yet?{" "}
                <button
                  type="button"
                  onClick={() => setTab("register")}
                  style={{ background: "none", border: 0, color: "#38bdf8", cursor: "pointer", fontWeight: "600" }}
                >
                  Create one now
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="edit-form-group">
                <label className="edit-form-label">
                  <User size={14} /> Full Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className="edit-form-input"
                  placeholder="e.g. Abdulrahman"
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">
                  <Mail size={14} /> Email Address <span className="req">*</span>
                </label>
                <input
                  type="email"
                  className="edit-form-input"
                  placeholder="e.g. abdul@example.com"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">
                  <Lock size={14} /> Password (min 6 chars) <span className="req">*</span>
                </label>
                <input
                  type="password"
                  className="edit-form-input"
                  placeholder="Create a secure password"
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">
                  <Phone size={14} /> Mobile Phone Number
                </label>
                <input
                  type="tel"
                  className="edit-form-input"
                  placeholder="e.g. 9876543210"
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                />
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">
                  <MapPin size={14} /> Street Address
                </label>
                <input
                  type="text"
                  className="edit-form-input"
                  placeholder="Flat, House no., Street, Area"
                  value={regForm.street}
                  onChange={(e) => setRegForm({ ...regForm, street: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="edit-form-group">
                  <label className="edit-form-label">City</label>
                  <input
                    type="text"
                    className="edit-form-input"
                    placeholder="e.g. Mumbai"
                    value={regForm.city}
                    onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                  />
                </div>
                <div className="edit-form-group">
                  <label className="edit-form-label">PIN Code</label>
                  <input
                    type="text"
                    className="edit-form-input"
                    placeholder="e.g. 400076"
                    value={regForm.pincode}
                    onChange={(e) => setRegForm({ ...regForm, pincode: e.target.value })}
                    maxLength={6}
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: "10px", width: "100%", justifyContent: "center" }} disabled={loading}>
                {loading ? <Loader2 size={18} className="spinner-icon" /> : "Create TechZone Account"}
              </button>

              <div style={{ textAlign: "center", fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setTab("login")}
                  style={{ background: "none", border: 0, color: "#38bdf8", cursor: "pointer", fontWeight: "600" }}
                >
                  Sign in here
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
