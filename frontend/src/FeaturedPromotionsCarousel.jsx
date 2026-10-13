import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Zap,
  ShieldCheck,
  Sparkles,
  Tag,
  CheckCircle2,
  Clock
} from "lucide-react";
import "./featuredPromotions.css";

export const PROMOTIONAL_CAROUSEL_ITEMS = [
  {
    id: "deal-jbl-tune-720bt",
    badgeType: "deal",
    badgeLabel: "Limited Stock Deal",
    badgeIcon: Zap,
    category: "Audio Series",
    name: "JBL Tune 720BT Studio",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
    description: "Wireless Over-Ear with Pure Bass sound, 76-hour battery life, and high-clarity voice calls.",
    price: 3059,
    originalPrice: 5099,
    discount: "40% OFF",
    highlightTag: "Only 4 Left in Stock",
    ctaText: "Claim Deal",
    ctaLink: "/flash-sale"
  },
  {
    id: "pick-asus-vivobook-15",
    badgeType: "creator",
    badgeLabel: "Certified Creator Pick",
    badgeIcon: ShieldCheck,
    category: "Computing",
    name: "ASUS Vivobook 15 Core i5",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80",
    description: "Intel 12th Gen Core i5, 8GB RAM, 512GB PCIe NVMe SSD with FHD Anti-Glare wide-view display.",
    price: 44990,
    originalPrice: 49990,
    discount: "10% OFF",
    highlightTag: "Intel Authorized Retail",
    ctaText: "Shop Laptops",
    ctaLink: "/products?category=Laptops"
  },
  {
    id: "pick-oneplus-13-pro",
    badgeType: "flagship",
    badgeLabel: "Editor's Choice",
    badgeIcon: Sparkles,
    category: "Flagship Mobiles",
    name: "OnePlus 13 Ultra 5G",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80",
    description: "Snapdragon 8 Elite, ultra-bright 120Hz LTPO display, and Hasselblad triple 50MP camera system.",
    price: 69999,
    originalPrice: 79999,
    discount: "12% OFF",
    highlightTag: "Instant ₹5,000 Bank Rebate",
    ctaText: "Explore Mobiles",
    ctaLink: "/products?category=Mobiles"
  },
  {
    id: "pick-airpods-pro-2",
    badgeType: "audio",
    badgeLabel: "Top Acoustic Fidelity",
    badgeIcon: Tag,
    category: "Premium Audio",
    name: "Apple AirPods Pro (2nd Gen)",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80",
    description: "Active Noise Cancellation, Adaptive Audio, Personalized Spatial Audio with USB-C MagSafe case.",
    price: 24999,
    originalPrice: 30500,
    discount: "18% OFF",
    highlightTag: "Free Same-Day Dispatch",
    ctaText: "View Audio",
    ctaLink: "/products?category=Earbuds"
  }
];

const FeaturedPromotionsCarousel = memo(function FeaturedPromotionsCarousel({ onNavigate }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);
  const touchStartXRef = useRef(null);
  const touchEndXRef = useRef(null);
  const carouselTrackRef = useRef(null);

  // Responsive items-per-view calculator
  const updateVisibleCount = useCallback(() => {
    if (typeof window === "undefined") return;
    const width = window.innerWidth;
    if (width <= 680) {
      setVisibleCount(1);
    } else if (width <= 1100) {
      setVisibleCount(2);
    } else {
      setVisibleCount(3);
    }
  }, []);

  useEffect(() => {
    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, [updateVisibleCount]);

  const maxIndex = Math.max(0, PROMOTIONAL_CAROUSEL_ITEMS.length - visibleCount);

  // Clamp current index if screen resizes
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [maxIndex, currentIndex]);

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  const handleDotClick = (idx) => {
    setCurrentIndex(Math.min(maxIndex, idx));
  };

  const navigateTo = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else if (typeof window !== "undefined") {
      window.location.href = path;
    }
  };

  // Touch Swipe Handlers for mobile
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const diff = touchStartXRef.current - touchEndXRef.current;
    const swipeThreshold = 50;

    if (diff > swipeThreshold) {
      handleNext();
    } else if (diff < -swipeThreshold) {
      handlePrev();
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  // Calculate sliding translation
  // Each card is (100% / visibleCount)
  const slidePercent = (100 / visibleCount) * currentIndex;

  const totalPositions = maxIndex + 1;

  return (
    <section
      className="featured-promotions-section"
      id="featured-promotions-carousel"
      aria-label="Exclusive Deals and Featured Picks"
    >
      <div className="promotions-section-header">
        <div className="promotions-header-left">
          <span className="promotions-kicker">Curated Highlights</span>
          <h2 className="promotions-heading">Exclusive Deals & Featured Picks</h2>
          <p className="promotions-subheading">
            Discover handpicked products and limited-time offers.
          </p>
        </div>

        {/* Carousel Navigation Arrows */}
        <div className="promotions-nav-controls">
          <button
            type="button"
            className="promo-nav-btn btn-prev"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            aria-label="Previous promotional deals"
            id="promo-carousel-prev-btn"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            className="promo-nav-btn btn-next"
            onClick={handleNext}
            disabled={currentIndex >= maxIndex}
            aria-label="Next promotional deals"
            id="promo-carousel-next-btn"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Carousel Viewport Container */}
      <div
        className="promotions-carousel-viewport"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={carouselTrackRef}
          className="promotions-carousel-track"
          style={{ transform: `translateX(-${slidePercent}%)` }}
        >
          {PROMOTIONAL_CAROUSEL_ITEMS.map((item, idx) => {
            const BadgeIcon = item.badgeIcon;
            return (
              <div
                key={item.id}
                className="promotions-card-slot"
                style={{ flex: `0 0 ${100 / visibleCount}%` }}
              >
                <article
                  className={`promo-feature-card card-theme-${item.badgeType}`}
                  onClick={() => navigateTo(item.ctaLink)}
                  id={`promo-card-${item.id}`}
                >
                  {/* Top Badge & Highlight Bar */}
                  <div className="promo-card-top-bar">
                    <span className={`promo-badge-tag tag-${item.badgeType}`}>
                      <BadgeIcon size={13} />
                      <span>{item.badgeLabel}</span>
                    </span>

                    <span className="promo-discount-tag">{item.discount}</span>
                  </div>

                  {/* Product Imagery */}
                  <div className="promo-card-media">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="promo-product-image"
                      loading="lazy"
                    />
                  </div>

                  {/* Product Details Content */}
                  <div className="promo-card-content">
                    <span className="promo-card-category">{item.category}</span>
                    <h3 className="promo-card-title">{item.name}</h3>
                    <p className="promo-card-desc">{item.description}</p>

                    {/* Pricing */}
                    <div className="promo-pricing-row">
                      <div className="promo-price-group">
                        <strong className="promo-current-price">
                          ₹{item.price.toLocaleString("en-IN")}
                        </strong>
                        <del className="promo-original-price">
                          ₹{item.originalPrice.toLocaleString("en-IN")}
                        </del>
                      </div>
                      <span className="promo-highlight-tag">
                        <CheckCircle2 size={12} /> {item.highlightTag}
                      </span>
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      className="promo-action-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateTo(item.ctaLink);
                      }}
                      id={`promo-cta-btn-${idx}`}
                    >
                      <span>{item.ctaText}</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination Dots */}
      {totalPositions > 1 && (
        <div className="promotions-pagination-dots" role="tablist" aria-label="Promotions carousel slides">
          {Array.from({ length: totalPositions }).map((_, dotIdx) => (
            <button
              key={`promo-dot-${dotIdx}`}
              type="button"
              className={`promo-pagination-dot ${dotIdx === currentIndex ? "active" : ""}`}
              onClick={() => handleDotClick(dotIdx)}
              aria-label={`Go to carousel view ${dotIdx + 1}`}
              id={`promo-carousel-dot-${dotIdx}`}
            />
          ))}
        </div>
      )}
    </section>
  );
});

export default FeaturedPromotionsCarousel;
