import React, { useState, useEffect } from "react";
import {
  RotateCcw,
  Search,
  Filter,
  ArrowRight,
  Package,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Copy,
  Check,
  ShieldAlert,
  ArrowLeft
} from "lucide-react";
import axios from "axios";
import "./account.css";
import "./returns.css";

const API_BASE = "http://localhost:5000/api";

const STATUS_FILTERS = [
  "All",
  "Requested",
  "Approved",
  "Pickup Scheduled",
  "Item Received",
  "Refund Processing",
  "Refund Completed",
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
      year: "numeric"
    });
  } catch (e) {
    return dateString;
  }
}

export default function MyReturnsPage({
  user,
  token,
  onNavigate,
  onOpenAuthModal,
  showToast
}) {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  const fetchReturns = () => {
    if (!token && !user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const config = {};
    if (token) {
      config.headers = { Authorization: `Bearer ${token}` };
    }
    if (user?.email) {
      config.params = { email: user.email };
    }

    axios
      .get(`${API_BASE}/returns/my-returns`, config)
      .then((res) => {
        if (res.data?.success) {
          setReturns(res.data.returns || []);
        } else {
          setError(res.data?.message || "Failed to load returns.");
        }
      })
      .catch((err) => {
        console.error("My returns fetch error:", err);
        setError(
          err.response?.data?.message ||
            "Unable to load your return requests. Please try again."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReturns();
  }, [token, user]);

  const handleCopyId = (idStr) => {
    navigator.clipboard.writeText(idStr).then(() => {
      setCopiedId(idStr);
      if (showToast) showToast("Copied to Clipboard", idStr, "cart-add", "📋");
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Filter returns based on search and status
  const filteredReturns = returns.filter((ret) => {
    if (statusFilter !== "All" && ret.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNum = ret.returnNumber?.toLowerCase().includes(q);
      const matchOrd = ret.orderNumber?.toLowerCase().includes(q);
      const matchItem = ret.items?.some((it) => it.name?.toLowerCase().includes(q));
      const matchReason = ret.reason?.toLowerCase().includes(q);
      if (!matchNum && !matchOrd && !matchItem && !matchReason) {
        return false;
      }
    }
    return true;
  });

  const getStatusBadge = (status) => {
    let className = "ret-status-pill";
    if (status === "Requested") className += " status-requested";
    else if (status === "Approved") className += " status-approved";
    else if (status === "Pickup Scheduled" || status === "Item Received")
      className += " status-transit";
    else if (status === "Refund Processing" || status === "Replacement Processing")
      className += " status-processing";
    else if (status === "Refund Completed" || status === "Replacement Delivered")
      className += " status-completed";
    else if (status === "Rejected") className += " status-rejected";
    else if (status === "Cancelled") className += " status-cancelled";
    else className += " status-default";

    return <span className={className}>{status}</span>;
  };

  if (!user && !token) {
    return (
      <main className="account-page-container">
        <div className="returns-empty-card" style={{ maxWidth: "600px", margin: "60px auto" }}>
          <div className="returns-empty-icon-wrap">
            <RotateCcw size={36} />
          </div>
          <h2>Track Your Returns & Refunds</h2>
          <p>
            Please sign in to view your return requests, track pickup status, and check refund progress.
          </p>
          <button className="btn-primary" onClick={onOpenAuthModal} id="returns-sign-in-btn">
            Sign In to TechZone
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="account-page-container" id="my-returns-page">
      {/* Page Header */}
      <div className="account-header">
        <div className="account-header-left">
          <div className="returns-breadcrumb">
            <button
              className="btn-secondary"
              onClick={() => onNavigate("/my-account")}
              style={{ padding: "6px 14px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              id="back-to-account-btn"
            >
              <ArrowLeft size={14} /> My Account
            </button>
            <span className="crumb-divider">/</span>
            <span className="crumb-current">Returns & Refunds</span>
          </div>

          <h1>
            <RotateCcw size={28} color="var(--tz-accent-primary, #7C3AED)" /> Return & Refund Requests
          </h1>
          <p>
            Track your return requests, door-step courier pickups, inspection status, and refund payouts.
          </p>
        </div>

        <div className="account-header-actions">
          <button
            className="btn-secondary"
            onClick={fetchReturns}
            title="Refresh returns"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            id="returns-refresh-btn"
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
          <button
            className="btn-primary"
            onClick={() => onNavigate("/my-orders")}
            id="returns-view-orders-btn"
          >
            <Package size={15} /> Return an Item
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="returns-filter-card" id="returns-filter-section">
        <div className="returns-filter-top">
          {/* Search Box */}
          <div className="returns-search-wrapper">
            <Search size={16} className="returns-search-icon" />
            <input
              type="text"
              placeholder="Search by Return #, Order #, or Product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="returns-search-input"
              id="returns-search-input"
            />
          </div>

          <div className="returns-filter-count">
            Showing <strong>{filteredReturns.length}</strong> of {returns.length} return requests
          </div>
        </div>

        {/* Status Filters Pills */}
        <div className="returns-filter-pills-row">
          {STATUS_FILTERS.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`ret-filter-pill ${statusFilter === st ? "active" : ""}`}
              id={`filter-pill-${st.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {st}
              {st === "All" && returns.length > 0 && ` (${returns.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="returns-loading-card">
          <RefreshCw size={32} className="spin returns-loading-icon" />
          <p>Loading your return requests...</p>
        </div>
      ) : error ? (
        <div className="alert-banner error" style={{ margin: "20px 0" }}>
          <AlertCircle size={20} />
          <div>{error}</div>
        </div>
      ) : filteredReturns.length === 0 ? (
        <div className="returns-empty-card" id="returns-empty-state">
          <div className="returns-empty-icon-wrap">
            <RotateCcw size={36} />
          </div>
          <h3>
            {returns.length === 0 ? "No Return Requests Found" : "No Returns Match Your Filter"}
          </h3>
          <p>
            {returns.length === 0
              ? "You haven't requested any returns or refunds yet. If you have any delivered orders you'd like to return, you can initiate a return from your order history."
              : "Try adjusting your search terms or filter criteria to find the return request you are looking for."}
          </p>
          <button
            className="btn-primary"
            onClick={() => onNavigate("/my-orders")}
            id="empty-returns-view-orders-btn"
          >
            <Package size={15} /> View My Orders
          </button>
        </div>
      ) : (
        <div className="returns-list">
          {filteredReturns.map((ret) => {
            const retNum = ret.returnNumber || ret._id;
            const primaryItem = ret.items?.[0];
            const extraItemsCount = (ret.items?.length || 1) - 1;

            return (
              <article key={ret._id || retNum} className="ret-card" id={`return-card-${retNum}`}>
                {/* Header */}
                <div className="ret-card-header">
                  <div className="ret-header-meta">
                    <span className="ret-number-tag">
                      Return #{retNum}
                      <button
                        className="order-copy-btn"
                        onClick={() => handleCopyId(retNum)}
                        title="Copy Return ID"
                      >
                        {copiedId === retNum ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                      </button>
                    </span>

                    <span className="return-date-text">
                      <Calendar size={13} /> Requested on {formatDate(ret.createdAt)}
                    </span>

                    <span className="crumb-divider">•</span>

                    <span style={{ fontSize: "13px", color: "var(--tz-text-secondary, #625D6D)" }}>
                      Order:{" "}
                      <button
                        onClick={() => onNavigate(`/my-orders/${ret.orderNumber || ret.orderId}`)}
                        className="return-order-link"
                      >
                        #{ret.orderNumber || ret.orderId}
                      </button>
                    </span>
                  </div>

                  <div>{getStatusBadge(ret.status)}</div>
                </div>

                {/* Card Body: Items Preview */}
                <div className="ret-card-body">
                  <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
                    {primaryItem && (
                      <div style={{ display: "flex", gap: "14px", alignItems: "center", flex: "1", minWidth: "260px" }}>
                        <img
                          src={
                            primaryItem.image ||
                            "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&q=80"
                          }
                          alt={primaryItem.name}
                          style={{
                            width: "56px",
                            height: "56px",
                            objectFit: "contain",
                            background: "var(--tz-bg-card, #fff)",
                            border: "1px solid var(--tz-border-subtle, #E7DDF7)",
                            borderRadius: "8px",
                            padding: "4px"
                          }}
                        />
                        <div>
                          <h4 className="ret-item-title">
                            {primaryItem.name}
                          </h4>
                          <div className="ret-item-meta">
                            Return Qty: <strong>{primaryItem.qty}</strong> unit(s) • ₹{(primaryItem.price || 0).toLocaleString("en-IN")} each
                            {extraItemsCount > 0 && (
                              <span style={{ marginLeft: "8px", color: "var(--tz-accent-primary, #7C3AED)", fontWeight: "600" }}>
                                + {extraItemsCount} more item{extraItemsCount > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Return Reason & Resolution */}
                    <div className="ret-reason-box">
                      <div>
                        <span>Reason: </span>
                        <strong>{ret.reason}</strong>
                      </div>
                      <div>
                        <span>Resolution: </span>
                        <strong style={{ color: ret.resolution?.includes("Refund") ? "#059669" : "var(--tz-accent-primary, #7C3AED)" }}>
                          {ret.resolution}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Next Step Guidance Banner */}
                  {ret.nextExpectedStep && (
                    <div className="ret-next-step-strip">
                      <Clock size={16} color="var(--tz-accent-primary, #7C3AED)" style={{ flexShrink: 0 }} />
                      <div style={{ fontSize: "13px" }}>
                        <span>Expected Next Step: </span>
                        <strong>{ret.nextExpectedStep}</strong>
                      </div>
                    </div>
                  )}

                  {/* Rejection / Cancellation alerts */}
                  {ret.status === "Rejected" && (
                    <div className="alert-banner error" style={{ margin: "12px 0 0", padding: "10px 14px" }}>
                      <XCircle size={16} />
                      <div style={{ fontSize: "13px" }}>
                        <strong>Return Request Rejected: </strong>
                        {ret.rejectionReason || "Please contact customer support for further information."}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="ret-card-footer">
                  <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <div>
                      <span className="ret-chip-label">
                        Estimated Refund
                      </span>
                      <strong className="ret-refund-amount">
                        ₹{(ret.totalRefundAmount || 0).toLocaleString("en-IN")}
                      </strong>
                    </div>

                    {ret.refundDetails?.transactionReference && (
                      <div style={{ fontSize: "12px", color: "var(--tz-text-secondary, #625D6D)" }}>
                        Txn Ref: <strong style={{ color: "var(--tz-text-main, #24212B)" }}>{ret.refundDetails.transactionReference}</strong>
                      </div>
                    )}
                  </div>

                  <button
                    className="btn-primary"
                    onClick={() => onNavigate(`/my-returns/${retNum}`)}
                    id={`view-return-details-${retNum}`}
                    style={{ padding: "8px 18px", fontSize: "13px" }}
                  >
                    View Details & Track <ArrowRight size={14} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
