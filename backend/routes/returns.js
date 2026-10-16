const router = require("express").Router();
const mongoose = require("mongoose");
const Order = require("../models/Order");
const ReturnRequest = require("../models/ReturnRequest");
const ReturnConfig = require("../models/ReturnConfig");
const { authMiddleware, adminMiddleware, requirePermission, optionalAuth } = require("../middleware/auth");
const { logActivity } = require("../services/activityLogger");

// Helper to get or create default return policy config
async function getOrCreateConfig() {
  let config = await ReturnConfig.findOne({ key: "default_policy" });
  if (!config) {
    config = await ReturnConfig.create({
      key: "default_policy",
      returnWindowDays: 7,
      allowReplacement: true,
      allowPartialReturns: true,
      requirePhotos: false,
      supportedReasons: [
        "Product damaged",
        "Defective or not working",
        "Wrong product delivered",
        "Missing parts or accessories",
        "Product does not match the description",
        "Received a different item than ordered",
        "Other reason"
      ],
      codRefundMethod: "UPI / Bank Transfer",
      policyDescription: "Items can be returned within 7 days of delivery. Product must be in original condition with box, accessories, and tags intact."
    });
  }
  return config;
}

// Helper to look up an order by ID or orderNumber
async function findOrder(idStr) {
  if (!idStr) return null;
  const clean = String(idStr).trim();
  if (mongoose.Types.ObjectId.isValid(clean)) {
    const doc = await Order.findById(clean);
    if (doc) return doc;
  }
  let doc = await Order.findOne({ orderNumber: clean });
  if (doc) return doc;
  return await Order.findOne({ orderNumber: `TZ-${clean}` });
}

// Helper to compute return eligibility for an order
async function evaluateOrderEligibility(order, config) {
  if (!order) {
    return { isEligible: false, reason: "Order not found." };
  }

  // 1. Delivery Check
  if (order.status !== "Delivered") {
    let msg = `Order is currently "${order.status}". Returns are only permitted after package delivery.`;
    if (order.status === "Cancelled") {
      msg = "Cancelled orders are not eligible for returns.";
    }
    return { isEligible: false, reason: msg };
  }

  // 2. Delivery Date & Window Check
  const deliveredTimeline = order.statusTimeline?.find((t) => t.status === "Delivered");
  const deliveredDate = deliveredTimeline?.timestamp || order.updatedAt || order.createdAt;

  const windowDays = config.returnWindowDays || 7;
  const deadlineDate = new Date(new Date(deliveredDate).getTime() + windowDays * 24 * 60 * 60 * 1000);
  const now = new Date();

  if (now > deadlineDate) {
    return {
      isEligible: false,
      reason: `Return window expired on ${deadlineDate.toLocaleDateString("en-IN")}. Returns must be requested within ${windowDays} days of delivery.`,
      deliveredDate,
      deadlineDate,
      windowDays
    };
  }

  // 3. Existing Return Requests Check (track returned quantities per product)
  const existingReturns = await ReturnRequest.find({
    orderId: order._id,
    status: { $nin: ["Cancelled", "Rejected"] }
  });

  const returnedQuantities = {};
  for (const ret of existingReturns) {
    for (const it of ret.items) {
      const k = String(it.productId);
      returnedQuantities[k] = (returnedQuantities[k] || 0) + (Number(it.qty) || 0);
    }
  }

  const itemsEligibility = (order.items || []).map((it) => {
    const pId = String(it.productId);
    const purchased = Number(it.qty) || 1;
    const alreadyReturned = returnedQuantities[pId] || 0;
    const returnable = Math.max(0, purchased - alreadyReturned);

    return {
      productId: pId,
      name: it.name,
      image: it.image || "",
      price: it.price,
      purchasedQty: purchased,
      alreadyReturnedQty: alreadyReturned,
      returnableQty: returnable,
      isItemEligible: returnable > 0
    };
  });

  const hasAnyReturnable = itemsEligibility.some((i) => i.returnableQty > 0);

  if (!hasAnyReturnable) {
    return {
      isEligible: false,
      reason: "All items from this order have already been returned or have pending return requests.",
      deliveredDate,
      deadlineDate,
      windowDays,
      items: itemsEligibility
    };
  }

  return {
    isEligible: true,
    deliveredDate,
    deadlineDate,
    windowDays,
    items: itemsEligibility
  };
}

// -------------------------------------------------------------
// PUBLIC & CUSTOMER ENDPOINTS
// -------------------------------------------------------------

// GET /api/returns/policy - Public policy config
router.get("/policy", async (req, res) => {
  try {
    const config = await getOrCreateConfig();
    res.json({ success: true, policy: config });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/returns/order-eligibility/:orderId - Check return eligibility
router.get("/order-eligibility/:orderId", optionalAuth, async (req, res) => {
  try {
    const order = await findOrder(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    // Security check: if user is logged in, confirm order ownership
    if (req.user) {
      const orderUserMatch = order.userId && String(order.userId) === String(req.user._id);
      const orderEmailMatch = order.customer?.email?.toLowerCase() === req.user.email?.toLowerCase();
      if (!orderUserMatch && !orderEmailMatch && req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "Access denied to order details." });
      }
    }

    const config = await getOrCreateConfig();
    const eligibility = await evaluateOrderEligibility(order, config);

    res.json({
      success: true,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        customer: order.customer,
        paymentMethod: order.paymentMethod,
        totalAmount: order.totalAmount
      },
      ...eligibility
    });
  } catch (err) {
    console.error("Order eligibility error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/returns/request - Customer submit return request
router.post("/request", optionalAuth, async (req, res) => {
  try {
    const {
      orderId,
      items = [],
      reason,
      reasonDetails = "",
      photos = [],
      resolution,
      refundDetails = {},
      pickupAddress
    } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: "Order ID is required." });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Please select at least one item to return." });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: "Please select a reason for your return." });
    }

    if (!resolution || !resolution.trim()) {
      return res.status(400).json({ success: false, message: "Please select a return resolution (Refund or Replacement)." });
    }

    const order = await findOrder(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found in database." });
    }

    // Verify ownership if user is logged in
    const userId = req.user ? req.user._id : (order.userId || null);
    if (req.user) {
      const userMatch = order.userId && String(order.userId) === String(req.user._id);
      const emailMatch = order.customer?.email?.toLowerCase() === req.user.email?.toLowerCase();
      if (!userMatch && !emailMatch && req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "You are not authorized to return items for this order." });
      }
    }

    const config = await getOrCreateConfig();
    const eligibility = await evaluateOrderEligibility(order, config);

    if (!eligibility.isEligible) {
      return res.status(400).json({
        success: false,
        message: `Order is not eligible for return: ${eligibility.reason}`
      });
    }

    // Validate returned items against order items & available quantity
    let totalRefundAmount = 0;
    const verifiedReturnItems = [];

    for (const reqItem of items) {
      const pId = String(reqItem.productId);
      const reqQty = parseInt(reqItem.qty, 10) || 1;

      const orderItem = eligibility.items?.find((i) => i.productId === pId);
      if (!orderItem) {
        return res.status(400).json({
          success: false,
          message: `Item ID "${pId}" was not found in original order #${order.orderNumber}.`
        });
      }

      if (reqQty <= 0 || reqQty > orderItem.returnableQty) {
        return res.status(400).json({
          success: false,
          message: `Invalid return quantity (${reqQty}) for "${orderItem.name}". Maximum returnable: ${orderItem.returnableQty}.`
        });
      }

      const itemRefund = orderItem.price * reqQty;
      totalRefundAmount += itemRefund;

      verifiedReturnItems.push({
        productId: pId,
        name: orderItem.name,
        image: orderItem.image || "",
        price: orderItem.price,
        qty: reqQty,
        originalOrderQty: orderItem.purchasedQty
      });
    }

    // Generate Unique Return Number
    const returnNumber = `RET-${Math.floor(100000 + Math.random() * 900000)}`;

    // Build Address
    const finalPickupAddress = pickupAddress || {
      street: order.customer?.address || "",
      city: order.customer?.city || "",
      state: order.customer?.state || "",
      pincode: order.customer?.pincode || ""
    };

    // Create Return Request Document
    const newReturn = await ReturnRequest.create({
      returnNumber,
      orderId: order._id,
      orderNumber: order.orderNumber,
      userId,
      customer: {
        name: order.customer?.name || (req.user?.name || "Customer"),
        email: order.customer?.email || (req.user?.email || ""),
        phone: order.customer?.phone || (req.user?.phone || "")
      },
      items: verifiedReturnItems,
      totalRefundAmount,
      reason: reason.trim(),
      reasonDetails: reasonDetails.trim(),
      photos: Array.isArray(photos) ? photos.slice(0, 5) : [],
      resolution,
      refundDetails: {
        method: resolution.includes("UPI") ? "UPI / Bank Transfer" : "Original Payment Method",
        upiId: refundDetails.upiId?.trim() || "",
        bankAccount: refundDetails.bankAccount?.trim() || "",
        bankIfsc: refundDetails.bankIfsc?.trim() || ""
      },
      pickupAddress: finalPickupAddress,
      status: "Requested",
      statusTimeline: [
        {
          status: "Requested",
          timestamp: new Date(),
          note: `Customer submitted return request for ${verifiedReturnItems.length} item(s). Reason: ${reason}`
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: `Return request #${returnNumber} submitted successfully! Our team will review it within 24 hours.`,
      returnRequest: {
        ...newReturn.toObject(),
        nextExpectedStep: newReturn.getNextExpectedStep()
      }
    });
  } catch (err) {
    console.error("Submit return error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/returns/my-returns - Customer's return requests
router.get("/my-returns", optionalAuth, async (req, res) => {
  try {
    let query = {};
    const emailQuery = req.query.email?.trim();
    const userIdQuery = req.query.userId?.trim();

    if (req.user) {
      query = {
        $or: [
          { userId: req.user._id },
          { "customer.email": new RegExp("^" + req.user.email + "$", "i") }
        ]
      };
    } else if (emailQuery) {
      query = { "customer.email": new RegExp("^" + emailQuery + "$", "i") };
    } else if (userIdQuery && mongoose.Types.ObjectId.isValid(userIdQuery)) {
      query = { userId: userIdQuery };
    } else {
      return res.json({ success: true, returns: [] });
    }

    const returns = await ReturnRequest.find(query).sort({ createdAt: -1 });

    const formatted = returns.map((ret) => ({
      ...ret.toObject(),
      nextExpectedStep: ret.getNextExpectedStep()
    }));

    res.json({
      success: true,
      returns: formatted,
      count: formatted.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/returns/my-returns/:returnId - Single return details
router.get("/my-returns/:returnId", optionalAuth, async (req, res) => {
  try {
    const idStr = String(req.params.returnId).trim();
    let ret = null;

    if (mongoose.Types.ObjectId.isValid(idStr)) {
      ret = await ReturnRequest.findById(idStr);
    }
    if (!ret) {
      ret = await ReturnRequest.findOne({ returnNumber: idStr });
    }
    if (!ret) {
      ret = await ReturnRequest.findOne({ returnNumber: `RET-${idStr}` });
    }

    if (!ret) {
      return res.status(404).json({ success: false, message: "Return request not found." });
    }

    // Authorization check
    if (req.user && req.user.role !== "admin") {
      const userMatch = ret.userId && String(ret.userId) === String(req.user._id);
      const emailMatch = ret.customer?.email?.toLowerCase() === req.user.email?.toLowerCase();
      if (!userMatch && !emailMatch) {
        return res.status(403).json({ success: false, message: "Access denied. You do not own this return request." });
      }
    }

    res.json({
      success: true,
      returnRequest: {
        ...ret.toObject(),
        nextExpectedStep: ret.getNextExpectedStep()
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/returns/my-returns/:returnId/cancel - Customer cancel pending request
router.patch("/my-returns/:returnId/cancel", optionalAuth, async (req, res) => {
  try {
    const idStr = String(req.params.returnId).trim();
    let ret = await ReturnRequest.findOne({
      $or: [{ _id: mongoose.Types.ObjectId.isValid(idStr) ? idStr : null }, { returnNumber: idStr }]
    });

    if (!ret) {
      return res.status(404).json({ success: false, message: "Return request not found." });
    }

    // Ownership check
    if (req.user && req.user.role !== "admin") {
      const userMatch = ret.userId && String(ret.userId) === String(req.user._id);
      const emailMatch = ret.customer?.email?.toLowerCase() === req.user.email?.toLowerCase();
      if (!userMatch && !emailMatch) {
        return res.status(403).json({ success: false, message: "Access denied." });
      }
    }

    if (ret.status !== "Requested" && ret.status !== "Approved") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel return request in "${ret.status}" status.`
      });
    }

    ret.status = "Cancelled";
    ret.statusTimeline.push({
      status: "Cancelled",
      timestamp: new Date(),
      note: "Cancelled by customer."
    });

    await ret.save();

    res.json({
      success: true,
      message: "Return request has been cancelled.",
      returnRequest: {
        ...ret.toObject(),
        nextExpectedStep: ret.getNextExpectedStep()
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// ADMIN MANAGEMENT ENDPOINTS
// -------------------------------------------------------------

// GET /api/returns/admin/all - Admin list returns with metrics & filters
router.get("/admin/all", adminMiddleware, requirePermission("returns"), async (req, res) => {
  try {
    const { status, search, dateRange, page = 1, limit = 15 } = req.query;

    const query = {};

    if (status && status !== "All") {
      query.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { returnNumber: new RegExp(q, "i") },
        { orderNumber: new RegExp(q, "i") },
        { "customer.name": new RegExp(q, "i") },
        { "customer.email": new RegExp(q, "i") },
        { "items.name": new RegExp(q, "i") }
      ];
    }

    if (dateRange && dateRange !== "all") {
      const now = new Date();
      if (dateRange === "today") {
        query.createdAt = { $gte: new Date(now.setHours(0, 0, 0, 0)) };
      } else if (dateRange === "7days") {
        query.createdAt = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
      } else if (dateRange === "30days") {
        query.createdAt = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 15);
    const skip = (pageNum - 1) * limitNum;

    const [returns, totalCount, allReturns] = await Promise.all([
      ReturnRequest.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      ReturnRequest.countDocuments(query),
      ReturnRequest.find({}, "status totalRefundAmount")
    ]);

    // Calculate Admin Metrics
    const metrics = {
      total: allReturns.length,
      pending: allReturns.filter((r) => r.status === "Requested").length,
      approved: allReturns.filter((r) => r.status === "Approved").length,
      awaitingPickup: allReturns.filter((r) => r.status === "Pickup Scheduled" || r.status === "Item Received").length,
      refundProcessing: allReturns.filter((r) => r.status === "Refund Processing").length,
      completed: allReturns.filter((r) => r.status === "Refund Completed" || r.status === "Replacement Delivered").length,
      rejected: allReturns.filter((r) => r.status === "Rejected").length,
      totalRefundedAmount: allReturns
        .filter((r) => r.status === "Refund Completed")
        .reduce((sum, r) => sum + (r.totalRefundAmount || 0), 0)
    };

    const formatted = returns.map((ret) => ({
      ...ret.toObject(),
      nextExpectedStep: ret.getNextExpectedStep()
    }));

    res.json({
      success: true,
      metrics,
      returns: formatted,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / limitNum))
      }
    });
  } catch (err) {
    console.error("Admin returns list error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/returns/admin/:returnId/status - Admin update return status & processing
router.patch("/admin/:returnId/status", adminMiddleware, requirePermission("returns"), async (req, res) => {
  try {
    const idStr = String(req.params.returnId).trim();
    const {
      status,
      note = "",
      rejectionReason = "",
      transactionReference = "",
      trackingNumber = "",
      carrier = "",
      adminNotes = ""
    } = req.body;

    const ret = await ReturnRequest.findOne({
      $or: [{ _id: mongoose.Types.ObjectId.isValid(idStr) ? idStr : null }, { returnNumber: idStr }]
    });

    if (!ret) {
      return res.status(404).json({ success: false, message: "Return request not found." });
    }

    if (!status) {
      return res.status(400).json({ success: false, message: "New status is required." });
    }

    // Required fields validations
    if (status === "Rejected" && (!rejectionReason || !rejectionReason.trim())) {
      return res.status(400).json({
        success: false,
        message: "A specific rejection reason is required when rejecting a return request."
      });
    }

    if (status === "Refund Completed" && (!transactionReference || !transactionReference.trim())) {
      return res.status(400).json({
        success: false,
        message: "Bank / Gateway transaction reference is required to mark a refund as completed."
      });
    }

    ret.status = status;

    if (adminNotes) {
      ret.adminNotes = adminNotes.trim();
    }

    if (status === "Rejected") {
      ret.rejectionReason = rejectionReason.trim();
    }

    if (status === "Refund Completed") {
      ret.refundDetails.transactionReference = transactionReference.trim();
      ret.refundDetails.refundedAt = new Date();
    }

    if (status === "Replacement Shipped") {
      if (trackingNumber) ret.replacementDetails.trackingNumber = trackingNumber.trim();
      if (carrier) ret.replacementDetails.carrier = carrier.trim();
      ret.replacementDetails.shippedAt = new Date();
      ret.replacementDetails.status = "Shipped";
    }

    if (status === "Replacement Delivered") {
      ret.replacementDetails.deliveredAt = new Date();
      ret.replacementDetails.status = "Delivered";
    }

    // Add entry to statusTimeline
    let autoNote = note.trim();
    if (!autoNote) {
      if (status === "Approved") autoNote = "Return request approved. Pickup will be scheduled.";
      else if (status === "Pickup Scheduled") autoNote = "Courier pickup agent assigned for collection.";
      else if (status === "Item Received") autoNote = "Item received at TechZone warehouse & verified.";
      else if (status === "Refund Processing") autoNote = "Quality inspection passed. Refund sent to payment processor.";
      else if (status === "Refund Completed") autoNote = `Refund completed successfully (Txn Ref: ${transactionReference}).`;
      else if (status === "Rejected") autoNote = `Request rejected: ${rejectionReason}`;
      else if (status === "Replacement Processing") autoNote = "Replacement unit is being prepared.";
      else if (status === "Replacement Shipped") autoNote = `Replacement dispatched via ${carrier || "Courier"} (Tracking: ${trackingNumber || "N/A"}).`;
      else if (status === "Replacement Delivered") autoNote = "Replacement unit delivered to customer.";
      else autoNote = `Status updated to ${status}.`;
    }

    ret.statusTimeline.push({
      status,
      timestamp: new Date(),
      note: autoNote
    });

    await ret.save();

    // If refund or replacement completed, update related Order status if all items returned
    if (status === "Refund Completed" || status === "Replacement Delivered") {
      try {
        const order = await Order.findById(ret.orderId);
        if (order && order.status === "Delivered") {
          // Check if this covered the whole order
          const totalOrderItemsCount = (order.items || []).reduce((s, x) => s + (x.qty || 1), 0);
          const returnedItemsCount = (ret.items || []).reduce((s, x) => s + (x.qty || 1), 0);
          if (returnedItemsCount >= totalOrderItemsCount) {
            order.status = "Returned";
            order.statusTimeline.push({
              status: "Returned",
              timestamp: new Date(),
              note: `Order returned & resolved via Return Request #${ret.returnNumber}`
            });
            await order.save();
          }
        }
      } catch (ordErr) {
        console.error("Order status update warning:", ordErr.message);
      }
    }

    res.json({
      success: true,
      message: `Return request #${ret.returnNumber} updated to "${status}".`,
      returnRequest: {
        ...ret.toObject(),
        nextExpectedStep: ret.getNextExpectedStep()
      }
    });
  } catch (err) {
    console.error("Admin update status error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/returns/admin/config - Admin get policy configuration
router.get("/admin/config", adminMiddleware, requirePermission("returns"), async (req, res) => {
  try {
    const config = await getOrCreateConfig();
    res.json({ success: true, config });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/returns/admin/config - Admin update policy configuration
router.put("/admin/config", adminMiddleware, requirePermission("returns"), async (req, res) => {
  try {
    const { returnWindowDays, allowReplacement, allowPartialReturns, requirePhotos, policyDescription } = req.body;

    const config = await getOrCreateConfig();

    if (returnWindowDays !== undefined) {
      const days = parseInt(returnWindowDays, 10);
      if (isNaN(days) || days < 1 || days > 90) {
        return res.status(400).json({ success: false, message: "Return window must be between 1 and 90 days." });
      }
      config.returnWindowDays = days;
    }

    if (allowReplacement !== undefined) config.allowReplacement = Boolean(allowReplacement);
    if (allowPartialReturns !== undefined) config.allowPartialReturns = Boolean(allowPartialReturns);
    if (requirePhotos !== undefined) config.requirePhotos = Boolean(requirePhotos);
    if (policyDescription) config.policyDescription = policyDescription.trim();

    await config.save();

    res.json({
      success: true,
      message: `Return policy updated. Return window set to ${config.returnWindowDays} days.`,
      config
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
