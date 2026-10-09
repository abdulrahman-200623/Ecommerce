const router = require("express").Router();
const Product = require("../models/Product");

// GET product stats for admin dashboard
router.get("/stats", async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const lowStock = await Product.countDocuments({ stock: { $gt: 0, $lte: 5 } });
    const outOfStock = await Product.countDocuments({ stock: { $lte: 0 } });
    const categories = await Product.distinct("category");
    res.json({
      totalProducts,
      lowStock,
      outOfStock,
      categoryCount: categories.length,
      categories
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET all products
router.get("/", async (req, res) => {
  try {
    res.json(await Product.find().sort({ createdAt: -1 }));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET single product
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST create product
router.post("/", async (req, res) => {
  try {
    res.status(201).json(await Product.create(req.body));
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// PUT update product
router.put("/:id", async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Product not found" });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// DELETE product
router.delete("/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

module.exports = router;
