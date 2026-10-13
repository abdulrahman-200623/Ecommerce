import React, { useState } from "react";
import axios from "axios";
import {
  UserPlus,
  Mail,
  User,
  Phone,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Layers,
  ArrowRight,
  Eye,
  EyeOff
} from "lucide-react";
import "./superadmin.css";

const API_BASE = "http://localhost:5000/api";

const AVAILABLE_PERMISSIONS = [
  {
    key: "dashboard",
    label: "Dashboard Access",
    category: "General",
    description: "Access regular admin dashboard overview, sales summaries & metrics"
  },
  {
    key: "products",
    label: "Product Management",
    category: "Catalog",
    description: "Browse and view catalog products, pricing, specifications & stock levels"
  },
  {
    key: "products_manage",
    label: "Add, Edit & Delete Products",
    category: "Catalog",
    description: "Create new products, edit details/pricing, adjust inventory & remove products"
  },
  {
    key: "categories",
    label: "Category Management",
    category: "Catalog",
    description: "Create new product categories, rename, reorganize and remove categories"
  },
  {
    key: "orders",
    label: "Order Management",
    category: "Sales",
    description: "Inspect customer orders, update order status (Processing, Shipped, Delivered) & cancel orders"
  },
  {
    key: "customers",
    label: "Customer Management",
    category: "Users",
    description: "View customer profiles, registration details, addresses & purchasing history"
  },
  {
    key: "returns",
    label: "Return & Refund Management",
    category: "Sales",
    description: "Review customer return requests, approve/reject refunds & configure return policy"
  },
  {
    key: "coupons",
    label: "Coupon & Flash Sale Management",
    category: "Marketing",
    description: "Create and manage promotional discount coupons and configure flash sale campaigns"
  },
  {
    key: "inventory",
    label: "Inventory Management",
    category: "Catalog",
    description: "Perform quick stock level adjustments, replenishment & stock alert monitoring"
  },
  {
    key: "reports",
    label: "Reports & Analytics",
    category: "Analytics",
    description: "Inspect revenue analytics, sales trends, top products and export CSV/JSON backups"
  },
  {
    key: "reviews",
    label: "Manage Customer Reviews",
    category: "Content",
    description: "Moderate customer product reviews, filter verified purchases & delete spam reviews"
  }
];

export default function SuperAdminCreateAdmin({ token, onNavigate }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    adminRoleTitle: "Store Manager",
    isActive: true
  });
  const [selectedPermissions, setSelectedPermissions] = useState([
    "dashboard",
    "products",
    "orders"
  ]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successResult, setSuccessResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Generate strong random temporary password
  const generateTempPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: pwd }));
  };

  // Permission toggles
  const handleTogglePermission = (key) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  // Presets
  const applyPreset = (preset) => {
    if (preset === "all") {
      setSelectedPermissions(AVAILABLE_PERMISSIONS.map((p) => p.key));
    } else if (preset === "catalog") {
      setSelectedPermissions(["dashboard", "products", "products_manage", "categories", "inventory"]);
    } else if (preset === "sales") {
      setSelectedPermissions(["dashboard", "orders", "returns", "customers"]);
    } else if (preset === "support") {
      setSelectedPermissions(["dashboard", "reviews", "customers", "returns"]);
    } else if (preset === "clear") {
      setSelectedPermissions([]);
    }
  };

  // Form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setErrorMessage("Please enter a valid full name (minimum 2 characters).");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setErrorMessage("Temporary password must be at least 6 characters long.");
      return;
    }

    if (selectedPermissions.length === 0) {
      setErrorMessage("Please select at least one permission module for this admin.");
      return;
    }

    setLoading(true);

    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        adminRoleTitle: formData.adminRoleTitle.trim(),
        permissions: selectedPermissions,
        isActive: formData.isActive
      };

      const res = await axios.post(`${API_BASE}/superadmin/admins`, payload, {
        headers,
        withCredentials: true
      });

      if (res.data?.success) {
        setSuccessResult({
          admin: res.data.admin,
          plainPassword: formData.password
        });
        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          password: "",
          adminRoleTitle: "Store Manager",
          isActive: true
        });
        setSelectedPermissions(["dashboard", "products", "orders"]);
      } else {
        setErrorMessage(res.data?.message || "Failed to create administrator.");
      }
    } catch (err) {
      console.error("Create admin error:", err);
      setErrorMessage(
        err.response?.data?.message || err.message || "Server error while creating administrator."
      );
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    if (!successResult) return;
    const text = `TechZone Admin Credentials:\nName: ${successResult.admin.name}\nEmail: ${successResult.admin.email}\nTemporary Password: ${successResult.plainPassword}\nLogin URL: http://localhost:5173/admin\n\n*Note: You will be required to change your temporary password upon first login.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div>
      {/* Success Modal / Banner */}
      {successResult && (
        <div className="sa-modal-overlay">
          <div className="sa-modal-card">
            <div className="sa-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(16, 185, 129, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#34d399" }}>
                  <CheckCircle2 size={20} />
                </div>
                <h3>Admin Created Successfully!</h3>
              </div>
            </div>

            <div className="sa-modal-body">
              <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 0 }}>
                The new administrator account has been saved in MongoDB. A temporary password was set, and the admin will be required to choose a new password on first login.
              </p>

              <div style={{ background: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 14, padding: "16px 18px", marginTop: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: "8px 12px", fontSize: 13 }}>
                  <div style={{ color: "#94a3b8" }}>Full Name:</div>
                  <div style={{ fontWeight: 700, color: "#fff" }}>{successResult.admin.name}</div>

                  <div style={{ color: "#94a3b8" }}>Email Address:</div>
                  <div style={{ fontWeight: 700, color: "#60a5fa" }}>{successResult.admin.email}</div>

                  <div style={{ color: "#94a3b8" }}>Role Title:</div>
                  <div>
                    <span className="sa-badge sa-badge-admin">{successResult.admin.adminRoleTitle}</span>
                  </div>

                  <div style={{ color: "#94a3b8" }}>Temporary Password:</div>
                  <div style={{ fontWeight: 700, color: "#34d399", fontFamily: "monospace", fontSize: 14 }}>
                    {successResult.plainPassword}
                  </div>

                  <div style={{ color: "#94a3b8" }}>Permissions:</div>
                  <div style={{ color: "#c084fc", fontWeight: 600 }}>
                    {successResult.admin.permissions?.length || 0} modules assigned
                  </div>

                  <div style={{ color: "#94a3b8" }}>Password Policy:</div>
                  <div style={{ color: "#f59e0b", fontSize: 12 }}>
                    Must change password on first login
                  </div>
                </div>
              </div>
            </div>

            <div className="sa-modal-footer">
              <button
                type="button"
                className="sa-btn-secondary"
                onClick={copyCredentials}
                id="sa-copy-creds-btn"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                {copied ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
                <span>{copied ? "Copied to Clipboard!" : "Copy Credentials"}</span>
              </button>

              <button
                type="button"
                className="sa-btn-primary"
                onClick={() => setSuccessResult(null)}
              >
                Provision Another Admin
              </button>

              <button
                type="button"
                className="sa-btn-secondary"
                onClick={() => onNavigate("/superadmin/manage-admins")}
              >
                View in Manage Admins
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Creation Form Card */}
      <div className="sa-form-card">
        {errorMessage && (
          <div className="sa-alert sa-alert-error" role="alert" id="sa-create-error">
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="sa-form-grid">
            {/* Full Name */}
            <div className="sa-field-group">
              <label className="sa-label" htmlFor="admin-create-name">
                <span>Full Name *</span>
              </label>
              <div className="sa-input-box">
                <input
                  id="admin-create-name"
                  type="text"
                  className="sa-input"
                  placeholder="e.g. Priya Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <User className="sa-input-icon" size={18} />
              </div>
            </div>

            {/* Email Address */}
            <div className="sa-field-group">
              <label className="sa-label" htmlFor="admin-create-email">
                <span>Email Address (Unique Login) *</span>
              </label>
              <div className="sa-input-box">
                <input
                  id="admin-create-email"
                  type="email"
                  className="sa-input"
                  placeholder="admin.name@techzone.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <Mail className="sa-input-icon" size={18} />
              </div>
            </div>

            {/* Phone Number */}
            <div className="sa-field-group">
              <label className="sa-label" htmlFor="admin-create-phone">
                <span>Phone Number</span>
              </label>
              <div className="sa-input-box">
                <input
                  id="admin-create-phone"
                  type="text"
                  className="sa-input"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <Phone className="sa-input-icon" size={18} />
              </div>
            </div>

            {/* Admin Role Title */}
            <div className="sa-field-group">
              <label className="sa-label" htmlFor="admin-create-role-title">
                <span>Role / Designation</span>
              </label>
              <select
                id="admin-create-role-title"
                className="sa-select"
                style={{ width: "100%", height: 46 }}
                value={formData.adminRoleTitle}
                onChange={(e) => setFormData({ ...formData, adminRoleTitle: e.target.value })}
              >
                <option value="Store Manager">Store Manager (General)</option>
                <option value="Catalog Manager">Catalog & Products Specialist</option>
                <option value="Orders Specialist">Fulfillment & Orders Specialist</option>
                <option value="Customer Support Admin">Support & Returns Specialist</option>
                <option value="Marketing & Promotions Admin">Promotions & Coupons Specialist</option>
                <option value="General Admin">General Administrator</option>
              </select>
            </div>
          </div>

          {/* Password & Security Row */}
          <div className="sa-form-grid" style={{ marginTop: 10 }}>
            {/* Temporary Password */}
            <div className="sa-field-group">
              <div className="sa-label">
                <span>Temporary Password *</span>
                <button
                  type="button"
                  onClick={generateTempPassword}
                  className="sa-link-btn"
                  style={{ color: "#a78bfa", fontSize: 11, fontWeight: 700 }}
                  id="sa-generate-pwd-btn"
                >
                  <RefreshCw size={12} />
                  <span>Auto-Generate</span>
                </button>
              </div>
              <div className="sa-input-box">
                <input
                  id="admin-create-password"
                  type={showPassword ? "text" : "password"}
                  className="sa-input has-toggle"
                  placeholder="Min 6 characters temporary password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <KeyRound className="sa-input-icon" size={18} />
                <button
                  type="button"
                  className="sa-toggle-pwd"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
                Admin will be prompted to choose their own password upon first login.
              </div>
            </div>

            {/* Account Status Switch */}
            <div className="sa-field-group">
              <label className="sa-label">
                <span>Initial Account Status</span>
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 14, height: 46 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  <input
                    type="radio"
                    name="accountStatus"
                    checked={formData.isActive === true}
                    onChange={() => setFormData({ ...formData, isActive: true })}
                  />
                  <span style={{ color: "#34d399" }}>Active (Can log in immediately)</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  <input
                    type="radio"
                    name="accountStatus"
                    checked={formData.isActive === false}
                    onChange={() => setFormData({ ...formData, isActive: false })}
                  />
                  <span style={{ color: "#f87171" }}>Inactive (Suspended)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Granular Permissions Selection */}
          <div style={{ marginTop: 28, paddingTop: 24, borderTop: "1px solid var(--sa-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px", color: "#ffffff" }}>
                  Role-Based Permissions (RBAC)
                </h3>
                <p style={{ fontSize: 12.5, color: "#94a3b8", margin: 0 }}>
                  Select the exact modules and capabilities this administrator is authorized to access.
                </p>
              </div>

              {/* Quick Presets */}
              <div className="sa-presets-bar">
                <button type="button" className="sa-preset-btn" onClick={() => applyPreset("all")}>
                  Select All (11)
                </button>
                <button type="button" className="sa-preset-btn" onClick={() => applyPreset("catalog")}>
                  Catalog & Inventory
                </button>
                <button type="button" className="sa-preset-btn" onClick={() => applyPreset("sales")}>
                  Orders & Returns
                </button>
                <button type="button" className="sa-preset-btn" onClick={() => applyPreset("support")}>
                  Support & Reviews
                </button>
                <button type="button" className="sa-preset-btn" onClick={() => applyPreset("clear")}>
                  Clear All
                </button>
              </div>
            </div>

            {/* Permissions Grid */}
            <div className="sa-perm-grid">
              {AVAILABLE_PERMISSIONS.map((perm) => {
                const isChecked = selectedPermissions.includes(perm.key);
                return (
                  <div
                    key={perm.key}
                    id={`sa-perm-toggle-${perm.key}`}
                    className={`sa-perm-item ${isChecked ? "checked" : ""}`}
                    onClick={() => handleTogglePermission(perm.key)}
                  >
                    <div className="sa-checkbox-custom">
                      {isChecked && <Check size={14} />}
                    </div>
                    <div className="sa-perm-info">
                      <h4>{perm.label}</h4>
                      <p>{perm.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Row */}
          <div style={{ marginTop: 32, display: "flex", justifyContent: "flex-end", gap: 14 }}>
            <button
              type="button"
              className="sa-btn-secondary"
              onClick={() => onNavigate("/superadmin/manage-admins")}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="sa-btn-primary"
              disabled={loading}
              id="sa-submit-new-admin"
              style={{ padding: "11px 28px", fontSize: 14 }}
            >
              {loading ? (
                <>
                  <div className="sa-spinner" />
                  <span>Provisioning Account...</span>
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  <span>Create Administrator Account</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
