import React, { useState, useEffect } from "react";
import {
  Package,
  Calendar,
  Truck,
  MapPin,
  CreditCard,
  Banknote,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  AlertCircle,
  ArrowLeft,
  Copy,
  Check,
  Tag,
  ShieldCheck,
  Loader2,
  X,
  FileText
} from "lucide-react";
import axios from "axios";
import "./account.css";
import "./returns.css";
import ReturnRequestModal from "./ReturnRequestModal";

const API_BASE = "http://localhost:5000/api";

function formatDate(dateString) {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
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

function formatShortDate(dateString) {
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

export default function OrderDetailsPage({
  orderId,
  user,
  token,
  onNavigate,
  onOpenAuthModal,
  showToast
}) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isForbidden, setIsForbidden] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Cancellation state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("Changed my mind");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  // Return Eligibility & Request state
  const [eligibility, setEligibility] = useState(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [preselectedProductId, setPreselectedProductId] = useState(null);

  const fetchOrderDetails = () => {
    if (!orderId) {
      setError("No order ID specified.");
      setLoading(false);
      return;
    }

    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setIsForbidden(false);

    axios
      .get(`${API_BASE}/orders/my-orders/${encodeURIComponent(orderId)}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        if (res.data?.success && res.data.order) {
          setOrder(res.data.order);
          // If order is delivered, check return eligibility against policy
          if (res.data.order.status === "Delivered") {
            const h = token ? { Authorization: `Bearer ${token}` } : {};
            axios
              .get(
                `${API_BASE}/returns/order-eligibility/${encodeURIComponent(
                  res.data.order.orderNumber || orderId
                )}`,
                { headers: h }
              )
              .then((elRes) => {
                if (elRes.data?.success) {
                  setEligibility(elRes.data);
                }
              })
              .catch(() => {});
          }
        } else {
          setError(res.data?.message || "Order not found.");
        }
      })
      .catch((err) => {
        console.error("Order details fetch error:", err);
        if (err.response?.status === 403) {
          setIsForbidden(true);
          setError(
            err.response?.data?.message ||
            "Access denied. You are only authorized to view orders placed under your own account."
          );
        } else {
          setError(
            err.response?.data?.message ||
            "Unable to load this order. Please verify the order ID or return to your order history."
          );
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId, token]);

  const handleCopyOrderId = () => {
    const idToCopy = order?.orderNumber || orderId;
    navigator.clipboard.writeText(idToCopy).then(() => {
      setCopiedId(true);
      if (showToast) {
        showToast("Copied to Clipboard", idToCopy, "cart-add", "📋");
      }
      setTimeout(() => setCopiedId(false), 2000);
    });
  };

  const handleCancelOrder = async () => {
    setCancelling(true);
    setCancelError("");

    try {
      const idToCancel = order?.orderNumber || orderId;
      const res = await axios.put(
        `${API_BASE}/orders/my-orders/${encodeURIComponent(idToCancel)}/cancel`,
        { reason: cancelReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        if (showToast) {
          showToast(
            "Order Cancelled",
            `Order ${idToCancel} was cancelled successfully.`,
            "wishlist-remove",
            "✕"
          );
        }
        setShowCancelModal(false);
        fetchOrderDetails();
      } else {
        throw new Error(res.data?.message || "Failed to cancel order.");
      }
    } catch (err) {
      console.error("Cancellation error:", err);
      setCancelError(
        err.response?.data?.message ||
        err.message ||
        "Could not cancel this order. Please contact support."
      );
    } finally {
      setCancelling(false);
    }
  };

  // If unauthenticated
  if (!token || !user) {
    return (
      <main className="account-page-container">
        <div className="account-breadcrumb">
          <button onClick={() => onNavigate("/")}>Home</button>
          <span className="divider">/</span>
          <button onClick={() => onNavigate("/my-orders")}>My Orders</button>
          <span className="divider">/</span>
          <span className="current">Order Details</span>
        </div>

        <div className="empty-state-card">
          <div className="empty-state-icon-wrap">
            <Package size={38} />
          </div>
          <h2>Sign In to View Order Details</h2>
          <p>You must be authenticated with your TechZone account to view this order details page.</p>
          <button className="btn-primary" onClick={onOpenAuthModal} id="details-login-prompt-btn">
            Sign In Now
          </button>
        </div>
      </main>
    );
  }

  // Loading state
  if (loading) {
    return (
      <main className="account-page-container">
        <div style={{ textAlign: "center", padding: "100px 20px", color: "#94a3b8" }}>
          <Loader2 size={36} className="spinner-icon" style={{ margin: "0 auto 16px", color: "#38bdf8" }} />
          <h3 style={{ color: "#f8fafc", margin: "0 0 6px" }}>Loading Order Details...</h3>
          <p style={{ margin: 0 }}>Verifying account ownership and order credentials.</p>
        </div>
      </main>
    );
  }

  // Forbidden / Unauthorized ownership error
  if (isForbidden) {
    return (
      <main className="account-page-container">
        <div className="account-breadcrumb">
          <button onClick={() => onNavigate("/my-orders")}>← Back to My Orders</button>
        </div>

        <div className="empty-state-card" style={{ borderColor: "#ef4444" }}>
          <div className="empty-state-icon-wrap" style={{ background: "rgba(239, 68, 68, 0.12)", color: "#f87171", borderColor: "rgba(239, 68, 68, 0.4)" }}>
            <ShieldCheck size={38} />
          </div>
          <h2>Access Restricted</h2>
          <p style={{ color: "#fca5a5" }}>{error}</p>
          <p style={{ fontSize: "13px", color: "#94a3b8" }}>
            For privacy and security, customers can only access orders placed through their own authenticated TechZone profile.
          </p>
          <button className="btn-primary" onClick={() => onNavigate("/my-orders")}>
            Return to My Orders
          </button>
        </div>
      </main>
    );
  }

  // Other error or not found
  if (error || !order) {
    return (
      <main className="account-page-container">
        <div className="account-breadcrumb">
          <button onClick={() => onNavigate("/my-orders")}>← Back to My Orders</button>
        </div>

        <div className="empty-state-card">
          <div className="empty-state-icon-wrap" style={{ color: "#f87171" }}>
            <AlertCircle size={38} />
          </div>
          <h2>Order Not Found</h2>
          <p>{error || "We could not find the requested order."}</p>
          <button className="btn-primary" onClick={() => onNavigate("/my-orders")}>
            Back to All Orders
          </button>
        </div>
      </main>
    );
  }

  // Stepper calculations
  const orderSteps = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered"];
  const currentStatus = order.status || "Pending";
  const isCancelled = currentStatus === "Cancelled";
  const isReturned = currentStatus === "Returned";

  let currentStepIdx = orderSteps.indexOf(currentStatus);
  if (currentStepIdx === -1) currentStepIdx = 0;

  const isCancelable = ["Pending", "Confirmed", "Processing"].includes(currentStatus);
  const isCOD = order.paymentMethod === "Cash on Delivery";

  // Estimated delivery calculation
  const createdDate = new Date(order.createdAt || Date.now());
  const estimatedDate = order.estimatedDeliveryDate
    ? new Date(order.estimatedDeliveryDate)
    : new Date(createdDate.getTime() + (order.shippingMethod === "Express Delivery" ? 2 : 4) * 86400000);

  return (
    <main className="account-page-container" id="order-details-view">
      {/* Breadcrumb Navigation */}
      <div className="account-breadcrumb">
        <button onClick={() => onNavigate("/")}>Home</button>
        <span className="divider">/</span>
        <button onClick={() => onNavigate("/my-orders")}>My Orders</button>
        <span className="divider">/</span>
        <span className="current">#{order.orderNumber || order._id}</span>
      </div>

      {/* Header */}
      <div className="account-page-header">
        <div className="account-header-title">
          <button
            onClick={() => onNavigate("/my-orders")}
            className="btn-secondary"
            style={{ marginBottom: "14px", padding: "6px 14px", fontSize: "13px" }}
          >
            <ArrowLeft size={14} /> Back to Orders
          </button>
          <h1>
            <FileText size={26} color="#38bdf8" /> Order #{order.orderNumber || order._id}
            <button
              className="order-copy-btn"
              onClick={handleCopyOrderId}
              title="Copy Order ID"
              aria-label="Copy Order ID"
            >
              {copiedId ? <Check size={18} color="#34d399" /> : <Copy size={18} />}
            </button>
          </h1>
          <p>
            Placed on <strong style={{ color: "#f8fafc" }}>{formatDate(order.createdAt)}</strong> • Paid via{" "}
            <strong style={{ color: "#f8fafc" }}>{order.paymentMethod || "Online"}</strong>
          </p>
        </div>

        <div className="account-header-actions">
          {isCancelable && (
            <button
              className="btn-danger"
              onClick={() => {
                setShowCancelModal(true);
                setCancelError("");
              }}
              id="details-cancel-order-btn"
            >
              <XCircle size={15} /> Cancel Order
            </button>
          )}

          {currentStatus === "Delivered" && eligibility?.isEligible && (
            <button
              className="btn-primary"
              onClick={() => {
                setPreselectedProductId(null);
                setIsReturnModalOpen(true);
              }}
              id="details-return-items-btn"
              style={{
                background: "#f59e0b",
                color: "#000",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <RotateCcw size={15} /> Return Item(s)
            </button>
          )}

          {currentStatus === "Returned" && (
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
              <RotateCcw size={14} /> View Return Details
            </button>
          )}

          <button className="btn-secondary" onClick={() => onNavigate("/products")}>
            Shop Again
          </button>
        </div>
      </div>

      {/* Order Status & Stepper Card */}
      <div className="order-timeline-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
          <h3 className="order-timeline-title" style={{ margin: 0 }}>
            <Clock size={18} color="#38bdf8" /> Order Status & Tracking
          </h3>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "13px", color: "#94a3b8" }}>Current Status:</span>
            <span className={`status-badge ${(currentStatus || "pending").toLowerCase()}`}>
              {currentStatus}
            </span>
          </div>
        </div>

        {isCancelled ? (
          <div className="alert-banner error" style={{ margin: "16px 0 0" }}>
            <XCircle size={22} style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ display: "block", fontSize: "15px", marginBottom: "2px" }}>
                This order has been cancelled
              </strong>
              <span>
                Cancelled on{" "}
                {formatDate(
                  order.statusTimeline?.find((t) => t.status === "Cancelled")?.timestamp ||
                  order.updatedAt
                )}
                . Any inventory has been released and payments (if prepaid) are queued for refund.
              </span>
            </div>
          </div>
        ) : isReturned ? (
          <div className="alert-banner info" style={{ margin: "16px 0 0" }}>
            <RotateCcw size={22} style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ display: "block", fontSize: "15px", marginBottom: "2px" }}>
                Order Returned
              </strong>
              <span>This order has been processed for return according to TechZone return policies.</span>
            </div>
          </div>
        ) : (
          <>
            {/* Visual Stepper */}
            <div className="order-stepper">
              <div className="stepper-progress-bar">
                <div
                  className="stepper-progress-fill"
                  style={{
                    width: `${(currentStepIdx / (orderSteps.length - 1)) * 100}%`
                  }}
                />
              </div>

              {orderSteps.map((step, idx) => {
                const isCompleted = idx < currentStepIdx || currentStatus === "Delivered";
                const isCurrent = idx === currentStepIdx && currentStatus !== "Delivered";

                return (
                  <div
                    key={step}
                    className={`stepper-step ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""}`}
                  >
                    <div className="stepper-circle">
                      {isCompleted ? <Check size={16} /> : idx + 1}
                    </div>
                    <span className="stepper-label">{step}</span>
                  </div>
                );
              })}
            </div>

            {/* Estimated Delivery or Return Policy Banner */}
            {currentStatus === "Delivered" ? (
              <div
                style={{
                  marginTop: "20px",
                  padding: "16px 20px",
                  background: eligibility?.isEligible
                    ? "rgba(16, 185, 129, 0.08)"
                    : "rgba(245, 158, 11, 0.08)",
                  border: `1px solid ${
                    eligibility?.isEligible
                      ? "rgba(16, 185, 129, 0.3)"
                      : "rgba(245, 158, 11, 0.3)"
                  }`,
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  fontSize: "14px"
                }}
                id="order-return-policy-banner"
              >
                <RotateCcw
                  size={24}
                  color={eligibility?.isEligible ? "#34d399" : "#fbbf24"}
                  style={{ flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: "700",
                      color: eligibility?.isEligible ? "#34d399" : "#fbbf24",
                      marginBottom: "2px"
                    }}
                  >
                    {eligibility?.isEligible
                      ? "TechZone 7-Day Hassle-Free Return Guarantee Active"
                      : "Return Policy Status"}
                  </div>
                  <div style={{ color: "#cbd5e1", fontSize: "13px" }}>
                    {eligibility?.isEligible ? (
                      <>
                        Delivered on{" "}
                        <strong style={{ color: "#fff" }}>
                          {formatShortDate(eligibility.deliveredDate)}
                        </strong>
                        . You have until{" "}
                        <strong style={{ color: "#34d399" }}>
                          {formatShortDate(eligibility.deadlineDate)}
                        </strong>{" "}
                        to request a return or replacement for this order.
                      </>
                    ) : (
                      <>{eligibility?.reason || "Return window has expired."}</>
                    )}
                  </div>
                </div>

                {eligibility?.isEligible && (
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setPreselectedProductId(null);
                      setIsReturnModalOpen(true);
                    }}
                    style={{
                      padding: "8px 16px",
                      fontSize: "13px",
                      background: "#f59e0b",
                      color: "#000",
                      fontWeight: "700",
                      flexShrink: 0
                    }}
                  >
                    Start Return
                  </button>
                )}
              </div>
            ) : (
              <div
                style={{
                  marginTop: "20px",
                  padding: "14px 18px",
                  background: "rgba(56, 189, 248, 0.08)",
                  border: "1px solid rgba(56, 189, 248, 0.25)",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  fontSize: "14px"
                }}
              >
                <Truck size={20} color="#38bdf8" />
                <div>
                  Estimated Delivery: <strong style={{ color: "#f8fafc" }}>{formatShortDate(estimatedDate)}</strong> via{" "}
                  <span style={{ color: "#94a3b8" }}>{order.shippingMethod || "Standard Delivery"}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Main Grid: Items (Left) + Summary & Shipping (Right) */}
      <div className="order-details-grid">
        {/* Left Column: Purchased Products */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="profile-card">
            <div className="profile-card-header">
              <h3 className="profile-card-title">
                <Package size={18} color="#38bdf8" /> Purchased Products ({order.items?.length || 0})
              </h3>
            </div>

            <div className="order-items-preview-list">
              {order.items?.map((item, idx) => {
                const itemTotal = (item.price || 0) * (item.qty || 1);
                return (
                  <div key={item._id || item.productId || idx} className="order-item-row" style={{ padding: "16px 0" }}>
                    <div className="order-item-thumb" style={{ width: "72px", height: "72px" }}>
                      <img
                        src={
                          item.image ||
                          "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&q=80"
                        }
                        alt={item.name}
                      />
                    </div>
                    <div className="order-item-info">
                      <h4 style={{ fontSize: "15px" }}>{item.name}</h4>
                      <p style={{ color: "#94a3b8" }}>
                        Price: ₹{(item.price || 0).toLocaleString("en-IN")} • Qty: <strong>{item.qty || 1}</strong>
                      </p>
                      {item.productId && (
                        <button
                          onClick={() => onNavigate(`/products/${encodeURIComponent(item.productId)}`)}
                          style={{
                            background: "transparent",
                            border: 0,
                            color: "#38bdf8",
                            fontSize: "12px",
                            cursor: "pointer",
                            padding: 0,
                            marginTop: "4px",
                            textDecoration: "underline"
                          }}
                        >
                          View Product Details →
                        </button>
                      )}

                      {/* Item Return Action when Delivered */}
                      {currentStatus === "Delivered" && (
                        <div style={{ marginTop: "8px" }}>
                          {(() => {
                            const itemElig = eligibility?.items?.find(
                              (i) => String(i.productId) === String(item.productId)
                            );
                            if (itemElig?.isItemEligible) {
                              return (
                                <button
                                  className="btn-secondary"
                                  onClick={() => {
                                    setPreselectedProductId(item.productId);
                                    setIsReturnModalOpen(true);
                                  }}
                                  style={{
                                    padding: "4px 12px",
                                    fontSize: "12px",
                                    borderColor: "rgba(245, 158, 11, 0.4)",
                                    color: "#fbbf24",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px"
                                  }}
                                  id={`return-item-btn-${item.productId}`}
                                >
                                  <RotateCcw size={12} /> Return this item ({itemElig.returnableQty} eligible)
                                </button>
                              );
                            }
                            if (itemElig && itemElig.alreadyReturnedQty > 0) {
                              return (
                                <span
                                  style={{
                                    fontSize: "11px",
                                    color: "#34d399",
                                    padding: "3px 8px",
                                    background: "rgba(16, 185, 129, 0.1)",
                                    borderRadius: "4px",
                                    border: "1px solid rgba(16, 185, 129, 0.2)"
                                  }}
                                >
                                  ✓ Return requested ({itemElig.alreadyReturnedQty} unit(s))
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      )}
                    </div>
                    <div className="order-item-price" style={{ fontSize: "17px" }}>
                      ₹{itemTotal.toLocaleString("en-IN")}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery & Shipping Address Card */}
          <div className="profile-card">
            <div className="profile-card-header">
              <h3 className="profile-card-title">
                <MapPin size={18} color="#38bdf8" /> Shipping & Delivery Information
              </h3>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
              <div>
                <span className="profile-info-label">Recipient Name</span>
                <div className="profile-info-value" style={{ marginTop: "4px" }}>
                  {order.customer?.name || user.name}
                </div>
              </div>

              <div>
                <span className="profile-info-label">Contact Phone</span>
                <div className="profile-info-value" style={{ marginTop: "4px" }}>
                  {order.customer?.phone || user.phone || "Not provided"}
                </div>
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <span className="profile-info-label">Delivery Address</span>
                <div className="profile-info-value" style={{ marginTop: "4px", lineHeight: "1.5" }}>
                  {order.customer?.address}
                  {order.customer?.city ? `, ${order.customer.city}` : ""}
                  {order.customer?.state ? `, ${order.customer.state}` : ""}
                  {order.customer?.pincode ? ` - ${order.customer.pincode}` : ""}
                </div>
              </div>

              <div>
                <span className="profile-info-label">Email Notification</span>
                <div className="profile-info-value" style={{ marginTop: "4px" }}>
                  {order.customer?.email || user.email}
                </div>
              </div>

              <div>
                <span className="profile-info-label">Shipping Method</span>
                <div className="profile-info-value" style={{ marginTop: "4px" }}>
                  {order.shippingMethod || "Standard Delivery"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Financial Summary & Payment */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Price Details Breakdown */}
          <div className="order-summary-box">
            <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#f8fafc", margin: 0, paddingBottom: "14px", borderBottom: "1px solid #333a40" }}>
              Order Financial Summary
            </h3>

            <div className="summary-row">
              <span>Items Subtotal</span>
              <span style={{ color: "#f8fafc" }}>₹{(order.subtotal || order.totalAmount || 0).toLocaleString("en-IN")}</span>
            </div>

            <div className="summary-row">
              <span>Shipping Charges</span>
              <span style={{ color: order.shippingFee === 0 ? "#34d399" : "#f8fafc" }}>
                {order.shippingFee === 0 ? "FREE" : `₹${order.shippingFee}`}
              </span>
            </div>

            {order.discount > 0 && (
              <div className="summary-row">
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Tag size={13} color="#34d399" /> Coupon Discount
                  {order.couponCode && (
                    <span style={{ background: "rgba(52, 211, 153, 0.15)", padding: "1px 6px", borderRadius: "4px", fontSize: "11px", color: "#34d399" }}>
                      {order.couponCode}
                    </span>
                  )}
                </span>
                <span className="discount-val">−₹{(order.discount || 0).toLocaleString("en-IN")}</span>
              </div>
            )}

            <div className="summary-row total">
              <span>Total Paid / Payable</span>
              <strong>₹{(order.totalAmount || 0).toLocaleString("en-IN")}</strong>
            </div>
          </div>

          {/* Payment Information */}
          <div className="profile-card">
            <div className="profile-card-header">
              <h3 className="profile-card-title">
                <CreditCard size={18} color="#38bdf8" /> Payment Information
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#94a3b8", fontSize: "13px" }}>Payment Method</span>
                <span style={{ color: "#f8fafc", fontWeight: "600", fontSize: "14px" }}>
                  {order.paymentMethod || "Online"}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#94a3b8", fontSize: "13px" }}>Payment Status</span>
                <span
                  style={{
                    color: order.paymentStatus === "Paid" ? "#34d399" : "#fbbf24",
                    fontWeight: "700",
                    fontSize: "13px"
                  }}
                >
                  {order.paymentStatus || (isCOD ? "Pending (Cash on Delivery)" : "Paid")}
                </span>
              </div>

              {order.paymentDetails?.transactionId && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#94a3b8", fontSize: "13px" }}>Transaction ID</span>
                  <span style={{ color: "#cbd5e1", fontSize: "12px", fontFamily: "monospace" }}>
                    {order.paymentDetails.transactionId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Cancellation Info / Button */}
          {isCancelable ? (
            <div style={{ background: "#202529", border: "1px solid #3b4248", borderRadius: "14px", padding: "18px 22px" }}>
              <h4 style={{ margin: "0 0 6px", fontSize: "14px", color: "#f8fafc" }}>Need to cancel this order?</h4>
              <p style={{ margin: "0 0 14px", fontSize: "12px", color: "#94a3b8" }}>
                You can cancel this order while it is in {currentStatus} status. Once the item is dispatched, cancellations are no longer possible.
              </p>
              <button
                className="btn-danger"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => {
                  setShowCancelModal(true);
                  setCancelError("");
                }}
              >
                Cancel This Order
              </button>
            </div>
          ) : (
            <div style={{ background: "#1a1e22", border: "1px solid #2d3439", borderRadius: "10px", padding: "14px 18px", fontSize: "12px", color: "#94a3b8" }}>
              <ShieldCheck size={16} color="#10b981" style={{ display: "inline", marginRight: "6px" }} />
              Order status is <strong>{currentStatus}</strong>. Cancellations are only permitted prior to shipping.
            </div>
          )}
        </div>
      </div>

      {/* Cancel Order Confirmation Modal */}
      {showCancelModal && (
        <div className="auth-modal-backdrop" onClick={() => !cancelling && setShowCancelModal(false)}>
          <div className="auth-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "440px" }}>
            <div className="auth-modal-header">
              <h3 style={{ color: "#f87171" }}>
                <XCircle size={20} color="#ef4444" /> Cancel Order
              </h3>
              <button
                className="auth-modal-close"
                onClick={() => !cancelling && setShowCancelModal(false)}
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
                <strong style={{ color: "#38bdf8" }}>#{order.orderNumber || order._id}</strong>?
              </p>

              <div className="edit-form-group" style={{ marginTop: "12px" }}>
                <label className="edit-form-label">Please tell us why you are cancelling:</label>
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

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "18px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelling}
                >
                  Keep Order
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  id="confirm-details-cancel-btn"
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

      {/* Return Request Modal Wizard */}
      {isReturnModalOpen && order && (
        <ReturnRequestModal
          isOpen={isReturnModalOpen}
          order={order}
          token={token}
          preselectedProductId={preselectedProductId}
          onClose={() => {
            setIsReturnModalOpen(false);
            setPreselectedProductId(null);
          }}
          onSuccess={(newReturn) => {
            setIsReturnModalOpen(false);
            setPreselectedProductId(null);
            fetchOrderDetails();
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
