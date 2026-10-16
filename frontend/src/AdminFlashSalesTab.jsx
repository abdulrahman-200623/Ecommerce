import React, { useState, useEffect, useMemo } from "react";
import {
  Zap,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  Tag,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  Eye,
  ToggleLeft,
  ToggleRight,
  Flame,
  X,
  Package,
  Layers
} from "lucide-react";
import axios from "axios";
import "./flashSale.css";
import "./admin.css";

const API_BASE = "http://localhost:5000/api";

export default function AdminFlashSalesTab({
  products = [],
  token,
  onViewProduct,
  showToast
}) {
  const [sales, setSales] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, active: 0, scheduled: 0, expired: 0, disabled: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [formData, setFormData] = useState({
    productId: "",
    salePrice: "",
    discountPercentage: "",
    startTime: "",
    endTime: "",
    saleQuantity: "",
    isActive: true
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Admin auth headers
  const getAuthHeaders = () => ({
    headers: {
      "x-admin-key": "techzone-admin-secret",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/flash-sales/all`, getAuthHeaders());
      if (res.data?.success) {
        setSales(res.data.flashSales || []);
        if (res.data.metrics) setMetrics(res.data.metrics);
      }
    } catch (err) {
      console.warn("Failed to load flash sales for admin:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // Format date-time for datetime-local input
  const formatForInput = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    const now = new Date();
    const end = new Date(now.getTime() + 24 * 3600000); // 24 hours default

    setEditingSale(null);
    setFormData({
      productId: products[0] ? String(products[0]._id) : "",
      salePrice: "",
      discountPercentage: "25",
      startTime: formatForInput(now),
      endTime: formatForInput(end),
      saleQuantity: "20",
      isActive: true
    });

    // Auto-calculate initial price based on first product
    if (products[0]) {
      const orig = Number(products[0].price);
      setFormData((prev) => ({
        ...prev,
        salePrice: Math.round(orig * 0.75).toString()
      }));
    }

    setFormError("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (sale) => {
    setEditingSale(sale);
    setFormData({
      productId: sale.productId,
      salePrice: sale.salePrice.toString(),
      discountPercentage: sale.discountPercentage.toString(),
      startTime: formatForInput(sale.startTime),
      endTime: formatForInput(sale.endTime),
      saleQuantity: sale.saleQuantity ? sale.saleQuantity.toString() : "",
      isActive: sale.isActive
    });
    setFormError("");
    setIsModalOpen(true);
  };

  // Currently selected product in form
  const selectedProduct = useMemo(() => {
    if (!formData.productId) return null;
    return products.find((p) => String(p._id) === String(formData.productId) || String(p.productId) === String(formData.productId)) || null;
  }, [products, formData.productId]);

  // Handle Product Change
  const handleProductSelect = (pId) => {
    const prod = products.find((p) => String(p._id) === String(pId) || String(p.productId) === String(pId));
    const orig = prod ? Number(prod.price) : 0;
    const disc = parseInt(formData.discountPercentage, 10) || 20;
    const computedSale = orig > 0 ? Math.round(orig * (1 - disc / 100)) : "";

    setFormData((prev) => ({
      ...prev,
      productId: pId,
      salePrice: computedSale.toString()
    }));
  };

  // Handle Discount Change -> recalculates sale price
  const handleDiscountChange = (discStr) => {
    const disc = parseInt(discStr, 10) || 0;
    const orig = selectedProduct ? Number(selectedProduct.price) : 0;
    const computedSale = orig > 0 && disc > 0 && disc < 100 ? Math.round(orig * (1 - disc / 100)) : "";

    setFormData((prev) => ({
      ...prev,
      discountPercentage: discStr,
      salePrice: computedSale.toString()
    }));
  };

  // Handle Sale Price Change -> recalculates discount percentage
  const handleSalePriceChange = (priceStr) => {
    const sPrice = Number(priceStr) || 0;
    const orig = selectedProduct ? Number(selectedProduct.price) : 0;
    let computedDisc = "";
    if (orig > 0 && sPrice > 0 && sPrice < orig) {
      computedDisc = Math.round(((orig - sPrice) / orig) * 100).toString();
    }

    setFormData((prev) => ({
      ...prev,
      salePrice: priceStr,
      discountPercentage: computedDisc
    }));
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!selectedProduct) {
      setFormError("Please select a valid product.");
      return;
    }

    const origPrice = Number(selectedProduct.price);
    const sPrice = Number(formData.salePrice);
    const disc = Number(formData.discountPercentage);

    if (!sPrice || sPrice <= 0) {
      setFormError("Sale price must be greater than zero.");
      return;
    }

    if (sPrice >= origPrice) {
      setFormError(`Sale price (₹${sPrice}) must be lower than original price (₹${origPrice}).`);
      return;
    }

    if (!disc || disc < 1 || disc > 99) {
      setFormError("Discount percentage must be between 1% and 99%.");
      return;
    }

    if (!formData.startTime || !formData.endTime) {
      setFormError("Start and end dates/times are required.");
      return;
    }

    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);

    if (end <= start) {
      setFormError("Sale end date & time must be strictly after the start date & time.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingSale) {
        // PUT update
        const res = await axios.put(
          `${API_BASE}/flash-sales/${editingSale._id}`,
          {
            salePrice: sPrice,
            discountPercentage: disc,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            saleQuantity: parseInt(formData.saleQuantity, 10) || 0,
            isActive: formData.isActive
          },
          getAuthHeaders()
        );

        if (res.data?.success) {
          if (showToast) showToast("Flash sale deal updated successfully.");
          setIsModalOpen(false);
          fetchSales();
        }
      } else {
        // POST create
        const res = await axios.post(
          `${API_BASE}/flash-sales`,
          {
            productId: String(selectedProduct._id || selectedProduct.productId),
            salePrice: sPrice,
            discountPercentage: disc,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            saleQuantity: parseInt(formData.saleQuantity, 10) || 0,
            isActive: formData.isActive
          },
          getAuthHeaders()
        );

        if (res.data?.success) {
          if (showToast) showToast("New flash sale deal launched successfully!");
          setIsModalOpen(false);
          fetchSales();
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to save flash sale.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Active/Disable
  const handleToggleActive = async (sale) => {
    try {
      const res = await axios.patch(
        `${API_BASE}/flash-sales/${sale._id}/toggle`,
        {},
        getAuthHeaders()
      );
      if (res.data?.success) {
        if (showToast) showToast(res.data.message);
        fetchSales();
      }
    } catch (err) {
      if (showToast) showToast("Failed to toggle deal status.", "error");
    }
  };

  // Delete Deal
  const handleDelete = async (sale) => {
    if (!window.confirm(`Are you sure you want to remove flash sale for "${sale.name}"?`)) {
      return;
    }

    try {
      const res = await axios.delete(
        `${API_BASE}/flash-sales/${sale._id}`,
        getAuthHeaders()
      );
      if (res.data?.success) {
        if (showToast) showToast(res.data.message);
        fetchSales();
      }
    } catch (err) {
      if (showToast) showToast("Failed to delete flash sale.", "error");
    }
  };

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const matchSearch =
        !search.trim() ||
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.productId?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [sales, search, statusFilter]);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="admin-flash-sales-section">
      {/* Metrics Row */}
      <div className="admin-flash-stats-grid">
        <div className="admin-flash-stat-card">
          <div className="admin-flash-stat-icon stat-icon-active">
            <Zap size={22} />
          </div>
          <div className="admin-flash-stat-info">
            <h4>Active Deals</h4>
            <div className="stat-value">{metrics.active}</div>
          </div>
        </div>

        <div className="admin-flash-stat-card">
          <div className="admin-flash-stat-icon stat-icon-scheduled">
            <Clock size={22} />
          </div>
          <div className="admin-flash-stat-info">
            <h4>Scheduled</h4>
            <div className="stat-value">{metrics.scheduled}</div>
          </div>
        </div>

        <div className="admin-flash-stat-card">
          <div className="admin-flash-stat-icon stat-icon-expired">
            <Flame size={22} />
          </div>
          <div className="admin-flash-stat-info">
            <h4>Expired</h4>
            <div className="stat-value">{metrics.expired}</div>
          </div>
        </div>

        <div className="admin-flash-stat-card">
          <div className="admin-flash-stat-icon stat-icon-total">
            <Layers size={22} />
          </div>
          <div className="admin-flash-stat-info">
            <h4>Total Deals</h4>
            <div className="stat-value">{metrics.total}</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-flash-toolbar">
        <div className="admin-flash-toolbar-left">
          <div className="admin-flash-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search deals by product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="admin-search-flash-sales"
            />
          </div>

          <select
            className="admin-flash-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            id="admin-filter-flash-status"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Scheduled">Scheduled Only</option>
            <option value="Expired">Expired Only</option>
            <option value="Disabled">Disabled Only</option>
          </select>
        </div>

        <button
          className="btn-create-flash"
          onClick={handleOpenCreate}
          id="admin-create-flash-sale-btn"
        >
          <Plus size={16} />
          <span>Launch Flash Sale</span>
        </button>
      </div>

      {/* Table */}
      <div className="admin-flash-table-wrap">
        <table className="admin-flash-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Regular Price</th>
              <th>Flash Sale Price</th>
              <th>Discount</th>
              <th>Period (Local Time)</th>
              <th>Claimed / Quota</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                  {loading ? "Loading flash sales..." : "No flash sale deals found matching filters."}
                </td>
              </tr>
            ) : (
              filteredSales.map((sale) => {
                const quota = sale.saleQuantity || 0;
                const sold = sale.soldQuantity || 0;
                const soldPercent = quota > 0 ? Math.min(100, Math.round((sold / quota) * 100)) : 0;

                return (
                  <tr key={sale._id}>
                    <td>
                      <div className="admin-flash-prod-cell">
                        <img src={sale.image} alt={sale.name} className="admin-flash-thumb" />
                        <div>
                          <span className="admin-flash-prod-title">{sale.name}</span>
                          <span className="admin-flash-prod-cat">{sale.category}</span>
                        </div>
                      </div>
                    </td>
                    <td>₹{sale.originalPrice?.toLocaleString("en-IN")}</td>
                    <td>
                      <strong style={{ color: "#ef4444" }}>
                        ₹{sale.salePrice?.toLocaleString("en-IN")}
                      </strong>
                    </td>
                    <td>
                      <span className="flash-discount-badge" style={{ display: "inline-flex" }}>
                        {sale.discountPercentage}% OFF
                      </span>
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>
                      <div>Start: {formatDateTime(sale.startTime)}</div>
                      <div>End: {formatDateTime(sale.endTime)}</div>
                    </td>
                    <td>
                      <div style={{ minWidth: "110px" }}>
                        <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "3px" }}>
                          {quota > 0 ? `${sold} / ${quota} (${soldPercent}%)` : `${sold} sold (No limit)`}
                        </div>
                        {quota > 0 && (
                          <div className="quota-bar-track">
                            <div className="quota-bar-fill" style={{ width: `${soldPercent}%` }} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`admin-status-badge status-badge-${sale.status.toLowerCase()}`}>
                        {sale.status === "Active" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />}
                        {sale.status}
                      </span>
                    </td>
                    <td>
                      <div className="admin-flash-actions">
                        <button
                          className="admin-action-icon-btn"
                          onClick={() => handleToggleActive(sale)}
                          title={sale.isActive ? "Disable Deal" : "Enable Deal"}
                          id={`toggle-sale-btn-${sale._id}`}
                        >
                          {sale.isActive ? <ToggleRight size={17} color="#10b981" /> : <ToggleLeft size={17} color="#64748b" />}
                        </button>

                        <button
                          className="admin-action-icon-btn"
                          onClick={() => handleOpenEdit(sale)}
                          title="Edit Deal"
                          id={`edit-sale-btn-${sale._id}`}
                        >
                          <Edit2 size={15} />
                        </button>

                        <button
                          className="admin-action-icon-btn btn-delete"
                          onClick={() => handleDelete(sale)}
                          title="Delete Deal"
                          id={`delete-sale-btn-${sale._id}`}
                        >
                          <Trash2 size={15} />
                        </button>

                        {onViewProduct && (
                          <button
                            className="admin-action-icon-btn"
                            onClick={() => onViewProduct({ _id: sale.productId })}
                            title="Preview on Store"
                          >
                            <Eye size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="flash-modal-overlay">
          <div className="flash-modal-card">
            <div className="flash-modal-header">
              <h3>
                <Zap size={20} color="#ef4444" />
                <span>{editingSale ? "Edit Flash Sale Deal" : "Launch New Flash Sale"}</span>
              </h3>
              <button className="flash-modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="flash-modal-body">
                {formError && (
                  <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.4)", padding: "10px 14px", borderRadius: "10px", color: "#fca5a5", fontSize: "0.85rem", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <AlertTriangle size={16} />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Product Selector */}
                <div className="flash-form-group">
                  <label>Select Product from Catalog *</label>
                  <select
                    className="flash-select"
                    value={formData.productId}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    disabled={!!editingSale}
                    id="admin-flash-select-product"
                  >
                    {products.map((p) => (
                      <option key={p._id || p.productId} value={p._id || p.productId}>
                        {p.name} — Regular: ₹{Number(p.price).toLocaleString("en-IN")} ({p.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price & Discount Dual Inputs */}
                <div className="flash-form-row">
                  <div className="flash-form-group">
                    <label>Discount Percentage (% OFF) *</label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      className="flash-input"
                      placeholder="e.g. 30"
                      value={formData.discountPercentage}
                      onChange={(e) => handleDiscountChange(e.target.value)}
                      required
                      id="admin-flash-discount-input"
                    />
                  </div>

                  <div className="flash-form-group">
                    <label>Flash Sale Price (₹ INR) *</label>
                    <input
                      type="number"
                      min="1"
                      className="flash-input"
                      placeholder="e.g. 2999"
                      value={formData.salePrice}
                      onChange={(e) => handleSalePriceChange(e.target.value)}
                      required
                      id="admin-flash-price-input"
                    />
                  </div>
                </div>

                {/* Start & End Date Pickers */}
                <div className="flash-form-row">
                  <div className="flash-form-group">
                    <label>Sale Start Date & Time *</label>
                    <input
                      type="datetime-local"
                      className="flash-input"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      required
                      id="admin-flash-start-input"
                    />
                  </div>

                  <div className="flash-form-group">
                    <label>Sale End Date & Time *</label>
                    <input
                      type="datetime-local"
                      className="flash-input"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      required
                      id="admin-flash-end-input"
                    />
                  </div>
                </div>

                {/* Quota & Status */}
                <div className="flash-form-row">
                  <div className="flash-form-group">
                    <label>Sale Quantity Limit / Quota (Optional)</label>
                    <input
                      type="number"
                      min="0"
                      className="flash-input"
                      placeholder="Leave blank or 0 for unlimited"
                      value={formData.saleQuantity}
                      onChange={(e) => setFormData({ ...formData, saleQuantity: e.target.value })}
                      id="admin-flash-quota-input"
                    />
                  </div>

                  <div className="flash-form-group">
                    <label>Status</label>
                    <select
                      className="flash-select"
                      value={formData.isActive ? "true" : "false"}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "true" })}
                    >
                      <option value="true">Active / Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                </div>

                {/* Live Deal Preview */}
                {selectedProduct && (
                  <div className="flash-preview-box">
                    <img src={selectedProduct.image} alt={selectedProduct.name} className="flash-preview-thumb" />
                    <div className="flash-preview-details">
                      <h4>{selectedProduct.name}</h4>
                      <div className="flash-preview-pricing">
                        <strong style={{ color: "#ef4444", fontSize: "1.1rem" }}>
                          ₹{Number(formData.salePrice || 0).toLocaleString("en-IN")}
                        </strong>
                        <del style={{ color: "#64748b", fontSize: "0.85rem" }}>
                          ₹{Number(selectedProduct.price).toLocaleString("en-IN")}
                        </del>
                        <span className="flash-preview-savings">
                          {formData.discountPercentage}% OFF (Customer saves ₹
                          {Math.max(0, Number(selectedProduct.price) - Number(formData.salePrice || 0)).toLocaleString("en-IN")})
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flash-modal-footer">
                <button
                  type="button"
                  className="btn-flash-cancel"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-flash-submit"
                  disabled={submitting}
                  id="admin-flash-save-deal-btn"
                >
                  {submitting ? "Saving Deal..." : editingSale ? "Update Flash Deal" : "Publish Flash Deal →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
