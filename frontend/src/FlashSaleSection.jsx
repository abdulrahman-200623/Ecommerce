import React, { useState, useEffect, useRef } from "react";
import { Zap, ChevronLeft, ChevronRight, ShoppingCart, Heart, Star, ArrowRight, Flame } from "lucide-react";
import CountdownTimer from "./CountdownTimer";
import "./flashSale.css";

export default function FlashSaleSection({
  onNavigate,
  add,
  checkIsWishlisted,
  onToggleWishlist
}) {
  const [deals, setDeals] = useState([]);
  const [upcomingDeals, setUpcomingDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const trackRef = useRef(null);

  const fetchDeals = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/flash-sales/active");
      const data = await res.json();
      if (data?.success) {
        setDeals(data.activeDeals || []);
        setUpcomingDeals(data.upcomingDeals || []);
      }
    } catch (err) {
      console.warn("Flash sales fetch notice:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
    // Refresh every 60s to sync statuses
    const interval = setInterval(fetchDeals, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleScroll = (direction) => {
    if (!trackRef.current) return;
    const scrollAmount = 300;
    if (direction === "left") {
      trackRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    } else {
      trackRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // If loading and no deals, or if absolutely no active or upcoming deals exist, don't break page
  if (loading && !deals.length && !upcomingDeals.length) {
    return null;
  }

  // Active deals take priority; if none active, display upcoming deals with upcoming timer
  const displayDeals = deals.length > 0 ? deals : upcomingDeals;
  if (!displayDeals.length) return null;

  const isUpcoming = deals.length === 0 && upcomingDeals.length > 0;
  // Earliest end time for active sales, or earliest start time for upcoming sales
  const primaryDeal = displayDeals[0];

  return (
    <section className="flash-sale-section" id="flash-sale-home-section">
      <div className="flash-sale-header">
        <div className="flash-sale-title-group">
          <div className="flash-badge-pill">
            <Zap size={14} fill="#fff" />
            <span>{isUpcoming ? "Upcoming Drop" : "Limited Time"}</span>
          </div>
          <div className="flash-sale-heading">
            <h2>
              {isUpcoming ? "⚡ Upcoming Flash Sale" : "⚡ Flash Sale Deals"}
            </h2>
            <p>
              {isUpcoming
                ? "Get ready! Huge discounts unlocking soon."
                : "Top tech at clearance prices. Grab yours before the timer expires!"}
            </p>
          </div>
        </div>

        {/* Live Countdown Timer */}
        {primaryDeal && (
          <CountdownTimer
            startTime={primaryDeal.startTime}
            endTime={primaryDeal.endTime}
            onExpire={fetchDeals}
            size="large"
          />
        )}

        <div className="flash-header-actions">
          <button
            className="view-all-deals-btn"
            onClick={() => onNavigate("/flash-sale")}
            id="home-view-all-flash-deals-btn"
          >
            <span>View All Deals</span>
            <ArrowRight size={16} />
          </button>

          {/* Carousel Arrows */}
          <div className="carousel-nav-btns">
            <button
              className="carousel-nav-btn"
              onClick={() => handleScroll("left")}
              aria-label="Scroll left"
              id="flash-carousel-prev-btn"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className="carousel-nav-btn"
              onClick={() => handleScroll("right")}
              aria-label="Scroll right"
              id="flash-carousel-next-btn"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Carousel Track */}
      <div className="flash-carousel-container">
        <div className="flash-carousel-track" ref={trackRef}>
          {displayDeals.map((deal) => {
            const isWishlisted = checkIsWishlisted ? checkIsWishlisted(deal.productId) : false;
            const quota = deal.saleQuantity || 0;
            const sold = deal.soldQuantity || 0;
            const soldPercent = quota > 0 ? Math.min(100, Math.round((sold / quota) * 100)) : 45;

            return (
              <article
                key={deal._id}
                className="flash-card"
                onClick={() => onNavigate("/products/" + encodeURIComponent(deal.productId))}
                id={`flash-card-${deal.productId}`}
              >
                <div className="flash-card-top-badges">
                  <span className="flash-discount-badge">
                    <Zap size={12} fill="#fff" />
                    {deal.discountPercentage}% OFF
                  </span>
                  <button
                    type="button"
                    className={`flash-wishlist-btn ${isWishlisted ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleWishlist) onToggleWishlist(deal);
                    }}
                    title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                    aria-label={`Wishlist ${deal.name}`}
                  >
                    <Heart size={16} fill={isWishlisted ? "#ef4444" : "none"} color={isWishlisted ? "#ef4444" : "currentColor"} />
                  </button>
                </div>

                <div className="flash-card-img-wrap">
                  <img src={deal.image} alt={deal.name} loading="lazy" />
                </div>

                <div className="flash-card-timer">
                  <CountdownTimer
                    startTime={deal.startTime}
                    endTime={deal.endTime}
                    size="card"
                  />
                </div>

                <h3 className="flash-card-title" title={deal.name}>{deal.name}</h3>

                <div className="flash-card-rating">
                  <Star size={13} fill="#f59e0b" color="#f59e0b" />
                  <span>{deal.rating ? Number(deal.rating).toFixed(1) : "4.5"}</span>
                  <span>({deal.reviews || 0})</span>
                </div>

                <div className="flash-card-price-row">
                  <span className="flash-sale-price">₹{deal.salePrice.toLocaleString("en-IN")}</span>
                  <span className="flash-orig-price">₹{deal.originalPrice.toLocaleString("en-IN")}</span>
                  <span className="flash-discount-text">Save {deal.discountPercentage}%</span>
                </div>

                {/* Quota Progress Bar */}
                <div className="flash-quota-progress">
                  <div className="quota-labels">
                    <span><Flame size={12} color="#f59e0b" style={{ display: "inline", verticalAlign: "middle" }} /> {sold > 0 ? `${sold} Sold` : "Limited stock"}</span>
                    <span>{quota > 0 ? `${soldPercent}% claimed` : "In Stock"}</span>
                  </div>
                  <div className="quota-bar-track">
                    <div className="quota-bar-fill" style={{ width: `${soldPercent}%` }} />
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flash-card-actions">
                  <button
                    type="button"
                    className="btn-flash-cart"
                    onClick={(e) => {
                      e.stopPropagation();
                      add({
                        ...deal,
                        _id: deal.productId,
                        price: deal.salePrice,
                        originalPrice: deal.originalPrice
                      });
                    }}
                    id={`flash-add-btn-${deal.productId}`}
                  >
                    <ShoppingCart size={14} />
                    <span>Add to Cart</span>
                  </button>

                  <button
                    type="button"
                    className="btn-flash-view"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate("/products/" + encodeURIComponent(deal.productId));
                    }}
                  >
                    View Deal
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
