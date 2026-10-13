import React, { useState, useEffect } from "react";
import {
  RotateCcw,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  Package,
  AlertCircle,
  ShieldCheck,
  HelpCircle,
  Truck,
  CreditCard,
  Banknote,
  Upload,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import axios from "axios";
import "./returns.css";

const API_BASE = "http://localhost:5000/api";

const REASONS = [
  "Product damaged",
  "Defective or not working",
  "Wrong product delivered",
  "Missing parts or accessories",
  "Product does not match the description",
  "Received a different item than ordered",
  "Other reason"
];

export default function ReturnRequestModal({
  orderId,
  preselectedProductId = null,
  token,
  user,
  onClose,
  onSuccess,
  showToast
}) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eligibilityData, setEligibilityData] = useState(null);
  const [error, setError] = useState("");

  // Form State
  const [selectedItems, setSelectedItems] = useState({}); // { [productId]: returnQty }
  const [selectedReason, setSelectedReason] = useState(REASONS[0]);
  const [otherReasonText, setOtherReasonText] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrls, setPhotoUrls] = useState("");
  const [resolution, setResolution] = useState("Refund to Original Payment Method");
  const [upiId, setUpiId] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");

  useEffect(() => {
    async function checkEligibility() {
      setLoading(true);
      setError("");
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API_BASE}/returns/order-eligibility/${encodeURIComponent(orderId)}`, { headers });
        if (res.data?.success) {
          setEligibilityData(res.data);

          // Preselect items
          const initialSelection = {};
          (res.data.items || []).forEach((item) => {
            if (item.returnableQty > 0) {
              if (!preselectedProductId || item.productId === preselectedProductId) {
                initialSelection[item.productId] = item.returnableQty;
              }
            }
          });
          setSelectedItems(initialSelection);

          // Default resolution based on payment method
          if (res.data.paymentMethod === "Cash on Delivery") {
            setResolution("Refund via UPI / Bank (COD)");
          }
        } else {
          setError(res.data?.message || "Order is not eligible for returns.");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load order return eligibility.");
      } finally {
        setLoading(false);
      }
    }

    if (orderId) checkEligibility();
  }, [orderId, preselectedProductId, token]);

  const toggleItemSelection = (productId, maxQty) => {
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (next[productId]) {
        delete next[productId];
      } else {
        next[productId] = maxQty;
      }
      return next;
    });
  };

  const handleQtyChange = (productId, qty) => {
    setSelectedItems((prev) => ({
      ...prev,
      [productId]: parseInt(qty, 10)
    }));
  };

  // Compute calculated refund amount
  const estimatedRefundAmount = Object.entries(selectedItems).reduce((sum, [pId, qty]) => {
    const item = eligibilityData?.items?.find((i) => i.productId === pId);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  // Validate step navigation
  const handleNextStep = () => {
    setError("");
    if (step === 1) {
      if (Object.keys(selectedItems).length === 0) {
        setError("Please select at least one product to return.");
        return;
      }
    }
    if (step === 2) {
      if (selectedReason === "Other reason" && !otherReasonText.trim()) {
        setError("Please provide a brief explanation for 'Other reason'.");
        return;
      }
    }
    if (step === 4) {
      if (resolution.includes("UPI") && !upiId.trim() && !bankAccount.trim()) {
        setError("Please provide your UPI ID or Bank Account number for COD refund transfer.");
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  // Final Submit
  const handleSubmitReturn = async () => {
    setError("");
    setSubmitting(true);

    try {
      const itemsPayload = Object.entries(selectedItems).map(([pId, qty]) => ({
        productId: pId,
        qty
      }));

      const finalReason = selectedReason === "Other reason" ? `Other: ${otherReasonText.trim()}` : selectedReason;
      const parsedPhotos = photoUrls
        .split("\n")
        .map((p) => p.trim())
        .filter(Boolean);

      const payload = {
        orderId: eligibilityData?.orderId || orderId,
        items: itemsPayload,
        reason: finalReason,
        reasonDetails: description.trim(),
        photos: parsedPhotos,
        resolution,
        refundDetails: {
          upiId: upiId.trim(),
          bankAccount: bankAccount.trim(),
          bankIfsc: bankIfsc.trim()
        }
      };

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(`${API_BASE}/returns/request`, payload, { headers });

      if (res.data?.success) {
        if (showToast) {
          showToast("Return Submitted", res.data.message, "success", "📦");
        }
        if (onSuccess) onSuccess(res.data.returnRequest);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to submit return request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="return-wizard-overlay">
      <div className="return-wizard-card">
        {/* Wizard Header */}
        <div className="return-wizard-header">
          <h3>
            <RotateCcw size={20} color="#38bdf8" />
            <span>Return & Refund Request — Order #{eligibilityData?.orderNumber || orderId}</span>
          </h3>
          <button className="flash-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Stepper Progress */}
        <div className="wizard-stepper-track">
          {[
            { num: 1, label: "Select Items" },
            { num: 2, label: "Reason" },
            { num: 3, label: "Details" },
            { num: 4, label: "Resolution" },
            { num: 5, label: "Review" }
          ].map((s) => (
            <div
              key={s.num}
              className={`wizard-step-node ${step === s.num ? "active" : step > s.num ? "completed" : ""}`}
            >
              <div className="step-circle">{step > s.num ? <Check size={14} /> : s.num}</div>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Modal Body */}
        <div className="return-wizard-body">
          {error && (
            <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.4)", padding: "12px 16px", borderRadius: "10px", color: "#fca5a5", fontSize: "0.88rem", marginBottom: "18px", display: "flex", alignItems: "center", gap: "10px" }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: "50px 20px", color: "#94a3b8" }}>
              <RefreshCw size={32} className="pulsing-zap" style={{ margin: "0 auto 14px" }} />
              <h4>Checking return eligibility...</h4>
            </div>
          ) : !eligibilityData?.isEligible ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <AlertCircle size={44} color="#f87171" style={{ margin: "0 auto 16px" }} />
              <h3 style={{ color: "#f8fafc", marginBottom: "8px" }}>Return Window Closed</h3>
              <p style={{ color: "#94a3b8", maxWidth: "480px", margin: "0 auto 20px" }}>
                {eligibilityData?.reason || "This order is not eligible for returns under our policy."}
              </p>
              <button className="btn-secondary" onClick={onClose}>Close</button>
            </div>
          ) : (
            <>
              {/* STEP 1: Select Item(s) & Return Qty */}
              {step === 1 && (
                <div>
                  <h4 style={{ color: "#f8fafc", fontSize: "1rem", margin: "0 0 14px" }}>
                    Select the item(s) you wish to return:
                  </h4>
                  <div className="wizard-items-select-list">
                    {eligibilityData.items?.map((item) => {
                      const isSelected = !!selectedItems[item.productId];
                      const isAvailable = item.returnableQty > 0;

                      return (
                        <div
                          key={item.productId}
                          className={`wizard-select-item-card ${isSelected ? "selected" : ""}`}
                          onClick={() => isAvailable && toggleItemSelection(item.productId, item.returnableQty)}
                          style={{ opacity: isAvailable ? 1 : 0.5, cursor: isAvailable ? "pointer" : "not-allowed" }}
                        >
                          <input
                            type="checkbox"
                            className="wizard-item-checkbox"
                            checked={isSelected}
                            disabled={!isAvailable}
                            onChange={() => {}}
                          />
                          <img src={item.image} alt={item.name} className="wizard-item-img" />
                          <div className="wizard-item-details">
                            <h4>{item.name}</h4>
                            <p>
                              ₹{item.price.toLocaleString("en-IN")} • Purchased: {item.purchasedQty}
                              {item.alreadyReturnedQty > 0 && ` (${item.alreadyReturnedQty} already returned)`}
                            </p>
                          </div>

                          {isSelected && isAvailable && item.returnableQty > 1 && (
                            <div className="wizard-qty-control" onClick={(e) => e.stopPropagation()}>
                              <span style={{ fontSize: "12px", color: "#94a3b8" }}>Qty:</span>
                              <select
                                value={selectedItems[item.productId] || 1}
                                onChange={(e) => handleQtyChange(item.productId, e.target.value)}
                              >
                                {Array.from({ length: item.returnableQty }, (_, i) => i + 1).map((n) => (
                                  <option key={n} value={n}>
                                    {n}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2: Return Reason */}
              {step === 2 && (
                <div>
                  <h4 style={{ color: "#f8fafc", fontSize: "1rem", margin: "0 0 14px" }}>
                    Why are you returning these items?
                  </h4>
                  <div className="return-reasons-grid">
                    {REASONS.map((r) => (
                      <label
                        key={r}
                        className={`reason-radio-card ${selectedReason === r ? "selected" : ""}`}
                      >
                        <input
                          type="radio"
                          name="returnReason"
                          checked={selectedReason === r}
                          onChange={() => setSelectedReason(r)}
                        />
                        <span>{r}</span>
                      </label>
                    ))}
                  </div>

                  {selectedReason === "Other reason" && (
                    <div style={{ marginTop: "16px" }}>
                      <label style={{ display: "block", fontSize: "13px", color: "#cbd5e1", marginBottom: "6px" }}>
                        Please specify your reason *
                      </label>
                      <input
                        type="text"
                        className="flash-input"
                        placeholder="Explain briefly..."
                        value={otherReasonText}
                        onChange={(e) => setOtherReasonText(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Details & Evidence */}
              {step === 3 && (
                <div>
                  <h4 style={{ color: "#f8fafc", fontSize: "1rem", margin: "0 0 14px" }}>
                    Additional comments & condition details (Optional)
                  </h4>
                  <div className="flash-form-group">
                    <label>Description of the issue</label>
                    <textarea
                      className="flash-input"
                      rows={4}
                      placeholder="Share any helpful details to assist our team in reviewing your request faster..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="flash-form-group">
                    <label>Supporting Photo URLs (Optional, 1 per line)</label>
                    <textarea
                      className="flash-input"
                      rows={2}
                      placeholder="Paste image URLs (e.g. https://...)..."
                      value={photoUrls}
                      onChange={(e) => setPhotoUrls(e.target.value)}
                    />
                    <small style={{ color: "#64748b", display: "block", marginTop: "4px" }}>
                      Clear photos of packaging and any damage help expedite review and approval.
                    </small>
                  </div>
                </div>
              )}

              {/* STEP 4: Choose Resolution */}
              {step === 4 && (
                <div>
                  <h4 style={{ color: "#f8fafc", fontSize: "1rem", margin: "0 0 14px" }}>
                    How would you like this return resolved?
                  </h4>
                  <div className="resolution-cards-grid">
                    {eligibilityData.paymentMethod !== "Cash on Delivery" ? (
                      <div
                        className={`resolution-card ${resolution === "Refund to Original Payment Method" ? "selected" : ""}`}
                        onClick={() => setResolution("Refund to Original Payment Method")}
                      >
                        <h4>
                          <CreditCard size={18} color="#38bdf8" /> Refund to Source Card / Net Banking
                        </h4>
                        <p>Refund will be transferred back to your original payment method upon warehouse inspection.</p>
                      </div>
                    ) : (
                      <div
                        className={`resolution-card ${resolution === "Refund via UPI / Bank (COD)" ? "selected" : ""}`}
                        onClick={() => setResolution("Refund via UPI / Bank (COD)")}
                      >
                        <h4>
                          <Banknote size={18} color="#f59e0b" /> Direct UPI / Bank Account Refund (COD)
                        </h4>
                        <p>Since your order was Cash on Delivery, refund will be deposited directly to your UPI ID or bank account.</p>
                      </div>
                    )}

                    <div
                      className={`resolution-card ${resolution === "Replacement" ? "selected" : ""}`}
                      onClick={() => setResolution("Replacement")}
                    >
                      <h4>
                        <RefreshCw size={18} color="#10b981" /> Brand New Replacement
                      </h4>
                      <p>We'll dispatch an identical new replacement unit to your delivery address at no extra charge.</p>
                    </div>
                  </div>

                  {resolution.includes("UPI") && (
                    <div style={{ marginTop: "20px", background: "#0f172a", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                      <h5 style={{ color: "#f8fafc", margin: "0 0 12px", fontSize: "0.9rem" }}>
                        COD Refund Details
                      </h5>
                      <div className="flash-form-group">
                        <label>UPI ID (e.g. yourname@okhdfcbank / yourname@upi)</label>
                        <input
                          type="text"
                          className="flash-input"
                          placeholder="e.g. 9876543210@paytm"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                        />
                      </div>
                      <div style={{ textAlign: "center", color: "#64748b", margin: "8px 0", fontSize: "12px" }}>— OR —</div>
                      <div className="flash-form-row">
                        <div className="flash-form-group">
                          <label>Bank Account Number</label>
                          <input
                            type="text"
                            className="flash-input"
                            placeholder="Account Number"
                            value={bankAccount}
                            onChange={(e) => setBankAccount(e.target.value)}
                          />
                        </div>
                        <div className="flash-form-group">
                          <label>IFSC Code</label>
                          <input
                            type="text"
                            className="flash-input"
                            placeholder="e.g. HDFC0001234"
                            value={bankIfsc}
                            onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 5: Review & Submit */}
              {step === 5 && (
                <div>
                  <h4 style={{ color: "#f8fafc", fontSize: "1rem", margin: "0 0 14px" }}>
                    Review your return request details
                  </h4>

                  <div className="return-review-summary-box">
                    <div className="review-summary-row">
                      <span>Order Number:</span>
                      <strong style={{ color: "#f8fafc" }}>#{eligibilityData.orderNumber}</strong>
                    </div>

                    <div className="review-summary-row">
                      <span>Return Items:</span>
                      <strong>{Object.keys(selectedItems).length} item(s) selected</strong>
                    </div>

                    <div style={{ padding: "8px 0" }}>
                      {Object.entries(selectedItems).map(([pId, qty]) => {
                        const it = eligibilityData.items?.find((i) => i.productId === pId);
                        return (
                          <div key={pId} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#94a3b8", padding: "4px 0" }}>
                            <span>• {it?.name} (x{qty})</span>
                            <span style={{ color: "#f8fafc" }}>₹{((it?.price || 0) * qty).toLocaleString("en-IN")}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="review-summary-row">
                      <span>Reason:</span>
                      <strong style={{ color: "#fbbf24" }}>{selectedReason === "Other reason" ? otherReasonText : selectedReason}</strong>
                    </div>

                    <div className="review-summary-row">
                      <span>Resolution:</span>
                      <strong style={{ color: "#34d399" }}>{resolution}</strong>
                    </div>

                    <div className="review-summary-row total-row">
                      <span>{resolution === "Replacement" ? "Estimated Value:" : "Estimated Refund:"}</span>
                      <span>₹{estimatedRefundAmount.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: "16px", padding: "12px", background: "rgba(56, 189, 248, 0.08)", borderRadius: "10px", fontSize: "12px", color: "#94a3b8", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                    <ShieldCheck size={18} color="#38bdf8" style={{ flexShrink: 0 }} />
                    <span>
                      TechZone Guarantee: All approved returns include complimentary doorstep pickup. Once inspected at our warehouse, your refund or replacement is processed automatically.
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Wizard Footer */}
        {eligibilityData?.isEligible && (
          <div className="return-wizard-footer">
            {step > 1 ? (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setStep((prev) => prev - 1)}
                disabled={submitting}
              >
                <ChevronLeft size={16} /> Back
              </button>
            ) : (
              <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
            )}

            {step < 5 ? (
              <button
                type="button"
                className="btn-primary"
                onClick={handleNextStep}
                id="wizard-next-step-btn"
              >
                Next Step <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary"
                onClick={handleSubmitReturn}
                disabled={submitting}
                id="wizard-submit-return-btn"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)", border: "none" }}
              >
                {submitting ? "Submitting Request..." : "Submit Return Request →"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
