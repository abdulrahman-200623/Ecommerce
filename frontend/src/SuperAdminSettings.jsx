import React, { useState } from "react";
import axios from "axios";
import {
  Settings,
  ShieldCheck,
  KeyRound,
  User,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Server,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";
import "./superadmin.css";

const API_BASE = "http://localhost:5000/api";

export default function SuperAdminSettings({ token, superAdminUser, onUpdateUser }) {
  const [name, setName] = useState(superAdminUser?.name || "");
  const [phone, setPhone] = useState(superAdminUser?.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { text, type }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ text: "New passwords do not match. Please verify.", type: "error" });
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setMessage({ text: "New password must be at least 6 characters long.", type: "error" });
      return;
    }

    if (newPassword && !currentPassword) {
      setMessage({ text: "Please enter your current password to set a new password.", type: "error" });
      return;
    }

    setLoading(true);

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const payload = {
        name: name.trim(),
        phone: phone.trim()
      };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await axios.put(`${API_BASE}/superadmin/settings`, payload, {
        headers,
        withCredentials: true
      });

      if (res.data?.success) {
        setMessage({ text: "Super Administrator settings updated successfully!", type: "success" });
        if (onUpdateUser && res.data.user) {
          onUpdateUser(res.data.user);
        }
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || "Failed to update settings.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
      {/* Profile & Security Form */}
      <div className="sa-form-card">
        <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 6px", color: "#ffffff" }}>
          Super Administrator Account
        </h3>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 24px" }}>
          Root account credentials and security preferences
        </p>

        {message && (
          <div
            className={`sa-alert ${message.type === "error" ? "sa-alert-error" : "sa-alert-success"}`}
            role="alert"
          >
            {message.type === "error" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="sa-field-group">
            <label className="sa-label">Root Administrator Email</label>
            <input
              type="email"
              className="sa-input"
              value={superAdminUser?.email || "superadmin@techzone.com"}
              disabled
              style={{ opacity: 0.6 }}
            />
          </div>

          <div className="sa-field-group">
            <label className="sa-label">Display Name</label>
            <div className="sa-input-box">
              <input
                type="text"
                className="sa-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <User className="sa-input-icon" size={18} />
            </div>
          </div>

          <div className="sa-field-group">
            <label className="sa-label">Direct Contact Phone</label>
            <div className="sa-input-box">
              <input
                type="text"
                className="sa-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Phone className="sa-input-icon" size={18} />
            </div>
          </div>

          <div style={{ margin: "24px 0", borderTop: "1px solid var(--sa-border)" }} />

          <h4 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 14px", color: "#ffffff" }}>
            Change Master Security Password
          </h4>

          <div className="sa-field-group">
            <label className="sa-label">Current Master Password</label>
            <div className="sa-input-box">
              <input
                type={showCurrent ? "text" : "password"}
                className="sa-input has-toggle"
                placeholder="Required only if changing password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <Lock className="sa-input-icon" size={18} />
              <button
                type="button"
                className="sa-toggle-pwd"
                onClick={() => setShowCurrent(!showCurrent)}
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="sa-field-group">
            <label className="sa-label">New Master Password</label>
            <div className="sa-input-box">
              <input
                type={showNew ? "text" : "password"}
                className="sa-input has-toggle"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <KeyRound className="sa-input-icon" size={18} />
              <button
                type="button"
                className="sa-toggle-pwd"
                onClick={() => setShowNew(!showNew)}
                tabIndex={-1}
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="sa-field-group">
            <label className="sa-label">Confirm New Password</label>
            <input
              type="password"
              className="sa-input"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="sa-submit-btn"
            disabled={loading}
            style={{ marginTop: 20 }}
          >
            {loading ? (
              <>
                <div className="sa-spinner" />
                <span>Updating Credentials...</span>
              </>
            ) : (
              <span>Save Super Admin Settings</span>
            )}
          </button>
        </form>
      </div>

      {/* Security & System Architecture Info Card */}
      <div className="sa-panel-card" style={{ height: "fit-content" }}>
        <div className="sa-panel-header">
          <div className="sa-panel-title">
            <h3>System Security Architecture</h3>
            <p>Active configurations & environment security</p>
          </div>
        </div>

        <div style={{ padding: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ padding: 14, background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--sa-border)", borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>Access Token Lifetime</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#ffffff" }}>24 Hours (Short-lived JWT)</div>
            </div>

            <div style={{ padding: 14, background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--sa-border)", borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>Password Hashing Protocol</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#ffffff" }}>Bcrypt with Salt Rounds (10)</div>
            </div>

            <div style={{ padding: 14, background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--sa-border)", borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>Role-Based Access Enforcement</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#34d399" }}>Dual-Layer (Frontend + Backend API)</div>
            </div>

            <div style={{ padding: 14, background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--sa-border)", borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>Session Cookie Configuration</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#60a5fa" }}>HttpOnly, SameSite Lax, Role-Scoped</div>
            </div>

            <div style={{ padding: 14, background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--sa-border)", borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>Database Bootstrap Guard</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#c084fc" }}>Automated Bootstrap from .env on startup</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
