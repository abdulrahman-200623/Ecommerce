const router = require("express").Router();
const Coupon = require("../models/Coupon");

// Default starter coupons
const DEFAULT_COUPONS = [
  {
    code: "TECHZONE10",
    discountType: "percentage",
    discountValue: 10,
    maxDiscount: 2000,
    minOrderAmount: 1000,
    isActive: true,
    description: "10% off up to ₹2,000 on orders above ₹1,000"
  },
  {
    code: "WELCOME500",
    discountType: "fixed",
    discountValue: 500,
    maxDiscount: 500,
    minOrderAmount: 2499,
    isActive: true,
    description: "Flat ₹500 off on orders above ₹2,499"
  },
  {
    code: "FESTIVE15",
    discountType: "percentage",
    discountValue: 15,
    maxDiscount: 3500,
    minOrderAmount: 4999,
    isActive: true,
    description: "15% off up to ₹3,500 on premium orders above ₹4,999"
  },
  {
    code: "FREESHIP",
    discountType: "fixed",
    discountValue: 99,
    maxDiscount: 99,
    minOrderAmount: 499,
    isActive: true,
    description: "Free express shipping on all orders above ₹499"
  }
];

// Helper to seed default coupons if database has none
async function ensureDefaultCoupons() {
  try {
    const count = await Coupon.countDocuments();
    if (count === 0) {
      await Coupon.insertMany(DEFAULT_COUPONS);
      console.log("Seeded initial TechZone coupons.");
    }
  } catch (err) {
    console.error("Coupon seed check error:", err.message);
  }
}

// Call on startup
ensureDefaultCoupons();

// GET all available / active coupons
router.get("/available", async (req, res) => {
  try {
    await ensureDefaultCoupons();
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gte: now } }]
    }).select("code discountType discountValue maxDiscount minOrderAmount description");

    res.json({ success: true, coupons });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST validate coupon code
router.post("/validate", async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code || typeof code !== "string") {
      return res.status(400).json({ success: false, message: "Please provide a valid coupon code." });
    }

    const orderSubtotal = Number(subtotal) || 0;
    const cleanCode = code.trim().toUpperCase();

    await ensureDefaultCoupons();
    let coupon = await Coupon.findOne({ code: cleanCode });

    // Fallback to in-memory check if DB hasn't populated yet
    if (!coupon) {
      const foundDefault = DEFAULT_COUPONS.find(c => c.code === cleanCode);
      if (foundDefault) {
        coupon = foundDefault;
      }
    }

    if (!coupon || !coupon.isActive) {
      return res.status(404).json({
        success: false,
        message: `Coupon "${cleanCode}" is invalid or not active.`
      });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        message: `Coupon "${cleanCode}" has expired.`
      });
    }

    if (coupon.minOrderAmount && orderSubtotal < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order subtotal for "${cleanCode}" is ₹${coupon.minOrderAmount.toLocaleString("en-IN")}. Current cart subtotal is ₹${orderSubtotal.toLocaleString("en-IN")}.`
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = Math.round((orderSubtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscount > 0 && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = Math.min(coupon.discountValue, orderSubtotal);
    }

    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscount: coupon.maxDiscount,
        minOrderAmount: coupon.minOrderAmount,
        discountAmount,
        description: coupon.description
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
