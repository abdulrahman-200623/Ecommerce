import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Banknote,
  Tag,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Lock,
  RotateCcw,
  Package,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  User
} from "lucide-react";
import axios from "axios";
import "./checkout.css";

const API_BASE = "http://localhost:5000/api";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi NCR",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal"
];

// Helper to format date + days
function getEstimatedDeliveryDate(daysToAdd) {
  const d = new Date();
  d.setDate(d.getDate() + daysToAdd);
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

export default function CheckoutPage({
  cartItems = [],
  onClearCart,
  onNavigate,
  showToast,
  userId
}) {
  // Saved profile / address retrieval
  const savedProfile = useMemo(() => {
    try {
      return {
        name: localStorage.getItem("techzone_customer_name") || "",
        email: localStorage.getItem("techzone_customer_email") || "",
        phone: localStorage.getItem("techzone_customer_phone") || "",
        address: localStorage.getItem("techzone_saved_address") || "",
        city: localStorage.getItem("techzone_saved_city") || "",
        state: localStorage.getItem("techzone_saved_state") || "",
        pincode: localStorage.getItem("techzone_saved_pincode") || ""
      };
    } catch (e) {
      return {};
    }
  }, []);

  const hasSavedAddress = Boolean(
    savedProfile.name && savedProfile.address && savedProfile.pincode
  );

  // Form Fields State
  const [formData, setFormData] = useState({
    name: savedProfile.name || "",
    email: savedProfile.email || "",
    phone: savedProfile.phone || "",
    address: savedProfile.address || "",
    city: savedProfile.city || "",
    state: savedProfile.state || "Maharashtra",
    pincode: savedProfile.pincode || ""
  });

  const [saveAddressForFuture, setSaveAddressForFuture] = useState(true);
  const [shippingOption, setShippingOption] = useState("standard"); // standard | express
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery"); // "Cash on Delivery" | "Online Payment"

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);

  // Form validation errors
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch available coupons on mount
  useEffect(() => {
    axios
      .get(`${API_BASE}/coupons/available`)
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.coupons)) {
          setAvailableCoupons(res.data.coupons);
        }
      })
      .catch(() => {});
  }, []);

  // Client calculations
  const rawSubtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (Number(item.price) || 0) * (item.qty || 1), 0);
  }, [cartItems]);

  const shippingFee = useMemo(() => {
    if (shippingOption === "express") return 99;
    return rawSubtotal >= 999 ? 0 : 49;
  }, [shippingOption, rawSubtotal]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === "percentage") {
      let disc = Math.round((rawSubtotal * appliedCoupon.discountValue) / 100);
      if (appliedCoupon.maxDiscount > 0 && disc > appliedCoupon.maxDiscount) {
        disc = appliedCoupon.maxDiscount;
      }
      return disc;
    }
    return Math.min(appliedCoupon.discountValue || 0, rawSubtotal);
  }, [appliedCoupon, rawSubtotal]);

  const finalTotal = useMemo(() => {
    return Math.max(0, rawSubtotal - discountAmount + shippingFee);
  }, [rawSubtotal, discountAmount, shippingFee]);

  // Handle Quick Fill Saved Address
  const handleQuickFill = () => {
    setFormData({
      name: savedProfile.name || "",
      email: savedProfile.email || "",
      phone: savedProfile.phone || "",
      address: savedProfile.address || "",
      city: savedProfile.city || "",
      state: savedProfile.state || "Maharashtra",
      pincode: savedProfile.pincode || ""
    });
    setFieldErrors({});
    if (showToast) {
      showToast("Address Loaded", "Saved delivery details filled in.", "cart-add", "📍");
    }
  };

  // Form input change handler
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (submitError) setSubmitError("");
  };

  // Validate form fields
  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(\+91[\-\s]?)?[6-9]\d{9}$/;
    const pinRegex = /^\d{6}$/;

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = "Full name is required (at least 2 characters).";
    }

    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    const cleanPhone = formData.phone.trim().replace(/\s+/g, "");
    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      errors.phone = "Enter a valid 10-digit Indian mobile number (e.g. 9876543210).";
    }

    if (!formData.address.trim() || formData.address.trim().length < 5) {
      errors.address = "Complete delivery street/apartment address is required.";
    }

    if (!formData.city.trim() || formData.city.trim().length < 2) {
      errors.city = "City name is required.";
    }

    if (!formData.state.trim()) {
      errors.state = "Please select or enter your state.";
    }

    if (!formData.pincode.trim() || !pinRegex.test(formData.pincode.trim())) {
      errors.pincode = "Enter a valid 6-digit PIN code (e.g. 400076).";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Apply Coupon via backend validation
  const handleApplyCoupon = async (codeToApply) => {
    const code = (codeToApply || couponCodeInput).trim().toUpperCase();
    if (!code) {
      setCouponError("Please enter a coupon code.");
      return;
    }

    setCouponLoading(true);
    setCouponError("");

    try {
      const res = await axios.post(`${API_BASE}/coupons/validate`, {
        code,
        subtotal: rawSubtotal
      });

      if (res.data?.success && res.data.coupon) {
        setAppliedCoupon(res.data.coupon);
        setCouponCodeInput(res.data.coupon.code);
        setCouponError("");
        if (showToast) {
          showToast(
            "Coupon Applied!",
            `Saved ₹${res.data.coupon.discountAmount.toLocaleString("en-IN")} with ${res.data.coupon.code}`,
            "cart-add",
            "🎉"
          );
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || `Coupon "${code}" is invalid or expired.`;
      setCouponError(msg);
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  // Remove Applied Coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput("");
    setCouponError("");
  };

  // Submit Order to backend
  const handlePlaceOrder = async (e) => {
    if (e) e.preventDefault();

    if (!validateForm()) {
      setSubmitError("Please correct the highlighted fields before placing your order.");
      // Smooth scroll to top of form
      window.scrollTo({ top: 120, behavior: "smooth" });
      return;
    }

    if (cartItems.length === 0) {
      setSubmitError("Your shopping cart is empty.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      // Save address to localStorage if checked
      if (saveAddressForFuture) {
        localStorage.setItem("techzone_customer_name", formData.name.trim());
        localStorage.setItem("techzone_customer_email", formData.email.trim());
        localStorage.setItem("techzone_customer_phone", formData.phone.trim());
        localStorage.setItem("techzone_saved_address", formData.address.trim());
        localStorage.setItem("techzone_saved_city", formData.city.trim());
        localStorage.setItem("techzone_saved_state", formData.state.trim());
        localStorage.setItem("techzone_saved_pincode", formData.pincode.trim());
      }

      // Payload for backend
      const payload = {
        customer: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim()
        },
        items: cartItems.map((item) => ({
          productId: item._id,
          name: item.name,
          price: item.price,
          qty: item.qty || 1,
          image: item.image
        })),
        shippingOption,
        couponCode: appliedCoupon?.code || "",
        paymentMethod,
        notes: `Smart Checkout order via TechZone web`
      };

      const res = await axios.post(`${API_BASE}/orders/checkout`, payload);

      if (res.data?.success && res.data.order) {
        const order = res.data.order;

        // Clear cart
        if (onClearCart) onClearCart();

        if (showToast) {
          showToast(
            "Order Confirmed!",
            `Order ${order.orderNumber} placed successfully.`,
            "cart-add",
            "🛍️"
          );
        }

        // Navigate to Order Success page
        if (onNavigate) {
          onNavigate(`/order-success/${order.orderNumber || order._id}`);
        }
      } else {
        throw new Error(res.data?.message || "Failed to process order.");
      }
    } catch (err) {
      console.error("Order placement error:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "An unexpected error occurred while placing your order. Please try again.";
      setSubmitError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // If cart is completely empty
  if (!cartItems || cartItems.length === 0) {
    return (
      <main className="checkout-page-container">
        <div className="checkout-breadcrumb">
          <button onClick={() => onNavigate("/cart")}>Cart</button>
          <span className="divider">/</span>
          <span className="current">Checkout</span>
        </div>
        <div
          className="checkout-card"
          style={{ textAlign: "center", padding: "60px 20px" }}
        >
          <Package size={52} color="#64748b" style={{ margin: "0 auto 16px" }} />
          <h2 style={{ color: "#f8fafc", margin: "0 0 10px" }}>
            Your Cart is Currently Empty
          </h2>
          <p style={{ color: "#94a3b8", maxWidth: "420px", margin: "0 auto 24px" }}>
            You don't have any items in your cart to checkout. Explore our premium electronics catalog to add items.
          </p>
          <button
            className="btn-place-order"
            style={{ maxWidth: "240px", margin: "0 auto" }}
            onClick={() => onNavigate("/products")}
          >
            Browse Products <ArrowRight size={16} />
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page-container" id="smart-checkout-section">
      {/* Breadcrumb Navigation */}
      <div className="checkout-breadcrumb">
        <button onClick={() => onNavigate("/cart")}>← Shopping Cart</button>
        <span className="divider">/</span>
        <span className="current">Smart Checkout</span>
      </div>

      <div className="checkout-header">
        <h1>
          <ShieldCheck size={28} color="#10b981" /> TechZone Smart Checkout
        </h1>
        <p>Review customer details, choose delivery, and confirm your order securely.</p>
      </div>

      {/* Top Alert if submission error occurred */}
      {submitError && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid #ef4444",
            color: "#fca5a5",
            padding: "14px 18px",
            borderRadius: "8px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "14px"
          }}
          role="alert"
        >
          <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
          <div>{submitError}</div>
        </div>
      )}

      <form onSubmit={handlePlaceOrder}>
        <div className="checkout-grid">
          {/* Left Column: Customer Details, Address, Delivery, Payment */}
          <div className="checkout-main-content">
            {/* Card 1: Customer Contact Information */}
            <div className="checkout-card">
              <div className="checkout-card-header">
                <h3 className="checkout-card-title">
                  <User size={18} color="#38bdf8" /> Customer Information
                </h3>
                {hasSavedAddress && (
                  <button
                    type="button"
                    className="btn-quick-fill"
                    onClick={handleQuickFill}
                    title="Fill address from last successful order"
                  >
                    <Sparkles size={13} /> Use Saved Address
                  </button>
                )}
              </div>

              <div className="checkout-form-grid">
                <div className="checkout-form-group">
                  <label htmlFor="checkout-full-name">
                    Full Name <span className="req">*</span>
                  </label>
                  <input
                    id="checkout-full-name"
                    type="text"
                    className={`checkout-input ${fieldErrors.name ? "input-error" : ""}`}
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                  />
                  {fieldErrors.name && (
                    <span className="field-error-msg">
                      <AlertCircle size={12} /> {fieldErrors.name}
                    </span>
                  )}
                </div>

                <div className="checkout-form-group">
                  <label htmlFor="checkout-email">
                    Email Address <span className="req">*</span>
                  </label>
                  <input
                    id="checkout-email"
                    type="email"
                    className={`checkout-input ${fieldErrors.email ? "input-error" : ""}`}
                    placeholder="e.g. rahul@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                  />
                  {fieldErrors.email && (
                    <span className="field-error-msg">
                      <AlertCircle size={12} /> {fieldErrors.email}
                    </span>
                  )}
                </div>

                <div className="checkout-form-group full-width">
                  <label htmlFor="checkout-phone">
                    Mobile Phone Number <span className="req">*</span>
                  </label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    className={`checkout-input ${fieldErrors.phone ? "input-error" : ""}`}
                    placeholder="10-digit number (e.g. 9876543210)"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    maxLength={14}
                    required
                  />
                  {fieldErrors.phone && (
                    <span className="field-error-msg">
                      <AlertCircle size={12} /> {fieldErrors.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Card 2: Delivery Address */}
            <div className="checkout-card">
              <div className="checkout-card-header">
                <h3 className="checkout-card-title">
                  <MapPin size={18} color="#38bdf8" /> Shipping & Delivery Address
                </h3>
                <span className="checkout-card-badge">India Only</span>
              </div>

              <div className="checkout-form-grid">
                <div className="checkout-form-group full-width">
                  <label htmlFor="checkout-address">
                    Flat / House No., Street, Area <span className="req">*</span>
                  </label>
                  <input
                    id="checkout-address"
                    type="text"
                    className={`checkout-input ${fieldErrors.address ? "input-error" : ""}`}
                    placeholder="e.g. Flat 402, Skyline Towers, Hiranandani Gardens"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    required
                  />
                  {fieldErrors.address && (
                    <span className="field-error-msg">
                      <AlertCircle size={12} /> {fieldErrors.address}
                    </span>
                  )}
                </div>

                <div className="checkout-form-group">
                  <label htmlFor="checkout-city">
                    City <span className="req">*</span>
                  </label>
                  <input
                    id="checkout-city"
                    type="text"
                    className={`checkout-input ${fieldErrors.city ? "input-error" : ""}`}
                    placeholder="e.g. Mumbai"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    required
                  />
                  {fieldErrors.city && (
                    <span className="field-error-msg">
                      <AlertCircle size={12} /> {fieldErrors.city}
                    </span>
                  )}
                </div>

                <div className="checkout-form-group">
                  <label htmlFor="checkout-state">
                    State / UT <span className="req">*</span>
                  </label>
                  <select
                    id="checkout-state"
                    className={`checkout-select ${fieldErrors.state ? "input-error" : ""}`}
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    required
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.state && (
                    <span className="field-error-msg">
                      <AlertCircle size={12} /> {fieldErrors.state}
                    </span>
                  )}
                </div>

                <div className="checkout-form-group">
                  <label htmlFor="checkout-pincode">
                    6-Digit PIN Code <span className="req">*</span>
                  </label>
                  <input
                    id="checkout-pincode"
                    type="text"
                    className={`checkout-input ${fieldErrors.pincode ? "input-error" : ""}`}
                    placeholder="e.g. 400076"
                    value={formData.pincode}
                    onChange={(e) => handleInputChange("pincode", e.target.value)}
                    maxLength={6}
                    required
                  />
                  {fieldErrors.pincode && (
                    <span className="field-error-msg">
                      <AlertCircle size={12} /> {fieldErrors.pincode}
                    </span>
                  )}
                </div>

                <div className="checkout-form-group full-width">
                  <label className="checkout-checkbox-label">
                    <input
                      type="checkbox"
                      checked={saveAddressForFuture}
                      onChange={(e) => setSaveAddressForFuture(e.target.checked)}
                    />
                    Save this address for fast 1-click checkout on future orders
                  </label>
                </div>
              </div>
            </div>

            {/* Card 3: Shipping Options */}
            <div className="checkout-card">
              <div className="checkout-card-header">
                <h3 className="checkout-card-title">
                  <Truck size={18} color="#38bdf8" /> Shipping Method & Delivery Speed
                </h3>
              </div>

              <div className="shipping-options-list">
                {/* Standard Shipping */}
                <label
                  className={`shipping-option-card ${shippingOption === "standard" ? "active" : ""}`}
                >
                  <div className="shipping-option-left">
                    <input
                      type="radio"
                      name="shipping"
                      value="standard"
                      checked={shippingOption === "standard"}
                      onChange={() => setShippingOption("standard")}
                    />
                    <div className="shipping-option-info">
                      <h4>Standard Doorstep Delivery</h4>
                      <p>
                        Estimated arrival: <strong>{getEstimatedDeliveryDate(4)}</strong> (3–5 business days)
                      </p>
                    </div>
                  </div>
                  <div className="shipping-option-price">
                    {rawSubtotal >= 999 ? "FREE" : "₹49"}
                  </div>
                </label>

                {/* Express Priority Shipping */}
                <label
                  className={`shipping-option-card ${shippingOption === "express" ? "active" : ""}`}
                >
                  <div className="shipping-option-left">
                    <input
                      type="radio"
                      name="shipping"
                      value="express"
                      checked={shippingOption === "express"}
                      onChange={() => setShippingOption("express")}
                    />
                    <div className="shipping-option-info">
                      <h4>Express Priority Dispatch ⚡</h4>
                      <p>
                        Estimated arrival: <strong>{getEstimatedDeliveryDate(2)}</strong> (1–2 business days)
                      </p>
                    </div>
                  </div>
                  <div className="shipping-option-price" style={{ color: "#38bdf8" }}>
                    ₹99
                  </div>
                </label>
              </div>
            </div>

            {/* Card 4: Payment Method Selection */}
            <div className="checkout-card">
              <div className="checkout-card-header">
                <h3 className="checkout-card-title">
                  <CreditCard size={18} color="#38bdf8" /> Payment Method
                </h3>
              </div>

              <div className="payment-methods-grid">
                {/* Cash on Delivery */}
                <label
                  className={`payment-method-card ${paymentMethod === "Cash on Delivery" ? "active" : ""}`}
                >
                  <div className="payment-method-left">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Cash on Delivery"
                      checked={paymentMethod === "Cash on Delivery"}
                      onChange={() => setPaymentMethod("Cash on Delivery")}
                    />
                    <div className="payment-method-details">
                      <h4>
                        <Banknote size={16} color="#10b981" /> Cash on Delivery (COD)
                      </h4>
                      <p>Pay cash or scan UPI QR with delivery partner upon package arrival</p>
                    </div>
                  </div>
                  <span className="payment-badge">Zero Advance Fee</span>
                </label>

                {/* UPI / Online Payment */}
                <label
                  className={`payment-method-card ${paymentMethod === "Online Payment" ? "active" : ""}`}
                >
                  <div className="payment-method-left">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Online Payment"
                      checked={paymentMethod === "Online Payment"}
                      onChange={() => setPaymentMethod("Online Payment")}
                    />
                    <div className="payment-method-details">
                      <h4>
                        <CreditCard size={16} color="#38bdf8" /> Instant Pay (UPI / Cards / NetBanking)
                      </h4>
                      <p>Google Pay, PhonePe, Paytm, Visa, Mastercard, Rupay</p>
                    </div>
                  </div>
                  <span className="payment-badge" style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8" }}>
                    Instant Confirmation
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Place Order */}
          <aside className="order-summary-sidebar">
            <div className="checkout-card">
              <div className="checkout-card-header">
                <h3 className="checkout-card-title">Order Summary</h3>
                <span className="checkout-card-badge">
                  {cartItems.reduce((acc, it) => acc + (it.qty || 1), 0)} Items
                </span>
              </div>

              {/* Items List */}
              <div className="summary-items-list" aria-label="Order items preview">
                {cartItems.map((item) => (
                  <div className="summary-item-row" key={item._id}>
                    <div className="summary-item-img-wrap">
                      <img src={item.image} alt={item.name} />
                    </div>
                    <div className="summary-item-meta">
                      <div className="summary-item-name" title={item.name}>
                        {item.name}
                      </div>
                      <div className="summary-item-qty">
                        Qty: {item.qty} × ₹{Number(item.price).toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div className="summary-item-subtotal">
                      ₹{Number(item.price * (item.qty || 1)).toLocaleString("en-IN")}
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Code Section */}
              <div className="coupon-box">
                <div style={{ fontSize: "12px", fontWeight: "600", color: "#e2e8f0", marginBottom: "8px" }}>
                  Have a Promo Code or Voucher?
                </div>

                {!appliedCoupon ? (
                  <>
                    <div className="coupon-input-group">
                      <input
                        type="text"
                        className="coupon-input"
                        placeholder="e.g. TECHZONE10"
                        value={couponCodeInput}
                        onChange={(e) => {
                          setCouponCodeInput(e.target.value);
                          if (couponError) setCouponError("");
                        }}
                      />
                      <button
                        type="button"
                        className="btn-apply-coupon"
                        onClick={() => handleApplyCoupon()}
                        disabled={couponLoading || !couponCodeInput.trim()}
                      >
                        {couponLoading ? "Checking..." : "Apply"}
                      </button>
                    </div>

                    {couponError && (
                      <div className="coupon-feedback error">
                        <AlertCircle size={13} /> {couponError}
                      </div>
                    )}

                    {/* Quick Available Coupons Chips */}
                    {availableCoupons.length > 0 && (
                      <div className="coupon-chips-list">
                        {availableCoupons.map((c) => (
                          <button
                            type="button"
                            key={c.code}
                            className="coupon-chip"
                            onClick={() => handleApplyCoupon(c.code)}
                            title={c.description}
                          >
                            <Tag size={10} style={{ display: "inline", marginRight: "3px" }} />
                            {c.code}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="applied-coupon-tag">
                    <span>
                      <CheckCircle2 size={14} /> {appliedCoupon.code} Applied (-₹
                      {discountAmount.toLocaleString("en-IN")})
                    </span>
                    <button
                      type="button"
                      className="btn-remove-coupon"
                      onClick={handleRemoveCoupon}
                      title="Remove coupon"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}
              </div>

              {/* Bill Details */}
              <div className="price-breakdown">
                <div className="price-row">
                  <span>Cart Subtotal</span>
                  <span>₹{rawSubtotal.toLocaleString("en-IN")}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="price-row discount-row">
                    <span>Coupon Discount</span>
                    <span>−₹{discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="price-row">
                  <span>Shipping Fee</span>
                  <span>
                    {shippingFee === 0 ? (
                      <strong style={{ color: "#34d399" }}>FREE</strong>
                    ) : (
                      `₹${shippingFee}`
                    )}
                  </span>
                </div>

                <div className="price-row total-row">
                  <span>Total Payable</span>
                  <strong>₹{finalTotal.toLocaleString("en-IN")}</strong>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                type="submit"
                className="btn-place-order"
                disabled={submitting}
                id="btn-place-order-submit"
              >
                {submitting ? (
                  <>
                    <RotateCcw size={18} className="spin-icon" /> Processing Order...
                  </>
                ) : (
                  <>
                    <Lock size={16} /> Place Order (₹{finalTotal.toLocaleString("en-IN")})
                  </>
                )}
              </button>

              {/* Security & Trust Badges */}
              <div className="trust-badges-grid">
                <div className="trust-badge-item">
                  <ShieldCheck size={20} />
                  <span>256-Bit SSL Security</span>
                </div>
                <div className="trust-badge-item">
                  <Package size={20} />
                  <span>7-Day Easy Return</span>
                </div>
                <div className="trust-badge-item">
                  <CheckCircle2 size={20} />
                  <span>100% Genuine Tech</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </form>
    </main>
  );
}
