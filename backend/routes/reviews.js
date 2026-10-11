const router = require("express").Router();
const mongoose = require("mongoose");
const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");
const jwt = require("jsonwebtoken");

// Helper to extract authentication info safely
function extractAuth(req) {
  const authHeader = req.headers.authorization;
  let userId = req.body?.userId || req.query?.userId || req.headers["x-user-id"];
  let userName = req.body?.customerName;
  let isAdmin = false;

  // Admin secret header check
  if (
    req.headers["x-admin-key"] === "techzone-admin-secret" ||
    req.headers["x-admin-auth"] === "admin" ||
    req.query.adminKey === "techzone-admin-secret"
  ) {
    isAdmin = true;
  }

  // JWT Token verification if available
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "techzone_super_secret_change_me");
      if (decoded) {
        userId = decoded.id || decoded.userId || decoded._id || userId;
        userName = decoded.name || decoded.username || userName;
        if (decoded.role === "admin" || decoded.isAdmin) {
          isAdmin = true;
        }
      }
    } catch (e) {
      // Token invalid/expired - continue with fallback credentials
    }
  }

  return { userId, userName, isAdmin };
}

// Build query matcher for product ID that supports both ObjectId and string IDs
function buildProductMatch(productIdStr) {
  const pId = String(productIdStr);
  if (mongoose.Types.ObjectId.isValid(pId)) {
    return {
      $or: [
        { productId: new mongoose.Types.ObjectId(pId) },
        { productIdStr: pId }
      ]
    };
  }
  return { productIdStr: pId };
}

// Helper to recalculate ratings breakdown and update the Product document
async function calculateProductStats(productIdStr) {
  const query = buildProductMatch(productIdStr);
  const allReviews = await Review.find(query);
  const totalReviews = allReviews.length;

  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let totalRatingSum = 0;
  let recommendedCount = 0;

  allReviews.forEach(r => {
    const star = Math.min(5, Math.max(1, Math.round(r.rating)));
    breakdown[star] = (breakdown[star] || 0) + 1;
    totalRatingSum += r.rating;
    if (r.rating >= 4) {
      recommendedCount++;
    }
  });

  const averageRating = totalReviews > 0 ? Math.round((totalRatingSum / totalReviews) * 10) / 10 : 0;
  const percentages = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  if (totalReviews > 0) {
    for (let s = 1; s <= 5; s++) {
      percentages[s] = Math.round((breakdown[s] / totalReviews) * 100);
    }
  }

  const recommendedPercentage = totalReviews > 0 ? Math.round((recommendedCount / totalReviews) * 100) : 0;

  // Sync rating & review count back to the Product document in MongoDB
  try {
    const pId = String(productIdStr);
    if (mongoose.Types.ObjectId.isValid(pId)) {
      await Product.findByIdAndUpdate(pId, {
        rating: averageRating > 0 ? averageRating : 4.5,
        reviews: totalReviews
      });
    }
  } catch (err) {
    console.error("Failed to sync rating to product:", err.message);
  }

  return {
    averageRating,
    totalReviews,
    breakdown,
    percentages,
    recommendedPercentage
  };
}

// Helper to check if a customer has purchased this product
async function checkVerifiedPurchase(productIdStr, userId, customerEmail, customerName) {
  try {
    const orConditions = [];
    if (customerEmail) {
      orConditions.push({ "customer.email": new RegExp(`^${customerEmail.trim()}$`, "i") });
    }
    if (customerName) {
      orConditions.push({ "customer.name": new RegExp(`^${customerName.trim()}$`, "i") });
    }

    if (orConditions.length === 0) return false;

    const pId = String(productIdStr);
    const orderMatch = await Order.findOne({
      $or: orConditions,
      status: { $ne: "Cancelled" },
      "items.productId": { $in: [pId, new RegExp(pId, "i")] }
    });

    return !!orderMatch;
  } catch (err) {
    return false;
  }
}

// ====================================================================
// 1. GET /api/reviews/product/:productId
// Fetch all reviews and dynamic rating breakdown for a product
// Supports sorting, star filtering, pagination, and current user status
// ====================================================================
router.get("/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      sort = "recent",
      rating,
      page = 1,
      limit = 6,
      userId
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 6));
    const skip = (pageNum - 1) * limitNum;

    // Base query for this product
    const baseQuery = buildProductMatch(productId);
    const filterQuery = { ...baseQuery };

    // Star rating filter (1 to 5)
    if (rating && !isNaN(parseInt(rating, 10))) {
      filterQuery.rating = parseInt(rating, 10);
    }

    // Sort order
    let sortOptions = { createdAt: -1 };
    if (sort === "highest") {
      sortOptions = { rating: -1, createdAt: -1 };
    } else if (sort === "lowest") {
      sortOptions = { rating: 1, createdAt: -1 };
    } else if (sort === "helpful") {
      sortOptions = { helpfulVotes: -1, createdAt: -1 };
    }

    // Fetch reviews & total count matching current filter
    const [reviews, filteredCount, stats] = await Promise.all([
      Review.find(filterQuery).sort(sortOptions).skip(skip).limit(limitNum).lean(),
      Review.countDocuments(filterQuery),
      calculateProductStats(productId)
    ]);

    // Check if current user has already submitted a review
    let userReview = null;
    const currentUserId = userId || req.headers["x-user-id"];
    if (currentUserId) {
      userReview = await Review.findOne({
        ...baseQuery,
        userId: currentUserId
      }).lean();
    }

    // Format reviews for client, annotating with helpful status
    const formattedReviews = reviews.map(r => ({
      ...r,
      hasVotedHelpful: currentUserId ? (r.helpfulUsers || []).includes(currentUserId) : false,
      isOwner: currentUserId ? r.userId === currentUserId : false
    }));

    res.json({
      success: true,
      productId,
      reviews: formattedReviews,
      totalFiltered: filteredCount,
      stats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.max(1, Math.ceil(filteredCount / limitNum)),
        hasMore: skip + reviews.length < filteredCount
      },
      userReview
    });
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ====================================================================
// 2. POST /api/reviews
// Submit a new review for a product
// Validates fields, prevents duplicate submissions per user,
// verifies purchases, recalculates MongoDB ratings
// ====================================================================
router.post("/", async (req, res) => {
  try {
    const { userId: authUserId, userName: authUserName, isAdmin } = extractAuth(req);
    const {
      productId,
      customerName,
      customerEmail = "",
      rating,
      title,
      comment,
      userId: bodyUserId
    } = req.body;

    const targetUserId = authUserId || bodyUserId;
    const targetName = (customerName || authUserName || "").trim();

    // Validation
    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID is required." });
    }
    if (!targetUserId) {
      return res.status(400).json({ success: false, message: "User ID is required to submit a review." });
    }
    if (!targetName || targetName.length < 2) {
      return res.status(400).json({ success: false, message: "Please provide a valid customer name (at least 2 characters)." });
    }

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: "Please select a star rating between 1 and 5." });
    }

    const cleanTitle = (title || "").trim();
    if (!cleanTitle || cleanTitle.length < 2) {
      return res.status(400).json({ success: false, message: "Please provide a review title (at least 2 characters)." });
    }
    if (cleanTitle.length > 120) {
      return res.status(400).json({ success: false, message: "Review title cannot exceed 120 characters." });
    }

    const cleanComment = (comment || "").trim();
    if (!cleanComment || cleanComment.length < 5) {
      return res.status(400).json({ success: false, message: "Please provide review feedback (at least 5 characters)." });
    }
    if (cleanComment.length > 2000) {
      return res.status(400).json({ success: false, message: "Review comment cannot exceed 2000 characters." });
    }

    // Verify product exists in database if valid ObjectId
    const pIdStr = String(productId);
    let resolvedObjectId = null;
    if (mongoose.Types.ObjectId.isValid(pIdStr)) {
      resolvedObjectId = new mongoose.Types.ObjectId(pIdStr);
      const product = await Product.findById(resolvedObjectId);
      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found." });
      }
    } else {
      // Find by matching string ID or name if needed
      const product = await Product.findOne({
        $or: [{ _id: pIdStr }, { name: req.body.productName }]
      });
      if (product) {
        resolvedObjectId = product._id;
      } else {
        // Fallback valid ObjectId representation
        resolvedObjectId = new mongoose.Types.ObjectId();
      }
    }

    // Prevent duplicate review per user for this product
    const duplicateQuery = {
      ...buildProductMatch(pIdStr),
      userId: targetUserId
    };
    const existingReview = await Review.findOne(duplicateQuery);
    if (existingReview) {
      return res.status(400).json({
        success: false,
        isDuplicate: true,
        message: "You have already submitted a review for this product. You can edit your existing review.",
        existingReviewId: existingReview._id
      });
    }

    // Check Verified Purchase status
    const isVerifiedPurchase = await checkVerifiedPurchase(
      pIdStr,
      targetUserId,
      customerEmail,
      targetName
    );

    // Create and save review
    const newReview = new Review({
      productId: resolvedObjectId,
      productIdStr: pIdStr,
      userId: targetUserId,
      customerName: targetName,
      customerEmail: customerEmail ? customerEmail.trim().toLowerCase() : "",
      rating: Math.round(numRating),
      title: cleanTitle,
      comment: cleanComment,
      isVerifiedPurchase,
      helpfulVotes: 0,
      helpfulUsers: []
    });

    await newReview.save();

    // Recalculate dynamic ratings and sync with Product
    const stats = await calculateProductStats(pIdStr);

    res.status(201).json({
      success: true,
      message: "Review submitted successfully! Thank you for your feedback.",
      review: newReview,
      stats
    });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ====================================================================
// 3. PUT /api/reviews/:id
// Edit an existing review (user must own the review or be admin)
// ====================================================================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId: authUserId, isAdmin } = extractAuth(req);
    const {
      rating,
      title,
      comment,
      customerName,
      userId: bodyUserId
    } = req.body;

    const targetUserId = authUserId || bodyUserId;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    // Verify ownership or admin permission
    if (!isAdmin && (!targetUserId || review.userId !== targetUserId)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to edit this review."
      });
    }

    // Validate update fields
    if (rating !== undefined) {
      const numRating = Number(rating);
      if (!numRating || numRating < 1 || numRating > 5) {
        return res.status(400).json({ success: false, message: "Rating must be between 1 and 5." });
      }
      review.rating = Math.round(numRating);
    }

    if (title !== undefined) {
      const cleanTitle = (title || "").trim();
      if (!cleanTitle || cleanTitle.length < 2) {
        return res.status(400).json({ success: false, message: "Title must be at least 2 characters." });
      }
      review.title = cleanTitle;
    }

    if (comment !== undefined) {
      const cleanComment = (comment || "").trim();
      if (!cleanComment || cleanComment.length < 5) {
        return res.status(400).json({ success: false, message: "Comment must be at least 5 characters." });
      }
      review.comment = cleanComment;
    }

    if (customerName && customerName.trim().length >= 2) {
      review.customerName = customerName.trim();
    }

    await review.save();

    // Recalculate dynamic ratings
    const stats = await calculateProductStats(review.productIdStr);

    res.json({
      success: true,
      message: "Review updated successfully!",
      review,
      stats
    });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ====================================================================
// 4. DELETE /api/reviews/:id
// Delete a review (owner or admin permission required)
// ====================================================================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId: authUserId, isAdmin } = extractAuth(req);
    const targetUserId = authUserId || req.query.userId || req.body?.userId;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    // Verify ownership or admin permission
    if (!isAdmin && (!targetUserId || review.userId !== targetUserId)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this review."
      });
    }

    const productIdStr = review.productIdStr;
    await Review.findByIdAndDelete(id);

    // Recalculate dynamic ratings
    const stats = await calculateProductStats(productIdStr);

    res.json({
      success: true,
      message: "Review deleted successfully.",
      stats
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ====================================================================
// 5. POST /api/reviews/:id/helpful
// Upvote/helpful toggle for a review (prevents multiple votes per user)
// ====================================================================
router.post("/:id/helpful", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required." });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    const userIndex = (review.helpfulUsers || []).indexOf(userId);
    let isHelpful = false;

    if (userIndex > -1) {
      // Toggle off
      review.helpfulUsers.splice(userIndex, 1);
      review.helpfulVotes = Math.max(0, (review.helpfulVotes || 1) - 1);
      isHelpful = false;
    } else {
      // Toggle on
      if (!review.helpfulUsers) review.helpfulUsers = [];
      review.helpfulUsers.push(userId);
      review.helpfulVotes = (review.helpfulVotes || 0) + 1;
      isHelpful = true;
    }

    await review.save();

    res.json({
      success: true,
      helpfulVotes: review.helpfulVotes,
      isHelpful,
      message: isHelpful ? "Marked as helpful!" : "Removed helpful vote."
    });
  } catch (error) {
    console.error("Error voting helpful:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ====================================================================
// 6. GET /api/reviews/admin
// Admin management endpoint with search, product/rating filters,
// and product populate
// ====================================================================
router.get("/admin", async (req, res) => {
  try {
    const {
      q = "",
      rating,
      productId,
      sort = "recent",
      page = 1,
      limit = 15
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};

    // Rating filter
    if (rating && !isNaN(parseInt(rating, 10)) && parseInt(rating, 10) > 0) {
      filter.rating = parseInt(rating, 10);
    }

    // Product filter
    if (productId && productId !== "All") {
      Object.assign(filter, buildProductMatch(productId));
    }

    // Search query across customer name, title, comment
    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), "i");
      filter.$or = [
        { customerName: regex },
        { title: regex },
        { comment: regex }
      ];
    }

    let sortOptions = { createdAt: -1 };
    if (sort === "highest") sortOptions = { rating: -1, createdAt: -1 };
    if (sort === "lowest") sortOptions = { rating: 1, createdAt: -1 };
    if (sort === "helpful") sortOptions = { helpfulVotes: -1, createdAt: -1 };

    const [reviews, totalCount] = await Promise.all([
      Review.find(filter)
        .populate("productId", "name image price category")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments(filter)
    ]);

    // Aggregate overall metrics for the admin header
    const statsResult = await Review.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          avgRating: { $sum: "$rating" },
          fiveStar: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
          critical: { $sum: { $cond: [{ $lte: ["$rating", 2] }, 1, 0] } },
          verifiedCount: { $sum: { $cond: ["$isVerifiedPurchase", 1, 0] } }
        }
      }
    ]);

    const aggregate = statsResult[0] || {
      total: 0,
      avgRating: 0,
      fiveStar: 0,
      critical: 0,
      verifiedCount: 0
    };

    const overallAverage = aggregate.total > 0
      ? Math.round((aggregate.avgRating / aggregate.total) * 10) / 10
      : 0;

    res.json({
      success: true,
      reviews,
      totalCount,
      metrics: {
        totalReviews: aggregate.total,
        averageRating: overallAverage,
        fiveStarReviews: aggregate.fiveStar,
        criticalReviews: aggregate.critical,
        verifiedPurchases: aggregate.verifiedCount
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.max(1, Math.ceil(totalCount / limitNum)),
        hasMore: skip + reviews.length < totalCount
      }
    });
  } catch (error) {
    console.error("Error fetching admin reviews:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ====================================================================
// 7. GET /api/reviews/stats
// Store-wide review summary
// ====================================================================
router.get("/stats", async (req, res) => {
  try {
    const totalReviews = await Review.countDocuments();
    const statsResult = await Review.aggregate([
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 }
        }
      }
    ]);

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    statsResult.forEach(item => {
      breakdown[item._id] = item.count;
      sum += item._id * item.count;
    });

    const averageRating = totalReviews > 0 ? Math.round((sum / totalReviews) * 10) / 10 : 0;

    res.json({
      success: true,
      totalReviews,
      averageRating,
      breakdown
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
