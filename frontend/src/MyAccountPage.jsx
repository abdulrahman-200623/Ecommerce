import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Package,
  Heart,
  LogOut,
  Save,
  X,
  Lock,
  ArrowRight,
  Loader2,
  RotateCcw
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

function formatDate(dateString) {
  if (!dateString) return "Not available";
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  } catch (e) {
    return dateString;
  }
}

export default function MyAccountPage({
  user,
  token,
  onUpdateUser,
  onLogout,
  onNavigate,
  onOpenAuthModal,
  showToast
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [profileData, setProfileData] = useState(user || null);
  const [orderCount, setOrderCount] = useState(0);
  const [returnCount, setReturnCount] = useState(0);
  const [recentReturns, setRecentReturns] = useState([]);

  // Edit form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    street: "",
    city: "",
    state: "Maharashtra",
    pincode: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Sync profile data and fetch latest from backend
  useEffect(() => {
    if (!token) return;

    setFetching(true);
    // Fetch fresh profile
    axios
      .get(`${API_BASE}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        if (res.data?.success && res.data.user) {
          setProfileData(res.data.user);
          if (onUpdateUser) onUpdateUser(res.data.user);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch profile:", err);
      })
      .finally(() => {
        setFetching(false);
      });

    // Fetch user order count
    axios
      .get(`${API_BASE}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        if (res.data?.success) {
          setOrderCount(res.data.totalOrders || res.data.orders?.length || 0);
        }
      })
      .catch(() => {});

    // Fetch user returns & refund requests
    axios
      .get(`${API_BASE}/returns/my-returns`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        if (res.data?.success) {
          setReturnCount(res.data.count || res.data.returns?.length || 0);
          setRecentReturns((res.data.returns || []).slice(0, 3));
        }
      })
      .catch(() => {});
  }, [token]);

  // Populate form when starting to edit or profile changes
  useEffect(() => {
    if (profileData) {
      setFormData({
        name: profileData.name || "",
        phone: profileData.phone || "",
        street: profileData.address?.street || "",
        city: profileData.address?.city || "",
        state: profileData.address?.state || "Maharashtra",
        pincode: profileData.address?.pincode || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    }
  }, [profileData, isEditing]);

  // Validation helper
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = "Full name must be at least 2 characters.";
    }
    if (
      formData.phone.trim() &&
      !/^(\+91[\-\s]?)?[6-9]\d{9}$/.test(formData.phone.trim().replace(/\s+/g, ""))
    ) {
      errors.phone = "Please enter a valid 10-digit Indian mobile number.";
    }
    if (formData.pincode.trim() && !/^\d{6}$/.test(formData.pincode.trim())) {
      errors.pincode = "PIN code must be a 6-digit number.";
    }
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        errors.currentPassword = "Enter current password to set a new password.";
      }
      if (formData.newPassword.length < 6) {
        errors.newPassword = "New password must be at least 6 characters.";
      }
      if (formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match.";
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (!validateForm()) {
      setErrorMessage("Please correct the highlighted form errors.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: {
          street: formData.street.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim()
        }
      };

      if (formData.newPassword) {
        payload.currentPassword = formData.currentPassword;
        payload.newPassword = formData.newPassword;
      }

      const res = await axios.put(`${API_BASE}/users/profile`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success && res.data.user) {
        setProfileData(res.data.user);
        if (onUpdateUser) onUpdateUser(res.data.user);

        // Also update saved customer address in local storage for checkout
        localStorage.setItem("techzone_customer_name", res.data.user.name);
        if (res.data.user.phone) localStorage.setItem("techzone_customer_phone", res.data.user.phone);
        if (res.data.user.address?.street) localStorage.setItem("techzone_saved_address", res.data.user.address.street);
        if (res.data.user.address?.city) localStorage.setItem("techzone_saved_city", res.data.user.address.city);
        if (res.data.user.address?.state) localStorage.setItem("techzone_saved_state", res.data.user.address.state);
        if (res.data.user.address?.pincode) localStorage.setItem("techzone_saved_pincode", res.data.user.address.pincode);

        setSuccessMessage("Profile updated successfully!");
        if (showToast) {
          showToast("Profile Updated", "Your account information was saved.", "cart-add", "✓");
        }
        setIsEditing(false);
      } else {
        throw new Error(res.data?.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error("Save profile error:", err);
      setErrorMessage(
        err.response?.data?.message ||
        err.message ||
        "An unexpected error occurred while updating your profile."
      );
    } finally {
      setLoading(false);
    }
  };

  // If user is not authenticated
  if (!token || !user) {
    return (
      <main className="account-page-container">
        <div className="account-breadcrumb">
          <button onClick={() => onNavigate("/")}>Home</button>
          <span className="divider">/</span>
          <span className="current">My Account</span>
        </div>

        <div className="empty-state-card">
          <div className="empty-state-icon-wrap">
            <User size={38} />
          </div>
          <h2>Sign In to Access Your Account</h2>
          <p>
            Manage your personal profile, review saved delivery addresses, track previous
            electronics orders, and view your purchase history in real time.
          </p>
          <button className="btn-primary" onClick={onOpenAuthModal} id="account-login-prompt-btn">
            Sign In / Create Account <ArrowRight size={16} />
          </button>
        </div>
      </main>
    );
  }

  const currentUser = profileData || user;
  const fullAddress = [
    currentUser.address?.street,
    currentUser.address?.city,
    currentUser.address?.state,
    currentUser.address?.pincode
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="account-page-container" id="my-account-section">
      {/* Breadcrumb */}
      <div className="account-breadcrumb">
        <button onClick={() => onNavigate("/")}>Home</button>
        <span className="divider">/</span>
        <span className="current">My Account</span>
      </div>

      {/* Header */}
      <div className="account-page-header">
        <div className="account-header-title">
          <h1>
            <User size={28} color="#38bdf8" /> My TechZone Account
          </h1>
          <p>View and manage your personal details, default shipping address, and security.</p>
        </div>
        <div className="account-header-actions">
          {!isEditing && (
            <button
              className="btn-primary"
              onClick={() => {
                setIsEditing(true);
                setSuccessMessage("");
                setErrorMessage("");
              }}
              id="edit-profile-btn"
            >
              <Edit3 size={15} /> Edit Profile
            </button>
          )}
          <button className="btn-secondary" onClick={() => onNavigate("/my-orders")} id="account-goto-orders-btn">
            <Package size={16} /> Order History ({orderCount})
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="alert-banner success" role="status">
          <CheckCircle2 size={18} />
          <div>{successMessage}</div>
        </div>
      )}

      {errorMessage && (
        <div className="alert-banner error" role="alert">
          <AlertCircle size={18} />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Account Layout */}
      <div className="account-layout">
        {/* Left Sidebar Card */}
        <aside className="account-sidebar-card">
          <div className="user-profile-badge">
            <div className="user-avatar-large">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
            </div>
            <h2>{currentUser.name || "Customer"}</h2>
            <div className="user-email-text">{currentUser.email}</div>
            <span className="role-pill">
              <ShieldCheck size={12} /> {currentUser.role === "admin" ? "Verified Admin" : "Verified Customer"}
            </span>
          </div>

          <nav className="account-nav-list">
            <button
              className={`account-nav-item ${!isEditing ? "active" : ""}`}
              onClick={() => setIsEditing(false)}
            >
              <div className="account-nav-item-left">
                <User size={16} /> Personal Profile
              </div>
            </button>
            <button
              className="account-nav-item"
              onClick={() => onNavigate("/my-orders")}
              id="sidebar-my-orders-btn"
            >
              <div className="account-nav-item-left">
                <Package size={16} /> Order History
              </div>
              {orderCount > 0 && <span className="account-nav-badge">{orderCount}</span>}
            </button>
            <button
              className="account-nav-item"
              onClick={() => onNavigate("/my-returns")}
              id="sidebar-my-returns-btn"
            >
              <div className="account-nav-item-left">
                <RotateCcw size={16} /> Returns & Refunds
              </div>
              {returnCount > 0 && (
                <span className="account-nav-badge" style={{ background: "#f59e0b", color: "#000", fontWeight: "700" }}>
                  {returnCount}
                </span>
              )}
            </button>
            <button
              className="account-nav-item"
              onClick={() => onNavigate("/wishlist")}
              id="sidebar-my-wishlist-btn"
            >
              <div className="account-nav-item-left">
                <Heart size={16} /> Saved Wishlist
              </div>
            </button>
          </nav>

          <div className="account-sidebar-footer">
            <button className="logout-sidebar-btn" onClick={onLogout} id="account-sign-out-btn">
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </aside>

        {/* Right Content Panel */}
        <div className="account-main-panel">
          {isEditing ? (
            /* Edit Profile Mode */
            <div className="profile-card">
              <div className="profile-card-header">
                <h3 className="profile-card-title">
                  <Edit3 size={18} color="#38bdf8" /> Edit Profile Information
                </h3>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsEditing(false)}
                  style={{ padding: "6px 12px", fontSize: "12px" }}
                >
                  <X size={14} /> Cancel
                </button>
              </div>

              <form onSubmit={handleSaveProfile}>
                <div className="edit-form-grid">
                  {/* Full Name */}
                  <div className="edit-form-group">
                    <label className="edit-form-label">
                      <User size={14} /> Full Name <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      className={`edit-form-input ${formErrors.name ? "error" : ""}`}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="e.g. Abdulrahman"
                    />
                    {formErrors.name && (
                      <span className="edit-field-error">
                        <AlertCircle size={12} /> {formErrors.name}
                      </span>
                    )}
                  </div>

                  {/* Email (Readonly) */}
                  <div className="edit-form-group">
                    <label className="edit-form-label">
                      <Mail size={14} /> Email Address (Account ID)
                    </label>
                    <input
                      type="email"
                      className="edit-form-input"
                      value={currentUser.email}
                      disabled
                      title="Email address is associated with your TechZone login ID."
                    />
                  </div>

                  {/* Phone */}
                  <div className="edit-form-group">
                    <label className="edit-form-label">
                      <Phone size={14} /> Mobile Phone Number
                    </label>
                    <input
                      type="tel"
                      className={`edit-form-input ${formErrors.phone ? "error" : ""}`}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. 9876543210"
                    />
                    {formErrors.phone && (
                      <span className="edit-field-error">
                        <AlertCircle size={12} /> {formErrors.phone}
                      </span>
                    )}
                  </div>

                  {/* Saved Delivery Address */}
                  <div className="edit-form-group full-width">
                    <label className="edit-form-label">
                      <MapPin size={14} /> Street Address / Flat / Building
                    </label>
                    <input
                      type="text"
                      className="edit-form-input"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      placeholder="e.g. Flat 402, Skyline Towers, Powai"
                    />
                  </div>

                  <div className="edit-form-group">
                    <label className="edit-form-label">City</label>
                    <input
                      type="text"
                      className="edit-form-input"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Mumbai"
                    />
                  </div>

                  <div className="edit-form-group">
                    <label className="edit-form-label">State</label>
                    <select
                      className="edit-form-input"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="edit-form-group">
                    <label className="edit-form-label">PIN Code (6 digits)</label>
                    <input
                      type="text"
                      className={`edit-form-input ${formErrors.pincode ? "error" : ""}`}
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      maxLength={6}
                      placeholder="e.g. 400076"
                    />
                    {formErrors.pincode && (
                      <span className="edit-field-error">
                        <AlertCircle size={12} /> {formErrors.pincode}
                      </span>
                    )}
                  </div>

                  {/* Optional Password Change */}
                  <div className="edit-form-section-title">
                    <Lock size={15} /> Change Password (Optional)
                  </div>

                  <div className="edit-form-group full-width">
                    <label className="edit-form-label">Current Password</label>
                    <input
                      type="password"
                      className={`edit-form-input ${formErrors.currentPassword ? "error" : ""}`}
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                      placeholder="Enter current password if changing"
                    />
                    {formErrors.currentPassword && (
                      <span className="edit-field-error">
                        <AlertCircle size={12} /> {formErrors.currentPassword}
                      </span>
                    )}
                  </div>

                  <div className="edit-form-group">
                    <label className="edit-form-label">New Password</label>
                    <input
                      type="password"
                      className={`edit-form-input ${formErrors.newPassword ? "error" : ""}`}
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      placeholder="At least 6 characters"
                    />
                    {formErrors.newPassword && (
                      <span className="edit-field-error">
                        <AlertCircle size={12} /> {formErrors.newPassword}
                      </span>
                    )}
                  </div>

                  <div className="edit-form-group">
                    <label className="edit-form-label">Confirm New Password</label>
                    <input
                      type="password"
                      className={`edit-form-input ${formErrors.confirmPassword ? "error" : ""}`}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Repeat new password"
                    />
                    {formErrors.confirmPassword && (
                      <span className="edit-field-error">
                        <AlertCircle size={12} /> {formErrors.confirmPassword}
                      </span>
                    )}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="edit-form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsEditing(false)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={loading} id="save-profile-btn">
                    {loading ? (
                      <>
                        <Loader2 size={16} className="spinner-icon" /> Saving Profile...
                      </>
                    ) : (
                      <>
                        <Save size={16} /> Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* View Profile Mode */
            <div className="profile-card">
              <div className="profile-card-header">
                <h3 className="profile-card-title">
                  <ShieldCheck size={20} color="#10b981" /> Profile Overview
                </h3>
                <button
                  className="btn-outline-primary"
                  onClick={() => setIsEditing(true)}
                  id="view-mode-edit-btn"
                >
                  <Edit3 size={14} /> Edit Profile
                </button>
              </div>

              <div className="profile-info-grid">
                {/* Full Name */}
                <div className="profile-info-item">
                  <span className="profile-info-label">
                    <User size={13} /> Full Name
                  </span>
                  <div className="profile-info-value">{currentUser.name || "Customer"}</div>
                </div>

                {/* Email Address */}
                <div className="profile-info-item">
                  <span className="profile-info-label">
                    <Mail size={13} /> Email Address
                  </span>
                  <div className="profile-info-value">{currentUser.email}</div>
                </div>

                {/* Phone Number */}
                <div className="profile-info-item">
                  <span className="profile-info-label">
                    <Phone size={13} /> Phone Number
                  </span>
                  <div className={`profile-info-value ${!currentUser.phone ? "not-provided" : ""}`}>
                    {currentUser.phone || "No phone number added"}
                  </div>
                </div>

                {/* Account Creation Date */}
                <div className="profile-info-item">
                  <span className="profile-info-label">
                    <Calendar size={13} /> Account Creation Date
                  </span>
                  <div className="profile-info-value">{formatDate(currentUser.createdAt)}</div>
                </div>

                {/* Saved Delivery Address */}
                <div className="profile-address-box">
                  <MapPin size={22} className="profile-address-icon" />
                  <div className="profile-address-content">
                    <span className="profile-info-label">Saved Delivery Address</span>
                    <div
                      className={`profile-info-value ${!fullAddress ? "not-provided" : ""}`}
                      style={{ marginTop: "4px", lineHeight: "1.5" }}
                    >
                      {fullAddress || "No saved shipping address yet. Click 'Edit Profile' to add one."}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Summary Strip */}
              <div
                style={{
                  marginTop: "30px",
                  paddingTop: "20px",
                  borderTop: "1px solid #333a40",
                  display: "flex",
                  gap: "20px",
                  flexWrap: "wrap"
                }}
              >
                <div
                  style={{
                    background: "#171b1e",
                    border: "1px solid #2d3439",
                    borderRadius: "10px",
                    padding: "14px 20px",
                    flex: "1",
                    minWidth: "180px",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    cursor: "pointer"
                  }}
                  onClick={() => onNavigate("/my-orders")}
                >
                  <Package size={26} color="#38bdf8" />
                  <div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase" }}>Total Orders</div>
                    <div style={{ fontSize: "20px", fontWeight: "800", color: "#f8fafc" }}>{orderCount}</div>
                  </div>
                </div>

                <div
                  style={{
                    background: "#171b1e",
                    border: "1px solid #2d3439",
                    borderRadius: "10px",
                    padding: "14px 20px",
                    flex: "1",
                    minWidth: "180px",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    cursor: "pointer"
                  }}
                  onClick={() => onNavigate("/my-returns")}
                  id="account-returns-summary-card"
                >
                  <RotateCcw size={26} color="#f59e0b" />
                  <div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase" }}>Returns & Refunds</div>
                    <div style={{ fontSize: "20px", fontWeight: "800", color: "#f8fafc" }}>
                      {returnCount} {returnCount === 1 ? "Request" : "Requests"}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: "#171b1e",
                    border: "1px solid #2d3439",
                    borderRadius: "10px",
                    padding: "14px 20px",
                    flex: "1",
                    minWidth: "180px",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    cursor: "pointer"
                  }}
                  onClick={() => onNavigate("/wishlist")}
                >
                  <Heart size={26} color="#ef4444" />
                  <div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase" }}>Wishlist Access</div>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#38bdf8" }}>View Saved Tech →</div>
                  </div>
                </div>
              </div>

              {/* Track Return / Refund Dedicated Section */}
              <div style={{ marginTop: "32px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h4 style={{ margin: 0, fontSize: "16px", color: "#f8fafc", display: "flex", alignItems: "center", gap: "8px" }}>
                    <RotateCcw size={18} color="#f59e0b" /> Track Return / Refund
                  </h4>
                  <button
                    className="btn-secondary"
                    onClick={() => onNavigate("/my-returns")}
                    style={{ padding: "6px 14px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                    id="account-view-all-returns-btn"
                  >
                    View All Returns ({returnCount}) <ArrowRight size={13} />
                  </button>
                </div>

                {recentReturns.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {recentReturns.map((ret) => {
                      const retNum = ret.returnNumber || ret._id;
                      const primaryItem = ret.items?.[0];
                      return (
                        <div
                          key={ret._id || retNum}
                          style={{
                            background: "#171b1e",
                            border: "1px solid #2d3439",
                            borderRadius: "10px",
                            padding: "12px 16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "12px"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                            {primaryItem?.image && (
                              <img
                                src={primaryItem.image}
                                alt={primaryItem.name}
                                style={{ width: "40px", height: "40px", objectFit: "contain", background: "#fff", borderRadius: "6px", padding: "2px" }}
                              />
                            )}
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <strong style={{ color: "#38bdf8", fontSize: "13px" }}>#{retNum}</strong>
                                <span style={{ fontSize: "12px", color: "#64748b" }}>•</span>
                                <span style={{ fontSize: "12px", color: "#94a3b8" }}>Order #{ret.orderNumber}</span>
                              </div>
                              <div style={{ color: "#f1f5f9", fontSize: "13px", fontWeight: "500", marginTop: "2px" }}>
                                {primaryItem?.name || ret.reason}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                            <span className={`ret-status-pill status-${(ret.status || "").toLowerCase().replace(/\s+/g, "-")}`}>
                              {ret.status}
                            </span>
                            <button
                              className="btn-primary"
                              onClick={() => onNavigate(`/my-returns/${retNum}`)}
                              style={{ padding: "6px 12px", fontSize: "12px" }}
                            >
                              Track →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px dashed #334155",
                      borderRadius: "10px",
                      padding: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "14px"
                    }}
                  >
                    <div>
                      <div style={{ color: "#f1f5f9", fontSize: "14px", fontWeight: "600", marginBottom: "4px" }}>
                        No Active Return or Refund Requests
                      </div>
                      <div style={{ color: "#94a3b8", fontSize: "12px" }}>
                        TechZone offers a 7-day hassle-free return window on delivered purchases.
                      </div>
                    </div>
                    <button
                      className="btn-secondary"
                      onClick={() => onNavigate("/my-orders")}
                      style={{ padding: "8px 16px", fontSize: "12px" }}
                    >
                      View Delivered Orders
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
