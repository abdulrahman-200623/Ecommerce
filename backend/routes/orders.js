const router = require("express").Router();
const Order = require("../models/Order");

// GET all orders
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

// GET single order
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST new order
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
