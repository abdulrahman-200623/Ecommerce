const router = require("express").Router();
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const FlashSale = require("../models/FlashSale");
const { authMiddleware, adminMiddleware, requirePermission, optionalAuth } = require("../middleware/auth");
const { logActivity } = require("../services/activityLogger");

// Regex patterns
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDIAN_PHONE_REGEX = /^(\+91[\-\s]?)?[6-9]\d{9}$/;
const PINCODE_REGEX = /^\d{6}$/;

// Helper to look up an active flash sale for a product
async function findActiveFlashSale(productId) {
  if (!productId) return null;
  const now = new Date();
  const pIdStr = String(productId);
  return await FlashSale.findOne({
    productId: pIdStr,
    isActive: true,
    startTime: { $lte: now },
    endTime: { $gt: now }
  });
}

// Helper to look up a product by ID (handles both ObjectId and string ID)
async function findProductById(idStr) {
  const pId = String(idStr);
  if (mongoose.Types.ObjectId.isValid(pId)) {
    const doc = await Product.findById(pId);
    if (doc) return doc;
  }
  return await Product.findOne({ productId: pId });
}

// Helper to look up an order by ObjectId or orderNumber
async function findOrderByIdOrNumber(id) {
  if (!id) return null;
  const idStr = String(id).trim();
  if (mongoose.Types.ObjectId.isValid(idStr)) {
    const doc = await Order.findById(idStr);
    if (doc) return doc;
  }
  let doc = await Order.findOne({ orderNumber: idStr });
  if (doc) return doc;
  return await Order.findOne({ orderNumber: `TZ-${idStr}` });
}

// GET all orders (sorted newest first)
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET order stats
router.get("/stats", async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: "Pending" });
    const deliveredOrders = await Order.countDocuments({ status: "Delivered" });
    const processingOrders = await Order.countDocuments({ status: "Processing" });
    const shippedOrders = await Order.countDocuments({ status: "Shipped" });
    const cancelledOrders = await Order.countDocuments({ status: "Cancelled" });

    const revenueResult = await Order.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    res.json({
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST calculate checkout summary (server-verified pricing, stock check, coupon, and shipping)
router.post("/calculate-summary", async (req, res) => {
  try {
    const { items = [], couponCode = "", shippingOption = "standard" } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart items cannot be empty." });
    }

    let subtotal = 0;
    const verifiedItems = [];
    const stockIssues = [];

    for (const item of items) {
      const pId = item.productId || item._id;
      const requestedQty = Math.max(1, parseInt(item.qty, 10) || 1);

      const dbProduct = await findProductById(pId);
      if (!dbProduct) {
        // Fallback if item is demo item not in DB
        const unitPrice = Number(item.price) || 0;
        subtotal += unitPrice * requestedQty;
        verifiedItems.push({
          productId: String(pId),
          name: item.name || "TechZone Product",
          price: unitPrice,
          qty: requestedQty,
          image: item.image || ""
        });
        continue;
      }

      // Check stock
      if (typeof dbProduct.stock === "number" && dbProduct.stock < requestedQty) {
        stockIssues.push({
          name: dbProduct.name,
          available: dbProduct.stock,
          requested: requestedQty
        });
      }

      let unitPrice = dbProduct.price;
      const activeSale = await findActiveFlashSale(dbProduct._id);
      if (activeSale) {
        // Apply flash sale price if quota allows
        if (activeSale.saleQuantity <= 0 || (activeSale.soldQuantity + requestedQty <= activeSale.saleQuantity)) {
          unitPrice = activeSale.salePrice;
        }
      }

      subtotal += unitPrice * requestedQty;
      verifiedItems.push({
        productId: String(dbProduct._id),
        name: dbProduct.name,
        price: unitPrice,
        qty: requestedQty,
        image: dbProduct.image || item.image || ""
      });
    }

    if (stockIssues.length > 0) {
      const issue = stockIssues[0];
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for "${issue.name}". Only ${issue.available} unit(s) available.`,
        stockIssues
      });
    }

    // Shipping calculation
    const isExpress = shippingOption === "express" || shippingOption === "Express Delivery";
    const shippingFee = isExpress ? 99 : (subtotal >= 999 ? 0 : 49);
    const shippingMethod = isExpress ? "Express Delivery" : "Standard Delivery";

    // Coupon calculation
    let discount = 0;
    let appliedCoupon = null;

    if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
      const cleanCode = couponCode.trim().toUpperCase();
      const coupon = await Coupon.findOne({ code: cleanCode, isActive: true });
      if (coupon) {
        const notExpired = !coupon.expiresAt || new Date(coupon.expiresAt) >= new Date();
        const meetsMin = !coupon.minOrderAmount || subtotal >= coupon.minOrderAmount;

        if (notExpired && meetsMin) {
          if (coupon.discountType === "percentage") {
            discount = Math.round((subtotal * coupon.discountValue) / 100);
            if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
              discount = coupon.maxDiscount;
            }
          } else {
            discount = Math.min(coupon.discountValue, subtotal);
          }
          appliedCoupon = {
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            discountAmount: discount
          };
        }
      }
    }

    const finalTotal = Math.max(0, subtotal - discount + shippingFee);

    res.json({
      success: true,
      subtotal,
      discount,
      shippingFee,
      shippingMethod,
      finalTotal,
      appliedCoupon,
      items: verifiedItems
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST process smart checkout and create order
router.post("/checkout", optionalAuth, async (req, res) => {
  try {
    const {
      customer,
      items = [],
      shippingOption = "standard",
      couponCode = "",
      paymentMethod = "Cash on Delivery",
      notes = ""
    } = req.body;

    // 1. Validate customer info
    if (!customer) {
      return res.status(400).json({ success: false, message: "Customer details are required." });
    }

    const name = customer.name?.trim();
    const email = customer.email?.trim();
    const phone = customer.phone?.trim();
    const address = customer.address?.trim();
    const city = customer.city?.trim();
    const state = customer.state?.trim();
    const pincode = customer.pincode?.trim();

    if (!name || name.length < 2) {
      return res.status(400).json({ success: false, message: "Please provide a valid full name (at least 2 characters)." });
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ success: false, message: "Please provide a valid email address." });
    }
    if (!phone || !INDIAN_PHONE_REGEX.test(phone.replace(/\s+/g, ""))) {
      return res.status(400).json({ success: false, message: "Please provide a valid 10-digit Indian mobile number." });
    }
    if (!address || address.length < 5) {
      return res.status(400).json({ success: false, message: "Please enter a complete delivery address (at least 5 characters)." });
    }
    if (!city || city.length < 2) {
      return res.status(400).json({ success: false, message: "Please enter your city." });
    }
    if (!state || state.length < 2) {
      return res.status(400).json({ success: false, message: "Please enter or select your state." });
    }
    if (!pincode || !PINCODE_REGEX.test(pincode)) {
      return res.status(400).json({ success: false, message: "Please enter a valid 6-digit Indian PIN code." });
    }

    // 2. Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart cannot be empty for checkout." });
    }

    // 3. Server-side product price & stock verification
    let subtotal = 0;
    const finalOrderItems = [];
    const productsToUpdateStock = [];
    const salesToUpdateSold = [];

    for (const item of items) {
      const pId = item.productId || item._id;
      const requestedQty = Math.max(1, parseInt(item.qty, 10) || 1);

      const dbProduct = await findProductById(pId);
      if (dbProduct) {
        // Stock check
        if (typeof dbProduct.stock === "number" && dbProduct.stock < requestedQty) {
          return res.status(400).json({
            success: false,
            message: `Cannot place order. "${dbProduct.name}" only has ${dbProduct.stock} unit(s) remaining in stock.`
          });
        }

        let price = dbProduct.price;
        const activeSale = await findActiveFlashSale(dbProduct._id);
        if (activeSale) {
          if (activeSale.saleQuantity <= 0 || (activeSale.soldQuantity + requestedQty <= activeSale.saleQuantity)) {
            price = activeSale.salePrice;
            salesToUpdateSold.push({ saleId: activeSale._id, qty: requestedQty });
          }
        }

        subtotal += price * requestedQty;
        finalOrderItems.push({
          productId: String(dbProduct._id),
          name: dbProduct.name,
          price: price,
          qty: requestedQty,
          image: dbProduct.image || item.image || ""
        });

        productsToUpdateStock.push({
          productId: dbProduct._id,
          qty: requestedQty
        });
      } else {
        // Fallback for demo items
        const price = Number(item.price) || 0;
        subtotal += price * requestedQty;
        finalOrderItems.push({
          productId: String(pId),
          name: item.name || "TechZone Product",
          price: price,
          qty: requestedQty,
          image: item.image || ""
        });
      }
    }

    // 4. Validate and apply coupon
    let discount = 0;
    let appliedCouponCode = "";

    if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
      const cleanCode = couponCode.trim().toUpperCase();
      const coupon = await Coupon.findOne({ code: cleanCode, isActive: true });

      if (coupon) {
        const notExpired = !coupon.expiresAt || new Date(coupon.expiresAt) >= new Date();
        const meetsMin = !coupon.minOrderAmount || subtotal >= coupon.minOrderAmount;

        if (notExpired && meetsMin) {
          appliedCouponCode = coupon.code;
          if (coupon.discountType === "percentage") {
            discount = Math.round((subtotal * coupon.discountValue) / 100);
            if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
              discount = coupon.maxDiscount;
            }
          } else {
            discount = Math.min(coupon.discountValue, subtotal);
          }
        }
      }
    }

    // 5. Calculate shipping fee
    const isExpress = shippingOption === "express" || shippingOption === "Express Delivery";
    const shippingFee = isExpress ? 99 : (subtotal >= 999 ? 0 : 49);
    const shippingMethod = isExpress ? "Express Delivery" : "Standard Delivery";

    // 6. Final total
    const totalAmount = Math.max(0, subtotal - discount + shippingFee);

    // 7. Payment status & details
    const isCOD = paymentMethod === "Cash on Delivery";
    const paymentStatus = isCOD ? "Pending" : "Paid";
    const transactionId = isCOD ? "" : `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 8. Safely reduce inventory in MongoDB & update flash sales sold count
    for (const pUpdate of productsToUpdateStock) {
      try {
        await Product.findByIdAndUpdate(pUpdate.productId, {
          $inc: { stock: -pUpdate.qty }
        });
      } catch (stockErr) {
        console.error("Stock update error:", stockErr.message);
      }
    }

    for (const sUpdate of salesToUpdateSold) {
      try {
        await FlashSale.findByIdAndUpdate(sUpdate.saleId, {
          $inc: { soldQuantity: sUpdate.qty }
        });
      } catch (saleErr) {
        console.error("Flash sale sold count update error:", saleErr.message);
      }
    }

    // 9. Generate unique order number
    const orderNumber = "TZ-" + Math.floor(100000 + Math.random() * 900000);

    // 10. Create order document
    const estimatedDays = isExpress ? 2 : 4;
    const estDelivery = new Date();
    estDelivery.setDate(estDelivery.getDate() + estimatedDays);

    const newOrder = await Order.create({
      userId: req.user?._id || null,
      orderNumber,
      customer: {
        name,
        email,
        phone,
        address,
        city,
        state,
        pincode
      },
      items: finalOrderItems,
      subtotal,
      discount,
      shippingFee,
      shippingMethod,
      couponCode: appliedCouponCode,
      totalAmount,
      status: "Pending",
      statusTimeline: [
        {
          status: "Pending",
          timestamp: new Date(),
          note: "Order placed successfully"
        }
      ],
      estimatedDeliveryDate: estDelivery,
      paymentMethod,
      paymentStatus,
      paymentDetails: {
        transactionId
      },
      notes
    });

    res.status(201).json({
      success: true,
      order: newOrder
    });
  } catch (e) {
    console.error("Checkout error:", e);
    res.status(500).json({ success: false, message: e.message || "Failed to process checkout." });
  }
});

// ==========================================
// USER ORDER HISTORY & MANAGEMENT ENDPOINTS
// ==========================================

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Handler for user's order list with filters & pagination
async function handleGetMyOrders(req, res) {
  try {
    const user = req.user;
    const {
      status,
      search,
      dateRange,
      startDate,
      endDate,
      sort = "newest",
      page = 1,
      limit = 10
    } = req.query;

    const queryFilter = {
      $or: [
        { userId: user._id },
        { "customer.email": { $regex: new RegExp(`^${escapeRegex(user.email)}$`, "i") } }
      ]
    };

    // Filter by Order Status
    if (status && status !== "All" && status !== "all") {
      queryFilter.status = status;
    }

    // Filter by Date Range
    if (startDate || endDate) {
      queryFilter.createdAt = {};
      if (startDate) queryFilter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        queryFilter.createdAt.$lte = end;
      }
    } else if (dateRange) {
      const now = new Date();
      if (dateRange === "30days") {
        const d = new Date();
        d.setDate(now.getDate() - 30);
        queryFilter.createdAt = { $gte: d };
      } else if (dateRange === "6months") {
        const d = new Date();
        d.setMonth(now.getMonth() - 6);
        queryFilter.createdAt = { $gte: d };
      } else if (dateRange === "year") {
        const d = new Date();
        d.setFullYear(now.getFullYear() - 1);
        queryFilter.createdAt = { $gte: d };
      }
    }

    // Search by Order ID or Product Name
    if (search && search.trim()) {
      const s = search.trim();
      const searchRegex = new RegExp(escapeRegex(s), "i");
      queryFilter.$and = [
        {
          $or: [
            { orderNumber: searchRegex },
            { "items.name": searchRegex }
          ]
        }
      ];
    }

    // Sorting
    let sortOptions = { createdAt: -1 };
    if (sort === "oldest") sortOptions = { createdAt: 1 };
    else if (sort === "price_high") sortOptions = { totalAmount: -1 };
    else if (sort === "price_low") sortOptions = { totalAmount: 1 };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const totalOrders = await Order.countDocuments(queryFilter);
    const orders = await Order.find(queryFilter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      orders,
      totalOrders,
      page: pageNum,
      totalPages: Math.ceil(totalOrders / limitNum) || 1
    });
  } catch (err) {
    console.error("Error retrieving user orders:", err);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve your order history. Please try again."
    });
  }
}

// GET /api/orders/my-orders (Protected)
router.get("/my-orders", authMiddleware, handleGetMyOrders);
router.get("/myorders", authMiddleware, handleGetMyOrders);

// GET /api/orders/my-orders/:id - Single order details with strict ownership enforcement
router.get("/my-orders/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const user = req.user;
    const order = await findOrderByIdOrNumber(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found."
      });
    }

    // Strict ownership verification
    const isOwner =
      (order.userId && String(order.userId) === String(user._id)) ||
      (order.customer?.email && order.customer.email.toLowerCase() === user.email.toLowerCase()) ||
      user.role === "admin";

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are only authorized to view orders placed under your own account."
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (err) {
    console.error("Error fetching order details:", err);
    res.status(500).json({
      success: false,
      message: "Failed to load order details."
    });
  }
});

// Helper for cancelling an order
async function handleCancelOrder(req, res) {
  try {
    const id = req.params.id;
    const user = req.user;
    const { reason = "Cancelled by user" } = req.body;
    const order = await findOrderByIdOrNumber(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found."
      });
    }

    // Ownership check
    const isOwner =
      (order.userId && String(order.userId) === String(user._id)) ||
      (order.customer?.email && order.customer.email.toLowerCase() === user.email.toLowerCase()) ||
      user.role === "admin";

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only cancel your own orders."
      });
    }

    // Check cancellation business rules
    if (order.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "This order has already been cancelled."
      });
    }

    if (["Shipped", "Delivered", "Returned"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because it is already marked as '${order.status}'. Please contact TechZone Support for assistance.`
      });
    }

    // Permitted to cancel (Pending, Confirmed, Processing)
    order.status = "Cancelled";
    if (!Array.isArray(order.statusTimeline)) {
      order.statusTimeline = [];
    }
    order.statusTimeline.push({
      status: "Cancelled",
      timestamp: new Date(),
      note: reason || "Cancelled by customer"
    });

    // Safely restore inventory in MongoDB
    if (Array.isArray(order.items)) {
      for (const item of order.items) {
        if (item.productId) {
          try {
            await Product.findByIdAndUpdate(item.productId, {
              $inc: { stock: item.qty || 1 }
            });
          } catch (stockErr) {
            console.error("Restock error on cancellation:", stockErr.message);
          }
        }
      }
    }

    await order.save();

    res.json({
      success: true,
      message: `Order ${order.orderNumber} has been cancelled successfully.`,
      order
    });
  } catch (err) {
    console.error("Error cancelling order:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to cancel order."
    });
  }
}

// PUT /api/orders/my-orders/:id/cancel and POST /api/orders/my-orders/:id/cancel
router.put("/my-orders/:id/cancel", authMiddleware, handleCancelOrder);
router.post("/my-orders/:id/cancel", authMiddleware, handleCancelOrder);

// GET single order by ID or orderNumber
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const order = await findOrderByIdOrNumber(id);

    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST new order (direct admin or legacy fallback)
router.post("/", async (req, res) => {
  try {
    const body = { ...req.body };
    if (!body.orderNumber) {
      body.orderNumber = "TZ-" + Math.floor(100000 + Math.random() * 900000);
    }
    const order = await Order.create(body);
    res.status(201).json(order);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// PUT update order status or details
router.put("/:id", adminMiddleware, requirePermission("orders"), async (req, res) => {
  try {
    const allowedStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
    if (req.body.status && !allowedStatuses.includes(req.body.status)) {
      return res.status(400).json({ message: "Invalid order status value." });
    }

    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found" });

    logActivity({
      action: "ORDER_STATUS_UPDATE",
      description: `Updated status for order #${order.orderNumber || order._id} to "${order.status}"`,
      performedBy: req.user,
      target: { id: order._id, name: `Order #${order.orderNumber || order._id}`, type: "Order" },
      details: { status: order.status, totalAmount: order.totalAmount },
      ipAddress: req.ip
    });

    res.json(order);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// DELETE order
router.delete("/:id", adminMiddleware, requirePermission("orders"), async (req, res) => {
  try {
    const existing = await Order.findById(req.params.id);
    await Order.findByIdAndDelete(req.params.id);

    if (existing) {
      logActivity({
        action: "ORDER_DELETE",
        description: `Deleted order #${existing.orderNumber || existing._id}`,
        performedBy: req.user,
        target: { id: existing._id, name: `Order #${existing.orderNumber || existing._id}`, type: "Order" },
        ipAddress: req.ip
      });
    }

    res.json({ message: "Order deleted successfully" });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

module.exports = router;
