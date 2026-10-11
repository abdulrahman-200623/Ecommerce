const router = require("express").Router();
const mongoose = require("mongoose");
const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");

// Helper to sanitize/ensure product details
async function resolveProductDetails(productId, fallbackProduct) {
  let productData = fallbackProduct || {};
  if (mongoose.Types.ObjectId.isValid(productId)) {
    try {
      const dbProduct = await Product.findById(productId);
      if (dbProduct) {
        productData = {
          productId: String(dbProduct._id),
          name: dbProduct.name,
          description: dbProduct.description || "",
          price: dbProduct.price,
          originalPrice: dbProduct.originalPrice || dbProduct.price,
          discount: dbProduct.discount || 0,
          category: dbProduct.category || "Electronics",
          image: dbProduct.image || "",
          rating: dbProduct.rating || 4.5,
          reviews: dbProduct.reviews || 0,
          stock: dbProduct.stock || 0
        };
        return productData;
      }
    } catch (e) {
      // Continue to fallback
    }
  }

  return {
    productId: String(productId || fallbackProduct?._id || fallbackProduct?.productId),
    name: productData.name || "Product",
    description: productData.description || "",
    price: Number(productData.price) || 0,
    originalPrice: Number(productData.originalPrice || productData.price) || 0,
    discount: Number(productData.discount) || 0,
    category: productData.category || "Electronics",
    image: productData.image || "",
    rating: Number(productData.rating) || 4.5,
    reviews: Number(productData.reviews) || 0,
    stock: Number(productData.stock) || 10
  };
}

// GET wishlist for a user (via param or query)
router.get("/:userId?", async (req, res) => {
  try {
    const userId = req.params.userId || req.query.userId;
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return res.json({
        success: true,
        userId,
        count: 0,
        items: []
      });
    }

    res.json({
      success: true,
      userId,
      count: wishlist.items.length,
      items: wishlist.items
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST add product to wishlist (prevents duplicate)
router.post("/", async (req, res) => {
  try {
    const { userId, productId, product } = req.body;
    const targetUserId = userId || req.query.userId;
    const targetProductId = productId || product?._id || product?.productId;

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }
    if (!targetProductId) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    let wishlist = await Wishlist.findOne({ userId: targetUserId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId: targetUserId, items: [] });
    }

    // Check duplicate
    const exists = wishlist.items.some(
      (item) => String(item.productId) === String(targetProductId)
    );

    if (exists) {
      return res.status(200).json({
        success: true,
        alreadyExists: true,
        message: "Product is already in your wishlist",
        count: wishlist.items.length,
        items: wishlist.items
      });
    }

    // Resolve product fields
    const itemData = await resolveProductDetails(targetProductId, product);
    wishlist.items.unshift(itemData);
    await wishlist.save();

    res.status(201).json({
      success: true,
      message: "Added to wishlist",
      count: wishlist.items.length,
      items: wishlist.items
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST toggle product in wishlist (adds if not present, removes if present)
router.post("/toggle", async (req, res) => {
  try {
    const { userId, productId, product } = req.body;
    const targetUserId = userId || req.query.userId;
    const targetProductId = productId || product?._id || product?.productId;

    if (!targetUserId || !targetProductId) {
      return res.status(400).json({
        success: false,
        message: "userId and productId are required"
      });
    }

    let wishlist = await Wishlist.findOne({ userId: targetUserId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId: targetUserId, items: [] });
    }

    const existingIndex = wishlist.items.findIndex(
      (item) => String(item.productId) === String(targetProductId)
    );

    let action = "";
    if (existingIndex > -1) {
      // Remove from wishlist
      wishlist.items.splice(existingIndex, 1);
      action = "removed";
    } else {
      // Add to wishlist
      const itemData = await resolveProductDetails(targetProductId, product);
      wishlist.items.unshift(itemData);
      action = "added";
    }

    await wishlist.save();

    res.json({
      success: true,
      action,
      inWishlist: action === "added",
      message: action === "added" ? "Added to Wishlist" : "Removed from Wishlist",
      count: wishlist.items.length,
      items: wishlist.items
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE remove product from wishlist
router.delete("/:productId", async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = req.query.userId || req.body?.userId;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return res.json({
        success: true,
        message: "Wishlist already empty",
        count: 0,
        items: []
      });
    }

    const initialLength = wishlist.items.length;
    wishlist.items = wishlist.items.filter(
      (item) => String(item.productId) !== String(productId)
    );

    if (wishlist.items.length !== initialLength) {
      await wishlist.save();
    }

    res.json({
      success: true,
      message: "Removed from wishlist",
      count: wishlist.items.length,
      items: wishlist.items
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE clear entire wishlist for user
router.delete("/clear/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const wishlist = await Wishlist.findOne({ userId });
    if (wishlist) {
      wishlist.items = [];
      await wishlist.save();
    }

    res.json({
      success: true,
      message: "Wishlist cleared",
      count: 0,
      items: []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
