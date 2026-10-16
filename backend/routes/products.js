const router = require("express").Router();
const mongoose = require("mongoose");
const Product = require("../models/Product");
const { adminMiddleware, requirePermission } = require("../middleware/auth");
const { logActivity } = require("../services/activityLogger");

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

// GET category counts for admin and storefront
router.get("/categories/counts", async (req, res) => {
  try {
    const rawCounts = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const total = await Product.countDocuments();
    const categories = rawCounts
      .filter((item) => item._id)
      .map((item) => ({
        name: item._id,
        count: item.count
      }));
    res.json({ total, categories });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// PUT rename a category across all products
router.put("/categories/rename", adminMiddleware, requirePermission("categories"), async (req, res) => {
  try {
    const { oldName, newName } = req.body;
    if (!oldName || !newName || !oldName.trim() || !newName.trim()) {
      return res.status(400).json({ message: "Both old and new category names are required." });
    }
    const result = await Product.updateMany(
      { category: { $regex: new RegExp(`^${oldName.trim()}$`, "i") } },
      { $set: { category: newName.trim() } }
    );

    logActivity({
      action: "CATEGORY_RENAME",
      description: `Renamed category "${oldName}" to "${newName}" across ${result.modifiedCount} products`,
      performedBy: req.user,
      details: { oldName, newName, modifiedCount: result.modifiedCount },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: `Renamed category "${oldName}" to "${newName}". Updated ${result.modifiedCount} products.`,
      modifiedCount: result.modifiedCount
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// DELETE remove or reassign a category
router.delete("/categories/:categoryName", adminMiddleware, requirePermission("categories"), async (req, res) => {
  try {
    const categoryName = req.params.categoryName;
    const { reassignTo } = req.body || {};
    const count = await Product.countDocuments({
      category: { $regex: new RegExp(`^${categoryName.trim()}$`, "i") }
    });

    if (count > 0) {
      if (!reassignTo || !reassignTo.trim()) {
        return res.status(400).json({
          message: `Cannot delete category "${categoryName}" because it currently contains ${count} product(s). Please reassign them to another category first.`,
          count
        });
      }
      await Product.updateMany(
        { category: { $regex: new RegExp(`^${categoryName.trim()}$`, "i") } },
        { $set: { category: reassignTo.trim() } }
      );
      return res.json({
        success: true,
        message: `Successfully reassigned ${count} products from "${categoryName}" to "${reassignTo}".`,
        reassignedCount: count
      });
    }

    res.json({
      success: true,
      message: `Category "${categoryName}" deleted (0 products affected).`
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET all products (with optional category, search, stock, sort query params)
router.get("/", async (req, res) => {
  try {
    const { category, search, stock, sort } = req.query;
    const filter = {};

    if (category && category !== "All") {
      filter.category = { $regex: new RegExp(`^${category.trim()}$`, "i") };
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } }
      ];
    }

    if (stock) {
      if (stock === "In Stock") filter.stock = { $gt: 5 };
      else if (stock === "Low Stock") filter.stock = { $gt: 0, $lte: 5 };
      else if (stock === "Out of Stock") filter.stock = { $lte: 0 };
    }

    let sortOptions = { createdAt: -1 };
    if (sort === "price-asc") sortOptions = { price: 1 };
    else if (sort === "price-desc") sortOptions = { price: -1 };
    else if (sort === "rating") sortOptions = { rating: -1 };
    else if (sort === "stock-asc") sortOptions = { stock: 1 };
    else if (sort === "stock-desc") sortOptions = { stock: -1 };

    const products = await Product.find(filter).sort(sortOptions).lean();
    const normalized = products.map((p) => {
      if ((!p.images || p.images.length === 0) && p.image) {
        return { ...p, images: [p.image] };
      }
      return p;
    });
    res.json(normalized);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET recommendations for a product
router.get("/:id/recommendations", async (req, res) => {
  try {
    const id = req.params.id;
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 8, 4), 16);

    let target = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      target = await Product.findById(id);
    }
    if (!target) {
      target = await Product.findOne({
        $or: [{ productId: id }, { name: id }]
      });
    }

    if (!target) {
      // Fallback: top rated products
      const fallback = await Product.find()
        .sort({ rating: -1, reviews: -1 })
        .limit(limit);
      return res.json(fallback);
    }

    const targetPrice = Number(target.price) || 0;
    const minPrice = targetPrice * 0.6;
    const maxPrice = targetPrice * 1.5;
    const recommendedMap = new Map();

    // 1. Same category, similar price, high rating
    const query1 = await Product.find({
      _id: { $ne: target._id },
      category: target.category,
      price: { $gte: minPrice, $lte: maxPrice }
    })
      .sort({ rating: -1, reviews: -1 })
      .limit(limit);

    for (const p of query1) {
      if (!recommendedMap.has(String(p._id))) {
        recommendedMap.set(String(p._id), p);
      }
    }

    // 2. Same category, any price, high rating
    if (recommendedMap.size < limit) {
      const query2 = await Product.find({
        _id: { $ne: target._id },
        category: target.category
      })
        .sort({ rating: -1, reviews: -1 })
        .limit(limit);

      for (const p of query2) {
        if (!recommendedMap.has(String(p._id))) {
          recommendedMap.set(String(p._id), p);
        }
        if (recommendedMap.size >= limit) break;
      }
    }

    // 3. Similar price across catalogue, high rating
    if (recommendedMap.size < limit) {
      const query3 = await Product.find({
        _id: { $ne: target._id },
        price: { $gte: minPrice, $lte: maxPrice }
      })
        .sort({ rating: -1, reviews: -1 })
        .limit(limit);

      for (const p of query3) {
        if (!recommendedMap.has(String(p._id))) {
          recommendedMap.set(String(p._id), p);
        }
        if (recommendedMap.size >= limit) break;
      }
    }

    // 4. Fallback best-rated catalogue products
    if (recommendedMap.size < limit) {
      const query4 = await Product.find({
        _id: { $ne: target._id }
      })
        .sort({ rating: -1, createdAt: -1 })
        .limit(limit);

      for (const p of query4) {
        if (!recommendedMap.has(String(p._id))) {
          recommendedMap.set(String(p._id), p);
        }
        if (recommendedMap.size >= limit) break;
      }
    }

    const results = Array.from(recommendedMap.values()).slice(0, limit);
    res.json(results);
  } catch (e) {
    console.error("GET /:id/recommendations error:", e);
    res.status(500).json({ message: e.message });
  }
});

// GET single product
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    let product = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id).lean();
    }
    if (!product) {
      product = await Product.findOne({
        $or: [{ productId: id }, { name: id }]
      }).lean();
    }
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Fallback: ensure images array exists and has at least product.image
    if ((!product.images || product.images.length === 0) && product.image) {
      product.images = [product.image];
    }

    res.json(product);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST create product
router.post("/", adminMiddleware, requirePermission("products_manage"), async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.name || !String(data.name).trim()) {
      return res.status(400).json({ message: "Product name is required" });
    }
    if (!data.category || !String(data.category).trim()) {
      return res.status(400).json({ message: "Product category is required" });
    }
    data.name = String(data.name).trim();
    data.category = String(data.category).trim();

    // Sanitize and sync images
    if (Array.isArray(data.images) && data.images.length > 0) {
      data.images = data.images.map((u) => String(u).trim()).filter(Boolean);
      if (!data.image || !data.images.includes(data.image)) {
        data.image = data.images[0] || "";
      }
    } else if (data.image) {
      data.image = String(data.image).trim();
      data.images = [data.image];
    } else {
      data.images = [];
    }

    const created = await Product.create(data);

    logActivity({
      action: "PRODUCT_CREATE",
      description: `Created new product: "${created.name}" (₹${created.price})`,
      performedBy: req.user,
      target: { id: created._id, name: created.name, type: "Product" },
      details: { price: created.price, category: created.category, stock: created.stock },
      ipAddress: req.ip
    });

    res.status(201).json(created);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// PUT update product (accepts inventory permission if updating stock only)
router.put(
  "/:id",
  adminMiddleware,
  (req, res, next) => {
    if (req.body && Object.keys(req.body).length === 1 && req.body.stock !== undefined) {
      // Stock adjustment only requires inventory or products_manage
      const hasInv = req.user?.permissions?.includes("inventory");
      const hasProd = req.user?.permissions?.includes("products_manage");
      if (req.isSuperAdmin || req.user?.role === "superadmin" || hasInv || hasProd) {
        return next();
      }
      return res.status(403).json({
        success: false,
        message: "Access denied. You lack the 'inventory' permission to adjust stock."
      });
    }
    return requirePermission("products_manage")(req, res, next);
  },
  async (req, res) => {
    try {
      const data = { ...req.body };
      if (data.name !== undefined) {
        if (!String(data.name).trim()) {
          return res.status(400).json({ message: "Product name cannot be empty" });
        }
        data.name = String(data.name).trim();
      }
      if (data.category !== undefined) {
        if (!String(data.category).trim()) {
          return res.status(400).json({ message: "Product category cannot be empty" });
        }
        data.category = String(data.category).trim();
      }

      // Sanitize and sync images on update
      if (Array.isArray(data.images)) {
        data.images = data.images.map((u) => String(u).trim()).filter(Boolean);
        if (data.images.length > 0 && (!data.image || !data.images.includes(data.image))) {
          data.image = data.images[0];
        }
      } else if (data.image && (!data.images || data.images.length === 0)) {
        data.image = String(data.image).trim();
        data.images = [data.image];
      }

      const updated = await Product.findByIdAndUpdate(req.params.id, data, { new: true });
      if (!updated) return res.status(404).json({ message: "Product not found" });

      logActivity({
        action: "PRODUCT_UPDATE",
        description: `Updated product "${updated.name}" (${updated._id})`,
        performedBy: req.user,
        target: { id: updated._id, name: updated.name, type: "Product" },
        details: { updatedFields: Object.keys(data) },
        ipAddress: req.ip
      });

      res.json(updated);
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  }
);

// DELETE product
router.delete("/:id", adminMiddleware, requirePermission("products_manage"), async (req, res) => {
  try {
    const existing = await Product.findById(req.params.id);
    await Product.findByIdAndDelete(req.params.id);

    if (existing) {
      logActivity({
        action: "PRODUCT_DELETE",
        description: `Deleted product "${existing.name}" (${existing._id})`,
        performedBy: req.user,
        target: { id: existing._id, name: existing.name, type: "Product" },
        details: { category: existing.category, price: existing.price },
        ipAddress: req.ip
      });
    }

    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

module.exports = router;
