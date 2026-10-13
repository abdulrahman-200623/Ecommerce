const router = require("express").Router();
const mongoose = require("mongoose");
const FlashSale = require("../models/FlashSale");
const Product = require("../models/Product");
const { adminMiddleware, requirePermission } = require("../middleware/auth");

// Helper to look up a product in MongoDB
async function findProduct(idStr) {
  if (!idStr) return null;
  const pId = String(idStr).trim();
  if (mongoose.Types.ObjectId.isValid(pId)) {
    const doc = await Product.findById(pId);
    if (doc) return doc;
  }
  return await Product.findOne({
    $or: [{ productId: pId }, { _id: pId }]
  });
}

// GET /api/flash-sales/active - Public deals endpoint
router.get("/active", async (req, res) => {
  try {
    const now = new Date();

    // Query active/upcoming sales from DB
    const sales = await FlashSale.find({
      isActive: true,
      endTime: { $gt: now }
    }).sort({ startTime: 1 });

    const activeDeals = [];
    const upcomingDeals = [];

    for (const sale of sales) {
      const prod = await findProduct(sale.productId);
      const deal = sale.toDealSnapshot(prod, now);

      if (deal.status === "Active") {
        activeDeals.push(deal);
      } else if (deal.status === "Scheduled") {
        upcomingDeals.push(deal);
      }
    }

    res.json({
      success: true,
      serverTime: now,
      activeDeals,
      upcomingDeals,
      totalActive: activeDeals.length,
      totalUpcoming: upcomingDeals.length
    });
  } catch (err) {
    console.error("Error fetching active flash sales:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/flash-sales/all - Admin endpoint with all statuses & metrics
router.get("/all", adminMiddleware, requirePermission("coupons"), async (req, res) => {
  try {
    const now = new Date();
    const sales = await FlashSale.find().sort({ createdAt: -1 });

    let activeCount = 0;
    let scheduledCount = 0;
    let expiredCount = 0;
    let disabledCount = 0;

    const list = await Promise.all(
      sales.map(async (sale) => {
        const prod = await findProduct(sale.productId);
        const deal = sale.toDealSnapshot(prod, now);

        if (deal.status === "Active") activeCount++;
        else if (deal.status === "Scheduled") scheduledCount++;
        else if (deal.status === "Expired") expiredCount++;
        else if (deal.status === "Disabled") disabledCount++;

        return deal;
      })
    );

    res.json({
      success: true,
      serverTime: now,
      metrics: {
        total: sales.length,
        active: activeCount,
        scheduled: scheduledCount,
        expired: expiredCount,
        disabled: disabledCount
      },
      flashSales: list
    });
  } catch (err) {
    console.error("Error fetching all flash sales for admin:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/flash-sales/:id - Get single flash sale
router.get("/:id", async (req, res) => {
  try {
    const now = new Date();
    const sale = await FlashSale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: "Flash sale deal not found." });
    }

    const prod = await findProduct(sale.productId);
    res.json({
      success: true,
      serverTime: now,
      flashSale: sale.toDealSnapshot(prod, now)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/flash-sales - Admin create flash sale
router.post("/", adminMiddleware, requirePermission("coupons"), async (req, res) => {
  try {
    const {
      productId,
      salePrice,
      discountPercentage,
      startTime,
      endTime,
      saleQuantity,
      isActive = true
    } = req.body;

    // 1. Validate Product
    if (!productId) {
      return res.status(400).json({ success: false, message: "Please select an existing product." });
    }

    const dbProduct = await findProduct(productId);
    if (!dbProduct) {
      return res.status(404).json({ success: false, message: "Product not found in MongoDB catalog." });
    }

    const originalPrice = Number(dbProduct.price);
    if (!originalPrice || originalPrice <= 0) {
      return res.status(400).json({ success: false, message: "Selected product has an invalid base price." });
    }

    // 2. Validate Prices & Discounts
    let finalSalePrice = Number(salePrice);
    let finalDiscount = Number(discountPercentage);

    if (finalSalePrice && finalSalePrice > 0) {
      if (finalSalePrice >= originalPrice) {
        return res.status(400).json({
          success: false,
          message: `Sale price (₹${finalSalePrice}) must be lower than original regular price (₹${originalPrice}).`
        });
      }
      finalDiscount = Math.round(((originalPrice - finalSalePrice) / originalPrice) * 100);
    } else if (finalDiscount && finalDiscount > 0) {
      if (finalDiscount < 1 || finalDiscount > 99) {
        return res.status(400).json({
          success: false,
          message: "Discount percentage must be between 1% and 99%."
        });
      }
      finalSalePrice = Math.round(originalPrice * (1 - finalDiscount / 100));
    } else {
      return res.status(400).json({
        success: false,
        message: "Please specify either a valid sale price or discount percentage."
      });
    }

    // 3. Validate Date Range
    if (!startTime || !endTime) {
      return res.status(400).json({ success: false, message: "Start time and end time are required." });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid date format for start or end time." });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: "Sale end date & time must be later than the start date & time."
      });
    }

    // 4. Overlap Check for Active / Scheduled sales on same product
    const prodKey = String(dbProduct._id);
    const existingOverlap = await FlashSale.findOne({
      productId: { $in: [prodKey, String(dbProduct.productId || prodKey)] },
      isActive: true,
      $or: [
        { startTime: { $lt: end }, endTime: { $gt: start } }
      ]
    });

    if (existingOverlap) {
      return res.status(400).json({
        success: false,
        message: `An active or scheduled flash sale already exists for "${dbProduct.name}" in this time window.`
      });
    }

    // 5. Create Flash Sale
    const quota = Math.max(0, parseInt(saleQuantity, 10) || 0);

    const newSale = await FlashSale.create({
      productId: prodKey,
      productRef: mongoose.Types.ObjectId.isValid(prodKey) ? dbProduct._id : undefined,
      productName: dbProduct.name,
      productImage: dbProduct.image || "",
      originalPrice,
      salePrice: finalSalePrice,
      discountPercentage: finalDiscount,
      startTime: start,
      endTime: end,
      saleQuantity: quota,
      soldQuantity: 0,
      isActive: Boolean(isActive)
    });

    const now = new Date();
    res.status(201).json({
      success: true,
      message: `Flash sale deal created for "${dbProduct.name}"!`,
      flashSale: newSale.toDealSnapshot(dbProduct, now)
    });
  } catch (err) {
    console.error("Error creating flash sale:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/flash-sales/:id - Admin update flash sale
router.put("/:id", adminMiddleware, requirePermission("coupons"), async (req, res) => {
  try {
    const sale = await FlashSale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: "Flash sale not found." });
    }

    const {
      salePrice,
      discountPercentage,
      startTime,
      endTime,
      saleQuantity,
      isActive
    } = req.body;

    const dbProduct = await findProduct(sale.productId);
    const originalPrice = dbProduct ? Number(dbProduct.price) : sale.originalPrice;

    if (salePrice !== undefined) {
      const numSale = Number(salePrice);
      if (numSale <= 0 || numSale >= originalPrice) {
        return res.status(400).json({
          success: false,
          message: `Sale price must be greater than zero and less than regular price (₹${originalPrice}).`
        });
      }
      sale.salePrice = numSale;
      sale.discountPercentage = Math.round(((originalPrice - numSale) / originalPrice) * 100);
    } else if (discountPercentage !== undefined) {
      const numDisc = Number(discountPercentage);
      if (numDisc < 1 || numDisc > 99) {
        return res.status(400).json({ success: false, message: "Discount must be between 1% and 99%." });
      }
      sale.discountPercentage = numDisc;
      sale.salePrice = Math.round(originalPrice * (1 - numDisc / 100));
    }

    if (startTime) {
      const start = new Date(startTime);
      if (isNaN(start.getTime())) return res.status(400).json({ success: false, message: "Invalid start time." });
      sale.startTime = start;
    }

    if (endTime) {
      const end = new Date(endTime);
      if (isNaN(end.getTime())) return res.status(400).json({ success: false, message: "Invalid end time." });
      sale.endTime = end;
    }

    if (new Date(sale.endTime) <= new Date(sale.startTime)) {
      return res.status(400).json({ success: false, message: "End time must be after start time." });
    }

    if (saleQuantity !== undefined) {
      sale.saleQuantity = Math.max(0, parseInt(saleQuantity, 10) || 0);
    }

    if (isActive !== undefined) {
      sale.isActive = Boolean(isActive);
    }

    await sale.save();
    const now = new Date();

    res.json({
      success: true,
      message: "Flash sale updated successfully.",
      flashSale: sale.toDealSnapshot(dbProduct, now)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/flash-sales/:id/toggle - Admin toggle status
router.patch("/:id/toggle", adminMiddleware, requirePermission("coupons"), async (req, res) => {
  try {
    const sale = await FlashSale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: "Flash sale not found." });
    }

    sale.isActive = !sale.isActive;
    await sale.save();

    const prod = await findProduct(sale.productId);
    const now = new Date();

    res.json({
      success: true,
      message: `Flash sale ${sale.isActive ? "enabled" : "disabled"} successfully.`,
      flashSale: sale.toDealSnapshot(prod, now)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/flash-sales/:id - Admin delete flash sale
router.delete("/:id", adminMiddleware, requirePermission("coupons"), async (req, res) => {
  try {
    const sale = await FlashSale.findByIdAndDelete(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: "Flash sale not found." });
    }

    res.json({
      success: true,
      message: `Flash sale for "${sale.productName}" has been removed.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/flash-sales/seed - Seed default sales for testing if empty
router.post("/seed", async (req, res) => {
  try {
    const count = await FlashSale.countDocuments();
    if (count > 0) {
      return res.json({ success: true, message: "Flash sales already exist.", count });
    }

    const products = await Product.find().limit(6);
    if (!products.length) {
      return res.status(400).json({ success: false, message: "No products available to seed sales." });
    }

    const now = Date.now();
    const seeded = [];

    // Deal 1: Active sale ending in 24 hours (OnePlus / First Product)
    if (products[0]) {
      const p = products[0];
      const orig = p.price || 69999;
      const sale = Math.round(orig * 0.75); // 25% off
      seeded.push({
        productId: String(p._id),
        productRef: p._id,
        productName: p.name,
        productImage: p.image || "",
        originalPrice: orig,
        salePrice: sale,
        discountPercentage: 25,
        startTime: new Date(now - 3600000 * 2), // Started 2 hours ago
        endTime: new Date(now + 3600000 * 24), // Ends in 24 hours
        saleQuantity: 30,
        soldQuantity: 12,
        isActive: true
      });
    }

    // Deal 2: Active sale ending in 18 hours (Second Product)
    if (products[1]) {
      const p = products[1];
      const orig = p.price || 44990;
      const sale = Math.round(orig * 0.7); // 30% off
      seeded.push({
        productId: String(p._id),
        productRef: p._id,
        productName: p.name,
        productImage: p.image || "",
        originalPrice: orig,
        salePrice: sale,
        discountPercentage: 30,
        startTime: new Date(now - 3600000 * 4), // Started 4 hours ago
        endTime: new Date(now + 3600000 * 18), // Ends in 18 hours
        saleQuantity: 20,
        soldQuantity: 8,
        isActive: true
      });
    }

    // Deal 3: Active sale ending in 36 hours (Third Product)
    if (products[2]) {
      const p = products[2];
      const orig = p.price || 5099;
      const sale = Math.round(orig * 0.6); // 40% off
      seeded.push({
        productId: String(p._id),
        productRef: p._id,
        productName: p.name,
        productImage: p.image || "",
        originalPrice: orig,
        salePrice: sale,
        discountPercentage: 40,
        startTime: new Date(now - 3600000 * 1), // Started 1 hour ago
        endTime: new Date(now + 3600000 * 36), // Ends in 36 hours
        saleQuantity: 50,
        soldQuantity: 29,
        isActive: true
      });
    }

    // Deal 4: Upcoming sale starting in 3 hours (Fourth Product)
    if (products[3]) {
      const p = products[3];
      const orig = p.price || 1999;
      const sale = Math.round(orig * 0.65); // 35% off
      seeded.push({
        productId: String(p._id),
        productRef: p._id,
        productName: p.name,
        productImage: p.image || "",
        originalPrice: orig,
        salePrice: sale,
        discountPercentage: 35,
        startTime: new Date(now + 3600000 * 3), // Starts in 3 hours
        endTime: new Date(now + 3600000 * 27), // Ends 24 hours later
        saleQuantity: 40,
        soldQuantity: 0,
        isActive: true
      });
    }

    const created = await FlashSale.insertMany(seeded);
    res.json({
      success: true,
      message: `Successfully seeded ${created.length} flash sales.`,
      seededCount: created.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
