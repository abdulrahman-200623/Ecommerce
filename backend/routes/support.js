const router = require("express").Router();
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const SupportConfig = require("../models/SupportConfig");
const Order = require("../models/Order");
const { broadcastNewMessage, broadcastConversationStatus, broadcastSupportConfig } = require("../socket");

const JWT_SECRET = process.env.JWT_SECRET || "techzone_super_secret_change_me";
const ADMIN_SECRET = "techzone-admin-secret";

// Predefined quick-reply responses
const QUICK_REPLIES_INFO = {
  order_status: {
    title: "Order Status",
    response: "You can track your order status anytime! If you have your Order ID (e.g., TZ-673964), simply type it below or click 'Check Order' to see real-time updates on dispatch and delivery."
  },
  payment_issues: {
    title: "Payment Issues",
    response: "TechZone accepts UPI, Credit/Debit cards, Net Banking, and Cash on Delivery. If an amount was debited but your order didn't confirm, banks usually refund within 24-48 hours. Please share your transaction details if you need urgent assistance."
  },
  delivery_info: {
    title: "Delivery Information",
    response: "We offer Standard Delivery (3-5 business days) and Express Delivery (1-2 business days). All orders above ₹499 qualify for Free Standard Delivery. Orders are dispatched within 24 hours of placement."
  },
  return_refund: {
    title: "Return and Refund Policy",
    response: "TechZone offers an easy 7-day replacement or return guarantee for defective or damaged electronics. Once a return is picked up, refunds are processed within 3-5 business days to the original payment method."
  },
  product_info: {
    title: "Product Information",
    response: "All products sold on TechZone are 100% genuine with authentic manufacturer warranties. Need help choosing between models or checking technical specifications? Tell our agents what you are looking for!"
  },
  contact_support: {
    title: "Contact Support",
    response: "You're connected to TechZone Electronics Support! You can chat with us live here, or reach our priority helpline at support@techzone.io / +91 98765 43210 (9 AM - 9 PM IST)."
  }
};

// Helper: Extract & Verify Authentication
function extractAuth(req) {
  const authHeader = req.headers.authorization;
  const adminKey = req.headers["x-admin-key"] || req.query.adminKey;
  let userId = null;
  let userName = "Customer";
  let userEmail = "";
  let isGuest = true;
  let isAdmin = false;

  // 1. Admin check
  if (
    adminKey === ADMIN_SECRET ||
    req.headers["x-admin-auth"] === "admin"
  ) {
    isAdmin = true;
    return { isAdmin, userId: "admin_user", userName: "TechZone Support Agent", userEmail: "admin@techzone.io", isGuest: false };
  }

  // 2. JWT verification
  let token = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.headers["x-guest-token"]) {
    token = req.headers["x-guest-token"];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded) {
        userId = decoded.id || decoded.guestId || decoded.userId;
        userName = decoded.name || decoded.customerName || "Customer";
        userEmail = decoded.email || "";
        isGuest = Boolean(decoded.role === "guest" || decoded.guestId);
        if (decoded.role === "admin" || decoded.isAdmin) {
          isAdmin = true;
        }
      }
    } catch (e) {
      // Invalid token
    }
  }

  return { isAdmin, userId, userName, userEmail, isGuest };
}

// Helper: Ensure Support Configuration Exists
async function getOrCreateSupportConfig() {
  let config = await SupportConfig.findOne({ key: "default_config" });
  if (!config) {
    config = await SupportConfig.create({
      key: "default_config",
      isOnline: true,
      statusMessage: "Support agents are online & ready to assist",
      offlineNotice: "Support agents are currently offline. Leave a message and we'll reply shortly!",
      businessHours: "Monday - Sunday: 9:00 AM - 9:00 PM IST",
      welcomeMessage: "Welcome to TechZone Support! 👋 How can we help you today with your electronics order or product query?",
      autoReplyQuickReplies: true
    });
  }
  return config;
}

// -------------------------------------------------------------------------
// PUBLIC / CUSTOMER ROUTES
// -------------------------------------------------------------------------

// GET /api/support/status - Get current support availability
router.get("/status", async (req, res) => {
  try {
    const config = await getOrCreateSupportConfig();
    res.json({
      success: true,
      isOnline: config.isOnline,
      statusMessage: config.statusMessage,
      offlineNotice: config.offlineNotice,
      businessHours: config.businessHours,
      welcomeMessage: config.welcomeMessage
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/support/session - Handshake to establish secure guest or user session
router.post("/session", async (req, res) => {
  try {
    const auth = extractAuth(req);
    let sessionToken = null;
    let customerId = auth.userId;
    let isGuest = auth.isGuest;
    let customerName = req.body.customerName || auth.userName || "Customer";
    let customerEmail = req.body.customerEmail || auth.userEmail || "";

    if (!customerId) {
      // Create cryptographically secure guest session
      const randomId = "guest_" + crypto.randomBytes(8).toString("hex") + "_" + Date.now().toString(36);
      customerId = randomId;
      isGuest = true;
      sessionToken = jwt.sign(
        { guestId: randomId, role: "guest", name: customerName, email: customerEmail },
        JWT_SECRET,
        { expiresIn: "30d" }
      );
    } else if (req.headers["x-guest-token"] || (authHeader = req.headers.authorization)) {
      // Re-use current valid token
      sessionToken = req.headers["x-guest-token"] || (req.headers.authorization && req.headers.authorization.split(" ")[1]);
    } else {
      sessionToken = jwt.sign(
        { id: customerId, role: isGuest ? "guest" : "customer", name: customerName, email: customerEmail },
        JWT_SECRET,
        { expiresIn: "30d" }
      );
    }

    const config = await getOrCreateSupportConfig();

    res.json({
      success: true,
      token: sessionToken,
      customerId,
      customerName,
      customerEmail,
      isGuest,
      supportConfig: {
        isOnline: config.isOnline,
        statusMessage: config.statusMessage,
        offlineNotice: config.offlineNotice,
        businessHours: config.businessHours,
        welcomeMessage: config.welcomeMessage
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/support/conversations - Start or retrieve active conversation
router.post("/conversations", async (req, res) => {
  try {
    const auth = extractAuth(req);
    if (!auth.userId && !auth.isAdmin) {
      return res.status(401).json({ success: false, message: "Valid chat session or token required" });
    }

    const { customerName, customerEmail, initialMessage, createNew = false, metadata = {} } = req.body;
    const customerId = auth.userId;

    // Check if customer already has an active conversation (open or pending)
    if (!createNew) {
      const activeConv = await Conversation.findOne({
        customerId,
        status: { $in: ["open", "pending"] }
      }).sort({ lastMessageAt: -1 });

      if (activeConv) {
        // Fetch messages for active conversation
        const messages = await Message.find({ conversationId: activeConv.conversationId }).sort({ createdAt: 1 });
        return res.json({
          success: true,
          isNew: false,
          conversation: activeConv,
          messages
        });
      }
    }

    // Generate unique conversation ID
    const convId = "TZ-CHAT-" + Date.now().toString(36).toUpperCase() + "-" + crypto.randomBytes(2).toString("hex").toUpperCase();

    const config = await getOrCreateSupportConfig();
    const finalCustomerName = (customerName && customerName.trim()) || auth.userName || "Customer";
    const finalCustomerEmail = (customerEmail && customerEmail.trim()) || auth.userEmail || "";

    const newConv = await Conversation.create({
      conversationId: convId,
      customerId,
      customerName: finalCustomerName,
      customerEmail: finalCustomerEmail,
      isGuest: auth.isGuest,
      status: "open",
      unreadCountCustomer: 0,
      unreadCountAdmin: initialMessage ? 1 : 0,
      lastMessage: {
        text: initialMessage ? initialMessage.trim() : config.welcomeMessage,
        sender: initialMessage ? "customer" : "system",
        createdAt: new Date()
      },
      lastMessageAt: new Date(),
      metadata: {
        userAgent: metadata.userAgent || req.headers["user-agent"] || "",
        currentPage: metadata.currentPage || "",
        ipAddress: req.ip || ""
      }
    });

    const messages = [];

    // 1. Initial Welcome message from TechZone
    const welcomeMsg = await Message.create({
      conversationId: convId,
      sender: "system",
      senderName: "TechZone Support",
      text: config.welcomeMessage,
      messageType: "system",
      isRead: true
    });
    messages.push(welcomeMsg);

    // 2. If user sent an initial message
    if (initialMessage && initialMessage.trim()) {
      const custMsg = await Message.create({
        conversationId: convId,
        sender: "customer",
        senderName: finalCustomerName,
        text: initialMessage.trim().substring(0, 2000),
        messageType: "text",
        isRead: false
      });
      messages.push(custMsg);
      broadcastNewMessage(convId, custMsg, newConv);
    }

    res.status(201).json({
      success: true,
      isNew: true,
      conversation: newConv,
      messages
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/support/conversations/:conversationId - Get conversation and message history
router.get("/conversations/:conversationId", async (req, res) => {
  try {
    const auth = extractAuth(req);
    const { conversationId } = req.params;

    const conv = await Conversation.findOne({ conversationId });
    if (!conv) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    // Authorization: customer can only view own conversation; admin can view all
    if (!auth.isAdmin && conv.customerId !== auth.userId) {
      return res.status(403).json({ success: false, message: "Unauthorized access to this conversation" });
    }

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });

    res.json({
      success: true,
      conversation: conv,
      messages
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/support/conversations/:conversationId/messages - Send message (customer or admin)
router.post("/conversations/:conversationId/messages", async (req, res) => {
  try {
    const auth = extractAuth(req);
    const { conversationId } = req.params;
    const { text, messageType = "text", orderData = null, quickReplyKey = "" } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Message text cannot be empty" });
    }

    const cleanText = text.trim();
    if (cleanText.length > 2000) {
      return res.status(400).json({ success: false, message: "Message is too long (max 2000 characters)" });
    }

    const conv = await Conversation.findOne({ conversationId });
    if (!conv) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    // Authorization
    const isAdmin = auth.isAdmin;
    if (!isAdmin && conv.customerId !== auth.userId) {
      return res.status(403).json({ success: false, message: "Unauthorized to send messages to this conversation" });
    }

    const sender = isAdmin ? "admin" : "customer";
    const senderName = isAdmin ? "TechZone Support Agent" : (conv.customerName || "Customer");

    const newMsg = await Message.create({
      conversationId,
      sender,
      senderName,
      text: cleanText,
      messageType,
      orderData,
      quickReplyKey,
      isRead: false
    });

    const updateFields = {
      lastMessage: {
        text: cleanText,
        sender,
        createdAt: newMsg.createdAt
      },
      lastMessageAt: newMsg.createdAt
    };

    if (isAdmin) {
      updateFields.$inc = { unreadCountCustomer: 1 };
      if (conv.status === "resolved") {
        updateFields.status = "open";
      }
    } else {
      updateFields.$inc = { unreadCountAdmin: 1 };
      if (conv.status === "resolved") {
        updateFields.status = "open";
      }
    }

    // If order was attached, save orderNumber on conversation
    if (orderData && orderData.orderNumber) {
      updateFields.orderNumber = orderData.orderNumber;
    }

    const updatedConv = await Conversation.findOneAndUpdate(
      { conversationId },
      updateFields,
      { new: true }
    );

    // Real-time broadcast
    broadcastNewMessage(conversationId, newMsg, updatedConv);

    // If customer selected a predefined quick reply and auto-replies are enabled
    if (sender === "customer" && quickReplyKey && QUICK_REPLIES_INFO[quickReplyKey]) {
      const qrData = QUICK_REPLIES_INFO[quickReplyKey];
      setTimeout(async () => {
        try {
          const autoMsg = await Message.create({
            conversationId,
            sender: "admin",
            senderName: "TechZone Assistant",
            text: qrData.response,
            messageType: "quick_reply",
            isRead: false
          });

          const autoConv = await Conversation.findOneAndUpdate(
            { conversationId },
            {
              lastMessage: {
                text: qrData.response,
                sender: "admin",
                createdAt: autoMsg.createdAt
              },
              lastMessageAt: autoMsg.createdAt,
              $inc: { unreadCountCustomer: 1 }
            },
            { new: true }
          );

          broadcastNewMessage(conversationId, autoMsg, autoConv);
        } catch (err) {
          console.error("Auto reply error:", err);
        }
      }, 700);
    }

    res.status(201).json({
      success: true,
      message: newMsg,
      conversation: updatedConv
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// PATCH /api/support/conversations/:conversationId/read - Mark messages read
router.patch("/conversations/:conversationId/read", async (req, res) => {
  try {
    const auth = extractAuth(req);
    const { conversationId } = req.params;

    const conv = await Conversation.findOne({ conversationId });
    if (!conv) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    if (auth.isAdmin) {
      await Message.updateMany(
        { conversationId, sender: "customer", isRead: false },
        { $set: { isRead: true } }
      );
      await Conversation.updateOne({ conversationId }, { $set: { unreadCountAdmin: 0 } });
    } else {
      if (conv.customerId !== auth.userId) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
      }
      await Message.updateMany(
        { conversationId, sender: "admin", isRead: false },
        { $set: { isRead: true } }
      );
      await Conversation.updateOne({ conversationId }, { $set: { unreadCountCustomer: 0 } });
    }

    const updated = await Conversation.findOne({ conversationId });
    broadcastConversationStatus(conversationId, updated);

    res.json({ success: true, conversation: updated });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// PATCH /api/support/conversations/:conversationId/status - Update conversation status
router.patch("/conversations/:conversationId/status", async (req, res) => {
  try {
    const auth = extractAuth(req);
    const { conversationId } = req.params;
    const { status } = req.body;

    if (!["open", "pending", "resolved"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be open, pending, or resolved" });
    }

    const conv = await Conversation.findOne({ conversationId });
    if (!conv) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    if (!auth.isAdmin && conv.customerId !== auth.userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const updateFields = { status };
    if (status === "resolved") {
      updateFields.resolvedAt = new Date();
    } else {
      updateFields.resolvedAt = null;
    }

    const updatedConv = await Conversation.findOneAndUpdate(
      { conversationId },
      updateFields,
      { new: true }
    );

    // Add a system notice message in conversation
    const sysMsg = await Message.create({
      conversationId,
      sender: "system",
      senderName: "System",
      text: status === "resolved"
        ? `This conversation has been marked as resolved by ${auth.isAdmin ? "Support Agent" : "Customer"}. You can send a message anytime to reopen it.`
        : `Conversation status changed to ${status}.`,
      messageType: "system",
      isRead: true
    });

    broadcastNewMessage(conversationId, sysMsg, updatedConv);
    broadcastConversationStatus(conversationId, updatedConv);

    res.json({
      success: true,
      conversation: updatedConv,
      systemMessage: sysMsg
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/support/my-conversations - List customer's own conversations
router.get("/my-conversations", async (req, res) => {
  try {
    const auth = extractAuth(req);
    if (!auth.userId) {
      return res.status(401).json({ success: false, message: "User session required" });
    }

    const conversations = await Conversation.find({ customerId: auth.userId }).sort({ lastMessageAt: -1 });
    res.json({ success: true, conversations });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/support/orders/lookup/:orderNumber - Secure order lookup for support
router.get("/orders/lookup/:orderNumber", async (req, res) => {
  try {
    const auth = extractAuth(req);
    const { orderNumber } = req.params;

    if (!orderNumber || !orderNumber.trim()) {
      return res.status(400).json({ success: false, message: "Order number required" });
    }

    const query = {
      $or: [
        { orderNumber: orderNumber.trim() },
        { orderNumber: new RegExp("^" + orderNumber.trim() + "$", "i") }
      ]
    };

    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({ success: false, message: `No order found matching "${orderNumber}"` });
    }

    // Security check: If not admin, verify customer email/name or current customer
    if (!auth.isAdmin && auth.userEmail) {
      if (order.customer.email.toLowerCase() !== auth.userEmail.toLowerCase()) {
        // Redact full address/phone for privacy if partial match
        return res.json({
          success: true,
          order: {
            orderNumber: order.orderNumber,
            status: order.status,
            createdAt: order.createdAt,
            totalAmount: order.totalAmount,
            itemCount: order.items.length,
            items: order.items.map(it => ({ name: it.name, qty: it.qty, price: it.price })),
            shippingMethod: order.shippingMethod,
            customerName: order.customer.name
          }
        });
      }
    }

    res.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt,
        totalAmount: order.totalAmount,
        discount: order.discount,
        shippingFee: order.shippingFee,
        shippingMethod: order.shippingMethod,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        customer: {
          name: order.customer.name,
          email: order.customer.email,
          city: order.customer.city,
          state: order.customer.state
        },
        items: order.items
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// -------------------------------------------------------------------------
// ADMIN ROUTES (Protected by extractAuth with isAdmin check)
// -------------------------------------------------------------------------

// Middleware to ensure admin
function requireAdmin(req, res, next) {
  const auth = extractAuth(req);
  if (!auth.isAdmin) {
    return res.status(403).json({ success: false, message: "Access denied. Administrator privileges required." });
  }
  req.auth = auth;
  next();
}

// GET /api/support/admin/conversations - List conversations with filter and search
router.get("/admin/conversations", requireAdmin, async (req, res) => {
  try {
    const { status = "all", search = "", page = 1, limit = 50 } = req.query;

    const query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (search && search.trim()) {
      const s = search.trim();
      const regex = new RegExp(s, "i");
      query.$or = [
        { customerName: regex },
        { customerEmail: regex },
        { conversationId: regex },
        { "lastMessage.text": regex },
        { orderNumber: regex }
      ];
    }

    const total = await Conversation.countDocuments(query);
    const conversations = await Conversation.find(query)
      .sort({ lastMessageAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    // Summary counts
    const totalOpen = await Conversation.countDocuments({ status: "open" });
    const totalPending = await Conversation.countDocuments({ status: "pending" });
    const totalResolved = await Conversation.countDocuments({ status: "resolved" });
    const totalUnreadAdmin = await Conversation.aggregate([
      { $group: { _id: null, total: { $sum: "$unreadCountAdmin" } } }
    ]);

    res.json({
      success: true,
      conversations,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)) || 1
      },
      counts: {
        totalAll: await Conversation.countDocuments(),
        open: totalOpen,
        pending: totalPending,
        resolved: totalResolved,
        totalUnread: totalUnreadAdmin[0]?.total || 0
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/support/admin/stats - Admin dashboard metrics for support
router.get("/admin/stats", requireAdmin, async (req, res) => {
  try {
    const totalAll = await Conversation.countDocuments();
    const open = await Conversation.countDocuments({ status: "open" });
    const pending = await Conversation.countDocuments({ status: "pending" });
    const resolved = await Conversation.countDocuments({ status: "resolved" });
    const unreadAgg = await Conversation.aggregate([
      { $group: { _id: null, total: { $sum: "$unreadCountAdmin" } } }
    ]);
    const totalMessages = await Message.countDocuments();

    const config = await getOrCreateSupportConfig();

    res.json({
      success: true,
      stats: {
        totalConversations: totalAll,
        openConversations: open,
        pendingConversations: pending,
        resolvedConversations: resolved,
        unreadAdminMessages: unreadAgg[0]?.total || 0,
        totalMessages,
        isOnline: config.isOnline
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/support/admin/reply - Admin replies to a conversation
router.post("/admin/reply", requireAdmin, async (req, res) => {
  try {
    const { conversationId, text, agentName = "TechZone Support Agent", orderData = null } = req.body;

    if (!conversationId || !text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Conversation ID and message text are required" });
    }

    const conv = await Conversation.findOne({ conversationId });
    if (!conv) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    const cleanText = text.trim();
    const newMsg = await Message.create({
      conversationId,
      sender: "admin",
      senderName: agentName,
      text: cleanText,
      messageType: orderData ? "order_info" : "text",
      orderData: orderData || null,
      isRead: false
    });

    const updateFields = {
      lastMessage: {
        text: cleanText,
        sender: "admin",
        createdAt: newMsg.createdAt
      },
      lastMessageAt: newMsg.createdAt,
      $inc: { unreadCountCustomer: 1 }
    };

    if (conv.status === "resolved") {
      updateFields.status = "open";
    }

    const updatedConv = await Conversation.findOneAndUpdate(
      { conversationId },
      updateFields,
      { new: true }
    );

    broadcastNewMessage(conversationId, newMsg, updatedConv);

    res.status(201).json({
      success: true,
      message: newMsg,
      conversation: updatedConv
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// PATCH /api/support/admin/status - Admin toggles availability and configuration
router.patch("/admin/status", requireAdmin, async (req, res) => {
  try {
    const { isOnline, statusMessage, offlineNotice, businessHours, welcomeMessage } = req.body;

    const updateData = {};
    if (typeof isOnline === "boolean") updateData.isOnline = isOnline;
    if (statusMessage) updateData.statusMessage = statusMessage.trim();
    if (offlineNotice) updateData.offlineNotice = offlineNotice.trim();
    if (businessHours) updateData.businessHours = businessHours.trim();
    if (welcomeMessage) updateData.welcomeMessage = welcomeMessage.trim();

    const config = await SupportConfig.findOneAndUpdate(
      { key: "default_config" },
      { $set: updateData },
      { new: true, upsert: true }
    );

    broadcastSupportConfig(config);

    res.json({
      success: true,
      config
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
