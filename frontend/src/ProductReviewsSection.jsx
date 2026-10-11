import React, { useState, useEffect, useCallback, useRef, memo } from "react";
import {
  Star,
  ThumbsUp,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  X,
  MessageSquare
} from "lucide-react";
import axios from "axios";
import StarRatingSelector from "./StarRatingSelector";
import "./reviews.css";

const API_BASE = "http://localhost:5000/api";

// Reusable Static Star Display (memoized for performance)
export const StaticStars = memo(function StaticStars({ rating = 0, size = 16 }) {
  const rounded = Math.round(Number(rating) || 0);
  return (
    <div className="review-stars-row" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((starVal) => {
        const isFilled = starVal <= rounded;
        return (
          <Star
            key={starVal}
            size={size}
            fill={isFilled ? "#f59e0b" : "none"}
            color={isFilled ? "#f59e0b" : "#475569"}
          />
        );
      })}
    </div>
  );
});

// Alias for backwards compatibility
export const StarRating = StaticStars;

// Helper date formatter
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  } catch (e) {
    return dateStr;
  }
};

// Helper name initials
const getInitials = (name) => {
  if (!name) return "TZ";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

// Memoized individual Review Card
const ReviewCard = memo(function ReviewCard({
  rev,
  isAuthor,
  onHelpfulVote,
  onEdit,
  onDelete
}) {
  return (
    <article
      className={`review-card ${isAuthor ? "is-own-review" : ""}`}
      id={`review-item-${rev._id}`}
    >
      <div className="review-card-top">
        <div className="review-user-info">
          <div className="review-user-avatar">
            {getInitials(rev.customerName)}
          </div>
          <div className="review-user-meta">
            <div className="review-user-name">
              <span>{rev.customerName}</span>
              {rev.isVerifiedPurchase && (
                <span className="verified-badge" title="Verified TechZone Buyer">
                  <CheckCircle2 size={12} /> Verified Purchase
                </span>
              )}
              {isAuthor && (
                <span className="own-review-badge">Your Review</span>
              )}
            </div>
            <span className="review-date">{formatDate(rev.createdAt)}</span>
          </div>
        </div>

        {/* Stars */}
        <StaticStars rating={rev.rating} size={15} />
      </div>

      <h4 className="review-title">{rev.title}</h4>
      <p className="review-comment">{rev.comment}</p>

      <div className="review-card-footer">
        {/* Helpful Button */}
        <button
          type="button"
          className={`btn-helpful ${rev.hasVotedHelpful ? "active" : ""}`}
          onClick={() => onHelpfulVote(rev._id)}
          title="Mark this review as helpful"
          id={`helpful-btn-${rev._id}`}
        >
          <ThumbsUp size={13} fill={rev.hasVotedHelpful ? "#10b981" : "none"} />
          <span>Helpful ({rev.helpfulVotes || 0})</span>
        </button>

        {/* Author / Admin Edit & Delete Actions */}
        {isAuthor && (
          <div className="review-actions-group">
            <button
              type="button"
              className="btn-action-edit"
              onClick={() => onEdit(rev)}
              title="Edit this review"
              id={`edit-review-${rev._id}`}
            >
              <Edit2 size={13} /> Edit
            </button>
            <button
              type="button"
              className="btn-action-delete"
              onClick={() => onDelete(rev._id)}
              title="Delete this review"
              id={`delete-review-${rev._id}`}
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        )}
      </div>
    </article>
  );
});

export default function ProductReviewsSection({
  productId,
  productName,
  userId,
  onRatingUpdate,
  showToast
}) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    recommendedPercentage: 0
  });

  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("recent");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // User review state (if already reviewed)
  const [userReview, setUserReview] = useState(null);

  // Form states (NOTE: hover state is strictly isolated inside StarRatingSelector)
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [formRating, setFormRating] = useState(5);

  // Prefill customer name if saved in localStorage
  const [customerName, setCustomerName] = useState(() => {
    return localStorage.getItem("techzone_customer_name") || "";
  });
  const [customerEmail, setCustomerEmail] = useState(() => {
    return localStorage.getItem("techzone_customer_email") || "";
  });
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Keep a stable ref for onRatingUpdate to prevent recreation of fetchReviews & re-render loops
  const onRatingUpdateRef = useRef(onRatingUpdate);
  useEffect(() => {
    onRatingUpdateRef.current = onRatingUpdate;
  }, [onRatingUpdate]);

  // Fetch reviews from backend (stable reference; won't re-trigger on rating hover or form input)
  const fetchReviews = useCallback(
    async (currentPage = 1, append = false) => {
      if (!productId) return;
      if (currentPage === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        let url = `${API_BASE}/reviews/product/${encodeURIComponent(productId)}?page=${currentPage}&limit=6&sort=${sort}&userId=${encodeURIComponent(userId || "")}`;
        if (ratingFilter !== "all") {
          url += `&rating=${ratingFilter}`;
        }

        const res = await axios.get(url);
        if (res.data?.success) {
          const fetchedReviews = res.data.reviews || [];
          if (append) {
            setReviews((prev) => [...prev, ...fetchedReviews]);
          } else {
            setReviews(fetchedReviews);
          }

          if (res.data.stats) {
            setStats(res.data.stats);
            // Notify parent without creating loop
            if (onRatingUpdateRef.current) {
              onRatingUpdateRef.current(res.data.stats);
            }
          }

          if (res.data.userReview) {
            setUserReview(res.data.userReview);
          } else {
            setUserReview(null);
          }

          setHasMore(!!res.data.pagination?.hasMore);
        }
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [productId, sort, ratingFilter, userId]
  );

  useEffect(() => {
    setPage(1);
    fetchReviews(1, false);
  }, [fetchReviews]);

  // Handle Load More
  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReviews(nextPage, true);
  }, [page, fetchReviews]);

  // Open Add Review Form
  const handleOpenAddForm = useCallback(() => {
    setIsEditing(false);
    setEditingReviewId(null);
    setFormRating(5);
    setReviewTitle("");
    setReviewComment("");
    setFormError("");
    setShowForm(true);
  }, []);

  // Open Edit Review Form
  const handleOpenEditForm = useCallback((rev) => {
    setIsEditing(true);
    setEditingReviewId(rev._id);
    setFormRating(rev.rating);
    setReviewTitle(rev.title);
    setReviewComment(rev.comment);
    setCustomerName(rev.customerName || "");
    setFormError("");
    setShowForm(true);
  }, []);

  // Close Form
  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setIsEditing(false);
    setEditingReviewId(null);
    setFormError("");
  }, []);

  // Handle Form Submission (Add or Update)
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!customerName.trim() || customerName.trim().length < 2) {
      setFormError("Please enter your name (at least 2 characters).");
      return;
    }

    if (!formRating || formRating < 1 || formRating > 5) {
      setFormError("Please choose a rating between 1 and 5 stars.");
      return;
    }

    if (!reviewTitle.trim() || reviewTitle.trim().length < 2) {
      setFormError("Please enter a review title (at least 2 characters).");
      return;
    }

    if (!reviewComment.trim() || reviewComment.trim().length < 5) {
      setFormError("Please write at least 5 characters in your review comment.");
      return;
    }

    setSubmitting(true);

    try {
      localStorage.setItem("techzone_customer_name", customerName.trim());
      if (customerEmail.trim()) {
        localStorage.setItem("techzone_customer_email", customerEmail.trim());
      }

      if (isEditing && editingReviewId) {
        // PUT update review
        const res = await axios.put(`${API_BASE}/reviews/${editingReviewId}`, {
          userId,
          rating: formRating,
          title: reviewTitle.trim(),
          comment: reviewComment.trim(),
          customerName: customerName.trim()
        });

        if (res.data?.success) {
          if (showToast) {
            showToast("Review Updated", "Your review has been updated successfully!", "review-success", "⭐");
          }
          handleCloseForm();
          fetchReviews(1, false);
        }
      } else {
        // POST new review
        const res = await axios.post(`${API_BASE}/reviews`, {
          productId,
          productName,
          userId,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          rating: formRating,
          title: reviewTitle.trim(),
          comment: reviewComment.trim()
        });

        if (res.data?.success) {
          if (showToast) {
            showToast("Review Submitted", "Thank you for reviewing this product!", "review-success", "🎉");
          }
          handleCloseForm();
          fetchReviews(1, false);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit review. Please try again.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Review
  const handleDeleteReview = useCallback(
    async (reviewId) => {
      if (!window.confirm("Are you sure you want to delete this review?")) return;

      try {
        const res = await axios.delete(
          `${API_BASE}/reviews/${reviewId}?userId=${encodeURIComponent(userId || "")}`
        );
        if (res.data?.success) {
          if (showToast) {
            showToast("Review Deleted", "Your review has been deleted.", "review-delete", "🗑️");
          }
          if (userReview && userReview._id === reviewId) {
            setUserReview(null);
          }
          fetchReviews(1, false);
        }
      } catch (err) {
        const msg = err.response?.data?.message || "Failed to delete review.";
        if (showToast) showToast("Error", msg, "review-error", "⚠️");
      }
    },
    [userId, userReview, showToast, fetchReviews]
  );

  // Handle Helpful Vote Toggle
  const handleHelpfulVote = useCallback(
    async (reviewId) => {
      try {
        const res = await axios.post(`${API_BASE}/reviews/${reviewId}/helpful`, {
          userId
        });

        if (res.data?.success) {
          setReviews((prev) =>
            prev.map((r) => {
              if (r._id === reviewId) {
                return {
                  ...r,
                  helpfulVotes: res.data.helpfulVotes,
                  hasVotedHelpful: res.data.isHelpful
                };
              }
              return r;
            })
          );
        }
      } catch (err) {
        console.error("Helpful vote error:", err);
      }
    },
    [userId]
  );

  return (
    <section className="reviews-section" id="reviews-section">
      {/* Section Header */}
      <div className="reviews-section-header">
        <div className="reviews-title-area">
          <span>Customer Feedback</span>
          <h2>
            Reviews & Ratings
            <span className="reviews-count-pill" id="total-reviews-count-pill">
              {stats.totalReviews} {stats.totalReviews === 1 ? "Review" : "Reviews"}
            </span>
          </h2>
        </div>

        {/* Action Button: Write or Edit */}
        <div>
          {userReview ? (
            <button
              className="btn-write-review"
              onClick={() => handleOpenEditForm(userReview)}
              id="edit-my-review-header-btn"
            >
              <Edit2 size={16} /> Edit My Review
            </button>
          ) : (
            <button
              className="btn-write-review"
              onClick={handleOpenAddForm}
              id="write-review-header-btn"
            >
              <Plus size={17} /> Write a Review
            </button>
          )}
        </div>
      </div>

      {/* Ratings Overview & 5-Star Breakdown Card */}
      <div className="ratings-summary-container">
        {/* Big Score Card */}
        <div className="rating-big-score">
          <div className="big-rating-number" id="average-rating-display">
            {stats.totalReviews > 0 ? stats.averageRating.toFixed(1) : "0.0"}
          </div>
          <div className="big-stars-row">
            <StaticStars rating={Math.round(stats.averageRating)} size={22} />
          </div>
          <div className="big-rating-label">
            {stats.totalReviews > 0
              ? `Based on ${stats.totalReviews} customer ${stats.totalReviews === 1 ? "review" : "reviews"}`
              : "No customer reviews yet"}
          </div>

          {stats.totalReviews > 0 && stats.recommendedPercentage > 0 && (
            <div className="big-recommend-badge">
              <CheckCircle2 size={14} />
              <span>{stats.recommendedPercentage}% would recommend</span>
            </div>
          )}
        </div>

        {/* 5-Star Breakdown Progress Bars */}
        <div className="rating-breakdown-list" aria-label="Rating breakdown">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.breakdown ? stats.breakdown[star] || 0 : 0;
            const percentage = stats.percentages ? stats.percentages[star] || 0 : 0;
            const isCurrentFilter = String(ratingFilter) === String(star);

            return (
              <div
                key={star}
                className={`breakdown-row ${isCurrentFilter ? "active-filter" : ""}`}
                onClick={() => setRatingFilter(isCurrentFilter ? "all" : star)}
                title={`Filter by ${star} star reviews`}
                role="button"
                tabIndex={0}
                id={`filter-star-row-${star}`}
              >
                <div className="breakdown-star-label">
                  <span>{star} Star</span>
                  <Star size={13} fill="#f59e0b" color="#f59e0b" />
                </div>
                <div className="breakdown-bar-track">
                  <div
                    className="breakdown-bar-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="breakdown-count">
                  {count} <span style={{ color: "#64748b" }}>({percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notice if user already submitted a review */}
      {userReview && !showForm && (
        <div className="user-already-reviewed-box">
          <div className="user-already-text">
            <CheckCircle2 size={18} color="#38bdf8" />
            <span>
              You reviewed this product on {formatDate(userReview.createdAt)} with{" "}
              <strong>{userReview.rating} Stars</strong>.
            </span>
          </div>
          <button
            className="btn-edit-own-review"
            onClick={() => handleOpenEditForm(userReview)}
            id="edit-existing-review-btn"
          >
            <Edit2 size={14} /> Update Your Review
          </button>
        </div>
      )}

      {/* Review Submission / Edit Form Modal / Card */}
      {showForm && (
        <div className="review-form-card" id="review-submission-form-container">
          <div className="review-form-header">
            <h3>
              {isEditing ? (
                <>
                  <Edit2 size={19} color="#38bdf8" /> Edit Your Product Review
                </>
              ) : (
                <>
                  <MessageSquare size={19} color="#10b981" /> Write a Customer Review
                </>
              )}
            </h3>
            <button
              type="button"
              className="review-form-close"
              onClick={handleCloseForm}
              aria-label="Close review form"
            >
              <X size={20} />
            </button>
          </div>

          {formError && (
            <div className="form-error-banner" role="alert">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitReview}>
            {/* Optimized Isolated Star Rating Selector */}
            <div className="rating-picker-wrapper">
              <label className="rating-picker-label">
                Your Overall Rating <span className="req">*</span>
              </label>
              <StarRatingSelector
                value={formRating}
                onChange={setFormRating}
                size={32}
                disabled={submitting}
              />
            </div>

            {/* Customer Details Grid */}
            <div className="review-form-grid">
              <div className="review-form-group">
                <label htmlFor="review-author-name">
                  Your Full Name <span className="req">*</span>
                </label>
                <input
                  id="review-author-name"
                  type="text"
                  placeholder="e.g. Alex Johnson"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  maxLength={80}
                  required
                />
              </div>

              <div className="review-form-group">
                <label htmlFor="review-author-email">
                  Email Address <span style={{ color: "#64748b" }}>(Used to verify purchase)</span>
                </label>
                <input
                  id="review-author-email"
                  type="email"
                  placeholder="e.g. alex@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  maxLength={100}
                />
              </div>
            </div>

            {/* Review Title */}
            <div className="review-form-group">
              <label htmlFor="review-title-input">
                Review Headline / Title <span className="req">*</span>
              </label>
              <input
                id="review-title-input"
                type="text"
                placeholder="Summarize your key experience in a headline..."
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                maxLength={120}
                required
              />
              <span className="review-form-charcount">{reviewTitle.length} / 120</span>
            </div>

            {/* Review Comment */}
            <div className="review-form-group">
              <label htmlFor="review-comment-input">
                Detailed Feedback <span className="req">*</span>
              </label>
              <textarea
                id="review-comment-input"
                placeholder="What did you like or dislike about this product? How is the build quality, performance, battery or audio?..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                maxLength={2000}
                rows={4}
                required
              />
              <span className="review-form-charcount">{reviewComment.length} / 2000</span>
            </div>

            {/* Actions */}
            <div className="review-form-actions">
              <button
                type="button"
                className="btn-cancel-review"
                onClick={handleCloseForm}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-submit-review"
                disabled={submitting}
                id="submit-review-form-btn"
              >
                {submitting ? (
                  "Submitting..."
                ) : isEditing ? (
                  <>
                    <Edit2 size={16} /> Update Review
                  </>
                ) : (
                  <>
                    <Plus size={16} /> Submit Review
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sorting & Rating Filters Controls Bar */}
      <div className="reviews-controls-bar">
        {/* Rating Filter Pills */}
        <div className="rating-filter-pills" role="tablist">
          <button
            type="button"
            className={`pill-btn ${ratingFilter === "all" ? "active" : ""}`}
            onClick={() => setRatingFilter("all")}
            id="filter-all-ratings-btn"
          >
            All Ratings ({stats.totalReviews})
          </button>
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              type="button"
              key={star}
              className={`pill-btn ${String(ratingFilter) === String(star) ? "active" : ""}`}
              onClick={() => setRatingFilter(String(ratingFilter) === String(star) ? "all" : star)}
              id={`filter-pill-${star}-star`}
            >
              {star} ★ ({stats.breakdown ? stats.breakdown[star] || 0 : 0})
            </button>
          ))}
        </div>

        {/* Sort Select */}
        <div className="reviews-sort-select">
          <label htmlFor="review-sort-dropdown">Sort by:</label>
          <select
            id="review-sort-dropdown"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="recent">Most Recent</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>
      </div>

      {/* Reviews List or Empty State */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
          Loading customer reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="reviews-empty-state" id="reviews-empty-state">
          <div className="reviews-empty-icon">
            <Star size={28} />
          </div>
          {ratingFilter !== "all" ? (
            <>
              <h3>No {ratingFilter}-star reviews found</h3>
              <p>There are currently no reviews with a {ratingFilter}-star rating for this product.</p>
              <button
                className="btn-cancel-review"
                onClick={() => setRatingFilter("all")}
              >
                Clear Rating Filter
              </button>
            </>
          ) : (
            <>
              <h3>No reviews yet for this product</h3>
              <p>
                Be the first customer to share your thoughts and help others make a confident decision!
              </p>
              {!showForm && (
                <button
                  className="btn-write-review"
                  onClick={handleOpenAddForm}
                  id="write-first-review-btn"
                >
                  <Plus size={16} /> Write the First Review
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="reviews-list">
          {reviews.map((rev) => {
            const isAuthor = rev.userId === userId || (userReview && userReview._id === rev._id);
            return (
              <ReviewCard
                key={rev._id}
                rev={rev}
                isAuthor={isAuthor}
                onHelpfulVote={handleHelpfulVote}
                onEdit={handleOpenEditForm}
                onDelete={handleDeleteReview}
              />
            );
          })}

          {/* Load More Button */}
          {hasMore && (
            <div className="reviews-load-more-wrap">
              <button
                type="button"
                className="btn-load-more"
                onClick={handleLoadMore}
                disabled={loadingMore}
                id="load-more-reviews-btn"
              >
                {loadingMore ? "Loading more reviews..." : "Load More Reviews"}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
