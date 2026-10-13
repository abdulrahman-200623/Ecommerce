import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Users,
  Search,
  Filter,
  Edit,
  ShieldCheck,
  Power,
  KeyRound,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Check,
  X,
  RefreshCw,
  Copy,
  Clock,
  Layers,
  ShieldAlert,
  UserCheck,
  UserX
} from "lucide-react";
import "./superadmin.css";

const API_BASE = "http://localhost:5000/api";

const AVAILABLE_PERMISSIONS = [
  { key: "dashboard", label: "Dashboard Access", description: "View admin overview & key metrics" },
  { key: "products", label: "Product Management", description: "View catalog and product list" },
  { key: "products_manage", label: "Add, Edit & Delete Products", description: "Create, modify, and delete products" },
  { key: "categories", label: "Category Management", description: "Create, rename, and manage categories" },
  { key: "orders", label: "Order Management", description: "View orders and update fulfillment status" },
  { key: "customers", label: "Customer Management", description: "View customer profiles and order histories" },
  { key: "returns", label: "Return & Refund Management", description: "Review and approve/reject return requests" },
  { key: "coupons", label: "Coupon & Flash Sale Management", description: "Manage discount codes and flash sales" },
  { key: "inventory", label: "Inventory Management", description: "Adjust stock levels and warehouse inventory" },
  { key: "reports", label: "Reports & Analytics", description: "Access store performance analytics and reports" },
  { key: "reviews", label: "Customer Reviews", description: "Moderate, hide, and manage product reviews" }
];

export default function SuperAdminManageAdmins({ token, superAdminUser, onNavigate }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  // Modals state
  const [editingAdmin, setEditingAdmin] = useState(null); // Edit profile modal
  const [permModalAdmin, setPermModalAdmin] = useState(null); // Edit permissions modal
  const [resetPwdAdmin, setResetPwdAdmin] = useState(null); // Reset password modal
  const [deletingAdmin, setDeletingAdmin] = useState(null); // Delete confirmation modal

  // Feedback notifications
  const [toast, setToast] = useState(null);
  const [tempPassword, setTempPassword] = useState("");
  const [pwdCopied, setPwdCopied] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const getHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetchAdmins();
  }, [searchQuery, statusFilter, roleFilter]);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("q", searchQuery.trim());
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (roleFilter !== "all") params.append("role", roleFilter);

      const res = await axios.get(`${API_BASE}/superadmin/admins?${params.toString()}`, {
        headers: getHeaders(),
        withCredentials: true
      });

      if (res.data?.success) {
        setAdmins(res.data.admins || []);
      }
    } catch (err) {
      console.error("Failed to fetch admins:", err);
      showToast(err.response?.data?.message || "Failed to load admins", "error");
    } finally {
      setLoading(false);
    }
  };

  // 1. Toggle Active / Inactive Status
  const handleToggleStatus = async (admin) => {
    if (String(admin._id) === String(superAdminUser?._id)) {
      showToast("You cannot deactivate your own Super Admin account.", "error");
      return;
    }
    if (admin.role === "superadmin") {
      showToast("Super Administrator status cannot be disabled.", "error");
      return;
    }

    const nextStatus = !admin.isActive;
    try {
      const res = await axios.patch(
        `${API_BASE}/superadmin/admins/${admin._id}/status`,
        { isActive: nextStatus },
        { headers: getHeaders(), withCredentials: true }
      );

      if (res.data?.success) {
        showToast(`Account "${admin.name}" ${nextStatus ? "activated" : "deactivated"} successfully.`);
        fetchAdmins();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update status", "error");
    }
  };

  // 2. Save Edit Admin Details
  const handleSaveEditAdmin = async (e) => {
    e.preventDefault();
    if (!editingAdmin) return;

    try {
      const res = await axios.put(
        `${API_BASE}/superadmin/admins/${editingAdmin._id}`,
        {
          name: editingAdmin.name,
          phone: editingAdmin.phone,
          adminRoleTitle: editingAdmin.adminRoleTitle,
          isActive: editingAdmin.isActive
        },
        { headers: getHeaders(), withCredentials: true }
      );

      if (res.data?.success) {
        showToast(`Admin details updated for "${editingAdmin.name}".`);
        setEditingAdmin(null);
        fetchAdmins();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update admin details", "error");
    }
  };

  // 3. Save Permissions Modal
  const handleSavePermissions = async () => {
    if (!permModalAdmin) return;

    try {
      const res = await axios.put(
        `${API_BASE}/superadmin/admins/${permModalAdmin._id}`,
        { permissions: permModalAdmin.permissions },
        { headers: getHeaders(), withCredentials: true }
      );

      if (res.data?.success) {
        showToast(`Permissions updated for "${permModalAdmin.name}".`);
        setPermModalAdmin(null);
        fetchAdmins();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update permissions", "error");
    }
  };

  // 4. Reset Password
  const handleExecuteResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPwdAdmin || !tempPassword) return;

    try {
      const res = await axios.post(
        `${API_BASE}/superadmin/admins/${resetPwdAdmin._id}/reset-password`,
        { newPassword: tempPassword },
        { headers: getHeaders(), withCredentials: true }
      );

      if (res.data?.success) {
        showToast(res.data.message || "Password reset successfully!");
        setResetPwdAdmin(null);
        setTempPassword("");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reset password", "error");
    }
  };

  // 5. Delete Admin
  const handleConfirmDelete = async () => {
    if (!deletingAdmin) return;

    try {
      const res = await axios.delete(
        `${API_BASE}/superadmin/admins/${deletingAdmin._id}`,
        { headers: getHeaders(), withCredentials: true }
      );

      if (res.data?.success) {
        showToast(`Administrator "${deletingAdmin.name}" permanently deleted.`);
        setDeletingAdmin(null);
        fetchAdmins();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete administrator", "error");
    }
  };

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTempPassword(pwd);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return "Never logged in";
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="sa-toast" style={{ borderColor: toast.type === "error" ? "rgba(239, 68, 68, 0.4)" : "rgba(16, 185, 129, 0.4)" }}>
          {toast.type === "error" ? <AlertTriangle size={18} color="#f87171" /> : <CheckCircle2 size={18} color="#34d399" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Panel Card */}
      <div className="sa-panel-card">
        {/* Panel Header & Filters */}
        <div className="sa-panel-header">
          <div className="sa-panel-title">
            <h3>Registered Administrator Accounts</h3>
            <p>Total: {admins.length} administrator(s) found</p>
          </div>

          <div className="sa-filter-bar">
            {/* Search */}
            <div className="sa-search-input-box">
              <input
                type="text"
                placeholder="Search name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="sa-search-admins-input"
              />
              <Search className="sa-input-icon" size={16} />
            </div>

            {/* Status Filter */}
            <select
              className="sa-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              id="sa-filter-status"
            >
              <option value="all">Status: All</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            {/* Role Filter */}
            <select
              className="sa-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              id="sa-filter-role"
            >
              <option value="all">Role: All</option>
              <option value="admin">Regular Admins</option>
              <option value="superadmin">Super Admins</option>
            </select>
          </div>
        </div>

        {/* Admins Table */}
        <div className="sa-table-responsive">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Administrator</th>
                <th>Role & Title</th>
                <th>Permissions</th>
                <th>Account Status</th>
                <th>Created Date</th>
                <th>Last Login</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "40px" }}>
                    <div className="sa-spinner" style={{ margin: "0 auto 10px" }} />
                    <div style={{ color: "#94a3b8", fontSize: 13 }}>Loading administrator accounts...</div>
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    <Users size={32} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
                    <div>No administrator accounts match your criteria.</div>
                  </td>
                </tr>
              ) : (
                admins.map((admin) => {
                  const isCurrentSuperAdmin = String(admin._id) === String(superAdminUser?._id);
                  const isSuperAdmin = admin.role === "superadmin";

                  return (
                    <tr key={admin._id} id={`sa-admin-row-${admin._id}`}>
                      {/* Name / Email / Phone */}
                      <td>
                        <div className="sa-user-cell">
                          <div className="sa-user-avatar" style={isSuperAdmin ? { background: "linear-gradient(135deg, #7c3aed, #2563eb)" } : {}}>
                            {admin.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="sa-user-name-cell">
                              {admin.name}
                              {isCurrentSuperAdmin && (
                                <span style={{ marginLeft: 6, fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(139, 92, 246, 0.3)", color: "#c084fc", fontWeight: 700 }}>
                                  You
                                </span>
                              )}
                            </div>
                            <div className="sa-user-email-cell">{admin.email}</div>
                            {admin.phone && (
                              <div style={{ fontSize: 11, color: "#64748b" }}>{admin.phone}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role & Title */}
                      <td>
                        <span className={isSuperAdmin ? "sa-badge sa-badge-superadmin" : "sa-badge sa-badge-admin"}>
                          {admin.adminRoleTitle || (isSuperAdmin ? "Super Administrator" : "Admin")}
                        </span>
                      </td>

                      {/* Permissions */}
                      <td>
                        {isSuperAdmin ? (
                          <span style={{ fontSize: 12, color: "#c084fc", fontWeight: 700 }}>
                            All Modules (Root)
                          </span>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa" }}>
                              {admin.permissions?.length || 0} Modules
                            </span>
                            <button
                              className="sa-preset-btn"
                              style={{ padding: "2px 8px", fontSize: 11 }}
                              onClick={() => setPermModalAdmin({ ...admin })}
                              title="Edit Permissions"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        <span className={admin.isActive ? "sa-badge sa-badge-active" : "sa-badge sa-badge-inactive"}>
                          {admin.isActive ? "Active" : "Inactive"}
                        </span>
                        {admin.mustChangePassword && (
                          <div style={{ fontSize: 10.5, color: "#f59e0b", marginTop: 4, fontWeight: 600 }}>
                            Pending Pwd Reset
                          </div>
                        )}
                      </td>

                      {/* Created */}
                      <td style={{ fontSize: 12.5, color: "#94a3b8" }}>
                        {formatDate(admin.createdAt)}
                      </td>

                      {/* Last Login */}
                      <td style={{ fontSize: 12.5, color: "#94a3b8" }}>
                        {formatRelativeTime(admin.lastLogin)}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: "right" }}>
                        <div className="sa-table-actions" style={{ justifyContent: "flex-end" }}>
                          {/* Edit Details */}
                          <button
                            className="sa-icon-btn"
                            title="Edit Details"
                            onClick={() => setEditingAdmin({ ...admin })}
                            id={`sa-edit-btn-${admin._id}`}
                          >
                            <Edit size={15} />
                          </button>

                          {/* Reset Password */}
                          <button
                            className="sa-icon-btn"
                            title="Reset Password"
                            onClick={() => {
                              setResetPwdAdmin(admin);
                              generateRandomPassword();
                            }}
                            id={`sa-reset-pwd-btn-${admin._id}`}
                          >
                            <KeyRound size={15} />
                          </button>

                          {/* Toggle Active / Inactive */}
                          {!isCurrentSuperAdmin && !isSuperAdmin && (
                            <button
                              className={`sa-icon-btn ${admin.isActive ? "" : "btn-danger"}`}
                              title={admin.isActive ? "Deactivate Account" : "Activate Account"}
                              onClick={() => handleToggleStatus(admin)}
                              id={`sa-toggle-status-btn-${admin._id}`}
                            >
                              <Power size={15} color={admin.isActive ? "#10b981" : "#ef4444"} />
                            </button>
                          )}

                          {/* Delete Account */}
                          {!isCurrentSuperAdmin && !isSuperAdmin && (
                            <button
                              className="sa-icon-btn btn-danger"
                              title="Delete Account"
                              onClick={() => setDeletingAdmin(admin)}
                              id={`sa-delete-btn-${admin._id}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          MODAL 1: EDIT ADMIN DETAILS
          ======================================================== */}
      {editingAdmin && (
        <div className="sa-modal-overlay">
          <div className="sa-modal-card">
            <div className="sa-modal-header">
              <h3>Edit Administrator: {editingAdmin.name}</h3>
              <button
                className="sa-icon-btn"
                onClick={() => setEditingAdmin(null)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditAdmin}>
              <div className="sa-modal-body">
                <div className="sa-field-group">
                  <label className="sa-label">Full Name</label>
                  <input
                    type="text"
                    className="sa-input"
                    value={editingAdmin.name}
                    onChange={(e) => setEditingAdmin({ ...editingAdmin, name: e.target.value })}
                    required
                  />
                </div>

                <div className="sa-field-group">
                  <label className="sa-label">Email Address (Read-only)</label>
                  <input
                    type="email"
                    className="sa-input"
                    value={editingAdmin.email}
                    disabled
                    style={{ opacity: 0.6 }}
                  />
                </div>

                <div className="sa-field-group">
                  <label className="sa-label">Phone Number</label>
                  <input
                    type="text"
                    className="sa-input"
                    value={editingAdmin.phone || ""}
                    onChange={(e) => setEditingAdmin({ ...editingAdmin, phone: e.target.value })}
                  />
                </div>

                {editingAdmin.role !== "superadmin" && (
                  <div className="sa-field-group">
                    <label className="sa-label">Role Designation</label>
                    <select
                      className="sa-select"
                      style={{ width: "100%", height: 46 }}
                      value={editingAdmin.adminRoleTitle || "Admin"}
                      onChange={(e) => setEditingAdmin({ ...editingAdmin, adminRoleTitle: e.target.value })}
                    >
                      <option value="Store Manager">Store Manager</option>
                      <option value="Catalog Manager">Catalog Manager</option>
                      <option value="Orders Specialist">Orders Specialist</option>
                      <option value="Customer Support Admin">Customer Support Admin</option>
                      <option value="Marketing & Promotions Admin">Marketing & Promotions Admin</option>
                      <option value="General Admin">General Admin</option>
                    </select>
                  </div>
                )}

                {String(editingAdmin._id) !== String(superAdminUser?._id) && editingAdmin.role !== "superadmin" && (
                  <div className="sa-field-group">
                    <label className="sa-label">Account Status</label>
                    <div style={{ display: "flex", gap: 14 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
                        <input
                          type="radio"
                          name="editStatus"
                          checked={editingAdmin.isActive === true}
                          onChange={() => setEditingAdmin({ ...editingAdmin, isActive: true })}
                        />
                        <span style={{ color: "#34d399" }}>Active</span>
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
                        <input
                          type="radio"
                          name="editStatus"
                          checked={editingAdmin.isActive === false}
                          onChange={() => setEditingAdmin({ ...editingAdmin, isActive: false })}
                        />
                        <span style={{ color: "#f87171" }}>Inactive (Deactivated)</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="sa-modal-footer">
                <button
                  type="button"
                  className="sa-btn-secondary"
                  onClick={() => setEditingAdmin(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sa-btn-primary"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: UPDATE PERMISSIONS MODAL
          ======================================================== */}
      {permModalAdmin && (
        <div className="sa-modal-overlay">
          <div className="sa-modal-card" style={{ maxWidth: 640 }}>
            <div className="sa-modal-header">
              <div>
                <h3>Manage Permissions: {permModalAdmin.name}</h3>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>
                  Adjust role-based module capabilities for {permModalAdmin.email}
                </p>
              </div>
              <button
                className="sa-icon-btn"
                onClick={() => setPermModalAdmin(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="sa-modal-body">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                <button
                  type="button"
                  className="sa-preset-btn"
                  onClick={() => setPermModalAdmin({ ...permModalAdmin, permissions: AVAILABLE_PERMISSIONS.map(p => p.key) })}
                >
                  Select All
                </button>
                <button
                  type="button"
                  className="sa-preset-btn"
                  onClick={() => setPermModalAdmin({ ...permModalAdmin, permissions: ["dashboard", "products", "products_manage", "categories", "inventory"] })}
                >
                  Catalog & Inventory
                </button>
                <button
                  type="button"
                  className="sa-preset-btn"
                  onClick={() => setPermModalAdmin({ ...permModalAdmin, permissions: ["dashboard", "orders", "returns", "customers"] })}
                >
                  Orders & Returns
                </button>
                <button
                  type="button"
                  className="sa-preset-btn"
                  onClick={() => setPermModalAdmin({ ...permModalAdmin, permissions: [] })}
                >
                  Clear All
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                {AVAILABLE_PERMISSIONS.map((perm) => {
                  const hasPerm = (permModalAdmin.permissions || []).includes(perm.key);
                  return (
                    <div
                      key={perm.key}
                      className={`sa-perm-item ${hasPerm ? "checked" : ""}`}
                      onClick={() => {
                        const current = permModalAdmin.permissions || [];
                        const updated = hasPerm
                          ? current.filter((k) => k !== perm.key)
                          : [...current, perm.key];
                        setPermModalAdmin({ ...permModalAdmin, permissions: updated });
                      }}
                    >
                      <div className="sa-checkbox-custom">
                        {hasPerm && <Check size={14} />}
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

            <div className="sa-modal-footer">
              <button
                type="button"
                className="sa-btn-secondary"
                onClick={() => setPermModalAdmin(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="sa-btn-primary"
                onClick={handleSavePermissions}
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: RESET PASSWORD MODAL
          ======================================================== */}
      {resetPwdAdmin && (
        <div className="sa-modal-overlay">
          <div className="sa-modal-card">
            <div className="sa-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <KeyRound size={20} color="#8b5cf6" />
                <h3>Reset Password: {resetPwdAdmin.name}</h3>
              </div>
              <button
                className="sa-icon-btn"
                onClick={() => setResetPwdAdmin(null)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleExecuteResetPassword}>
              <div className="sa-modal-body">
                <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 0 }}>
                  Enter a new temporary password for <strong>{resetPwdAdmin.email}</strong>. The admin will be required to change this password on their next login attempt.
                </p>

                <div className="sa-field-group">
                  <div className="sa-label">
                    <span>New Temporary Password</span>
                    <button
                      type="button"
                      className="sa-link-btn"
                      onClick={generateRandomPassword}
                      style={{ fontSize: 11, color: "#c084fc", fontWeight: 700 }}
                    >
                      <RefreshCw size={12} />
                      <span>Auto-Generate</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    className="sa-input"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    required
                    style={{ fontFamily: "monospace", fontSize: 14 }}
                  />
                </div>
              </div>

              <div className="sa-modal-footer">
                <button
                  type="button"
                  className="sa-btn-secondary"
                  onClick={() => setResetPwdAdmin(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sa-btn-primary"
                >
                  Set Temporary Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: DELETE CONFIRMATION MODAL
          ======================================================== */}
      {deletingAdmin && (
        <div className="sa-modal-overlay">
          <div className="sa-modal-card" style={{ maxWidth: 460 }}>
            <div className="sa-modal-header" style={{ borderColor: "rgba(239, 68, 68, 0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <AlertTriangle size={22} color="#ef4444" />
                <h3 style={{ color: "#f87171" }}>Delete Admin Account?</h3>
              </div>
              <button
                className="sa-icon-btn"
                onClick={() => setDeletingAdmin(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="sa-modal-body">
              <p style={{ color: "#f1f5f9", fontSize: 14, margin: "0 0 12px" }}>
                Are you sure you want to permanently delete administrator account:
              </p>
              <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.25)", borderRadius: 12, padding: "14px", marginBottom: 14 }}>
                <div style={{ fontWeight: 700, color: "#ffffff" }}>{deletingAdmin.name}</div>
                <div style={{ fontSize: 12, color: "#fca5a5" }}>{deletingAdmin.email}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Role: {deletingAdmin.adminRoleTitle || deletingAdmin.role}</div>
              </div>
              <p style={{ color: "#94a3b8", fontSize: 12.5, margin: 0 }}>
                This action is irreversible. The account and session tokens will be permanently revoked.
              </p>
            </div>

            <div className="sa-modal-footer">
              <button
                type="button"
                className="sa-btn-secondary"
                onClick={() => setDeletingAdmin(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="sa-btn-danger"
                onClick={handleConfirmDelete}
                id="sa-confirm-delete-btn"
              >
                Yes, Delete Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
