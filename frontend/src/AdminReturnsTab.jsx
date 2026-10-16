import React, { useState, useEffect } from "react";
import {
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  CreditCard,
  Banknote,
  Eye,
  RefreshCw,
  AlertCircle,
  Save,
  Sliders,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  X,
  AlertTriangle,
  FileText,
  SlidersHorizontal,
  Settings
} from "lucide-react";
import axios from "axios";
import "./admin.css";
import "./returns.css";

const API_BASE = "http://localhost:5000/api";

const ADMIN_STATUS_OPTIONS = [
  "All",
  "Requested",
  "Approved",
  "Pickup Scheduled",
  "Item Received",
  "Refund Processing",
  "Refund Completed",
  "Replacement Processing",
  "Replacement Shipped",
  "Replacement Delivered",
  "Rejected",
  "Cancelled"
];

function formatDate(dateString) {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (e) {
    return dateString;
  }
}

export default function AdminReturnsTab({ token, showToast, onViewProduct }) {
  const [returns, setReturns] = useState([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    awaitingPickup: 0,
    refundProcessing: 0,
    completed: 0,
    rejected: 0,
    totalRefundedAmount: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Policy Settings Card State
  const [policyConfig, setPolicyConfig] = useState(null);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policySaving, setPolicySaving] = useState(false);
  const [policySuccessMsg, setPolicySuccessMsg] = useState("");
  const [policyErrorMsg, setPolicyErrorMsg] = useState("");

  // Review & Update Modal State
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Photo viewer modal
  const [zoomedPhoto, setZoomedPhoto] = useState(null);

  const getHeaders = () => {
    const h = { "x-admin-key": "techzone-admin-secret" };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  };

  const fetchReturns = () => {
    setLoading(true);
    setError("");

    const params = {
      status: statusFilter !== "All" ? statusFilter : undefined,
      search: searchQuery.trim() || undefined,
      dateRange: dateRange !== "all" ? dateRange : undefined,
      page,
      limit: 12
    };

    axios
      .get(`${API_BASE}/returns/admin/all`, {
        headers: getHeaders(),
        params
      })
      .then((res) => {
        if (res.data?.success) {
          setReturns(res.data.returns || []);
          if (res.data.metrics) setMetrics(res.data.metrics);
          if (res.data.pagination) {
            setTotalPages(res.data.pagination.totalPages || 1);
            setTotalCount(res.data.pagination.totalCount || 0);
          }
        } else {
          setError(res.data?.message || "Failed to load returns.");
        }
      })
      .catch((err) => {
        console.error("Admin fetch returns error:", err);
        setError(err.response?.data?.message || "Failed to load returns list.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const fetchPolicyConfig = () => {
    setPolicyLoading(true);
    axios
      .get(`${API_BASE}/returns/admin/config`, {
        headers: getHeaders()
      })
      .then((res) => {
        if (res.data?.success && res.data.config) {
          setPolicyConfig(res.data.config);
        }
      })
      .catch((err) => {
        console.error("Fetch policy config error:", err);
      })
      .finally(() => {
        setPolicyLoading(false);
      });
  };

  useEffect(() => {
    fetchReturns();
  }, [statusFilter, dateRange, page]);

  useEffect(() => {
    fetchPolicyConfig();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReturns();
  };

  const handleOpenReviewModal = (ret) => {
    setSelectedReturn(ret);
    setNewStatus(ret.status);
    setAdminNote("");
    setRejectionReason(ret.rejectionReason || "");
    setTransactionRef(ret.refundDetails?.transactionReference || "");
    setCarrier(ret.replacementDetails?.carrier || "BlueDart Express");
    setTrackingNumber(ret.replacementDetails?.trackingNumber || "");
    setStatusUpdateError("");
  };

  const handleSavePolicyConfig = (e) => {
    e.preventDefault();
    setPolicySaving(true);
    setPolicySuccessMsg("");
    setPolicyErrorMsg("");

    axios
      .put(
        `${API_BASE}/returns/admin/config`,
        {
          returnWindowDays: policyConfig.returnWindowDays,
          allowReplacement: policyConfig.allowReplacement,
          allowPartialReturns: policyConfig.allowPartialReturns,
          policyDescription: policyConfig.policyDescription
        },
        { headers: getHeaders() }
      )
      .then((res) => {
        if (res.data?.success) {
          setPolicySuccessMsg(res.data.message || "Policy updated successfully!");
          if (showToast) showToast("Policy Updated", "Return rules updated successfully.", "cart-add", "✓");
          setTimeout(() => setPolicySuccessMsg(""), 3500);
        } else {
          setPolicyErrorMsg(res.data?.message || "Failed to update return policy.");
        }
      })
      .catch((err) => {
        setPolicyErrorMsg(err.response?.data?.message || "Failed to save return policy.");
      })
      .finally(() => {
        setPolicySaving(false);
      });
  };

  const handleApplyStatusUpdate = () => {
    if (!selectedReturn) return;

    // Validation guards matching backend rules
    if (newStatus === "Rejected" && (!rejectionReason || !rejectionReason.trim())) {
      setStatusUpdateError("A specific rejection reason is required to reject a return request.");
      setShowConfirmModal(false);
      return;
    }

    if (newStatus === "Refund Completed" && (!transactionRef || !transactionRef.trim())) {
      setStatusUpdateError("Payment / Bank Transaction Reference is required before marking refund as completed.");
      setShowConfirmModal(false);
      return;
    }

    setUpdatingStatus(true);
    setStatusUpdateError("");

    axios
      .patch(
        `${API_BASE}/returns/admin/${selectedReturn._id}/status`,
        {
          status: newStatus,
          note: adminNote.trim(),
          rejectionReason: rejectionReason.trim(),
          transactionReference: transactionRef.trim(),
          carrier: carrier.trim(),
          trackingNumber: trackingNumber.trim()
        },
        { headers: getHeaders() }
      )
      .then((res) => {
        if (res.data?.success) {
          setShowConfirmModal(false);
          setSelectedReturn(res.data.returnRequest);
          if (showToast) {
            showToast(
              "Status Updated",
              `Return #${selectedReturn.returnNumber} updated to "${newStatus}".`,
              "cart-add",
              "✓"
            );
          }
          fetchReturns();
        } else {
          setStatusUpdateError(res.data?.message || "Failed to update return status.");
        }
      })
      .catch((err) => {
        setStatusUpdateError(err.response?.data?.message || "Error updating return status.");
      })
      .finally(() => {
        setUpdatingStatus(false);
      });
  };

  const getStatusBadge = (status) => {
    let className = "ret-status-pill";
    if (status === "Requested") className += " status-requested";
    else if (status === "Approved") className += " status-approved";
    else if (status === "Pickup Scheduled" || status === "Item Received") className += " status-transit";
    else if (status === "Refund Processing" || status === "Replacement Processing") className += " status-processing";
    else if (status === "Refund Completed" || status === "Replacement Delivered") className += " status-completed";
    else if (status === "Rejected") className += " status-rejected";
    else if (status === "Cancelled") className += " status-cancelled";
    else className += " status-default";

    return <span className={className}>{status}</span>;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }} id="admin-returns-tab">
      {/* 1. Metrics Grid */}
      <div className="admin-stats-grid">
        {/* Total Requests */}
        <div className="admin-stat-card">
          <div className="stat-glow-line glow-blue" />
          <div className="stat-card-header">
            <span>Total Returns</span>
            <div className="stat-icon-wrapper icon-blue">
              <RotateCcw size={20} />
            </div>
          </div>
          <h3 className="stat-value">{metrics.total}</h3>
          <div className="stat-footer">
            <span>All recorded return requests</span>
          </div>
        </div>

        {/* Pending Review */}
        <div className="admin-stat-card">
          <div className="stat-glow-line glow-amber" />
          <div className="stat-card-header">
            <span>Pending Review</span>
            <div className="stat-icon-wrapper icon-amber">
              <Clock size={20} />
            </div>
          </div>
          <h3 className="stat-value" style={{ color: metrics.pending > 0 ? "#f59e0b" : "#fff" }}>
            {metrics.pending}
          </h3>
          <div className="stat-footer">
            <span>Awaiting admin approval</span>
          </div>
        </div>

        {/* In Pickup / Transit */}
        <div className="admin-stat-card">
          <div className="stat-glow-line glow-purple" />
          <div className="stat-card-header">
            <span>Awaiting / In Pickup</span>
            <div className="stat-icon-wrapper icon-purple">
              <Truck size={20} />
            </div>
          </div>
          <h3 className="stat-value">{metrics.awaitingPickup}</h3>
          <div className="stat-footer">
            <span>Courier collection or received</span>
          </div>
        </div>

        {/* Refund Processing */}
        <div className="admin-stat-card">
          <div className="stat-glow-line glow-blue" />
          <div className="stat-card-header">
            <span>Refund Processing</span>
            <div className="stat-icon-wrapper icon-blue">
              <CreditCard size={20} />
            </div>
          </div>
          <h3 className="stat-value" style={{ color: "#38bdf8" }}>
            {metrics.refundProcessing}
          </h3>
          <div className="stat-footer">
            <span>Inspection passed, queueing payout</span>
          </div>
        </div>

        {/* Completed Refunds / Replacements */}
        <div className="admin-stat-card">
          <div className="stat-glow-line glow-emerald" />
          <div className="stat-card-header">
            <span>Completed</span>
            <div className="stat-icon-wrapper icon-emerald">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <h3 className="stat-value" style={{ color: "#34d399" }}>
            {metrics.completed}
          </h3>
          <div className="stat-footer">
            <span>₹{metrics.totalRefundedAmount.toLocaleString("en-IN")} total refunded</span>
          </div>
        </div>

        {/* Rejected */}
        <div className="admin-stat-card">
          <div className="stat-glow-line glow-red" />
          <div className="stat-card-header">
            <span>Rejected</span>
            <div className="stat-icon-wrapper icon-red">
              <XCircle size={20} />
            </div>
          </div>
          <h3 className="stat-value" style={{ color: metrics.rejected > 0 ? "#f87171" : "#fff" }}>
            {metrics.rejected}
          </h3>
          <div className="stat-footer">
            <span>Denied with rejection notice</span>
          </div>
        </div>
      </div>

      {/* 2. Policy Configuration Accordion Card */}
      {policyConfig && (
        <div className="admin-card" style={{ padding: "20px 24px" }}>
          <div className="admin-card-header" style={{ marginBottom: "16px" }}>
            <div>
              <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Settings size={18} color="#38bdf8" /> Return Policy Configuration
              </h3>
              <p>Configure the customer return window, allowed resolutions, and policy rules</p>
            </div>
          </div>

          <form onSubmit={handleSavePolicyConfig}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>
                  Return Window (Days After Delivery) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  className="admin-input"
                  value={policyConfig.returnWindowDays}
                  onChange={(e) =>
                    setPolicyConfig({ ...policyConfig, returnWindowDays: parseInt(e.target.value, 10) || 7 })
                  }
                  required
                  id="admin-policy-window-input"
                />
                <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                  Customers can only request returns within this number of days after delivery.
                </span>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>
                  Allow Product Replacement?
                </label>
                <select
                  className="admin-select"
                  value={policyConfig.allowReplacement ? "yes" : "no"}
                  onChange={(e) =>
                    setPolicyConfig({ ...policyConfig, allowReplacement: e.target.value === "yes" })
                  }
                >
                  <option value="yes">Yes - Customers can request replacement</option>
                  <option value="no">No - Refund only</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>
                  Allow Partial Order Returns?
                </label>
                <select
                  className="admin-select"
                  value={policyConfig.allowPartialReturns ? "yes" : "no"}
                  onChange={(e) =>
                    setPolicyConfig({ ...policyConfig, allowPartialReturns: e.target.value === "yes" })
                  }
                >
                  <option value="yes">Yes - Return individual items/quantities</option>
                  <option value="no">No - Full order return only</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>
                Public Policy Notice / Customer Instructions
              </label>
              <textarea
                className="admin-textarea"
                rows="2"
                value={policyConfig.policyDescription}
                onChange={(e) =>
                  setPolicyConfig({ ...policyConfig, policyDescription: e.target.value })
                }
              />
            </div>

            {policySuccessMsg && (
              <div className="alert-banner success" style={{ marginBottom: "14px" }}>
                <CheckCircle2 size={16} /> <span>{policySuccessMsg}</span>
              </div>
            )}
            {policyErrorMsg && (
              <div className="alert-banner error" style={{ marginBottom: "14px" }}>
                <AlertCircle size={16} /> <span>{policyErrorMsg}</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                className="admin-action-btn-primary"
                disabled={policySaving}
                id="save-policy-config-btn"
              >
                <Save size={15} />
                <span>{policySaving ? "Saving Policy..." : "Update Return Policy"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Return Requests Table Card */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h3>
              <RotateCcw size={18} color="#f59e0b" /> Customer Return & Refund Requests
            </h3>
            <p>Review customer return claims, inspect products, approve door-step pickups, and disburse refunds</p>
          </div>
          <button
            className="admin-btn-secondary"
            onClick={fetchReturns}
            title="Refresh returns list"
            id="admin-returns-refresh-btn"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            alignItems: "center",
            margin: "18px 0 20px"
          }}
        >
          {/* Search */}
          <form
            onSubmit={handleSearchSubmit}
            style={{
              flex: "1 1 240px",
              maxWidth: "340px",
              display: "flex",
              alignItems: "center",
              background: "#171c21",
              border: "1px solid #333d47",
              borderRadius: "8px",
              padding: "0 12px"
            }}
          >
            <Search size={16} color="#64748b" />
            <input
              type="text"
              id="admin-return-search-input"
              placeholder="Search by Return #, Order #, Customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                color: "#f8fafc",
                padding: "9px 10px",
                width: "100%",
                outline: "none",
                fontSize: "13px"
              }}
            />
          </form>

          {/* Status Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>Status:</span>
            <select
              className="admin-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{ width: "160px" }}
              id="admin-return-status-filter"
            >
              {ADMIN_STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>Date:</span>
            <select
              className="admin-select"
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                setPage(1);
              }}
              style={{ width: "130px" }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Returns Table */}
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Return ID</th>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items Returned</th>
                <th>Est. Refund</th>
                <th>Reason</th>
                <th>Resolution</th>
                <th>Status</th>
                <th>Requested Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {returns.map((ret) => {
                const retNum = ret.returnNumber || ret._id;
                const primaryItem = ret.items?.[0];
                const extraItems = (ret.items?.length || 1) - 1;

                return (
                  <tr key={ret._id || retNum}>
                    <td>
                      <strong style={{ color: "#38bdf8", fontSize: "13px" }}>#{retNum}</strong>
                    </td>
                    <td>
                      <span style={{ color: "#e2e8f0", fontSize: "12px" }}>#{ret.orderNumber}</span>
                    </td>
                    <td>
                      <div>
                        <strong style={{ color: "#f8fafc", fontSize: "13px", display: "block" }}>
                          {ret.customer?.name || "Customer"}
                        </strong>
                        <span style={{ color: "#64748b", fontSize: "11px" }}>{ret.customer?.email}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {primaryItem?.image && (
                          <img
                            src={primaryItem.image}
                            alt={primaryItem.name}
                            style={{
                              width: "32px",
                              height: "32px",
                              objectFit: "contain",
                              background: "#fff",
                              borderRadius: "4px"
                            }}
                          />
                        )}
                        <div>
                          <div style={{ color: "#f1f5f9", fontSize: "12px", fontWeight: "600", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {primaryItem?.name}
                          </div>
                          <div style={{ color: "#94a3b8", fontSize: "11px" }}>
                            Qty: {primaryItem?.qty}
                            {extraItems > 0 && ` (+${extraItems} more)`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: "#34d399", fontSize: "13px" }}>
                        ₹{(ret.totalRefundAmount || 0).toLocaleString("en-IN")}
                      </strong>
                    </td>
                    <td>
                      <span style={{ fontSize: "12px", color: "#cbd5e1" }}>{ret.reason}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: "12px", color: ret.resolution?.includes("Refund") ? "#34d399" : "#38bdf8", fontWeight: "600" }}>
                        {ret.resolution}
                      </span>
                    </td>
                    <td>{getStatusBadge(ret.status)}</td>
                    <td>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>{formatDate(ret.createdAt)}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="admin-action-btn-primary"
                        onClick={() => handleOpenReviewModal(ret)}
                        id={`manage-return-${retNum}`}
                        style={{ padding: "6px 12px", fontSize: "12px" }}
                      >
                        <Eye size={13} /> Manage
                      </button>
                    </td>
                  </tr>
                );
              })}

              {returns.length === 0 && !loading && (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", padding: "48px 20px" }}>
                    <p style={{ color: "#94a3b8", fontSize: "15px", margin: "0 0 12px" }}>
                      No return requests match your search or filter criteria.
                    </p>
                    <button
                      className="admin-btn-secondary"
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("All");
                        setDateRange("all");
                      }}
                    >
                      Reset Filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "18px",
              padding: "12px 6px"
            }}
          >
            <span style={{ fontSize: "13px", color: "#94a3b8" }}>
              Page {page} of {totalPages} ({totalCount} total)
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="admin-btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                className="admin-btn-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. MODAL: REVIEW & MANAGE RETURN REQUEST */}
      {selectedReturn && (
        <div className="admin-modal-backdrop" onClick={() => !updatingStatus && setSelectedReturn(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "800px" }}>
            <div className="admin-modal-header">
              <h3>
                Manage Return Request: #{selectedReturn.returnNumber} (Order #{selectedReturn.orderNumber})
              </h3>
              <button
                className="admin-modal-close"
                onClick={() => !updatingStatus && setSelectedReturn(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="admin-modal-body" style={{ maxHeight: "75vh", overflowY: "auto" }}>
              {/* Customer & Address Strip */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  background: "rgba(255,255,255,0.03)",
                  padding: "14px 16px",
                  borderRadius: "10px",
                  marginBottom: "16px"
                }}
              >
                <div>
                  <h4 style={{ margin: "0 0 6px", color: "#38bdf8", fontSize: "13px" }}>Customer Contact</h4>
                  <div style={{ color: "#fff", fontWeight: "600" }}>{selectedReturn.customer?.name}</div>
                  <div style={{ color: "#94a3b8", fontSize: "12px" }}>{selectedReturn.customer?.email}</div>
                  <div style={{ color: "#94a3b8", fontSize: "12px" }}>Phone: {selectedReturn.customer?.phone || "N/A"}</div>
                </div>

                <div>
                  <h4 style={{ margin: "0 0 6px", color: "#38bdf8", fontSize: "13px" }}>Pickup Address</h4>
                  <div style={{ color: "#cbd5e1", fontSize: "12px", lineHeight: "1.5" }}>
                    {selectedReturn.pickupAddress?.street}
                    {selectedReturn.pickupAddress?.city ? `, ${selectedReturn.pickupAddress.city}` : ""}
                    {selectedReturn.pickupAddress?.state ? `, ${selectedReturn.pickupAddress.state}` : ""}
                    {selectedReturn.pickupAddress?.pincode ? ` - ${selectedReturn.pickupAddress.pincode}` : ""}
                  </div>
                </div>
              </div>

              {/* Items in Return */}
              <div style={{ marginBottom: "16px" }}>
                <h4 style={{ margin: "0 0 8px", color: "#fff", fontSize: "13px" }}>Returned Items</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {selectedReturn.items?.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 12px",
                        background: "rgba(0,0,0,0.25)",
                        borderRadius: "8px"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <img
                          src={item.image || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&q=80"}
                          alt={item.name}
                          style={{ width: "38px", height: "38px", objectFit: "contain", background: "#fff", borderRadius: "6px" }}
                        />
                        <div>
                          <div style={{ color: "#fff", fontWeight: "600", fontSize: "13px" }}>{item.name}</div>
                          <div style={{ color: "#94a3b8", fontSize: "11px" }}>
                            Return Qty: <strong style={{ color: "#38bdf8" }}>{item.qty}</strong> unit(s) • ₹{(item.price || 0).toLocaleString("en-IN")} each
                          </div>
                        </div>
                      </div>
                      <div style={{ color: "#34d399", fontWeight: "700", fontSize: "14px" }}>
                        ₹{((item.price || 0) * item.qty).toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reason & Customer Notes */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  marginBottom: "16px"
                }}
              >
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                  Reason: <strong style={{ color: "#f8fafc" }}>{selectedReturn.reason}</strong>
                </div>
                {selectedReturn.reasonDetails && (
                  <div style={{ fontSize: "12px", color: "#cbd5e1", marginTop: "4px" }}>
                    Customer Note: "{selectedReturn.reasonDetails}"
                  </div>
                )}
                {selectedReturn.photos && selectedReturn.photos.length > 0 && (
                  <div style={{ marginTop: "8px" }}>
                    <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>
                      Uploaded Photos ({selectedReturn.photos.length}):
                    </span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {selectedReturn.photos.map((pUrl, i) => (
                        <img
                          key={i}
                          src={pUrl}
                          alt="Customer evidence"
                          style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "6px", cursor: "pointer", border: "1px solid #475569" }}
                          onClick={() => setZoomedPhoto(pUrl)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Update Form Controls */}
              <div
                style={{
                  background: "rgba(56, 189, 248, 0.05)",
                  border: "1px solid rgba(56, 189, 248, 0.2)",
                  borderRadius: "10px",
                  padding: "16px",
                  marginBottom: "16px"
                }}
              >
                <h4 style={{ margin: "0 0 12px", color: "#38bdf8", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <ShieldCheck size={16} /> Update Status & Processing
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>
                      Current Status
                    </label>
                    <div style={{ marginTop: "4px" }}>{getStatusBadge(selectedReturn.status)}</div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>
                      Select New Status *
                    </label>
                    <select
                      className="admin-select"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      id="admin-update-status-select"
                    >
                      <option value="Requested">Requested (Under Initial Review)</option>
                      <option value="Approved">Approved (Ready for Pickup)</option>
                      <option value="Pickup Scheduled">Pickup Scheduled (Courier Assigned)</option>
                      <option value="Item Received">Item Received (Warehouse Verification)</option>
                      <option value="Refund Processing">Refund Processing (Inspection Passed)</option>
                      <option value="Refund Completed">Refund Completed (Disbursed via Gateway/Bank)</option>
                      <option value="Replacement Processing">Replacement Processing</option>
                      <option value="Replacement Shipped">Replacement Shipped</option>
                      <option value="Replacement Delivered">Replacement Delivered</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {/* Conditional Inputs based on target status */}
                {newStatus === "Rejected" && (
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", fontSize: "12px", color: "#f87171", fontWeight: "600", marginBottom: "4px" }}>
                      Rejection Reason (Required) *
                    </label>
                    <textarea
                      className="admin-textarea"
                      rows="2"
                      placeholder="Explain why this request is rejected (e.g. Returned item is outside return window or has physical damage not covered)..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      required
                      id="admin-rejection-reason-input"
                    />
                  </div>
                )}

                {newStatus === "Refund Completed" && (
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", fontSize: "12px", color: "#34d399", fontWeight: "600", marginBottom: "4px" }}>
                      Bank / Gateway Transaction Reference (Required) *
                    </label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="e.g. TXN-REF-981249827391 or UPI/UTR reference"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      required
                      id="admin-refund-txn-input"
                    />
                    <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginTop: "4px" }}>
                      Refund amount to customer: ₹{(selectedReturn.totalRefundAmount || 0).toLocaleString("en-IN")}.
                    </span>
                  </div>
                )}

                {newStatus === "Replacement Shipped" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>
                        Courier Partner
                      </label>
                      <input
                        type="text"
                        className="admin-input"
                        placeholder="e.g. BlueDart Express"
                        value={carrier}
                        onChange={(e) => setCarrier(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>
                        Tracking Number
                      </label>
                      <input
                        type="text"
                        className="admin-input"
                        placeholder="e.g. BLU-827361928"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Admin Note / Customer Communication */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>
                    Internal Note / Customer Update Message (Optional)
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="e.g. Package inspected at Mumbai hub. All seals verified."
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                  />
                </div>

                {statusUpdateError && (
                  <div className="alert-banner error" style={{ marginTop: "12px" }}>
                    <AlertCircle size={16} /> <span>{statusUpdateError}</span>
                  </div>
                )}
              </div>

              {/* History Timeline */}
              <div>
                <h4 style={{ margin: "0 0 8px", color: "#fff", fontSize: "13px" }}>Activity History</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {selectedReturn.statusTimeline?.map((t, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "8px 12px",
                        background: "rgba(255,255,255,0.02)",
                        borderLeft: "2px solid #38bdf8",
                        fontSize: "12px"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#f8fafc" }}>
                        <strong>{t.status}</strong>
                        <span style={{ color: "#64748b" }}>{formatDate(t.timestamp)}</span>
                      </div>
                      {t.note && <div style={{ color: "#94a3b8", marginTop: "2px" }}>{t.note}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => setSelectedReturn(null)}
                disabled={updatingStatus}
              >
                Close
              </button>
              <button
                type="button"
                className="admin-action-btn-primary"
                onClick={() => setShowConfirmModal(true)}
                disabled={updatingStatus || newStatus === selectedReturn.status}
                id="apply-status-update-btn"
              >
                Update Request Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="ret-modal-backdrop" onClick={() => !updatingStatus && setShowConfirmModal(false)}>
          <div className="ret-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "440px" }}>
            <div className="ret-modal-header">
              <h3 style={{ margin: 0, color: "#f8fafc", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertTriangle size={18} color="#f59e0b" /> Confirm Status Change
              </h3>
              <button className="ret-modal-close" onClick={() => setShowConfirmModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="ret-modal-body" style={{ padding: "16px" }}>
              <p style={{ color: "#cbd5e1", fontSize: "13px", lineHeight: "1.5", margin: 0 }}>
                Are you sure you want to transition Return Request <strong>#{selectedReturn?.returnNumber}</strong> from{" "}
                <span style={{ color: "#94a3b8" }}>{selectedReturn?.status}</span> to{" "}
                <strong style={{ color: "#38bdf8" }}>{newStatus}</strong>?
                This change will be saved to MongoDB and logged to the customer's timeline.
              </p>
            </div>
            <div className="ret-modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowConfirmModal(false)}
                disabled={updatingStatus}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleApplyStatusUpdate}
                disabled={updatingStatus}
                id="confirm-status-update-btn"
              >
                {updatingStatus ? "Applying..." : "Confirm & Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Zoom Modal */}
      {zoomedPhoto && (
        <div
          className="ret-modal-backdrop"
          onClick={() => setZoomedPhoto(null)}
          style={{ background: "rgba(0,0,0,0.85)" }}
        >
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            <button
              onClick={() => setZoomedPhoto(null)}
              style={{
                position: "absolute",
                top: "-40px",
                right: "0",
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: "50%",
                padding: "8px",
                color: "#fff",
                cursor: "pointer"
              }}
            >
              <X size={20} />
            </button>
            <img
              src={zoomedPhoto}
              alt="Zoomed customer evidence"
              style={{ maxWidth: "100%", maxHeight: "85vh", borderRadius: "8px" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
