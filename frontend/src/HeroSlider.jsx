import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Tag,
  Zap,
  Truck
} from "lucide-react";
import "./heroSlider.css";

// Authentic curated photography for electronics
const FALLBACK_IMAGES = {
  mobiles: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
  laptops: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
  headphones: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
  smartwatches: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80"
};

export const HERO_SLIDES = [
  {
    id: "mobiles-slide",
    category: "Mobiles",
    badgeText: "Official Flagship Launch",
    titlePrefix: "Next-Gen Performance.",
    titleHighlight: "OnePlus 13 & Galaxy S24",
    description:
      "Engineered with Snapdragon 8 Elite, ultra-bright 120Hz LTPO display, and pro Hasselblad triple lens system.",
    offerBadge: "SAVE 12%",
    offerDetail: "From ₹69,999 · Instant ₹5,000 Bank Rebate",
    primaryCtaText: "Shop Flagship Mobiles",
    primaryCtaLink: "/products?category=Mobiles",
    secondaryCtaText: "Compare Specs",
    secondaryCtaLink: "/products?category=Mobiles",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
    fallbackKey: "mobiles",
    warrantyTag: "2-Year Official Brand Warranty",
    startingPrice: "₹69,999"
  },
  {
    id: "laptops-slide",
    category: "Laptops",
    badgeText: "Pro Workstation Computing",
    titlePrefix: "Power Your Vision.",
    titleHighlight: "ASUS Vivobook 15 & MacBook",
    description:
      "Crafted for architects, software creators, and students. Intel Core i5 with ultra-fast 512GB PCIe NVMe SSD.",
    offerBadge: "FLAT ₹5,000 OFF",
    offerDetail: "Starting at ₹44,990 · Free Laptop Sleeve Included",
    primaryCtaText: "Explore Laptops",
    primaryCtaLink: "/products?category=Laptops",
    secondaryCtaText: "All Computing Deals",
    secondaryCtaLink: "/products?category=Laptops",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
    fallbackKey: "laptops",
    warrantyTag: "100% Genuine Intel Authorized",
    startingPrice: "₹44,990"
  },
  {
    id: "headphones-slide",
    category: "Headphones",
    badgeText: "Pure Studio Acoustic Fidelity",
    titlePrefix: "Silence The Noise.",
    titleHighlight: "JBL Tune 720BT & Sony Studio",
    description:
      "Wireless over-ear headphones with 40mm deep bass drivers, 76-hour battery life, and high-clarity voice calls.",
    offerBadge: "SAVE 15%",
    offerDetail: "Deal Price ₹5,099 · Express Same-Day Dispatch",
    primaryCtaText: "Discover Headphones",
    primaryCtaLink: "/products?category=Headphones",
    secondaryCtaText: "View Audio Series",
    secondaryCtaLink: "/products?category=Headphones",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    fallbackKey: "headphones",
    warrantyTag: "Official JBL 1-Year Guarantee",
    startingPrice: "₹5,099"
  },
  {
    id: "smartwatches-slide",
    category: "Smartwatches",
    badgeText: "Connected Wearable Tech",
    titlePrefix: "Track Every Move.",
    titleHighlight: "boAt Wave Call & Galaxy Fit",
    description:
      "Advanced 1.69\" HD curved display with Bluetooth calling, 24/7 heart-rate monitor, and 100+ active fitness modes.",
    offerBadge: "SAVE 20%",
    offerDetail: "Special Offer ₹1,999 · 7-Day Replacement Guarantee",
    primaryCtaText: "Shop Smartwatches",
    primaryCtaLink: "/products?category=Smartwatches",
    secondaryCtaText: "All Wearables",
    secondaryCtaLink: "/products?category=Smartwatches",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    fallbackKey: "smartwatches",
    warrantyTag: "Official boAt Authorized Retail",
    startingPrice: "₹1,999"
  }
];

const AUTOPLAY_INTERVAL_MS = 5000;
const TRANSITION_DURATION_MS = 700;

const HeroSlider = memo(function HeroSlider({ onNavigate }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(null);
  const [direction, setDirection] = useState("next");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(
    typeof document !== "undefined" ? !document.hidden : true
  );

  const totalSlides = HERO_SLIDES.length;
  const timerRef = useRef(null);
  const transitionTimerRef = useRef(null);

  // Preload all slide images on mount to eliminate blank frames or loading flickers
  useEffect(() => {
    HERO_SLIDES.forEach((slide) => {
      if (slide.image) {
        const img = new Image();
        img.src = slide.image;
      }
    });
  }, []);

  // Preload next upcoming slide image dynamically
  useEffect(() => {
    const nextIdx = (currentIndex + 1) % totalSlides;
    const nextSlide = HERO_SLIDES[nextIdx];
    if (nextSlide?.image) {
      const img = new Image();
      img.src = nextSlide.image;
    }
  }, [currentIndex, totalSlides]);

  // Tab visibility listener to pause/resume autoplay when user switches browser tabs
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Cleanup transition timer on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  // Central transition handler
  const goToSlide = useCallback((targetIndex, dir = "next") => {
    setCurrentIndex((current) => {
      if (targetIndex === current) return current;

      setPrevIndex(current);
      setDirection(dir);
      setIsTransitioning(true);

      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }

      transitionTimerRef.current = setTimeout(() => {
        setIsTransitioning(false);
        setPrevIndex(null);
      }, TRANSITION_DURATION_MS);

      return targetIndex;
    });
  }, []);

  const handleNext = useCallback(() => {
    goToSlide((currentIndex + 1) % totalSlides, "next");
  }, [currentIndex, totalSlides, goToSlide]);

  const handlePrev = useCallback(() => {
    goToSlide((currentIndex - 1 + totalSlides) % totalSlides, "prev");
  }, [currentIndex, totalSlides, goToSlide]);

  const handleGoToSlide = useCallback((index) => {
    if (index === currentIndex) return;
    const dir = index > currentIndex ? "next" : "prev";
    goToSlide(index, dir);
  }, [currentIndex, goToSlide]);

  // Autoplay effect - automatically resets whenever currentIndex, isHovered, or isTabVisible changes
  useEffect(() => {
    if (isHovered || !isTabVisible) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      goToSlide((currentIndex + 1) % totalSlides, "next");
    }, AUTOPLAY_INTERVAL_MS);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentIndex, isHovered, isTabVisible, totalSlides, goToSlide]);

  const navigateTo = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else if (window.location) {
      window.location.href = path;
    }
  };

  const activeSlide = HERO_SLIDES[currentIndex];
  const outgoingSlide = prevIndex !== null ? HERO_SLIDES[prevIndex] : null;

  // Render individual slide text pane
  const renderTextPane = (slide, stateClass, key) => (
    <div className={`hero-text-pane ${stateClass}`} key={key}>
      <div className="hero-badge-row">
        <span className="hero-category-badge">{slide.badgeText}</span>
        <span className="hero-warranty-badge">
          <ShieldCheck size={13} /> {slide.warrantyTag}
        </span>
      </div>

      <h1 className="hero-editorial-title">
        {slide.titlePrefix}{" "}
        <span className="hero-title-highlight">{slide.titleHighlight}</span>
      </h1>

      <p className="hero-editorial-desc">{slide.description}</p>

      {/* Compact Promotional Banner for Special Offers */}
      <div className="hero-compact-promo-bar">
        <div className="promo-tag-pill">
          <Tag size={12} /> {slide.offerBadge}
        </div>
        <div className="promo-text-wrap">
          <span>{slide.offerDetail}</span>
          <span className="promo-code-hint">
            Use code <strong>TECHZONE10</strong> for extra 10% off
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="hero-actions-row">
        <button
          type="button"
          className="hero-btn-primary"
          onClick={() => navigateTo(slide.primaryCtaLink)}
          id={`hero-cta-primary-${slide.id}`}
        >
          {slide.primaryCtaText} <ArrowRight size={16} />
        </button>

        <button
          type="button"
          className="hero-btn-secondary"
          onClick={() => navigateTo(slide.secondaryCtaLink)}
          id={`hero-cta-secondary-${slide.id}`}
        >
          {slide.secondaryCtaText}
        </button>
      </div>
    </div>
  );

  // Render individual slide visual pedestal
  const renderVisualPane = (slide, stateClass, key) => (
    <div className={`hero-slide-visual ${stateClass}`} key={key}>
      <img
        src={slide.image}
        alt={slide.titleHighlight}
        className="hero-featured-img"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = FALLBACK_IMAGES[slide.fallbackKey] || FALLBACK_IMAGES.mobiles;
        }}
      />
      <div className="hero-price-tag-card">
        <span className="tag-starting-label">Price starting from</span>
        <strong className="tag-price-value">{slide.startingPrice}</strong>
        <span className="tag-delivery-note">
          <Truck size={12} /> Free Express Delivery
        </span>
      </div>
    </div>
  );

  return (
    <section
      className="hero-editorial-section"
      id="home-hero-editorial"
      aria-label="Editorial Featured Electronics"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="hero-editorial-container">
        {/* Asymmetrical Layout Left / Main Feature Showcase */}
        <div className="hero-main-card">
          <div className="hero-main-inner">
            {/* Slide Content Column */}
            <div className="hero-content-col">
              <div className="hero-text-stage">
                {/* Active / Incoming Text */}
                {renderTextPane(
                  activeSlide,
                  isTransitioning
                    ? `incoming incoming-${direction}`
                    : "active",
                  `active-text-${activeSlide.id}`
                )}

                {/* Outgoing Text during Transition */}
                {isTransitioning && outgoingSlide && (
                  renderTextPane(
                    outgoingSlide,
                    `outgoing outgoing-${direction}`,
                    `outgoing-text-${outgoingSlide.id}`
                  )
                )}
              </div>

              {/* Slide Pagination & Arrows (Fixed navigation position, never shifts) */}
              <div className="hero-nav-controls">
                <div className="hero-dots-wrap">
                  {HERO_SLIDES.map((slide, idx) => (
                    <button
                      key={slide.id}
                      type="button"
                      className={`hero-dot ${idx === currentIndex ? "active" : ""}`}
                      onClick={() => handleGoToSlide(idx)}
                      aria-label={`Slide ${idx + 1}: ${slide.category}`}
                    />
                  ))}
                </div>

                <div className="hero-arrows-wrap">
                  <button
                    type="button"
                    className="hero-arrow-btn"
                    onClick={handlePrev}
                    aria-label="Previous featured banner"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    className="hero-arrow-btn"
                    onClick={handleNext}
                    aria-label="Next featured banner"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Slide Product Imagery Column */}
            <div className="hero-visual-col">
              <div className="hero-img-pedestal">
                {/* Active / Incoming Visual */}
                {renderVisualPane(
                  activeSlide,
                  isTransitioning
                    ? `incoming incoming-${direction}`
                    : "active",
                  `active-visual-${activeSlide.id}`
                )}

                {/* Outgoing Visual during Transition */}
                {isTransitioning && outgoingSlide && (
                  renderVisualPane(
                    outgoingSlide,
                    `outgoing outgoing-${direction}`,
                    `outgoing-visual-${outgoingSlide.id}`
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default HeroSlider;
