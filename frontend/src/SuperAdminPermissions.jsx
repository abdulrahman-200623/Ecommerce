import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  ShieldCheck,
  Check,
  X,
  Layers,
  Info,
  Lock,
  Search,
  Sparkles,
  Save,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import "./superadmin.css";

const API_BASE = "http://localhost:5000/api";

const ALL_PERMISSIONS = [
  { key: "dashboard", label: "Dashboard", category: "General", description: "View analytics overview and summary" },
  { key: "products", label: "Products View", category: "Catalog", description: "Browse catalog products and details" },
  { key: "products_manage", label: "Product Manage", category: "Catalog", description: "Create, edit, and delete products" },
  { key: "categories", label: "Categories", category: "Catalog", description: "Create and rename categories" },
  { key: "orders", label: "Orders", category: "Sales", description: "Update order status and fulfillment" },
  { key: "customers", label: "Customers", category: "Users", description: "Inspect customer accounts and history" },
  { key: "returns", label: "Returns", category: "Sales", description: "Review and approve/reject return requests" },
  { key: "coupons", label: "Flash Sales", category: "Marketing", description: "Manage discount codes and flash sales" },
  { key: "inventory", label: "Inventory", category: "Catalog", description: "Perform stock replenishment adjustments" },
  { key: "reports", label: "Reports", category: "Analytics", description: "View revenue analytics & export data" },
  { key: "reviews", label: "Reviews", category: "Content", description: "Moderate ratings and delete spam reviews" }
];

export default function SuperAdminPermissions({ token, onNavigate }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getHeaders = () => (token ? { Authorization: `Bearer ${token}` } : {});

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/superadmin/admins?limit=50`, {
        headers: getHeaders(),
        withCredentials: true
      });
      if (res.data?.success) {
        setAdmins(res.data.admins || []);
      }
    } catch (err) {
      console.error("Error loading permissions matrix:", err);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = async (admin, permKey) => {
    if (admin.role === "superadmin") {
      showToast("Super Admin has implicit root access to all modules.", "error");
      return;
    }

    const currentPerms = admin.permissions || [];
    const hasPerm = currentPerms.includes(permKey);
    const updated = hasPerm
      ? currentPerms.filter((k) => k !== permKey)
      : [...currentPerms, permKey];

    // Optimistic UI update
    setAdmins((prev) =>
      prev.map((a) => (a._id === admin._id ? { ...a, permissions: updated } : a))
    );

    try {
      const res = await axios.put(
        `${API_BASE}/superadmin/admins/${admin._id}`,
        { permissions: updated },
        { headers: getHeaders(), withCredentials: true }
      );
      if (res.data?.success) {
        showToast(`Updated '${permKey}' permission for ${admin.name}.`);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update permission", "error");
      fetchAdmins(); // Revert
    }
  };

  const filteredAdmins = admins.filter(
    (a) =>
      !searchQuery.trim() ||
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="sa-toast" style={{ borderColor: toast.type === "error" ? "rgba(239, 68, 68, 0.4)" : "rgba(16, 185, 129, 0.4)" }}>
          {toast.type === "error" ? <AlertTriangle size={18} color="#f87171" /> : <CheckCircle2 size={18} color="#34d399" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. Explanatory Overview */}
      <div className="sa-panel-card">
        <div className="sa-panel-header">
          <div className="sa-panel-title">
            <h3>Role-Based Access Control (RBAC) Architecture</h3>
            <p>Every admin is granted explicit access to modules on both frontend UI and backend API</p>
          </div>
          <div className="sa-search-input-box">
            <input
              type="text"
              placeholder="Search admin in matrix..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="sa-input-icon" size={16} />
          </div>
        </div>

        {/* 2. Interactive Matrix Table */}
        <div className="sa-table-responsive">
          <table className="sa-table" style={{ fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ minWidth: 200 }}>Administrator</th>
                {ALL_PERMISSIONS.map((perm) => (
                  <th key={perm.key} style={{ textAlign: "center", minWidth: 90 }} title={perm.description}>
                    {perm.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: "center", padding: 30 }}>
                    <div className="sa-spinner" style={{ margin: "0 auto" }} />
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => {
                  const isSuperAdmin = admin.role === "superadmin";
                  return (
                    <tr key={admin._id}>
                      <td>
                        <div style={{ fontWeight: 700, color: "#fff" }}>{admin.name}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{admin.email}</div>
                        <div style={{ marginTop: 2 }}>
                          <span className={isSuperAdmin ? "sa-badge sa-badge-superadmin" : "sa-badge sa-badge-admin"} style={{ fontSize: 10, padding: "1px 6px" }}>
                            {admin.adminRoleTitle || admin.role}
                          </span>
                        </div>
                      </td>

                      {ALL_PERMISSIONS.map((perm) => {
                        const hasPerm = isSuperAdmin || (admin.permissions || []).includes(perm.key);
                        return (
                          <td key={perm.key} style={{ textAlign: "center" }}>
                            <button
                              type="button"
                              onClick={() => togglePermission(admin, perm.key)}
                              disabled={isSuperAdmin}
                              title={`${admin.name}: ${hasPerm ? "Revoke" : "Grant"} ${perm.label}`}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 8,
                                border: hasPerm ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(255, 255, 255, 0.08)",
                                background: hasPerm ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.02)",
                                color: hasPerm ? "#34d399" : "#475569",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: isSuperAdmin ? "default" : "pointer",
                                transition: "all 0.15s ease"
                              }}
                            >
                              {hasPerm ? <Check size={16} /> : <X size={14} />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Permissions Documentation Cards */}
      <div className="sa-panel-card">
        <div className="sa-panel-header">
          <div className="sa-panel-title">
            <h3>Permissions Reference Guide</h3>
            <p>Module capabilities and backend protection boundaries</p>
          </div>
        </div>

        <div style={{ padding: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {ALL_PERMISSIONS.map((perm) => (
            <div
              key={perm.key}
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--sa-border)",
                borderRadius: 14,
                padding: 16
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontWeight: 700, color: "#ffffff", fontSize: 14 }}>{perm.label}</span>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 12, background: "rgba(139, 92, 246, 0.15)", color: "#c084fc", fontWeight: 600 }}>
                  {perm.key}
                </span>
              </div>
              <p style={{ fontSize: 12.5, color: "#94a3b8", margin: 0, lineHeight: 1.45 }}>
                {perm.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
