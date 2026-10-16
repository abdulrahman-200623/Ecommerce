import React, { useState, useEffect, useMemo } from "react";
import {
  Package,
  Calendar,
  Search,
  Filter,
  ArrowRight,
  Copy,
  Check,
  CreditCard,
  Banknote,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  RotateCcw,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X
} from "lucide-react";
import axios from "axios";
import "./account.css";
import ReturnRequestModal from "./ReturnRequestModal";

const API_BASE = "http://localhost:5000/api";

const STATUS_FILTERS = [
  "All",
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Returned"
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

export default function OrderHistoryPage({
  user,
  token,
  onNavigate,
  onOpenAuthModal,
  showToast
}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  // Filters state
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [dateRange, setDateRange] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // Cancel order modal state
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  // Return request modal state
  const [returnModalOrder, setReturnModalOrder] = useState(null);

  const fetchOrders = () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const params = {
      status: selectedStatus,
      search: searchQuery.trim(),
      dateRange: dateRange !== "all" ? dateRange : undefined,
      sort: sortBy,
      page,
      limit: 8
    };

    axios
      .get(`${API_BASE}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      })
      .then((res) => {
        if (res.data?.success) {
          setOrders(res.data.orders || []);
          setTotalOrders(res.data.totalOrders || 0);
          setTotalPages(res.data.totalPages || 1);
        } else {
          setError(res.data?.message || "Failed to load orders.");
        }
      })
      .catch((err) => {
        console.error("Order history fetch error:", err);
        setError(
          err.response?.data?.message ||
          "Unable to load orders from TechZone servers. Please try again."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
  }, [token, selectedStatus, dateRange, sortBy, page]);

  // Handle Search Debounce or submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleCopyOrderNumber = (ordNum) => {
    navigator.clipboard.writeText(ordNum).then(() => {
      setCopiedId(ordNum);
      if (showToast) {
        showToast("Copied to Clipboard", ordNum, "cart-add", "📋");
      }
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleConfirmCancelOrder = async () => {
    if (!orderToCancel) return;

    setCancelling(true);
    setCancelError("");

    try {
      const orderId = orderToCancel.orderNumber || orderToCancel._id;
      const res = await axios.put(
        `${API_BASE}/orders/my-orders/${orderId}/cancel`,
        { reason: cancelReason || "Cancelled by customer" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        if (showToast) {
          showToast(
            "Order Cancelled",
            `Order ${orderId} has been successfully cancelled.`,
            "wishlist-remove",
            "✕"
          );
        }
        setOrderToCancel(null);
        setCancelReason("");
        // Refresh orders list
        fetchOrders();
      } else {
        throw new Error(res.data?.message || "Failed to cancel order.");
      }
    } catch (err) {
      console.error("Cancellation error:", err);
      setCancelError(
        err.response?.data?.message ||
        err.message ||
        "Could not cancel order. Please try again or reach out to support."
      );
    } finally {
      setCancelling(false);
    }
  };

  // Status badge styling helper
  const renderStatusBadge = (status) => {
    const s = (status || "Pending").toLowerCase();
    let icon = <Clock size={13} />;
    if (s === "delivered") icon = <CheckCircle2 size={13} />;
    if (s === "shipped") icon = <Truck size={13} />;
    if (s === "cancelled") icon = <XCircle size={13} />;
    if (s === "returned") icon = <RotateCcw size={13} />;
    if (s === "processing" || s === "confirmed") icon = <Package size={13} />;

    return (
      <span className={`status-badge ${s}`}>
        {icon} {status}
      </span>
    );
  };

  // Can cancel rule
  const canCancelOrder = (status) => {
    return ["Pending", "Confirmed", "Processing"].includes(status);
  };

  // If user is unauthenticated
  if (!token || !user) {
    return (
      <main className="account-page-container">
        <div className="account-breadcrumb">
          <button onClick={() => onNavigate("/")}>Home</button>
          <span className="divider">/</span>
          <span className="current">My Orders</span>
        </div>

        <div className="empty-state-card">
          <div className="empty-state-icon-wrap">
            <Package size={38} />
          </div>
          <h2>Track Your Orders & Purchases</h2>
          <p>
            Sign in to view your real-time order history, tracking statuses, item invoices,
            and manage active electronics orders securely.
          </p>
          <button className="btn-primary" onClick={onOpenAuthModal} id="orders-login-prompt-btn">
            Sign In to View Orders <ArrowRight size={16} />
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="account-page-container" id="my-orders-section">
      {/* Breadcrumb */}
      <div className="account-breadcrumb">
        <button onClick={() => onNavigate("/")}>Home</button>
        <span className="divider">/</span>
        <button onClick={() => onNavigate("/my-account")}>My Account</button>
        <span className="divider">/</span>
        <span className="current">Order History</span>
      </div>

      {/* Header */}
      <div className="account-page-header">
        <div className="account-header-title">
          <h1>
            <Package size={28} color="#38bdf8" /> My Order History
          </h1>
          <p>Review real-time status, download item summaries, and track your shipments.</p>
        </div>
        <div className="account-header-actions">
          <button className="btn-secondary" onClick={() => onNavigate("/products")}>
            Browse More Products <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="orders-filter-container">
        {/* Status Pills */}
        <div className="status-pill-list">
          {STATUS_FILTERS.map((st) => (
            <button
              key={st}
              className={`status-pill-btn ${selectedStatus === st ? "active" : ""}`}
              onClick={() => {
                setSelectedStatus(st);
                setPage(1);
              }}
              id={`filter-status-${st.toLowerCase()}`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Secondary filters row */}
        <form onSubmit={handleSearchSubmit} className="orders-secondary-filters">
          <div className="orders-search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by Order ID (e.g. TZ-673964) or product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="orders-select-filter">
            <Calendar size={15} />
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by date range"
            >
              <option value="all">All Time</option>
              <option value="30days">Last 30 Days</option>
              <option value="6months">Last 6 Months</option>
              <option value="year">Past 1 Year</option>
            </select>
          </div>

          <div className="orders-select-filter">
            <SlidersHorizontal size={15} />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              aria-label="Sort orders"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price_high">Highest Price</option>
              <option value="price_low">Lowest Price</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" style={{ padding: "9px 16px", fontSize: "13px" }}>
            Search
          </button>
        </form>
      </div>

      {/* Error alert */}
      {error && (
        <div className="alert-banner error" role="alert">
          <AlertCircle size={18} />
          <div>{error}</div>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "80px 20px", color: "#94a3b8" }}>
          <Loader2 size={36} className="spinner-icon" style={{ margin: "0 auto 16px", color: "#38bdf8" }} />
          <h3 style={{ color: "#f8fafc", margin: "0 0 6px" }}>Loading Your Orders...</h3>
          <p style={{ margin: 0 }}>Fetching authentic data from TechZone database.</p>
        </div>
      ) : orders.length === 0 ? (
        /* Empty State */
        <div className="empty-state-card" id="empty-orders-state">
          <div className="empty-state-icon-wrap">
            <Package size={40} />
          </div>
          <h2>No Orders Found</h2>
          <p>
            {selectedStatus !== "All" || searchQuery
              ? `No orders matching your active filters. Try clearing your search or status selection.`
              : `You haven't placed any electronics orders with TechZone yet. Explore our cutting-edge smartphones, laptops, audio gear, and gadgets today!`}
          </p>
          <button
            className="btn-primary"
            onClick={() => onNavigate("/products")}
            id="start-shopping-empty-btn"
          >
            Start Shopping <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        /* Orders List */
        <div className="order-cards-list">
          {orders.map((order) => {
            const ordNumber = order.orderNumber || order._id;
            const isCancelable = canCancelOrder(order.status);
            const isCOD = order.paymentMethod === "Cash on Delivery";

            return (
              <article key={order._id || ordNumber} className="order-card" id={`order-card-${ordNumber}`}>
                {/* Order Card Header */}
                <div className="order-card-header">
                  <div className="order-header-meta">
                    <span className="order-number-tag">
                      Order #{ordNumber}
                      <button
                        className="order-copy-btn"
                        onClick={() => handleCopyOrderNumber(ordNumber)}
                        title="Copy Order ID"
                        aria-label="Copy Order ID"
                      >
                        {copiedId === ordNumber ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                      </button>
                    </span>

                    <span className="order-date-text">
                      <Calendar size={13} /> {formatDate(order.createdAt)}
                    </span>
                  </div>

                  <div>{renderStatusBadge(order.status)}</div>
                </div>

                {/* Order Card Body: Items Preview */}
                <div className="order-card-body">
                  <div className="order-items-preview-list">
                    {order.items?.map((item, idx) => (
                      <div key={item._id || item.productId || idx} className="order-item-row">
                        <div className="order-item-thumb">
                          <img
                            src={
                              item.image ||
                              "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&q=80"
                            }
                            alt={item.name}
                          />
                        </div>
                        <div className="order-item-info">
                          <h4>{item.name}</h4>
                          <p>
                            Quantity: <strong>{item.qty || 1}</strong> unit(s) • ₹{(item.price || 0).toLocaleString("en-IN")} each
                          </p>
                        </div>
                        <div className="order-item-price">
                          ₹{((item.price || 0) * (item.qty || 1)).toLocaleString("en-IN")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Card Footer */}
                <div className="order-card-footer">
                  <div className="order-footer-details">
                    <div className="order-total-block">
                      <span className="order-total-label">Total Amount</span>
                      <span className="order-total-amount">
                        ₹{(order.totalAmount || 0).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="order-payment-pill">
                      {isCOD ? <Banknote size={14} color="#f59e0b" /> : <CreditCard size={14} color="#38bdf8" />}
                      <span>{order.paymentMethod || "Online Payment"}</span>
                      <span style={{ color: order.paymentStatus === "Paid" ? "#34d399" : "#fbbf24" }}>
                        ({order.paymentStatus || "Pending"})
                      </span>
                    </div>
                  </div>

                  <div className="order-actions-group">
                    {isCancelable && (
                      <button
                        className="btn-danger"
                        onClick={() => {
                          setOrderToCancel(order);
                          setCancelError("");
                        }}
                        id={`cancel-order-btn-${ordNumber}`}
                      >
                        Cancel Order
                      </button>
                    )}

                    {order.status === "Delivered" && (
                      <button
                        className="btn-secondary"
                        onClick={() => setReturnModalOrder(order)}
                        id={`return-order-btn-${ordNumber}`}
                        style={{
                          borderColor: "rgba(245, 158, 11, 0.4)",
                          color: "#fbbf24",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                        title="Request Return or Refund for this order"
                      >
                        <RotateCcw size={14} /> Return Item(s)
                      </button>
                    )}

                    {order.status === "Returned" && (
                      <button
                        className="btn-secondary"
                        onClick={() => onNavigate("/my-returns")}
                        style={{
                          borderColor: "rgba(56, 189, 248, 0.3)",
                          color: "#38bdf8",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                      >
                        <RotateCcw size={14} /> View Return
                      </button>
                    )}

                    <button
                      className="btn-primary"
                      onClick={() => onNavigate(`/my-orders/${ordNumber}`)}
                      id={`view-order-details-${ordNumber}`}
                    >
                      View Details <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginTop: "24px" }}>
              <button
                className="btn-secondary"
                disabled={page <= 1}
                onClick={() => {
                  setPage(page - 1);
                  window.scrollTo({ top: 150, behavior: "smooth" });
                }}
                style={{ padding: "8px 14px" }}
              >
                <ChevronLeft size={16} /> Previous
              </button>

              <span style={{ fontSize: "14px", color: "#94a3b8" }}>
                Page <strong style={{ color: "#f8fafc" }}>{page}</strong> of{" "}
                <strong style={{ color: "#f8fafc" }}>{totalPages}</strong>
              </span>

              <button
                className="btn-secondary"
                disabled={page >= totalPages}
                onClick={() => {
                  setPage(page + 1);
                  window.scrollTo({ top: 150, behavior: "smooth" });
                }}
                style={{ padding: "8px 14px" }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      {orderToCancel && (
        <div className="auth-modal-backdrop" onClick={() => !cancelling && setOrderToCancel(null)}>
          <div className="auth-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "440px" }}>
            <div className="auth-modal-header">
              <h3 style={{ color: "#f87171" }}>
                <XCircle size={20} color="#ef4444" /> Cancel Order
              </h3>
              <button
                className="auth-modal-close"
                onClick={() => !cancelling && setOrderToCancel(null)}
                disabled={cancelling}
              >
                <X size={18} />
              </button>
            </div>

            <div className="auth-modal-body">
              {cancelError && (
                <div className="alert-banner error" role="alert">
                  <AlertCircle size={18} />
                  <div>{cancelError}</div>
                </div>
              )}

              <p style={{ color: "#cbd5e1", margin: 0, fontSize: "14px", lineHeight: "1.6" }}>
                Are you sure you want to cancel order{" "}
                <strong style={{ color: "#38bdf8" }}>#{orderToCancel.orderNumber || orderToCancel._id}</strong>?
              </p>

              <p style={{ color: "#94a3b8", fontSize: "13px", margin: "6px 0 14px" }}>
                Total: <strong>₹{(orderToCancel.totalAmount || 0).toLocaleString("en-IN")}</strong>. Any deducted inventory will be automatically restored to stock.
              </p>

              <div className="edit-form-group">
                <label className="edit-form-label">Reason for cancellation (optional):</label>
                <select
                  className="edit-form-input"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                >
                  <option value="Changed my mind">Changed my mind</option>
                  <option value="Found a better price elsewhere">Found a better price elsewhere</option>
                  <option value="Delivery time too long">Delivery time too long</option>
                  <option value="Ordered by mistake">Ordered by mistake</option>
                  <option value="Incorrect shipping address entered">Incorrect shipping address entered</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setOrderToCancel(null)}
                  disabled={cancelling}
                >
                  Keep Order
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={handleConfirmCancelOrder}
                  disabled={cancelling}
                  id="confirm-cancel-order-btn"
                >
                  {cancelling ? (
                    <>
                      <Loader2 size={15} className="spinner-icon" /> Cancelling...
                    </>
                  ) : (
                    "Yes, Cancel Order"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return Request Modal */}
      {returnModalOrder && (
        <ReturnRequestModal
          isOpen={Boolean(returnModalOrder)}
          order={returnModalOrder}
          token={token}
          onClose={() => setReturnModalOrder(null)}
          onSuccess={(newReturn) => {
            setReturnModalOrder(null);
            fetchOrders();
            if (showToast) {
              showToast(
                "Return Request Submitted",
                `Return #${newReturn.returnNumber} has been received for review.`,
                "cart-add",
                "✓"
              );
            }
            onNavigate(`/my-returns/${newReturn.returnNumber}`);
          }}
          showToast={showToast}
        />
      )}
    </main>
  );
}
