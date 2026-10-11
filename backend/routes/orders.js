const router = require("express").Router();
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");

// Regex patterns
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDIAN_PHONE_REGEX = /^(\+91[\-\s]?)?[6-9]\d{9}$/;
const PINCODE_REGEX = /^\d{6}$/;

// Helper to look up a product by ID (handles both ObjectId and string ID)
async function findProductById(idStr) {
  const pId = String(idStr);
  if (mongoose.Types.ObjectId.isValid(pId)) {
    const doc = await Product.findById(pId);
    if (doc) return doc;
  }
  return await Product.findOne({
    $or: [{ _id: pId }, { productId: pId }]
  });
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

      const unitPrice = dbProduct.price;
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
router.post("/checkout", async (req, res) => {
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

        const price = dbProduct.price;
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

    // 8. Safely reduce inventory in MongoDB
    for (const pUpdate of productsToUpdateStock) {
      try {
        await Product.findByIdAndUpdate(pUpdate.productId, {
          $inc: { stock: -pUpdate.qty }
        });
      } catch (stockErr) {
        console.error("Stock update error:", stockErr.message);
      }
    }

    // 9. Generate unique order number
    const orderNumber = "TZ-" + Math.floor(100000 + Math.random() * 900000);

    // 10. Create order document
    const newOrder = await Order.create({
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

// GET single order by ID or orderNumber
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    let order = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id);
    }
    if (!order) {
      order = await Order.findOne({ orderNumber: id });
    }
    if (!order) {
      order = await Order.findOne({
        $or: [{ _id: id }, { orderNumber: `TZ-${id}` }]
      });
    }

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
router.put("/:id", async (req, res) => {
  try {
    const allowedStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
    if (req.body.status && !allowedStatuses.includes(req.body.status)) {
      return res.status(400).json({ message: "Invalid order status value." });
    }

    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// DELETE order
router.delete("/:id", async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Order deleted successfully" });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

module.exports = router;
