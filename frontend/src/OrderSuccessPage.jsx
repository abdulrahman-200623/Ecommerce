import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Package,
  Truck,
  Copy,
  Check,
  Calendar,
  MapPin,
  CreditCard,
  Banknote,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import axios from "axios";
import "./checkout.css";

const API_BASE = "http://localhost:5000/api";

export default function OrderSuccessPage({ orderId, onNavigate, showToast }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setError("No order ID provided.");
      setLoading(false);
      return;
    }

    setLoading(true);
    axios
      .get(`${API_BASE}/orders/${encodeURIComponent(orderId)}`)
      .then((res) => {
        if (res.data) {
          setOrder(res.data);
        } else {
          setError("Order not found.");
        }
      })
      .catch((err) => {
        console.error("Failed to load order:", err);
        setError("Unable to retrieve order details. Please check your order ID or contact support.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderId]);

  const handleCopyOrderId = () => {
    const idToCopy = order?.orderNumber || orderId;
    navigator.clipboard.writeText(idToCopy).then(() => {
      setCopied(true);
      if (showToast) {
        showToast("Copied to Clipboard", idToCopy, "cart-add", "📋");
      }
      setTimeout(() => setCopied(false), 2500);
    });
  };

  if (loading) {
    return (
      <main className="order-success-page">
        <div className="checkout-card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ color: "#38bdf8", fontSize: "18px", fontWeight: "600", marginBottom: "12px" }}>
            Loading your order confirmation...
          </div>
          <p style={{ color: "#94a3b8" }}>Retrieving the latest updates from TechZone servers.</p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="order-success-page">
        <div className="checkout-card" style={{ textAlign: "center", padding: "50px 20px" }}>
          <AlertCircle size={48} color="#ef4444" style={{ margin: "0 auto 16px" }} />
          <h2 style={{ color: "#f8fafc", margin: "0 0 10px" }}>Order Details Unavailable</h2>
          <p style={{ color: "#94a3b8", maxWidth: "460px", margin: "0 auto 20px" }}>
            {error || "We could not find the requested order."}
          </p>
          <button className="primaryBtn" onClick={() => onNavigate("/products")}>
            Back to Store
          </button>
        </div>
      </main>
    );
  }

  const orderNum = order.orderNumber || order._id;
  const isCOD = order.paymentMethod === "Cash on Delivery";
  const isPaid = order.paymentStatus === "Paid";

  // Calculate estimated delivery date based on created date
  const createdDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const deliveryDate = new Date(createdDate);
  deliveryDate.setDate(deliveryDate.getDate() + (order.shippingMethod === "Express Delivery" ? 2 : 4));
  const formattedDeliveryDate = deliveryDate.toLocaleDateString("en-IN", {
    weekday: "long",
    month: "short",
    day: "numeric"
  });

  return (
    <main className="order-success-page" id="order-success-view">
      {/* Hero Confirmation Card */}
      <div className="order-success-hero">
        <div className="success-icon-wrap">
          <CheckCircle2 size={42} />
        </div>
        <h1>Order Confirmed!</h1>
        <p>
          Thank you, <strong>{order.customer?.name}</strong>! Your order has been placed into the TechZone system.
          A confirmation summary has been sent to <strong>{order.customer?.email}</strong>.
        </p>

        <div className="order-id-pill">
          <span>Order ID:</span>
          <strong>{orderNum}</strong>
          <button onClick={handleCopyOrderId} title="Copy Order ID">
            {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      {/* Order Status Timeline */}
      <div className="checkout-card">
        <div className="checkout-card-header">
          <h3 className="checkout-card-title">
            <Truck size={18} color="#38bdf8" /> Delivery Progress
          </h3>
          <span style={{ fontSize: "13px", color: "#34d399", fontWeight: "600" }}>
            Estimated Arrival: {formattedDeliveryDate}
          </span>
        </div>

        <div className="order-timeline">
          <div className="timeline-step completed">
            <div className="timeline-dot">✓</div>
            <span className="timeline-label">Order Placed</span>
          </div>

          <div className={`timeline-step ${order.status !== "Pending" ? "completed" : "active"}`}>
            <div className="timeline-dot">2</div>
            <span className="timeline-label">Processing</span>
          </div>

          <div
            className={`timeline-step ${
              order.status === "Shipped" || order.status === "Delivered"
                ? "completed"
                : ""
            }`}
          >
            <div className="timeline-dot">3</div>
            <span className="timeline-label">Shipped</span>
          </div>

          <div className={`timeline-step ${order.status === "Delivered" ? "completed" : ""}`}>
            <div className="timeline-dot">4</div>
            <span className="timeline-label">Delivered</span>
          </div>
        </div>
      </div>

      {/* Two-Column Details: Shipping Address & Payment */}
      <div className="order-details-two-col">
        <div className="order-info-block">
          <h3>
            <MapPin size={16} /> Delivery Address
          </h3>
          <p style={{ fontWeight: "600", color: "#fff" }}>{order.customer?.name}</p>
          <p>{order.customer?.address}</p>
          <p>
            {order.customer?.city}
            {order.customer?.state ? `, ${order.customer.state}` : ""} - {order.customer?.pincode}
          </p>
          <p style={{ marginTop: "8px", color: "#94a3b8" }}>Phone: {order.customer?.phone}</p>
        </div>

        <div className="order-info-block">
          <h3>
            <CreditCard size={16} /> Payment & Shipping
          </h3>
          <p>
            <strong>Method:</strong> {order.paymentMethod || "Cash on Delivery"}
          </p>
          <p style={{ margin: "8px 0" }}>
            <strong>Payment Status: </strong>
            <span
              className={`payment-status-badge ${isPaid ? "paid" : "pending"}`}
            >
              {isPaid ? "● Paid / Verified" : "● Pending (Pay upon Delivery)"}
            </span>
          </p>
          <p>
            <strong>Shipping Type:</strong> {order.shippingMethod || "Standard Delivery"}
          </p>
        </div>
      </div>

      {/* Ordered Products Snapshot */}
      <div className="checkout-card">
        <div className="checkout-card-header">
          <h3 className="checkout-card-title">
            <Package size={18} color="#38bdf8" /> Items in this Order (
            {(order.items || []).reduce((acc, it) => acc + (it.qty || 1), 0)})
          </h3>
        </div>

        <div className="summary-items-list" style={{ maxHeight: "none" }}>
          {(order.items || []).map((item, idx) => (
            <div className="summary-item-row" key={idx}>
              <div className="summary-item-img-wrap">
                <img src={item.image} alt={item.name} />
              </div>
              <div className="summary-item-meta">
                <div className="summary-item-name">{item.name}</div>
                <div className="summary-item-qty">
                  Quantity: {item.qty} × ₹{Number(item.price).toLocaleString("en-IN")}
                </div>
              </div>
              <div className="summary-item-subtotal">
                ₹{Number(item.price * (item.qty || 1)).toLocaleString("en-IN")}
              </div>
            </div>
          ))}
        </div>

        {/* Bill Summary */}
        <div className="price-breakdown" style={{ marginTop: "16px" }}>
          <div className="price-row">
            <span>Subtotal</span>
            <span>₹{(order.subtotal || order.totalAmount).toLocaleString("en-IN")}</span>
          </div>

          {order.discount > 0 && (
            <div className="price-row discount-row">
              <span>Coupon Discount {order.couponCode ? `(${order.couponCode})` : ""}</span>
              <span>−₹{order.discount.toLocaleString("en-IN")}</span>
            </div>
          )}

          <div className="price-row">
            <span>Shipping Charges</span>
            <span>
              {order.shippingFee === 0 ? (
                <strong style={{ color: "#34d399" }}>FREE</strong>
              ) : (
                `₹${order.shippingFee || 0}`
              )}
            </span>
          </div>

          <div className="price-row total-row">
            <span>Total Payable Amount</span>
            <strong>₹{(order.totalAmount || 0).toLocaleString("en-IN")}</strong>
          </div>
        </div>
      </div>

      {/* Navigation Actions */}
      <div className="order-success-actions">
        <button className="primaryBtn" onClick={() => onNavigate("/products")}>
          Continue Shopping <ArrowRight size={16} />
        </button>
        <button className="secondaryBtn" onClick={() => onNavigate("/admin")}>
          <ShieldCheck size={16} /> Open Admin Console
        </button>
      </div>
    </main>
  );
}
