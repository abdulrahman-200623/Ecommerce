import React, { useState, useMemo, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Search,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  Eye,
  X,
  ChevronDown,
  Save,
  ArrowLeft,
  Download,
  Database,
  Star,
  Layers,
  Phone,
  Mail,
  MapPin,
  PlusCircle,
  Check,
  Tag,
  DollarSign,
  Image as ImageIcon
} from "lucide-react";
import axios from "axios";
import "./admin.css";
import "./admin_add_page.css";

// Preset high quality tech product images
const PRESET_IMAGES = [
  { label: "Smartphone", url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=700&q=80" },
  { label: "Laptop", url: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=700&q=80" },
  { label: "Headphones", url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80" },
  { label: "Smartwatch", url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80" },
  { label: "Earbuds", url: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=700&q=80" },
  { label: "Monitor", url: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=700&q=80" },
  { label: "Fast Charger", url: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=700&q=80" },
  { label: "Gaming Mouse", url: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=700&q=80" }
];

export default function AdminPanel({
  products,
  setProducts,
  orders,
  setOrders,
  onBackToStore,
  onViewProduct
}) {
  // Determine initial tab based on current URL path
  const getInitialTab = () => {
    const p = window.location.pathname;
    if (p === "/admin/add-product") return "add-product";
    if (p === "/admin/products") return "products";
    if (p === "/admin/orders") return "orders";
    if (p === "/admin/analytics") return "analytics";
    if (p === "/admin/customers") return "customers";
    if (p === "/admin/settings") return "settings";
    return "dashboard";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");
  const [backendOnline, setBackendOnline] = useState(false);
  const [toast, setToast] = useState(null);

  // Modal states for edit & order details
  const [editingProduct, setEditingProduct] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  // Dedicated Add Product Form State
  const initialNewProductForm = {
    name: "Samsung Galaxy S24 Ultra",
    tagline: "12GB RAM | 256GB Storage | Titanium Gray",
    category: "Mobiles",
    price: "99999",
    originalPrice: "119999",
    discount: "17",
    stock: 20,
    rating: 4.8,
    reviews: 64,
    deliveryBadge: "Free Delivery",
    image: PRESET_IMAGES[0].url,
    description: "Premium flagship smartphone with dynamic AMOLED 2X display, quad telephoto camera system, and ultra-durable titanium frame."
  };

  const [addForm, setAddForm] = useState(initialNewProductForm);
  const [lastCreatedProduct, setLastCreatedProduct] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Switch tab and sync browser URL
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const path = tab === "dashboard" ? "/admin" : `/admin/${tab}`;
    window.history.pushState({}, "", path);
  };

  // Sync tab on browser back/forward buttons
  useEffect(() => {
    const onPop = () => {
      setActiveTab(getInitialTab());
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Check Backend Connectivity
  const checkBackend = async () => {
    try {
      const res = await axios.get("http://localhost:5000/", { timeout: 2000 });
      if (res.data) setBackendOnline(true);
    } catch (e) {
      setBackendOnline(false);
    }
  };

  useEffect(() => {
    checkBackend();
    const interval = setInterval(checkBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  // Categories list
  const categories = useMemo(() => {
    return ["All", ...new Set(products.map(p => p.category))];
  }, [products]);

  // Calculations for KPIs
  const totalRevenue = useMemo(() => {
    return orders
      .filter(o => o.status !== "Cancelled")
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  }, [orders]);

  const lowStockCount = useMemo(() => {
    return products.filter(p => (Number(p.stock) || 0) > 0 && (Number(p.stock) || 0) <= 5).length;
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.filter(p => (Number(p.stock) || 0) <= 0).length;
  }, [products]);

  const pendingOrdersCount = useMemo(() => {
    return orders.filter(o => o.status === "Pending").length;
  }, [orders]);

  // Category Distribution calculation
  const categoryStats = useMemo(() => {
    const counts = {};
    products.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    const total = products.length || 1;
    return Object.entries(counts).map(([cat, count]) => ({
      name: cat,
      count,
      pct: Math.round((count / total) * 100)
    })).sort((a, b) => b.count - a.count);
  }, [products]);

  // Handle Add Product Pricing Change with auto discount
  const handleAddPriceChange = (field, val) => {
    const updated = { ...addForm, [field]: val };
    const p = parseFloat(field === "price" ? val : updated.price);
    const op = parseFloat(field === "originalPrice" ? val : updated.originalPrice);
    if (!isNaN(p) && !isNaN(op) && op > p) {
      updated.discount = Math.round(((op - p) / op) * 100).toString();
    }
    setAddForm(updated);
  };

  // Submit on Dedicated Add Product Page
  const handlePublishNewProduct = async (e) => {
    if (e) e.preventDefault();
    if (!addForm.name.trim() || !addForm.price) {
      showToast("Please provide product name and price", "info");
      return;
    }

    const payload = {
      name: addForm.name.trim(),
      category: addForm.category,
      price: Number(addForm.price),
      originalPrice: Number(addForm.originalPrice) || Number(addForm.price),
      discount: Number(addForm.discount) || 0,
      stock: Number(addForm.stock) || 0,
      rating: Number(addForm.rating) || 4.5,
      reviews: Number(addForm.reviews) || 0,
      image: addForm.image || PRESET_IMAGES[0].url,
      description: addForm.description || addForm.tagline || ""
    };

    const newId = "prod_" + Date.now();
    const newProduct = { ...payload, _id: newId, createdAt: new Date().toISOString() };
    const updatedList = [newProduct, ...products];
    setProducts(updatedList);
    localStorage.setItem("techzone_products", JSON.stringify(updatedList));

    if (backendOnline) {
      try {
        const res = await axios.post("http://localhost:5000/api/products", payload);
        if (res.data?._id) {
          newProduct._id = res.data._id;
          setProducts([res.data, ...products]);
        }
      } catch (err) {
        console.warn("Backend create failed, saved locally", err);
      }
    }

    setLastCreatedProduct(newProduct);
    showToast(`"${payload.name}" published to store successfully!`);
  };

  // Quick reset add product form
  const handleResetAddForm = () => {
    setAddForm({
      name: "",
      tagline: "",
      category: "Mobiles",
      price: "",
      originalPrice: "",
      discount: "10",
      stock: 15,
      rating: 4.8,
      reviews: 10,
      deliveryBadge: "Free Delivery",
      image: PRESET_IMAGES[0].url,
      description: ""
    });
    setLastCreatedProduct(null);
  };

  // Open Edit Modal
  const handleOpenEdit = (p) => {
    setEditingProduct({
      _id: p._id,
      name: p.name || "",
      category: p.category || "Mobiles",
      price: p.price || "",
      originalPrice: p.originalPrice || "",
      discount: p.discount || "",
      stock: p.stock ?? 10,
      rating: p.rating ?? 4.5,
      reviews: p.reviews ?? 0,
      image: p.image || PRESET_IMAGES[0].url,
      description: p.description || ""
    });
    setIsEditModalOpen(true);
  };

  // Save Edit Modal
  const handleSaveEditProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct.name.trim() || !editingProduct.price) {
      showToast("Please provide product name and price", "info");
      return;
    }

    const payload = {
      ...editingProduct,
      price: Number(editingProduct.price),
      originalPrice: Number(editingProduct.originalPrice) || Number(editingProduct.price),
      discount: Number(editingProduct.discount) || 0,
      stock: Number(editingProduct.stock) || 0,
      rating: Number(editingProduct.rating) || 4.5,
      reviews: Number(editingProduct.reviews) || 0
    };

    const targetId = editingProduct._id;
    const updatedList = products.map(p => p._id === targetId ? { ...p, ...payload } : p);
    setProducts(updatedList);
    localStorage.setItem("techzone_products", JSON.stringify(updatedList));

    if (backendOnline) {
      try {
        await axios.put(`http://localhost:5000/api/products/${targetId}`, payload);
      } catch (err) {
        console.warn("Backend update failed, kept locally", err);
      }
    }

    showToast(`Updated "${payload.name}" successfully!`);
    setIsEditModalOpen(false);
  };

  // Delete product
  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    const filtered = products.filter(p => p._id !== id);
    setProducts(filtered);
    localStorage.setItem("techzone_products", JSON.stringify(filtered));

    if (backendOnline) {
      try {
        await axios.delete(`http://localhost:5000/api/products/${id}`);
      } catch (err) {
        console.warn("Backend delete failed", err);
      }
    }
    showToast(`Deleted "${name}"`);
  };

  // Inline Stock Modifier
  const handleStockAdjust = async (product, delta) => {
    const newStock = Math.max(0, (Number(product.stock) || 0) + delta);
    const updated = products.map(p => p._id === product._id ? { ...p, stock: newStock } : p);
    setProducts(updated);
    localStorage.setItem("techzone_products", JSON.stringify(updated));

    if (backendOnline) {
      try {
        await axios.put(`http://localhost:5000/api/products/${product._id}`, { stock: newStock });
      } catch (e) {}
    }
  };

  // Update order status
  const handleOrderStatusChange = async (orderId, newStatus) => {
    const updated = orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o);
    setOrders(updated);
    localStorage.setItem("techzone_orders", JSON.stringify(updated));

    if (backendOnline) {
      try {
        await axios.put(`http://localhost:5000/api/orders/${orderId}`, { status: newStatus });
      } catch (e) {}
    }
    showToast(`Order status updated to ${newStatus}`);
  };

  // Delete order
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Delete this order record?")) return;
    const filtered = orders.filter(o => o._id !== orderId);
    setOrders(filtered);
    localStorage.setItem("techzone_orders", JSON.stringify(filtered));

    if (backendOnline) {
      try {
        await axios.delete(`http://localhost:5000/api/orders/${orderId}`);
      } catch (e) {}
    }
    showToast("Order removed");
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchQuery = `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === "All" || p.category === categoryFilter;
      const stock = Number(p.stock) || 0;
      let matchStock = true;
      if (stockFilter === "In Stock") matchStock = stock > 5;
      else if (stockFilter === "Low Stock") matchStock = stock > 0 && stock <= 5;
      else if (stockFilter === "Out of Stock") matchStock = stock <= 0;
      return matchQuery && matchCategory && matchStock;
    });
  }, [products, searchQuery, categoryFilter, stockFilter]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (orderStatusFilter === "All") return true;
      return o.status === orderStatusFilter;
    });
  }, [orders, orderStatusFilter]);

  // Reset / Reseed Catalog
  const handleResetCatalog = () => {
    if (window.confirm("Reset all products back to default demo catalog? Any custom products will be overwritten.")) {
      localStorage.removeItem("techzone_products");
      window.location.reload();
    }
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ products, orders }, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `techzone-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Backup downloaded as JSON!");
  };

  // Savings computation for preview
  const savingsAmount = useMemo(() => {
    const p = Number(addForm.price) || 0;
    const op = Number(addForm.originalPrice) || 0;
    return op > p ? op - p : 0;
  }, [addForm.price, addForm.originalPrice]);

  return (
    <div className="admin-wrapper">
      {/* Toast Notification */}
      {toast && (
        <div className={`admin-toast ${toast.type === "success" ? "toast-success" : "toast-info"}`}>
          <CheckCircle2 size={18} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-brand">
            <div className="admin-logo-icon">
              <ShieldCheck size={22} />
            </div>
            <div className="admin-brand-text">
              <h2>Tech<span>Zone</span></h2>
              <p>Admin Console</p>
            </div>
          </div>
        </div>

        <nav className="admin-nav">
          <button
            className={`admin-nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => handleTabChange("dashboard")}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === "products" ? "active" : ""}`}
            onClick={() => handleTabChange("products")}
          >
            <Package size={18} />
            <span>Products</span>
            <span className="badge">{products.length}</span>
          </button>

          {/* DEDICATED ADD PRODUCT LINK */}
          <button
            className={`admin-nav-item ${activeTab === "add-product" ? "active" : ""}`}
            onClick={() => handleTabChange("add-product")}
            style={
              activeTab === "add-product"
                ? {
                    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.22), rgba(6, 182, 212, 0.15))",
                    borderColor: "rgba(16, 185, 129, 0.4)",
                    color: "#34d399"
                  }
                : {}
            }
          >
            <PlusCircle size={18} />
            <span>Add Product</span>
            <span
              className="badge"
              style={{
                background: activeTab === "add-product" ? "#10b981" : "rgba(16, 185, 129, 0.2)",
                color: activeTab === "add-product" ? "#fff" : "#34d399",
                fontWeight: "700"
              }}
            >
              + New
            </span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => handleTabChange("orders")}
          >
            <ShoppingCart size={18} />
            <span>Orders</span>
            {pendingOrdersCount > 0 && (
              <span className="badge" style={{ background: "#f59e0b", color: "#000" }}>
                {pendingOrdersCount}
              </span>
            )}
          </button>

          <button
            className={`admin-nav-item ${activeTab === "analytics" ? "active" : ""}`}
            onClick={() => handleTabChange("analytics")}
          >
            <BarChart3 size={18} />
            <span>Analytics</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === "customers" ? "active" : ""}`}
            onClick={() => handleTabChange("customers")}
          >
            <Users size={18} />
            <span>Customers</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => handleTabChange("settings")}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-store-btn" onClick={onBackToStore}>
            <ArrowLeft size={16} />
            <span>Back to Store</span>
          </button>

          <div className="admin-user-pill">
            <div className="admin-avatar">AD</div>
            <div className="admin-user-info">
              <span className="admin-user-name">Administrator</span>
              <span className="admin-user-role">Super Admin</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <h1 className="admin-page-title">
              {activeTab === "dashboard" && "Dashboard Overview"}
              {activeTab === "products" && "Product Catalog Management"}
              {activeTab === "add-product" && "Add New Product"}
              {activeTab === "orders" && "Customer Orders Management"}
              {activeTab === "analytics" && "Store Performance & Analytics"}
              {activeTab === "customers" && "Customer Directory"}
              {activeTab === "settings" && "Store Settings & Tools"}
            </h1>

            <div className={`admin-status-pill ${backendOnline ? "status-online" : "status-offline"}`}>
              {backendOnline ? (
                <>
                  <CheckCircle2 size={13} />
                  <span>MongoDB API Connected</span>
                </>
              ) : (
                <>
                  <Clock size={13} />
                  <span>Hybrid Local Storage Mode</span>
                </>
              )}
            </div>
          </div>

          <div className="admin-topbar-right">
            {activeTab !== "add-product" ? (
              <button
                className="admin-action-btn-primary"
                onClick={() => handleTabChange("add-product")}
              >
                <Plus size={16} />
                <span>Add New Product</span>
              </button>
            ) : (
              <button
                className="admin-btn-secondary"
                onClick={() => handleTabChange("products")}
              >
                <Package size={15} />
                <span>View Products Catalog</span>
              </button>
            )}
          </div>
        </header>

        {/* Tab Contents */}
        <div className="admin-content">
          {/* =========================================================
              TAB: DEDICATED SEPARATE ADD PRODUCT PAGE
             ========================================================= */}
          {activeTab === "add-product" && (
            <div className="add-product-container">
              {/* Breadcrumbs */}
              <div className="breadcrumb-bar">
                <span>Admin</span>
                <span>/</span>
                <span style={{ cursor: "pointer" }} onClick={() => handleTabChange("products")}>Products</span>
                <span>/</span>
                <span className="active">Add New Product</span>
              </div>

              {/* Success Banner if just published */}
              {lastCreatedProduct && (
                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(6, 182, 212, 0.12))",
                    border: "1px solid rgba(16, 185, 129, 0.4)",
                    borderRadius: "12px",
                    padding: "18px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "10px",
                        background: "#10b981",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff"
                      }}
                    >
                      <Check size={24} />
                    </div>
                    <div>
                      <h4 style={{ margin: "0 0 2px", color: "#fff", fontSize: "16px" }}>
                        "{lastCreatedProduct.name}" is now live!
                      </h4>
                      <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
                        Priced at ₹{Number(lastCreatedProduct.price).toLocaleString("en-IN")} • In Stock ({lastCreatedProduct.stock} units)
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      className="admin-btn-secondary"
                      onClick={() => onViewProduct(lastCreatedProduct)}
                    >
                      <Eye size={15} />
                      <span>View in Store</span>
                    </button>
                    <button
                      className="admin-action-btn-primary"
                      onClick={() => handleTabChange("products")}
                    >
                      <Package size={15} />
                      <span>Go to Products Table</span>
                    </button>
                    <button
                      className="admin-btn-secondary"
                      onClick={handleResetAddForm}
                    >
                      <span>Add Another Product</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Two Column Layout: Form on Left, Live Preview on Right */}
              <div className="add-product-grid">
                {/* Form Column */}
                <form className="form-column" onSubmit={handlePublishNewProduct}>
                  {/* Section 1: Basic Product Information */}
                  <div className="section-card">
                    <div className="section-header">
                      <h3><Tag size={17} color="#38bdf8" /> Product Information</h3>
                      <span>Essential Catalog Data</span>
                    </div>

                    <div className="admin-form-group">
                      <label>Product Title / Name *</label>
                      <input
                        className="admin-input"
                        placeholder="e.g. Sony WH-1000XM5 Wireless Noise Cancelling Headphones"
                        value={addForm.name}
                        onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="admin-form-row">
                      <div className="admin-form-group">
                        <label>Category *</label>
                        <select
                          className="admin-select"
                          value={addForm.category}
                          onChange={e => setAddForm({ ...addForm, category: e.target.value })}
                        >
                          <option value="Mobiles">Mobiles</option>
                          <option value="Laptops">Laptops</option>
                          <option value="Headphones">Headphones</option>
                          <option value="Smartwatches">Smartwatches</option>
                          <option value="Earbuds">Earbuds</option>
                          <option value="Monitors">Monitors</option>
                          <option value="Accessories">Accessories</option>
                        </select>
                      </div>

                      <div className="admin-form-group">
                        <label>Subtitle / Key Specs Highlight</label>
                        <input
                          className="admin-input"
                          placeholder="e.g. Active Noise Cancellation | 30hr Battery"
                          value={addForm.tagline}
                          onChange={e => setAddForm({ ...addForm, tagline: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="admin-form-group">
                      <label>Product Description *</label>
                      <textarea
                        className="admin-textarea"
                        style={{ minHeight: "100px" }}
                        placeholder="Enter comprehensive description, performance specs, build quality, and what makes this gadget standout..."
                        value={addForm.description}
                        onChange={e => setAddForm({ ...addForm, description: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Section 2: Pricing & Deals */}
                  <div className="section-card">
                    <div className="section-header">
                      <h3><DollarSign size={17} color="#10b981" /> Pricing & Deals</h3>
                      <span>Currency in Indian Rupee (₹)</span>
                    </div>

                    <div className="admin-form-row">
                      <div className="admin-form-group">
                        <label>Selling Price (₹) *</label>
                        <input
                          type="number"
                          className="admin-input"
                          placeholder="e.g. 26990"
                          value={addForm.price}
                          onChange={e => handleAddPriceChange("price", e.target.value)}
                          required
                        />
                      </div>

                      <div className="admin-form-group">
                        <label>Original MRP Price (₹)</label>
                        <input
                          type="number"
                          className="admin-input"
                          placeholder="e.g. 34990"
                          value={addForm.originalPrice}
                          onChange={e => handleAddPriceChange("originalPrice", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="admin-form-row">
                      <div className="admin-form-group">
                        <label>Discount Percentage (%)</label>
                        <input
                          type="number"
                          className="admin-input"
                          placeholder="e.g. 23"
                          value={addForm.discount}
                          onChange={e => setAddForm({ ...addForm, discount: e.target.value })}
                        />
                      </div>

                      <div className="admin-form-group">
                        <label>Delivery Text Badge</label>
                        <input
                          className="admin-input"
                          value={addForm.deliveryBadge}
                          onChange={e => setAddForm({ ...addForm, deliveryBadge: e.target.value })}
                        />
                      </div>
                    </div>

                    {savingsAmount > 0 && (
                      <div className="savings-callout">
                        <CheckCircle2 size={16} />
                        <span>
                          Customer saves <strong>₹{savingsAmount.toLocaleString("en-IN")}</strong> ({addForm.discount}% OFF)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Section 3: Inventory & Ratings */}
                  <div className="section-card">
                    <div className="section-header">
                      <h3><Package size={17} color="#f59e0b" /> Inventory & Social Proof</h3>
                      <span>Stock quantities & initial ratings</span>
                    </div>

                    <div className="admin-form-row">
                      <div className="admin-form-group">
                        <label>Stock Quantity (Units) *</label>
                        <input
                          type="number"
                          className="admin-input"
                          placeholder="e.g. 25"
                          value={addForm.stock}
                          onChange={e => setAddForm({ ...addForm, stock: e.target.value })}
                          required
                        />
                      </div>

                      <div className="admin-form-group">
                        <label>Customer Rating (1.0 - 5.0)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="1"
                          max="5"
                          className="admin-input"
                          value={addForm.rating}
                          onChange={e => setAddForm({ ...addForm, rating: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="admin-form-row">
                      <div className="admin-form-group">
                        <label>Review Count</label>
                        <input
                          type="number"
                          className="admin-input"
                          value={addForm.reviews}
                          onChange={e => setAddForm({ ...addForm, reviews: e.target.value })}
                        />
                      </div>

                      <div className="admin-form-group">
                        <label>Stock Status</label>
                        <div style={{ paddingTop: "10px" }}>
                          <span
                            className={`stock-pill ${
                              Number(addForm.stock) <= 0
                                ? "stock-out"
                                : Number(addForm.stock) <= 5
                                ? "stock-low"
                                : "stock-in"
                            }`}
                          >
                            {Number(addForm.stock) <= 0
                              ? "Will mark as Out of Stock"
                              : Number(addForm.stock) <= 5
                              ? "Will mark as Low Stock"
                              : "In Stock & Ready to Ship"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Image & Presets */}
                  <div className="section-card">
                    <div className="section-header">
                      <h3><ImageIcon size={17} color="#a78bfa" /> Product Media & Image</h3>
                      <span>High-res photo URL or preset</span>
                    </div>

                    <div className="admin-form-group">
                      <label>Image URL</label>
                      <input
                        className="admin-input"
                        placeholder="https://images.unsplash.com/..."
                        value={addForm.image}
                        onChange={e => setAddForm({ ...addForm, image: e.target.value })}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label style={{ fontSize: "11px" }}>Quick 1-Click High-Res Presets:</label>
                      <div className="image-presets">
                        {PRESET_IMAGES.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="image-preset-chip"
                            onClick={() => setAddForm({ ...addForm, image: preset.url })}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Publish Actions Row */}
                  <div className="action-publish-row">
                    <button type="submit" className="admin-action-btn-primary publish-btn">
                      <Save size={18} />
                      <span>Publish Product to Store</span>
                    </button>

                    <button
                      type="button"
                      className="admin-btn-secondary"
                      style={{ height: "46px" }}
                      onClick={handleResetAddForm}
                    >
                      Reset Form
                    </button>

                    <button
                      type="button"
                      className="admin-btn-secondary"
                      style={{ height: "46px" }}
                      onClick={() => handleTabChange("products")}
                    >
                      Cancel
                    </button>
                  </div>
                </form>

                {/* Right Column: Live Storefront Card Preview */}
                <div className="preview-column">
                  <div className="preview-card-container">
                    <div className="preview-badge-row">
                      <span className="live-badge">Live Storefront Preview</span>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>Real-time Rendering</span>
                    </div>

                    <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
                      This card updates instantaneously as you type your product information on the left.
                    </p>

                    {/* Mock Storefront Card */}
                    <div className="mock-store-card">
                      {Number(addForm.discount) > 0 && (
                        <b className="discount">{addForm.discount}% OFF</b>
                      )}

                      <div className="pic">
                        <img
                          src={addForm.image || PRESET_IMAGES[0].url}
                          alt={addForm.name || "Product Preview"}
                          onError={e => { e.target.src = PRESET_IMAGES[0].url; }}
                        />
                      </div>

                      <div className="rating">
                        <Star size={13} fill="#f4a300" />
                        <span>{addForm.rating || 4.5}</span>
                        <span style={{ color: "#8491a4", fontWeight: "normal" }}>
                          ({addForm.reviews || 0})
                        </span>
                      </div>

                      <h3>{addForm.name || "Product Title Goes Here"}</h3>
                      <p>{addForm.tagline || addForm.description || "Product specifications and features preview"}</p>

                      <div className="price">
                        <strong>₹{Number(addForm.price || 0).toLocaleString("en-IN")}</strong>
                        {Number(addForm.originalPrice) > Number(addForm.price) && (
                          <del>₹{Number(addForm.originalPrice).toLocaleString("en-IN")}</del>
                        )}
                        {Number(addForm.discount) > 0 && (
                          <b>{addForm.discount}% off</b>
                        )}
                      </div>

                      <div className="delivery">
                        <span>{Number(addForm.stock) > 0 ? "In Stock" : "Out of Stock"}</span>
                        <span>{addForm.deliveryBadge || "Free Delivery"}</span>
                      </div>

                      <button className="add" type="button" onClick={() => showToast("Preview card: Clicked Add to Cart")}>
                        <ShoppingCart size={15} /> Add to Cart
                      </button>
                    </div>

                    <div style={{ background: "rgba(255,255,255,0.02)", padding: "14px", borderRadius: "10px", border: "1px solid var(--admin-border)", fontSize: "12px", color: "#94a3b8" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span>Target Category:</span>
                        <strong style={{ color: "#38bdf8" }}>{addForm.category}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span>Stock Availability:</span>
                        <strong style={{ color: Number(addForm.stock) > 5 ? "#34d399" : "#fbbf24" }}>
                          {addForm.stock} units
                        </strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Status:</span>
                        <strong style={{ color: "#fff" }}>Ready for publication</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB: DASHBOARD
             ========================================================= */}
          {activeTab === "dashboard" && (
            <>
              {/* Stats KPI Grid */}
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <div className="stat-glow-line glow-blue" />
                  <div className="stat-card-header">
                    <span>Total Revenue</span>
                    <div className="stat-icon-wrapper icon-blue">
                      <TrendingUp size={20} />
                    </div>
                  </div>
                  <h3 className="stat-value">₹{totalRevenue.toLocaleString("en-IN")}</h3>
                  <div className="stat-footer">
                    <span className="trend-up"><ArrowUpRight size={14} /> +12.4%</span>
                    <span>from past 30 days</span>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="stat-glow-line glow-emerald" />
                  <div className="stat-card-header">
                    <span>Total Orders</span>
                    <div className="stat-icon-wrapper icon-emerald">
                      <ShoppingCart size={20} />
                    </div>
                  </div>
                  <h3 className="stat-value">{orders.length}</h3>
                  <div className="stat-footer">
                    <span className="trend-up"><ArrowUpRight size={14} /> {pendingOrdersCount} pending</span>
                    <span>requires fulfillment</span>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="stat-glow-line glow-purple" />
                  <div className="stat-card-header">
                    <span>Active Products</span>
                    <div className="stat-icon-wrapper icon-purple">
                      <Package size={20} />
                    </div>
                  </div>
                  <h3 className="stat-value">{products.length}</h3>
                  <div className="stat-footer">
                    <span>Across {categories.length - 1} categories</span>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="stat-glow-line glow-amber" />
                  <div className="stat-card-header">
                    <span>Low Stock Alerts</span>
                    <div className="stat-icon-wrapper icon-amber">
                      <AlertTriangle size={20} />
                    </div>
                  </div>
                  <h3 className="stat-value" style={{ color: (lowStockCount + outOfStockCount) > 0 ? "#fbbf24" : "#fff" }}>
                    {lowStockCount + outOfStockCount}
                  </h3>
                  <div className="stat-footer">
                    <span className="trend-down">{outOfStockCount} out of stock</span>
                    <span>needs restock</span>
                  </div>
                </div>
              </div>

              {/* Analytics & Category Share Row */}
              <div className="admin-analytics-row">
                <div className="admin-card">
                  <div className="admin-card-header">
                    <div>
                      <h3><BarChart3 size={18} /> Sales & Revenue Trajectory</h3>
                      <p>Weekly order volume and checkout sales estimates</p>
                    </div>
                  </div>

                  <div className="sales-chart-container">
                    {[
                      { day: "Mon", val: 65, amount: "₹42,000" },
                      { day: "Tue", val: 45, amount: "₹28,500" },
                      { day: "Wed", val: 80, amount: "₹56,200" },
                      { day: "Thu", val: 55, amount: "₹38,000" },
                      { day: "Fri", val: 92, amount: "₹69,900" },
                      { day: "Sat", val: 78, amount: "₹52,400" },
                      { day: "Sun", val: 88, amount: "₹61,000" }
                    ].map((item, idx) => (
                      <div key={idx} className="chart-bar-group" title={`${item.day}: ${item.amount}`}>
                        <div className="chart-bar-val">{item.amount}</div>
                        <div className="chart-bar-track">
                          <div className="chart-bar-fill" style={{ height: `${item.val}%` }} />
                        </div>
                        <span className="chart-label">{item.day}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#94a3b8" }}>
                    <span>⚡ Average Daily Order Volume: <strong>₹49,700</strong></span>
                    <span>High peak: Friday</span>
                  </div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-header">
                    <div>
                      <h3><Layers size={18} /> Category Catalog Share</h3>
                      <p>Inventory distribution across store</p>
                    </div>
                  </div>

                  <div className="category-progress-list">
                    {categoryStats.slice(0, 5).map((cat, idx) => {
                      const colors = [
                        "linear-gradient(90deg, #38bdf8, #2563eb)",
                        "linear-gradient(90deg, #34d399, #059669)",
                        "linear-gradient(90deg, #a78bfa, #7c3cff)",
                        "linear-gradient(90deg, #fbbf24, #d97706)",
                        "linear-gradient(90deg, #f472b6, #db2777)"
                      ];
                      return (
                        <div key={cat.name} className="category-progress-item">
                          <div className="category-meta">
                            <span className="category-name">{cat.name}</span>
                            <span className="category-pct">{cat.count} items ({cat.pct}%)</span>
                          </div>
                          <div className="progress-track">
                            <div
                              className="progress-fill"
                              style={{ width: `${cat.pct}%`, background: colors[idx % colors.length] }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Recent Orders and Stock Watchlist */}
              <div className="admin-analytics-row">
                <div className="admin-card">
                  <div className="admin-card-header">
                    <div>
                      <h3><ShoppingCart size={18} /> Recent Orders</h3>
                      <p>Customer checkout events</p>
                    </div>
                    <button
                      className="admin-btn-secondary"
                      style={{ height: "32px", fontSize: "12px" }}
                      onClick={() => handleTabChange("orders")}
                    >
                      View All Orders →
                    </button>
                  </div>

                  {orders.length === 0 ? (
                    <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px 0" }}>No orders placed yet.</p>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Order</th>
                            <th>Customer</th>
                            <th>Total</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.slice(0, 5).map(o => (
                            <tr key={o._id}>
                              <td>
                                <strong style={{ color: "#38bdf8" }}>{o.orderNumber || `#${o._id.slice(0, 6)}`}</strong>
                              </td>
                              <td>{o.customer?.name || "Customer"}</td>
                              <td><strong>₹{(o.totalAmount || 0).toLocaleString("en-IN")}</strong></td>
                              <td>
                                <span className={`order-status-badge status-${o.status || "Pending"}`}>
                                  {o.status || "Pending"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="admin-card">
                  <div className="admin-card-header">
                    <div>
                      <h3><AlertTriangle size={18} /> Inventory Watchlist</h3>
                      <p>Low stock items needing restocking</p>
                    </div>
                    <button
                      className="admin-btn-secondary"
                      style={{ height: "32px", fontSize: "12px" }}
                      onClick={() => { handleTabChange("products"); setStockFilter("Low Stock"); }}
                    >
                      Filter Table
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {products
                      .filter(p => (Number(p.stock) || 0) <= 5)
                      .slice(0, 4)
                      .map(p => (
                        <div
                          key={p._id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px",
                            background: "rgba(255,255,255,0.03)",
                            borderRadius: "8px"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <img
                              src={p.image}
                              alt={p.name}
                              style={{ width: "36px", height: "36px", objectFit: "contain", background: "#fff", borderRadius: "6px" }}
                            />
                            <div>
                              <div style={{ fontSize: "13px", fontWeight: "600", color: "#fff" }}>{p.name}</div>
                              <div style={{ fontSize: "11px", color: "#94a3b8" }}>{p.category}</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span className={`stock-pill ${p.stock <= 0 ? "stock-out" : "stock-low"}`}>
                              {p.stock <= 0 ? "0 left" : `${p.stock} left`}
                            </span>
                            <button
                              className="admin-action-btn-primary"
                              style={{ padding: "4px 8px", fontSize: "11px" }}
                              onClick={() => handleStockAdjust(p, 10)}
                              title="Restock +10 units"
                            >
                              +10 Restock
                            </button>
                          </div>
                        </div>
                      ))}

                    {products.filter(p => (Number(p.stock) || 0) <= 5).length === 0 && (
                      <div style={{ textAlign: "center", padding: "24px", color: "#34d399" }}>
                        <CheckCircle2 size={28} style={{ margin: "0 auto 8px" }} />
                        <div>Healthy stock levels across all products!</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* =========================================================
              TAB: PRODUCTS MANAGEMENT TABLE
             ========================================================= */}
          {activeTab === "products" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="admin-toolbar">
                <div className="toolbar-search">
                  <Search size={18} color="#94a3b8" />
                  <input
                    placeholder="Search by title, category, description..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      style={{ background: "none", border: 0, color: "#94a3b8", cursor: "pointer" }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div className="toolbar-filters">
                  <select
                    className="toolbar-select"
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                  >
                    {categories.map(c => <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>)}
                  </select>

                  <select
                    className="toolbar-select"
                    value={stockFilter}
                    onChange={e => setStockFilter(e.target.value)}
                  >
                    <option value="All">All Stock Levels</option>
                    <option value="In Stock">In Stock (&gt; 5)</option>
                    <option value="Low Stock">Low Stock (1 - 5)</option>
                    <option value="Out of Stock">Out of Stock (0)</option>
                  </select>

                  <button className="admin-btn-secondary" onClick={handleExportJSON}>
                    <Download size={15} />
                    <span>Export</span>
                  </button>

                  <button className="admin-action-btn-primary" onClick={() => handleTabChange("add-product")}>
                    <Plus size={16} />
                    <span>Add Product</span>
                  </button>
                </div>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock Status</th>
                      <th>Rating</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(p => {
                      const stock = Number(p.stock) || 0;
                      return (
                        <tr key={p._id}>
                          <td>
                            <div className="product-row-info">
                              <img src={p.image} alt={p.name} className="product-thumb" />
                              <div className="product-title-group">
                                <h4>{p.name}</h4>
                                <p>{p.description}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="category-tag">{p.category}</span>
                          </td>
                          <td>
                            <div>
                              <strong style={{ color: "#34d399", fontSize: "14px" }}>
                                ₹{Number(p.price).toLocaleString("en-IN")}
                              </strong>
                              {p.originalPrice && Number(p.originalPrice) > Number(p.price) && (
                                <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                                  <del>₹{Number(p.originalPrice).toLocaleString("en-IN")}</del>
                                  <b style={{ color: "#10b981", marginLeft: "4px" }}>{p.discount}% off</b>
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span className={`stock-pill ${stock <= 0 ? "stock-out" : stock <= 5 ? "stock-low" : "stock-in"}`}>
                                {stock <= 0 ? "Out of Stock" : stock <= 5 ? `Low (${stock})` : `In Stock (${stock})`}
                              </span>
                              <div className="stock-counter">
                                <button onClick={() => handleStockAdjust(p, -1)} title="Decrease stock">−</button>
                                <button onClick={() => handleStockAdjust(p, 1)} title="Increase stock">+</button>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#f59e0b" }}>
                              <Star size={13} fill="#f59e0b" />
                              <span style={{ color: "#fff", fontWeight: "600" }}>{p.rating || 4.5}</span>
                              <span style={{ color: "#94a3b8" }}>({p.reviews || 0})</span>
                            </div>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div className="table-actions" style={{ justifyContent: "flex-end" }}>
                              <button
                                className="action-icon-btn edit-btn"
                                onClick={() => handleOpenEdit(p)}
                                title="Edit Product"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                className="action-icon-btn"
                                onClick={() => onViewProduct(p)}
                                title="View in Store"
                              >
                                <ExternalLink size={15} />
                              </button>
                              <button
                                className="action-icon-btn delete-btn"
                                onClick={() => handleDeleteProduct(p._id, p.name)}
                                title="Delete Product"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: "center", padding: "48px 20px" }}>
                          <p style={{ color: "#94a3b8", fontSize: "15px", margin: "0 0 12px" }}>
                            No products match your search or filters.
                          </p>
                          <button
                            className="admin-btn-secondary"
                            onClick={() => { setSearchQuery(""); setCategoryFilter("All"); setStockFilter("All"); }}
                          >
                            Reset Filters
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB: ORDERS MANAGEMENT
             ========================================================= */}
          {activeTab === "orders" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                {["All", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map(st => (
                  <button
                    key={st}
                    className={`admin-btn-secondary ${orderStatusFilter === st ? "active" : ""}`}
                    style={{
                      borderColor: orderStatusFilter === st ? "#2563eb" : undefined,
                      background: orderStatusFilter === st ? "rgba(37,99,235,0.2)" : undefined,
                      color: orderStatusFilter === st ? "#60a5fa" : undefined
                    }}
                    onClick={() => setOrderStatusFilter(st)}
                  >
                    <span>{st}</span>
                    <span className="badge">
                      {st === "All" ? orders.length : orders.filter(o => o.status === st).length}
                    </span>
                  </button>
                ))}
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Customer Details</th>
                      <th>Items Ordered</th>
                      <th>Total Amount</th>
                      <th>Status Action</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(o => (
                      <tr key={o._id}>
                        <td>
                          <strong style={{ color: "#38bdf8", fontSize: "14px" }}>
                            {o.orderNumber || `#${o._id.slice(0, 8)}`}
                          </strong>
                          <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                            {o.paymentMethod || "Card / Online"}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: "12px", color: "#cbd5e1" }}>
                            {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "Today"}
                          </div>
                          <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                            {o.createdAt ? new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: "600", color: "#fff" }}>{o.customer?.name || "Customer"}</div>
                          <div style={{ fontSize: "11px", color: "#94a3b8" }}>{o.customer?.email}</div>
                          <div style={{ fontSize: "11px", color: "#94a3b8" }}>{o.customer?.city || o.customer?.address}</div>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {(o.items || []).slice(0, 3).map((item, idx) => (
                              <img
                                key={idx}
                                src={item.image || PRESET_IMAGES[0].url}
                                alt={item.name}
                                style={{ width: "32px", height: "32px", borderRadius: "6px", objectFit: "contain", background: "#fff", padding: "2px" }}
                                title={`${item.name} (x${item.qty})`}
                              />
                            ))}
                            {(o.items || []).length > 3 && (
                              <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                                +{(o.items || []).length - 3} more
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                            {(o.items || []).reduce((sum, it) => sum + (it.qty || 1), 0)} items
                          </div>
                        </td>
                        <td>
                          <strong style={{ color: "#34d399", fontSize: "15px" }}>
                            ₹{(o.totalAmount || 0).toLocaleString("en-IN")}
                          </strong>
                          <div style={{ fontSize: "10px", color: "#10b981" }}>● Paid</div>
                        </td>
                        <td>
                          <select
                            className="toolbar-select"
                            style={{ height: "34px", fontSize: "12px", padding: "0 8px" }}
                            value={o.status || "Pending"}
                            onChange={e => handleOrderStatusChange(o._id, e.target.value)}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className="table-actions" style={{ justifyContent: "flex-end" }}>
                            <button
                              className="action-icon-btn"
                              onClick={() => setSelectedOrderDetails(o)}
                              title="View Full Order Details"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              className="action-icon-btn delete-btn"
                              onClick={() => handleDeleteOrder(o._id)}
                              title="Delete Order"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredOrders.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: "center", padding: "48px 20px" }}>
                          <p style={{ color: "#94a3b8", fontSize: "15px" }}>No orders found for this status.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB: ANALYTICS
             ========================================================= */}
          {activeTab === "analytics" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <div className="stat-glow-line glow-blue" />
                  <div className="stat-card-header">
                    <span>Average Order Value</span>
                    <div className="stat-icon-wrapper icon-blue"><TrendingUp size={20} /></div>
                  </div>
                  <h3 className="stat-value">
                    ₹{orders.length ? Math.round(totalRevenue / orders.length).toLocaleString("en-IN") : "0"}
                  </h3>
                  <div className="stat-footer"><span>Based on completed checkouts</span></div>
                </div>

                <div className="admin-stat-card">
                  <div className="stat-glow-line glow-emerald" />
                  <div className="stat-card-header">
                    <span>Total Inventory Value</span>
                    <div className="stat-icon-wrapper icon-emerald"><Database size={20} /></div>
                  </div>
                  <h3 className="stat-value">
                    ₹{products.reduce((s, p) => s + (Number(p.price) || 0) * (Number(p.stock) || 0), 0).toLocaleString("en-IN")}
                  </h3>
                  <div className="stat-footer"><span>Current stock valuation</span></div>
                </div>

                <div className="admin-stat-card">
                  <div className="stat-glow-line glow-purple" />
                  <div className="stat-card-header">
                    <span>Order Fulfillment Rate</span>
                    <div className="stat-icon-wrapper icon-purple"><CheckCircle2 size={20} /></div>
                  </div>
                  <h3 className="stat-value">
                    {orders.length ? Math.round((orders.filter(o => o.status === "Delivered" || o.status === "Shipped").length / orders.length) * 100) : 100}%
                  </h3>
                  <div className="stat-footer"><span>Shipped / Delivered</span></div>
                </div>

                <div className="admin-stat-card">
                  <div className="stat-glow-line glow-amber" />
                  <div className="stat-card-header">
                    <span>Total Catalog Units</span>
                    <div className="stat-icon-wrapper icon-amber"><Package size={20} /></div>
                  </div>
                  <h3 className="stat-value">
                    {products.reduce((s, p) => s + (Number(p.stock) || 0), 0)}
                  </h3>
                  <div className="stat-footer"><span>Units stored in warehouse</span></div>
                </div>
              </div>

              <div className="admin-analytics-row">
                <div className="admin-card">
                  <div className="admin-card-header">
                    <h3><Star size={18} /> Top Rated Products</h3>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {products
                      .slice()
                      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                      .slice(0, 5)
                      .map((p, idx) => (
                        <div
                          key={p._id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px",
                            background: "rgba(255,255,255,0.02)",
                            borderRadius: "8px"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ fontSize: "14px", fontWeight: "700", color: "#38bdf8", width: "20px" }}>
                              0{idx + 1}
                            </span>
                            <img
                              src={p.image}
                              alt={p.name}
                              style={{ width: "38px", height: "38px", objectFit: "contain", background: "#fff", borderRadius: "6px" }}
                            />
                            <div>
                              <div style={{ fontWeight: "600", color: "#fff" }}>{p.name}</div>
                              <div style={{ fontSize: "12px", color: "#94a3b8" }}>{p.category}</div>
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ color: "#34d399", fontWeight: "700" }}>₹{Number(p.price).toLocaleString("en-IN")}</div>
                            <div style={{ fontSize: "12px", color: "#f59e0b" }}>★ {p.rating} ({p.reviews})</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-header">
                    <h3><Layers size={18} /> Revenue Potential by Category</h3>
                  </div>
                  <div className="category-progress-list">
                    {categoryStats.map(cat => (
                      <div key={cat.name} className="category-progress-item">
                        <div className="category-meta">
                          <span className="category-name">{cat.name}</span>
                          <span className="category-pct">{cat.count} models</span>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${cat.pct}%`, background: "#38bdf8" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB: CUSTOMERS
             ========================================================= */}
          {activeTab === "customers" && (
            <div className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3><Users size={18} /> Registered Shoppers & Recent Buyers</h3>
                  <p>Customer accounts generated from store checkout activities</p>
                </div>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Customer Name</th>
                      <th>Contact Info</th>
                      <th>Location / Address</th>
                      <th>Orders Placed</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "Rahul Sharma", email: "rahul.s@techzone.io", phone: "+91 98765 43210", city: "Mumbai, Maharashtra", orders: 3, status: "VIP Customer" },
                      { name: "Priya Patel", email: "priya.p@gmail.com", phone: "+91 98221 11234", city: "Bengaluru, Karnataka", orders: 2, status: "Active" },
                      { name: "Arjun Verma", email: "arjun.v@yahoo.com", phone: "+91 91234 56789", city: "New Delhi, NCR", orders: 1, status: "New Shopper" },
                      { name: "Sneha Reddy", email: "sneha.reddy@corp.com", phone: "+91 99887 76655", city: "Hyderabad, Telangana", orders: 4, status: "VIP Customer" },
                      { name: "Vikram Malhotra", email: "vikram.m@live.com", phone: "+91 97766 55443", city: "Pune, Maharashtra", orders: 1, status: "Active" }
                    ].map((cust, idx) => (
                      <tr key={idx}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div className="admin-avatar" style={{ background: "#2563eb", width: "32px", height: "32px", fontSize: "12px" }}>
                              {cust.name.slice(0, 2).toUpperCase()}
                            </div>
                            <strong style={{ color: "#fff" }}>{cust.name}</strong>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: "12px", color: "#cbd5e1" }}>{cust.email}</div>
                          <div style={{ fontSize: "11px", color: "#94a3b8" }}>{cust.phone}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: "12px", color: "#cbd5e1" }}>{cust.city}</div>
                        </td>
                        <td>
                          <strong style={{ color: "#38bdf8" }}>{cust.orders} orders</strong>
                        </td>
                        <td>
                          <span
                            className="stock-pill"
                            style={{
                              background: cust.status === "VIP Customer" ? "rgba(139, 92, 246, 0.15)" : "rgba(16, 185, 129, 0.15)",
                              color: cust.status === "VIP Customer" ? "#c084fc" : "#34d399"
                            }}
                          >
                            {cust.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB: SETTINGS
             ========================================================= */}
          {activeTab === "settings" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <h3><Database size={18} /> Backend API & Database Connection</h3>
                    <p>Configuration for Node.js Express & MongoDB backend</p>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxWidth: "600px" }}>
                  <div className="admin-form-group">
                    <label>API Base URL</label>
                    <input
                      className="admin-input"
                      value="http://localhost:5000"
                      readOnly
                    />
                  </div>

                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <button className="admin-action-btn-primary" onClick={checkBackend}>
                      <RefreshCw size={15} />
                      <span>Test Connection</span>
                    </button>
                    <span style={{ fontSize: "13px", color: backendOnline ? "#34d399" : "#fbbf24" }}>
                      Status: {backendOnline ? "Connected & Live (200 OK)" : "Offline (Local fallback active)"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <h3><RefreshCw size={18} /> Data Management & Reset Tools</h3>
                    <p>Manage sample datasets and store catalogs</p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  <button className="admin-btn-secondary" onClick={handleExportJSON}>
                    <Download size={16} />
                    <span>Export Catalog & Orders (JSON)</span>
                  </button>

                  <button
                    className="admin-btn-secondary"
                    style={{ borderColor: "#f43f5e", color: "#fb7185" }}
                    onClick={handleResetCatalog}
                  >
                    <Trash2 size={16} />
                    <span>Reset to 50 Demo Products</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL: EDIT PRODUCT */}
      {isEditModalOpen && editingProduct && (
        <div className="admin-modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Edit Product: {editingProduct.name}</h3>
              <button className="admin-modal-close" onClick={() => setIsEditModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label>Product Name *</label>
                  <input
                    className="admin-input"
                    value={editingProduct.name}
                    onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Category *</label>
                    <select
                      className="admin-select"
                      value={editingProduct.category}
                      onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    >
                      <option value="Mobiles">Mobiles</option>
                      <option value="Laptops">Laptops</option>
                      <option value="Headphones">Headphones</option>
                      <option value="Smartwatches">Smartwatches</option>
                      <option value="Earbuds">Earbuds</option>
                      <option value="Monitors">Monitors</option>
                      <option value="Accessories">Accessories</option>
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label>Stock Quantity *</label>
                    <input
                      type="number"
                      className="admin-input"
                      value={editingProduct.stock}
                      onChange={e => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Price (₹) *</label>
                    <input
                      type="number"
                      className="admin-input"
                      value={editingProduct.price}
                      onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })}
                      required
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Original Price (₹)</label>
                    <input
                      type="number"
                      className="admin-input"
                      value={editingProduct.originalPrice}
                      onChange={e => setEditingProduct({ ...editingProduct, originalPrice: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Image URL</label>
                  <input
                    className="admin-input"
                    value={editingProduct.image}
                    onChange={e => setEditingProduct({ ...editingProduct, image: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Description</label>
                  <textarea
                    className="admin-textarea"
                    value={editingProduct.description}
                    onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-action-btn-primary">
                  <Save size={16} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ORDER DETAILS */}
      {selectedOrderDetails && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedOrderDetails(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Order Details: {selectedOrderDetails.orderNumber || `#${selectedOrderDetails._id}`}</h3>
              <button className="admin-modal-close" onClick={() => setSelectedOrderDetails(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="admin-modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "10px" }}>
                <div>
                  <h4 style={{ margin: "0 0 6px", color: "#38bdf8", fontSize: "13px" }}>Customer</h4>
                  <div style={{ color: "#fff", fontWeight: "600" }}>{selectedOrderDetails.customer?.name}</div>
                  <div style={{ color: "#94a3b8", fontSize: "12px" }}>{selectedOrderDetails.customer?.email}</div>
                  <div style={{ color: "#94a3b8", fontSize: "12px" }}>{selectedOrderDetails.customer?.phone}</div>
                </div>

                <div>
                  <h4 style={{ margin: "0 0 6px", color: "#38bdf8", fontSize: "13px" }}>Shipping Address</h4>
                  <div style={{ color: "#cbd5e1", fontSize: "13px" }}>
                    {selectedOrderDetails.customer?.address}
                    {selectedOrderDetails.customer?.city ? `, ${selectedOrderDetails.customer.city}` : ""}
                    {selectedOrderDetails.customer?.pincode ? ` - ${selectedOrderDetails.customer.pincode}` : ""}
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ margin: "14px 0 8px", color: "#fff", fontSize: "14px" }}>Items in this Order</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {(selectedOrderDetails.items || []).map((it, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px",
                        background: "rgba(0,0,0,0.2)",
                        borderRadius: "8px"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <img
                          src={it.image || PRESET_IMAGES[0].url}
                          alt={it.name}
                          style={{ width: "42px", height: "42px", objectFit: "contain", background: "#fff", borderRadius: "6px" }}
                        />
                        <div>
                          <div style={{ color: "#fff", fontWeight: "600", fontSize: "13px" }}>{it.name}</div>
                          <div style={{ color: "#94a3b8", fontSize: "11px" }}>Quantity: {it.qty || 1}</div>
                        </div>
                      </div>
                      <div style={{ color: "#34d399", fontWeight: "700" }}>
                        ₹{Number(it.price * (it.qty || 1)).toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--admin-border)", paddingTop: "14px" }}>
                <div>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>Current Status: </span>
                  <span className={`order-status-badge status-${selectedOrderDetails.status}`}>
                    {selectedOrderDetails.status}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: "12px", color: "#94a3b8", marginRight: "8px" }}>Total Amount:</span>
                  <strong style={{ color: "#34d399", fontSize: "20px" }}>
                    ₹{(selectedOrderDetails.totalAmount || 0).toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button className="admin-btn-secondary" onClick={() => setSelectedOrderDetails(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
