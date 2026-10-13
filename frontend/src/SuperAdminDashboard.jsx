import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Users,
  UserCheck,
  UserX,
  Package,
  ShoppingCart,
  History,
  UserPlus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Layers
} from "lucide-react";
import "./superadmin.css";

const API_BASE = "http://localhost:5000/api";

export default function SuperAdminDashboard({ token, onNavigate }) {
  const [stats, setStats] = useState({
    totalAdmins: 0,
    activeAdmins: 0,
    inactiveAdmins: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [adminsList, setAdminsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [statsRes, adminsRes] = await Promise.all([
        axios.get(`${API_BASE}/superadmin/stats`, { headers, withCredentials: true }),
        axios.get(`${API_BASE}/superadmin/admins?limit=5`, { headers, withCredentials: true })
      ]);

      if (statsRes.data?.success) {
        setStats(statsRes.data.stats || {});
        setRecentActivities(statsRes.data.recentActivities || []);
      }
      if (adminsRes.data?.success) {
        setAdminsList(adminsRes.data.admins || []);
      }
    } catch (err) {
      console.error("Error loading Super Admin dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "Just now";
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div>
      {/* 1. Metrics Grid */}
      <div className="sa-stats-grid">
        {/* Total Admins */}
        <div className="sa-stat-card" style={{ "--card-accent": "#8b5cf6", "--icon-bg": "rgba(139, 92, 246, 0.15)" }}>
          <div className="sa-stat-header">
            <span className="sa-stat-label">Total Admins</span>
            <div className="sa-stat-icon-wrap">
              <Users size={20} />
            </div>
          </div>
          <div className="sa-stat-value" id="sa-stat-total-admins">
            {loading ? "..." : stats.totalAdmins}
          </div>
          <div className="sa-stat-subtext">All registered administrators</div>
        </div>

        {/* Active Admins */}
        <div className="sa-stat-card" style={{ "--card-accent": "#10b981", "--icon-bg": "rgba(16, 185, 129, 0.15)" }}>
          <div className="sa-stat-header">
            <span className="sa-stat-label">Active Admins</span>
            <div className="sa-stat-icon-wrap">
              <UserCheck size={20} />
            </div>
          </div>
          <div className="sa-stat-value" style={{ color: "#34d399" }} id="sa-stat-active-admins">
            {loading ? "..." : stats.activeAdmins}
          </div>
          <div className="sa-stat-subtext">Authorized & active accounts</div>
        </div>

        {/* Inactive Admins */}
        <div className="sa-stat-card" style={{ "--card-accent": "#ef4444", "--icon-bg": "rgba(239, 68, 68, 0.15)" }}>
          <div className="sa-stat-header">
            <span className="sa-stat-label">Inactive Admins</span>
            <div className="sa-stat-icon-wrap">
              <UserX size={20} />
            </div>
          </div>
          <div className="sa-stat-value" style={{ color: stats.inactiveAdmins > 0 ? "#f87171" : "#94a3b8" }} id="sa-stat-inactive-admins">
            {loading ? "..." : stats.inactiveAdmins}
          </div>
          <div className="sa-stat-subtext">Deactivated / suspended accounts</div>
        </div>

        {/* Total Products */}
        <div className="sa-stat-card" style={{ "--card-accent": "#3b82f6", "--icon-bg": "rgba(59, 130, 246, 0.15)" }}>
          <div className="sa-stat-header">
            <span className="sa-stat-label">Store Products</span>
            <div className="sa-stat-icon-wrap">
              <Package size={20} />
            </div>
          </div>
          <div className="sa-stat-value" id="sa-stat-total-products">
            {loading ? "..." : stats.totalProducts}
          </div>
          <div className="sa-stat-subtext">Catalog items in database</div>
        </div>

        {/* Total Orders */}
        <div className="sa-stat-card" style={{ "--card-accent": "#f59e0b", "--icon-bg": "rgba(245, 158, 11, 0.15)" }}>
          <div className="sa-stat-header">
            <span className="sa-stat-label">Store Orders</span>
            <div className="sa-stat-icon-wrap">
              <ShoppingCart size={20} />
            </div>
          </div>
          <div className="sa-stat-value" id="sa-stat-total-orders">
            {loading ? "..." : stats.totalOrders}
          </div>
          <div className="sa-stat-subtext">Customer purchase records</div>
        </div>
      </div>

      {/* 2. Quick Actions Bar */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 32 }}>
        <button
          className="sa-btn-primary"
          onClick={() => onNavigate("/superadmin/create-admin")}
          id="sa-dash-quick-create"
        >
          <UserPlus size={16} />
          <span>Provision New Admin</span>
        </button>

        <button
          className="sa-btn-secondary"
          onClick={() => onNavigate("/superadmin/manage-admins")}
          id="sa-dash-quick-manage"
        >
          <Users size={16} />
          <span>Manage Administrator Accounts</span>
        </button>

        <button
          className="sa-btn-secondary"
          onClick={() => onNavigate("/superadmin/permissions")}
          id="sa-dash-quick-perms"
        >
          <ShieldCheck size={16} />
          <span>Review Permissions Matrix</span>
        </button>

        <button
          className="sa-btn-secondary"
          onClick={() => onNavigate("/superadmin/activity-logs")}
          id="sa-dash-quick-logs"
        >
          <History size={16} />
          <span>Inspect Audit Trail</span>
        </button>
      </div>

      {/* 3. Split Panels: Recent Admin Activity + Admins Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 24 }}>
        {/* Recent Admin Activity */}
        <div className="sa-panel-card" style={{ marginBottom: 0 }}>
          <div className="sa-panel-header">
            <div className="sa-panel-title">
              <h3>Recent Admin Activity</h3>
              <p>Real-time audit log of governance actions</p>
            </div>
            <button
              className="sa-link-btn"
              onClick={() => onNavigate("/superadmin/activity-logs")}
              style={{ fontSize: 12, color: "#a78bfa" }}
            >
              <span>View All Logs</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ maxHeight: 420, overflowY: "auto" }}>
            {recentActivities.length === 0 ? (
              <div style={{ padding: "36px 20px", textAlign: "center", color: "#64748b" }}>
                <History size={32} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
                <div>No administrative activities recorded yet.</div>
              </div>
            ) : (
              recentActivities.map((act) => (
                <div key={act._id} className="sa-log-item">
                  <div className="sa-log-icon">
                    <History size={16} />
                  </div>
                  <div className="sa-log-content">
                    <div className="sa-log-desc">{act.description}</div>
                    <div className="sa-log-meta">
                      <span>By: {act.performedBy?.name || "System"}</span>
                      <span>•</span>
                      <span>{formatTimeAgo(act.createdAt)}</span>
                      {act.ipAddress && (
                        <>
                          <span>•</span>
                          <span>IP: {act.ipAddress}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Admins Quick Overview */}
        <div className="sa-panel-card" style={{ marginBottom: 0 }}>
          <div className="sa-panel-header">
            <div className="sa-panel-title">
              <h3>Administrators Overview</h3>
              <p>Active accounts and assigned permissions</p>
            </div>
            <button
              className="sa-link-btn"
              onClick={() => onNavigate("/superadmin/manage-admins")}
              style={{ fontSize: 12, color: "#a78bfa" }}
            >
              <span>Manage All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="sa-table-responsive">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Administrator</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                </tr>
              </thead>
              <tbody>
                {adminsList.map((a) => (
                  <tr key={a._id}>
                    <td>
                      <div className="sa-user-cell">
                        <div className="sa-user-avatar">
                          {a.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="sa-user-name-cell">{a.name}</div>
                          <div className="sa-user-email-cell">{a.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={a.role === "superadmin" ? "sa-badge sa-badge-superadmin" : "sa-badge sa-badge-admin"}>
                        {a.adminRoleTitle || a.role}
                      </span>
                    </td>
                    <td>
                      <span className={a.isActive ? "sa-badge sa-badge-active" : "sa-badge sa-badge-inactive"}>
                        {a.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "#94a3b8" }}>
                      {a.lastLogin ? formatTimeAgo(a.lastLogin) : "Never logged in"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
