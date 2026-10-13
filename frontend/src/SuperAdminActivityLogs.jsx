import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Clock,
  ShieldAlert,
  UserPlus,
  KeyRound,
  Trash2,
  Power,
  Edit,
  LogIn,
  Package,
  ShoppingCart
} from "lucide-react";
import "./superadmin.css";

const API_BASE = "http://localhost:5000/api";

export default function SuperAdminActivityLogs({ token }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchLogs();
  }, [search, actionFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (actionFilter !== "all") params.append("action", actionFilter);
      params.append("limit", "50");

      const res = await axios.get(`${API_BASE}/superadmin/activity-logs?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true
      });

      if (res.data?.success) {
        setLogs(res.data.logs || []);
        setTotalCount(res.data.totalCount || 0);
      }
    } catch (err) {
      console.error("Error fetching activity logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action) => {
    switch (action) {
      case "CREATE_ADMIN":
        return { label: "Admin Created", bg: "rgba(16, 185, 129, 0.15)", color: "#34d399", icon: UserPlus };
      case "UPDATE_ADMIN":
        return { label: "Admin Updated", bg: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", icon: Edit };
      case "DEACTIVATE_ADMIN":
        return { label: "Admin Deactivated", bg: "rgba(239, 68, 68, 0.15)", color: "#f87171", icon: Power };
      case "ACTIVATE_ADMIN":
        return { label: "Admin Activated", bg: "rgba(16, 185, 129, 0.15)", color: "#34d399", icon: Power };
      case "RESET_PASSWORD":
        return { label: "Password Reset", bg: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", icon: KeyRound };
      case "DELETE_ADMIN":
        return { label: "Admin Deleted", bg: "rgba(239, 68, 68, 0.2)", color: "#f87171", icon: Trash2 };
      case "LOGIN_SUPERADMIN":
      case "LOGIN_ADMIN":
        return { label: "Admin Login", bg: "rgba(139, 92, 246, 0.15)", color: "#c084fc", icon: LogIn };
      case "PRODUCT_CREATE":
      case "PRODUCT_UPDATE":
      case "PRODUCT_DELETE":
        return { label: "Catalog Action", bg: "rgba(6, 182, 212, 0.15)", color: "#22d3ee", icon: Package };
      case "ORDER_STATUS_UPDATE":
        return { label: "Order Action", bg: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", icon: ShoppingCart };
      default:
        return { label: action, bg: "rgba(255, 255, 255, 0.08)", color: "#94a3b8", icon: History };
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="sa-panel-card">
      {/* Header and Filters */}
      <div className="sa-panel-header">
        <div className="sa-panel-title">
          <h3>Administrative Audit Trail</h3>
          <p>Recorded operations and security events ({totalCount} total events)</p>
        </div>

        <div className="sa-filter-bar">
          <div className="sa-search-input-box">
            <input
              type="text"
              placeholder="Search activity description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="sa-input-icon" size={16} />
          </div>

          <select
            className="sa-select"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="all">Action: All Actions</option>
            <option value="CREATE_ADMIN">Create Admin</option>
            <option value="UPDATE_ADMIN">Update Admin</option>
            <option value="DEACTIVATE_ADMIN">Deactivate Admin</option>
            <option value="ACTIVATE_ADMIN">Activate Admin</option>
            <option value="RESET_PASSWORD">Reset Password</option>
            <option value="DELETE_ADMIN">Delete Admin</option>
            <option value="LOGIN_SUPERADMIN">Super Admin Login</option>
            <option value="LOGIN_ADMIN">Admin Login</option>
            <option value="PRODUCT_CREATE">Product Created</option>
            <option value="ORDER_STATUS_UPDATE">Order Status</option>
          </select>

          <button
            className="sa-icon-btn"
            onClick={fetchLogs}
            title="Refresh Logs"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Logs Stream */}
      <div>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div className="sa-spinner" style={{ margin: "0 auto 10px" }} />
            <div style={{ color: "#94a3b8", fontSize: 13 }}>Loading activity logs...</div>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
            <History size={32} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
            <div>No activity logs found matching your filters.</div>
          </div>
        ) : (
          logs.map((log) => {
            const badge = getActionBadge(log.action);
            const Icon = badge.icon;
            return (
              <div key={log._id} className="sa-log-item">
                <div className="sa-log-icon" style={{ background: badge.bg, color: badge.color }}>
                  <Icon size={17} />
                </div>
                <div className="sa-log-content">
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 6,
                        background: badge.bg,
                        color: badge.color,
                        textTransform: "uppercase"
                      }}
                    >
                      {badge.label}
                    </span>
                    <span style={{ fontSize: 13, color: "#ffffff", fontWeight: 600 }}>
                      {log.description}
                    </span>
                  </div>

                  <div className="sa-log-meta">
                    <span>
                      Performed By: <strong>{log.performedBy?.name || "System"}</strong> ({log.performedBy?.email || log.performedBy?.role || "system"})
                    </span>
                    <span>•</span>
                    <span>{formatDate(log.createdAt)}</span>
                    {log.ipAddress && (
                      <>
                        <span>•</span>
                        <span>IP: {log.ipAddress}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
