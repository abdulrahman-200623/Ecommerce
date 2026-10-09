# TechZone MERN E-Commerce & Admin Console

TechZone dark electronics e-commerce store with an integrated Admin Console.

## Features

### 🛍️ Customer Store
- **Storefront Navigation**: Home, Products, Features, Enterprise, Support, Pricing, Cart.
- **Top Navigation Admin Badge**: Click the **Admin** pill button in the top navigation or footer to instantly open the Admin Console.
- **Electronics Hero Section**: Dynamic showcase with Mobiles, Headphones, Earbuds, and Smartwatches.
- **Product Catalog**: Live search, category filtering, price/rating sorting, pagination.
- **Interactive Product Details**: Full specs, pricing, stock indicator, and related products carousel.
- **Shopping Cart & Checkout**: Add items to cart, quantity controls, and functional checkout modal that saves real orders into the system.

### ⚡ Admin Console (`/admin`)
- **Dashboard Overview**:
  - Key KPI Cards: Total Revenue (₹), Total Orders, Active Catalog Products, Low Stock Alerts.
  - Interactive Visual Sales Trajectory Chart.
  - Category Share Progress Distribution.
  - Recent Orders table with instant status actions.
  - Inventory Watchlist with "+10 Restock" quick action buttons.
- **Product Catalog Management**:
  - Full CRUD: Add New Product, Edit Product, Delete Product.
  - Search & Filters by Category and Stock Level (In Stock, Low Stock ≤ 5, Out of Stock).
  - Quick inline stock modifiers (`+` / `−` units).
  - High-res preset image selectors for phones, laptops, headphones, smartwatches, earbuds, monitors, and chargers.
- **Orders Management**:
  - View all customer orders placed via store checkout.
  - Filter by order status: Pending, Processing, Shipped, Delivered, Cancelled.
  - Live status dropdown changer.
  - Detailed modal view with customer shipping address, contact information, and ordered line items.
- **Analytics & Reporting**:
  - Average Order Value (AOV).
  - Inventory Valuation (₹).
  - Order Fulfillment rate (%).
  - Top-rated products leaderboard.
- **Customers Directory**:
  - Customer profiles, orders count, total spend, and VIP / Active shopper badges.
- **Settings & Data Tools**:
  - MongoDB API live connection checker.
  - Catalog backup export to JSON.
  - One-click catalog reset tool.

---

## How to Run

### Backend (Node.js & Express + MongoDB):
```bash
cd backend
npm install
npm run seed     # Seeds demo catalog to MongoDB
npm run dev      # Runs server on http://localhost:5000
```

### Frontend (React + Vite):
```bash
cd frontend
npm install
npm run dev      # Runs frontend on http://localhost:5173
```

*Note: The Admin Console and Store operate in Hybrid Mode. If MongoDB backend is running, it connects and persists to MongoDB. If backend is offline, it seamlessly falls back to local storage and sample data.*
