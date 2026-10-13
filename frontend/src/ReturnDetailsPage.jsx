import React, { useState, useEffect } from "react";
import {
  RotateCcw,
  Package,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  CreditCard,
  Banknote,
  ArrowLeft,
  Copy,
  Check,
  AlertCircle,
  ShieldCheck,
  FileText,
  MapPin,
  RefreshCw,
  ExternalLink,
  X,
  AlertTriangle
} from "lucide-react";
import axios from "axios";
import "./account.css";
import "./returns.css";

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

// Stepper steps definitions
const REFUND_STEPS = [
  "Request Submitted",
  "Under Review",
  "Approved",
  "Return Pickup / Receipt",
  "Refund Processing",
  "Refund Completed"
];

const REPLACEMENT_STEPS = [
  "Request Submitted",
  "Under Review",
  "Approved",
  "Item Received",
  "Replacement Processing",
  "Replacement Shipped",
  "Replacement Delivered"
];

export default function ReturnDetailsPage({
  returnId,
  user,
  token,
  onNavigate,
  onOpenAuthModal,
  showToast
}) {
  const [returnRequest, setReturnRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isForbidden, setIsForbidden] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Cancellation modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  // Preview photo modal
  const [activePhoto, setActivePhoto] = useState(null);

  const fetchReturnDetails = () => {
    if (!returnId) {
      setError("No return request ID provided.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setIsForbidden(false);

    const config = {};
    if (token) {
      config.headers = { Authorization: `Bearer ${token}` };
    }

    axios
      .get(`${API_BASE}/returns/my-returns/${encodeURIComponent(returnId)}`, config)
      .then((res) => {
        if (res.data?.success && res.data.returnRequest) {
          setReturnRequest(res.data.returnRequest);
        } else {
          setError(res.data?.message || "Return request not found.");
        }
      })
      .catch((err) => {
        console.error("Return details fetch error:", err);
        if (err.response?.status === 403) {
          setIsForbidden(true);
          setError(
            err.response?.data?.message ||
              "Access denied. You are only authorized to view return requests associated with your account."
          );
        } else {
          setError(
            err.response?.data?.message ||
              "Unable to load this return request. Please verify the ID or return to your returns list."
          );
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReturnDetails();
  }, [returnId, token]);

  const handleCopyReturnId = () => {
    const id = returnRequest?.returnNumber || returnRequest?._id;
    if (!id) return;
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(true);
      if (showToast) showToast("Copied to Clipboard", id, "cart-add", "📋");
      setTimeout(() => setCopiedId(false), 2000);
    });
  };

  const handleCancelRequest = async () => {
    setCancelling(true);
    setCancelError("");

    const config = {};
    if (token) {
      config.headers = { Authorization: `Bearer ${token}` };
    }

    try {
      const res = await axios.patch(
        `${API_BASE}/returns/my-returns/${encodeURIComponent(returnId)}/cancel`,
        {},
        config
      );

      if (res.data?.success) {
        setReturnRequest(res.data.returnRequest);
        setShowCancelModal(false);
        if (showToast) {
          showToast(
            "Return Request Cancelled",
            `Return #${returnRequest.returnNumber} has been successfully cancelled.`,
            "wishlist-remove",
            "✕"
          );
        }
      } else {
        setCancelError(res.data?.message || "Failed to cancel return request.");
      }
    } catch (err) {
      setCancelError(err.response?.data?.message || "Failed to cancel return request.");
    } finally {
      setCancelling(false);
    }
  };

  // Determine current step index in the timeline stepper
  const currentStatus = returnRequest?.status;
  const isReplacement = returnRequest?.resolution === "Replacement";
  const steps = isReplacement ? REPLACEMENT_STEPS : REFUND_STEPS;

  const getStepIndex = () => {
    if (!currentStatus) return 0;
    if (isReplacement) {
      switch (currentStatus) {
        case "Requested":
          return 0;
        case "Under Review":
          return 1;
        case "Approved":
          return 2;
        case "Item Received":
        case "Pickup Scheduled":
          return 3;
        case "Replacement Processing":
          return 4;
        case "Replacement Shipped":
          return 5;
        case "Replacement Delivered":
          return 6;
        default:
          return 0;
      }
    } else {
      switch (currentStatus) {
        case "Requested":
          return 0;
        case "Under Review":
          return 1;
        case "Approved":
          return 2;
        case "Pickup Scheduled":
        case "Item Received":
          return 3;
        case "Refund Processing":
          return 4;
        case "Refund Completed":
          return 5;
        default:
          return 0;
      }
    }
  };

  const currentStepIdx = getStepIndex();
  const isRejected = currentStatus === "Rejected";
  const isCancelled = currentStatus === "Cancelled";
  const isCompleted =
    currentStatus === "Refund Completed" || currentStatus === "Replacement Delivered";
  const isCancelable = currentStatus === "Requested" || currentStatus === "Approved";

  if (loading) {
    return (
      <main className="account-page-container">
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <RefreshCw size={36} color="#38bdf8" className="spin" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "#94a3b8" }}>Loading return request #{returnId}...</p>
        </div>
      </main>
    );
  }

  if (isForbidden) {
    return (
      <main className="account-page-container">
        <div className="returns-empty-card" style={{ maxWidth: "560px", margin: "60px auto" }}>
          <div className="returns-empty-icon-wrap" style={{ color: "#ef4444" }}>
            <ShieldCheck size={36} />
          </div>
          <h2>Access Restricted</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={() => onNavigate("/my-returns")}>
            <ArrowLeft size={15} /> Return to My Returns
          </button>
        </div>
      </main>
    );
  }

  if (error || !returnRequest) {
    return (
      <main className="account-page-container">
        <div className="returns-empty-card" style={{ maxWidth: "560px", margin: "60px auto" }}>
          <div className="returns-empty-icon-wrap" style={{ color: "#f59e0b" }}>
            <AlertCircle size={36} />
          </div>
          <h2>Return Request Not Found</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={() => onNavigate("/my-returns")}>
            <ArrowLeft size={15} /> Back to My Returns
          </button>
        </div>
      </main>
    );
  }

  const retNum = returnRequest.returnNumber || returnRequest._id;

  return (
    <main className="account-page-container" id="return-details-page">
      {/* Top Navigation & Header */}
      <div className="account-header">
        <div className="account-header-left">
          <button
            className="btn-secondary"
            onClick={() => onNavigate("/my-returns")}
            style={{ marginBottom: "14px", padding: "6px 14px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            id="back-to-returns-btn"
          >
            <ArrowLeft size={14} /> Back to Returns & Refunds
          </button>

          <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <RotateCcw size={26} color="var(--tz-accent-primary, #7C3AED)" /> Return #{retNum}
            <button
              className="order-copy-btn"
              onClick={handleCopyReturnId}
              title="Copy Return ID"
            >
              {copiedId ? <Check size={18} color="#059669" /> : <Copy size={18} />}
            </button>
          </h1>

          <p>
            Associated Order:{" "}
            <button
              onClick={() => onNavigate(`/my-orders/${returnRequest.orderNumber || returnRequest.orderId}`)}
              style={{
                background: "none",
                border: "none",
                color: "var(--tz-accent-primary, #7C3AED)",
                fontWeight: "600",
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline"
              }}
            >
              #{returnRequest.orderNumber || returnRequest.orderId}
            </button>{" "}
            • Requested on <strong style={{ color: "var(--tz-text-main, #24212B)" }}>{formatDate(returnRequest.createdAt)}</strong>
          </p>
        </div>

        <div className="account-header-actions">
          {isCancelable && (
            <button
              className="btn-danger"
              onClick={() => setShowCancelModal(true)}
              id="cancel-return-request-btn"
            >
              <XCircle size={15} /> Cancel Return Request
            </button>
          )}
          <button
            className="btn-secondary"
            onClick={() => onNavigate(`/my-orders/${returnRequest.orderNumber || returnRequest.orderId}`)}
          >
            View Original Order
          </button>
        </div>
      </div>

      {/* Visual Tracking & Status Stepper Card */}
      <div className="order-timeline-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
          <h3 className="order-timeline-title" style={{ margin: 0 }}>
            <Clock size={18} color="#38bdf8" /> Return Status Timeline
          </h3>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "13px", color: "#94a3b8" }}>Current Status:</span>
            <span className={`ret-status-pill status-${(currentStatus || "").toLowerCase().replace(/\s+/g, "-")}`}>
              {currentStatus}
            </span>
          </div>
        </div>

        {/* Rejection / Cancellation alerts */}
        {isRejected ? (
          <div className="alert-banner error" style={{ margin: "16px 0 0" }}>
            <XCircle size={24} style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ display: "block", fontSize: "15px", marginBottom: "4px" }}>
                Return Request Rejected
              </strong>
              <span>
                <strong>Reason:</strong> {returnRequest.rejectionReason || "Request does not satisfy our return criteria."}
              </span>
              <div style={{ marginTop: "8px", fontSize: "12px", color: "#fca5a5" }}>
                If you believe this was a mistake, please contact our 24/7 customer support team with your Return #{retNum}.
              </div>
            </div>
          </div>
        ) : isCancelled ? (
          <div className="alert-banner error" style={{ margin: "16px 0 0" }}>
            <XCircle size={24} style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ display: "block", fontSize: "15px", marginBottom: "4px" }}>
                Return Request Cancelled
              </strong>
              <span>
                This return request was cancelled by you. No courier pickup will occur and your original order remains active.
              </span>
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
                    width: `${(currentStepIdx / (steps.length - 1)) * 100}%`
                  }}
                />
              </div>

              {steps.map((step, idx) => {
                const isStepCompleted = idx < currentStepIdx || isCompleted;
                const isStepCurrent = idx === currentStepIdx && !isCompleted;

                return (
                  <div
                    key={step}
                    className={`stepper-step ${isStepCompleted ? "completed" : ""} ${isStepCurrent ? "current" : ""}`}
                  >
                    <div className="stepper-circle">
                      {isStepCompleted ? <Check size={16} /> : idx + 1}
                    </div>
                    <span className="stepper-label">{step}</span>
                  </div>
                );
              })}
            </div>

            {/* Expected Next Step Strip */}
            {returnRequest.nextExpectedStep && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "14px 18px",
                  background: "var(--tz-bg-secondary, #F5F1FF)",
                  border: "1px solid var(--tz-border-subtle, #E7DDF7)",
                  borderLeft: "4px solid var(--tz-accent-primary, #7C3AED)",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  fontSize: "14px"
                }}
              >
                <Clock size={20} color="var(--tz-accent-primary, #7C3AED)" />
                <div>
                  Expected Next Step: <strong style={{ color: "var(--tz-text-main, #24212B)" }}>{returnRequest.nextExpectedStep}</strong>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Main Details Grid: Left (Items + Reason + Photos) | Right (Financial + Pickup + Audit Log) */}
      <div className="order-details-grid">
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Returned Items */}
          <div className="profile-card">
            <div className="profile-card-header">
              <h3 className="profile-card-title">
                <Package size={18} color="var(--tz-accent-primary, #7C3AED)" /> Items Selected for Return ({returnRequest.items?.length || 0})
              </h3>
            </div>

            <div className="order-items-preview-list">
              {returnRequest.items?.map((item, idx) => {
                const itemTotal = (item.price || 0) * (item.qty || 1);
                return (
                  <div key={item.productId || idx} className="order-item-row" style={{ alignItems: "center" }}>
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
                        Return Quantity: <strong style={{ color: "var(--tz-accent-primary, #7C3AED)" }}>{item.qty || 1}</strong> unit(s)
                        {item.originalOrderQty && (
                          <span style={{ color: "var(--tz-text-muted, #7E788B)", marginLeft: "6px" }}>
                            (Purchased: {item.originalOrderQty})
                          </span>
                        )}
                        {" • "}₹{(item.price || 0).toLocaleString("en-IN")} each
                      </p>
                    </div>
                    <div className="order-item-price" style={{ color: "#059669", fontWeight: "700" }}>
                      ₹{itemTotal.toLocaleString("en-IN")}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                marginTop: "16px",
                paddingTop: "14px",
                borderTop: "1px solid var(--tz-border-subtle, #E7DDF7)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <span style={{ color: "var(--tz-text-secondary, #625D6D)", fontSize: "14px" }}>Total Estimated Refund Amount</span>
              <strong style={{ fontSize: "20px", color: "#059669" }}>
                ₹{(returnRequest.totalRefundAmount || 0).toLocaleString("en-IN")}
              </strong>
            </div>
          </div>

          {/* Return Reason & Customer Comments */}
          <div className="profile-card">
            <div className="profile-card-header">
              <h3 className="profile-card-title">
                <FileText size={18} color="var(--tz-accent-primary, #7C3AED)" /> Return Reason & Notes
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
              <div>
                <span style={{ color: "var(--tz-text-secondary, #625D6D)", display: "block", fontSize: "12px", textTransform: "uppercase", marginBottom: "4px" }}>
                  Selected Reason
                </span>
                <strong style={{ color: "var(--tz-text-main, #24212B)", fontSize: "15px" }}>{returnRequest.reason}</strong>
              </div>

              {returnRequest.reasonDetails && (
                <div>
                  <span style={{ color: "var(--tz-text-secondary, #625D6D)", display: "block", fontSize: "12px", textTransform: "uppercase", marginBottom: "4px" }}>
                    Additional Customer Comments
                  </span>
                  <div
                    style={{
                      background: "var(--tz-bg-secondary, #F5F1FF)",
                      border: "1px solid var(--tz-border-subtle, #E7DDF7)",
                      borderRadius: "8px",
                      padding: "12px 14px",
                      color: "var(--tz-text-main, #24212B)",
                      lineHeight: "1.5"
                    }}
                  >
                    {returnRequest.reasonDetails}
                  </div>
                </div>
              )}

              {/* Supporting Uploaded Photos */}
              {returnRequest.photos && returnRequest.photos.length > 0 && (
                <div>
                  <span style={{ color: "#94a3b8", display: "block", fontSize: "12px", textTransform: "uppercase", margin: "8px 0 6px" }}>
                    Attached Photos ({returnRequest.photos.length})
                  </span>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {returnRequest.photos.map((photoUrl, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActivePhoto(photoUrl)}
                        style={{
                          width: "72px",
                          height: "72px",
                          borderRadius: "8px",
                          border: "1px solid #334155",
                          overflow: "hidden",
                          cursor: "pointer"
                        }}
                        title="Click to view full photo"
                      >
                        <img
                          src={photoUrl}
                          alt={`Uploaded evidence ${idx + 1}`}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Resolution Details, Pickup Address & Audit Timeline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Resolution & Payout Information */}
          <div className="profile-card">
            <div className="profile-card-header">
              <h3 className="profile-card-title">
                {isReplacement ? (
                  <>
                    <Truck size={18} color="#38bdf8" /> Replacement Details
                  </>
                ) : (
                  <>
                    <CreditCard size={18} color="#34d399" /> Refund Details
                  </>
                )}
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--tz-text-secondary, #625D6D)" }}>Resolution Mode:</span>
                <strong style={{ color: "var(--tz-text-main, #24212B)" }}>{returnRequest.resolution}</strong>
              </div>

              {!isReplacement && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--tz-text-secondary, #625D6D)" }}>Refund Destination:</span>
                    <strong style={{ color: "var(--tz-text-main, #24212B)" }}>
                      {returnRequest.refundDetails?.method || "Original Payment Method"}
                    </strong>
                  </div>

                  {returnRequest.refundDetails?.upiId && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--tz-text-secondary, #625D6D)" }}>UPI ID:</span>
                      <strong style={{ color: "var(--tz-accent-primary, #7C3AED)" }}>{returnRequest.refundDetails.upiId}</strong>
                    </div>
                  )}

                  {returnRequest.refundDetails?.bankAccount && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--tz-text-secondary, #625D6D)" }}>Bank Account:</span>
                      <strong style={{ color: "var(--tz-text-main, #24212B)" }}>
                        Ending in {returnRequest.refundDetails.bankAccount.slice(-4)}
                      </strong>
                    </div>
                  )}

                  {returnRequest.refundDetails?.transactionReference ? (
                    <div
                      style={{
                        marginTop: "8px",
                        padding: "10px 14px",
                        background: "rgba(16, 185, 129, 0.12)",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        borderRadius: "8px"
                      }}
                    >
                      <div style={{ color: "#059669", fontWeight: "700", marginBottom: "4px" }}>
                        ✓ Refund Completed
                      </div>
                      <div style={{ color: "var(--tz-text-secondary, #625D6D)", fontSize: "12px" }}>
                        Transaction Ref: <strong style={{ color: "var(--tz-text-main, #24212B)" }}>{returnRequest.refundDetails.transactionReference}</strong>
                      </div>
                      {returnRequest.refundDetails.refundedAt && (
                        <div style={{ color: "var(--tz-text-muted, #7E788B)", fontSize: "11px", marginTop: "2px" }}>
                          Processed on {formatDate(returnRequest.refundDetails.refundedAt)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ color: "var(--tz-text-secondary, #625D6D)", fontSize: "12px", marginTop: "4px" }}>
                      Status: <span style={{ color: "#d97706", fontWeight: "600" }}>Refund Pending Inspection</span>
                    </div>
                  )}
                </>
              )}

              {isReplacement && (
                <div style={{ marginTop: "6px" }}>
                  {returnRequest.replacementDetails?.trackingNumber ? (
                    <div
                      style={{
                        padding: "10px 14px",
                        background: "var(--tz-accent-light, #EDE5FF)",
                        border: "1px solid var(--tz-accent-border, #E7DDF7)",
                        borderRadius: "8px"
                      }}
                    >
                      <div style={{ color: "var(--tz-accent-primary, #7C3AED)", fontWeight: "700" }}>Replacement Dispatched</div>
                      <div style={{ fontSize: "12px", color: "var(--tz-text-main, #24212B)", marginTop: "4px" }}>
                        Carrier: {returnRequest.replacementDetails.carrier || "Courier"} • Tracking: {returnRequest.replacementDetails.trackingNumber}
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: "var(--tz-text-secondary, #625D6D)", fontSize: "12px" }}>
                      Replacement unit will be prepared once returned items are received.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Pickup Address Card */}
          <div className="profile-card">
            <div className="profile-card-header">
              <h3 className="profile-card-title">
                <MapPin size={18} color="var(--tz-accent-primary, #7C3AED)" /> Return Pickup Address
              </h3>
            </div>

            <div style={{ fontSize: "13px", color: "var(--tz-text-secondary, #625D6D)", lineHeight: "1.6" }}>
              <strong style={{ display: "block", color: "var(--tz-text-main, #24212B)" }}>
                {returnRequest.customer?.name}
              </strong>
              <div>{returnRequest.pickupAddress?.street || returnRequest.customer?.address}</div>
              <div>
                {returnRequest.pickupAddress?.city || returnRequest.customer?.city},{" "}
                {returnRequest.pickupAddress?.state || returnRequest.customer?.state} -{" "}
                {returnRequest.pickupAddress?.pincode || returnRequest.customer?.pincode}
              </div>
              <div style={{ marginTop: "6px", color: "var(--tz-text-secondary, #625D6D)" }}>
                Contact: <strong style={{ color: "var(--tz-text-main, #24212B)" }}>{returnRequest.customer?.phone || "N/A"}</strong>
              </div>
            </div>
          </div>

          {/* Audit Timeline */}
          <div className="profile-card">
            <div className="profile-card-header">
              <h3 className="profile-card-title">
                <Clock size={18} color="var(--tz-accent-primary, #7C3AED)" /> Request Activity Log
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {returnRequest.statusTimeline?.map((item, idx) => (
                <div key={idx} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: idx === returnRequest.statusTimeline.length - 1 ? "var(--tz-accent-primary, #7C3AED)" : "var(--tz-border-subtle, #E7DDF7)",
                      marginTop: "5px",
                      flexShrink: 0
                    }}
                  />
                  <div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <strong style={{ color: "var(--tz-text-main, #24212B)", fontSize: "13px" }}>{item.status}</strong>
                      <span style={{ fontSize: "11px", color: "var(--tz-text-muted, #7E788B)" }}>
                        {formatDate(item.timestamp)}
                      </span>
                    </div>
                    {item.note && (
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--tz-text-secondary, #625D6D)" }}>
                        {item.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="ret-modal-backdrop" onClick={() => !cancelling && setShowCancelModal(false)}>
          <div className="ret-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "460px" }}>
            <div className="ret-modal-header">
              <h3 style={{ margin: 0, color: "var(--tz-text-main, #24212B)", fontSize: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertTriangle size={20} color="#ef4444" /> Cancel Return Request?
              </h3>
              <button
                className="ret-modal-close"
                onClick={() => !cancelling && setShowCancelModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="ret-modal-body" style={{ padding: "20px" }}>
              <p style={{ color: "var(--tz-text-secondary, #625D6D)", fontSize: "14px", lineHeight: "1.5", margin: "0 0 16px" }}>
                Are you sure you want to cancel Return Request <strong>#{retNum}</strong>?
                This action cannot be undone. Any scheduled courier pickup will be cancelled.
              </p>

              {cancelError && (
                <div className="alert-banner error" style={{ margin: "10px 0" }}>
                  <AlertCircle size={16} />
                  <span>{cancelError}</span>
                </div>
              )}
            </div>

            <div className="ret-modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                No, Keep Request
              </button>
              <button
                className="btn-danger"
                onClick={handleCancelRequest}
                disabled={cancelling}
                id="confirm-cancel-return-btn"
              >
                {cancelling ? "Cancelling..." : "Yes, Cancel Return"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Zoom Modal */}
      {activePhoto && (
        <div
          className="ret-modal-backdrop"
          onClick={() => setActivePhoto(null)}
          style={{ background: "rgba(0, 0, 0, 0.85)" }}
        >
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            <button
              onClick={() => setActivePhoto(null)}
              style={{
                position: "absolute",
                top: "-40px",
                right: "0",
                background: "rgba(255, 255, 255, 0.2)",
                border: "none",
                borderRadius: "50%",
                padding: "8px",
                color: "#fff",
                cursor: "pointer"
              }}
            >
              <X size={22} />
            </button>
            <img
              src={activePhoto}
              alt="Zoomed evidence"
              style={{
                maxWidth: "100%",
                maxHeight: "85vh",
                borderRadius: "10px",
                border: "1px solid #475569"
              }}
            />
          </div>
        </div>
      )}
    </main>
  );
}
