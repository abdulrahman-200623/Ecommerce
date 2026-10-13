import React, { useState, useEffect } from "react";
import { Zap, Clock, ShoppingCart, Heart, Star, ArrowRight, Flame, AlertCircle, RefreshCw } from "lucide-react";
import CountdownTimer from "./CountdownTimer";
import "./flashSale.css";

export default function FlashSalePage({
  onNavigate,
  add,
  checkIsWishlisted,
  onToggleWishlist,
  showToast
}) {
  const [activeTab, setActiveTab] = useState("active"); // "active" | "upcoming"
  const [activeDeals, setActiveDeals] = useState([]);
  const [upcomingDeals, setUpcomingDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFlashSales = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:5000/api/flash-sales/active");
      const data = await res.json();
      if (data?.success) {
        setActiveDeals(data.activeDeals || []);
        setUpcomingDeals(data.upcomingDeals || []);
      } else {
        setError(data?.message || "Failed to load flash deals.");
      }
    } catch (err) {
      setError("Unable to connect to flash sale service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlashSales();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const displayedDeals = activeTab === "active" ? activeDeals : upcomingDeals;
  const primaryDeal = activeDeals[0] || upcomingDeals[0];

  return (
    <main className="flash-sale-page" id="flash-sale-main-page">
      {/* Hero Banner */}
      <section className="flash-page-hero">
        <div className="flash-page-hero-left">
          <div className="flash-hero-badge">
            <Zap size={15} fill="#fca5a5" />
            <span>TECHZONE LIMITED DROP</span>
          </div>
          <h1>⚡ TechZone Mega Flash Sale</h1>
          <p>
            Exclusive discounts on premier smartphones, laptops, audio gear, and accessories.
            Prices revert once the timer reaches zero!
          </p>
        </div>

        {primaryDeal && (
          <div className="flash-page-hero-timer">
            <CountdownTimer
              startTime={primaryDeal.startTime}
              endTime={primaryDeal.endTime}
              onExpire={fetchFlashSales}
              size="large"
            />
          </div>
        )}
      </section>

      {/* Tabs */}
      <div className="flash-page-tabs">
        <button
          className={`flash-tab-btn ${activeTab === "active" ? "active" : ""}`}
          onClick={() => setActiveTab("active")}
          id="flash-tab-active-btn"
        >
          <Flame size={18} />
          <span>Active Deals</span>
          <span className="flash-tab-count">{activeDeals.length}</span>
        </button>

        <button
          className={`flash-tab-btn ${activeTab === "upcoming" ? "active" : ""}`}
          onClick={() => setActiveTab("upcoming")}
          id="flash-tab-upcoming-btn"
        >
          <Clock size={18} />
          <span>Upcoming Deals</span>
          <span className="flash-tab-count">{upcomingDeals.length}</span>
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
          <RefreshCw size={36} className="pulsing-zap" style={{ margin: "0 auto 16px" }} />
          <h3>Loading exclusive flash deals...</h3>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="flash-empty-state">
          <div className="flash-empty-icon" style={{ borderColor: "#ef4444", color: "#ef4444" }}>
            <AlertCircle size={36} />
          </div>
          <h3>Flash Deals Unavailable</h3>
          <p>{error}</p>
          <button className="btn-flash-submit" onClick={fetchFlashSales}>
            Retry Now
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && displayedDeals.length === 0 && (
        <div className="flash-empty-state">
          <div className="flash-empty-icon">
            <Zap size={36} />
          </div>
          <h3>
            {activeTab === "active"
              ? "No Active Flash Sales Right Now"
              : "No Upcoming Flash Sales Scheduled"}
          </h3>
          <p>
            {activeTab === "active"
              ? "All recent deals have ended or sold out. Check upcoming deals or browse our regular catalog for great prices!"
              : "Check back later for newly scheduled tech promotions."}
          </p>
          <button
            className="btn-flash-submit"
            onClick={() => onNavigate("/products")}
            id="flash-empty-browse-btn"
          >
            Explore All Products →
          </button>
        </div>
      )}

      {/* Deals Grid */}
      {!loading && !error && displayedDeals.length > 0 && (
        <div className="flash-deals-grid">
          {displayedDeals.map((deal) => {
            const isWishlisted = checkIsWishlisted ? checkIsWishlisted(deal.productId) : false;
            const quota = deal.saleQuantity || 0;
            const sold = deal.soldQuantity || 0;
            const soldPercent = quota > 0 ? Math.min(100, Math.round((sold / quota) * 100)) : 50;

            return (
              <article
                key={deal._id}
                className="flash-card"
                onClick={() => onNavigate("/products/" + encodeURIComponent(deal.productId))}
                id={`flash-page-card-${deal.productId}`}
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
                  <span>({deal.reviews || 0} reviews)</span>
                </div>

                <div className="flash-card-price-row">
                  <span className="flash-sale-price">₹{deal.salePrice.toLocaleString("en-IN")}</span>
                  <span className="flash-orig-price">₹{deal.originalPrice.toLocaleString("en-IN")}</span>
                  <span className="flash-discount-text">Save {deal.discountPercentage}%</span>
                </div>

                <div className="flash-quota-progress">
                  <div className="quota-labels">
                    <span>
                      <Flame size={12} color="#f59e0b" style={{ display: "inline", verticalAlign: "middle" }} />{" "}
                      {sold > 0 ? `${sold} Sold` : "Limited stock"}
                    </span>
                    <span>{quota > 0 ? `${soldPercent}% claimed` : "In Stock"}</span>
                  </div>
                  <div className="quota-bar-track">
                    <div className="quota-bar-fill" style={{ width: `${soldPercent}%` }} />
                  </div>
                </div>

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
                    id={`flash-page-add-cart-${deal.productId}`}
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
      )}
    </main>
  );
}
