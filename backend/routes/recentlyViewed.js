const router = require("express").Router();
const mongoose = require("mongoose");
const RecentlyViewed = require("../models/RecentlyViewed");
const Product = require("../models/Product");
const { authMiddleware, optionalAuth } = require("../middleware/auth");

// Helper to resolve product details from DB or fallback snapshot
async function resolveProduct(productId, fallbackSnapshot) {
  let dbProduct = null;
  if (mongoose.Types.ObjectId.isValid(productId)) {
    try {
      dbProduct = await Product.findById(productId);
    } catch (e) {}
  }
  if (!dbProduct) {
    try {
      dbProduct = await Product.findOne({
        $or: [{ productId: String(productId) }, { name: String(productId) }]
      });
    } catch (e) {}
  }

  if (dbProduct) {
    return {
      productId: String(dbProduct._id),
      productObjectId: dbProduct._id,
      snapshot: {
        _id: String(dbProduct._id),
        name: dbProduct.name,
        price: dbProduct.price,
        originalPrice: dbProduct.originalPrice || dbProduct.price,
        discount: dbProduct.discount || 0,
        category: dbProduct.category || "Electronics",
        image: dbProduct.image || "",
        rating: dbProduct.rating || 4.5,
        reviews: dbProduct.reviews || 0,
        stock: dbProduct.stock || 0
      }
    };
  }

  if (fallbackSnapshot) {
    return {
      productId: String(productId || fallbackSnapshot._id || fallbackSnapshot.productId),
      productObjectId: null,
      snapshot: {
        _id: String(productId || fallbackSnapshot._id || fallbackSnapshot.productId),
        name: fallbackSnapshot.name || "Product",
        price: Number(fallbackSnapshot.price) || 0,
        originalPrice: Number(fallbackSnapshot.originalPrice || fallbackSnapshot.price) || 0,
        discount: Number(fallbackSnapshot.discount) || 0,
        category: fallbackSnapshot.category || "Electronics",
        image: fallbackSnapshot.image || "",
        rating: Number(fallbackSnapshot.rating) || 4.5,
        reviews: Number(fallbackSnapshot.reviews) || 0,
        stock: Number(fallbackSnapshot.stock) || 0
      }
    };
  }

  return null;
}

// GET /api/recently-viewed - Fetch recently viewed products for logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user._id);
    const record = await RecentlyViewed.findOne({ userId });

    if (!record || !record.items || !record.items.length) {
      return res.json({
        success: true,
        count: 0,
        products: [],
        items: []
      });
    }

    // Resolve live products and filter out any deleted ones
    const resolvedProducts = [];
    const updatedItems = [];

    for (const item of record.items) {
      const resolved = await resolveProduct(item.productId, item.productSnapshot);
      if (resolved && resolved.snapshot) {
        resolvedProducts.push({
          ...resolved.snapshot,
          viewedAt: item.viewedAt
        });
        updatedItems.push({
          productId: resolved.productId,
          product: resolved.productObjectId,
          productSnapshot: resolved.snapshot,
          viewedAt: item.viewedAt
        });
      }
    }

    // If any deleted products were filtered, silently save clean list
    if (updatedItems.length !== record.items.length) {
      record.items = updatedItems;
      await record.save();
    }

    // Limit to top 10 unique recently viewed
    const topProducts = resolvedProducts.slice(0, 10);

    res.json({
      success: true,
      count: topProducts.length,
      products: topProducts,
      items: updatedItems.slice(0, 10)
    });
  } catch (error) {
    console.error("GET /api/recently-viewed error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/recently-viewed/:productId - Record a product view for logged-in user
router.post("/:productId", authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user._id);
    const { productId } = req.params;
    const fallbackProduct = req.body?.product;

    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    // Validate product existence
    const resolved = await resolveProduct(productId, fallbackProduct);
    if (!resolved) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    let record = await RecentlyViewed.findOne({ userId });
    if (!record) {
      record = new RecentlyViewed({ userId, items: [] });
    }

    // Remove existing occurrence to prevent duplicates and update to newest position
    record.items = record.items.filter(
      (item) => String(item.productId) !== String(resolved.productId)
    );

    // Unshift to top (most recent first)
    record.items.unshift({
      productId: resolved.productId,
      product: resolved.productObjectId,
      productSnapshot: resolved.snapshot,
      viewedAt: new Date()
    });

    // Limit stored items to max 20
    if (record.items.length > 20) {
      record.items = record.items.slice(0, 20);
    }

    await record.save();

    // Prepare live products list
    const topProducts = record.items.slice(0, 10).map((item) => ({
      ...(item.productSnapshot ? item.productSnapshot.toObject ? item.productSnapshot.toObject() : item.productSnapshot : {}),
      _id: item.productId,
      viewedAt: item.viewedAt
    }));

    res.status(201).json({
      success: true,
      message: "Product view recorded",
      count: topProducts.length,
      products: topProducts
    });
  } catch (error) {
    console.error("POST /api/recently-viewed/:productId error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/recently-viewed/sync - Merge guest browsing history into user account
router.post("/sync/merge", authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user._id);
    const guestItems = req.body.items || [];
    const guestProductIds = req.body.productIds || [];

    let record = await RecentlyViewed.findOne({ userId });
    if (!record) {
      record = new RecentlyViewed({ userId, items: [] });
    }

    // Map existing user items by productId
    const existingMap = new Map();
    for (const it of record.items) {
      existingMap.set(String(it.productId), it);
    }

    // Process guest items (most recent first)
    const combinedList = [];
    const seen = new Set();

    // 1. Add guest items first (they are freshest from current session)
    for (const g of guestItems) {
      const pid = String(g._id || g.productId);
      if (!pid || seen.has(pid)) continue;
      seen.add(pid);

      const resolved = await resolveProduct(pid, g);
      if (resolved) {
        combinedList.push({
          productId: resolved.productId,
          product: resolved.productObjectId,
          productSnapshot: resolved.snapshot,
          viewedAt: g.viewedAt ? new Date(g.viewedAt) : new Date()
        });
      }
    }

    // Also support array of simple IDs if provided
    for (const pid of guestProductIds) {
      const pstr = String(pid);
      if (!pstr || seen.has(pstr)) continue;
      seen.add(pstr);
      const resolved = await resolveProduct(pstr);
      if (resolved) {
        combinedList.push({
          productId: resolved.productId,
          product: resolved.productObjectId,
          productSnapshot: resolved.snapshot,
          viewedAt: new Date()
        });
      }
    }

    // 2. Append existing user items that weren't in guest session
    for (const it of record.items) {
      const pid = String(it.productId);
      if (!seen.has(pid)) {
        seen.add(pid);
        combinedList.push(it);
      }
    }

    // Sort by viewedAt desc and limit to 20
    combinedList.sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt));
    record.items = combinedList.slice(0, 20);
    await record.save();

    const topProducts = record.items.slice(0, 10).map((item) => ({
      ...(item.productSnapshot ? item.productSnapshot.toObject ? item.productSnapshot.toObject() : item.productSnapshot : {}),
      _id: item.productId,
      viewedAt: item.viewedAt
    }));

    res.json({
      success: true,
      message: "Browsing history synchronized successfully",
      count: topProducts.length,
      products: topProducts
    });
  } catch (error) {
    console.error("POST /api/recently-viewed/sync error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/recently-viewed - Clear viewing history for logged-in user
router.delete("/", authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user._id);
    await RecentlyViewed.findOneAndUpdate(
      { userId },
      { $set: { items: [] } },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Viewing history cleared successfully",
      count: 0,
      products: [],
      items: []
    });
  } catch (error) {
    console.error("DELETE /api/recently-viewed error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
