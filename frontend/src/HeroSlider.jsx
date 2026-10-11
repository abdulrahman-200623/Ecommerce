import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Zap,
  Flame,
  Pause,
  Play
} from "lucide-react";
import "./heroSlider.css";

// Fallback high-quality electronics image presets
const FALLBACK_IMAGES = {
  mobiles: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
  laptops: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80",
  headphones: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
  smartwatches: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80"
};

export const HERO_SLIDES = [
  {
    id: "mobiles-slide",
    theme: "theme-blue",
    category: "Mobiles",
    badgeIcon: Zap,
    badgeText: "FLAGSHIP MOBILE SALE",
    titlePrefix: "Next-Gen Performance.",
    titleHighlight: "OnePlus 13 & Galaxy S24",
    description:
      "Experience lightning Snapdragon speed, cinema-grade AMOLED displays, and pro-grade 108MP camera systems.",
    offerBadge: "UP TO 20% OFF",
    offerDetail: "Starting at ₹49,999 · Free Express Delivery",
    primaryCtaText: "Explore Mobiles",
    primaryCtaLink: "/products?category=Mobiles",
    secondaryCtaText: "View Top Deals",
    secondaryCtaLink: "/products",
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=85",
    fallbackKey: "mobiles"
  },
  {
    id: "laptops-slide",
    theme: "theme-purple",
    category: "Laptops",
    badgeIcon: Flame,
    badgeText: "PRO COMPUTING & GAMING",
    titlePrefix: "Power Your Vision.",
    titleHighlight: "MacBook Pro & Intel Core i7",
    description:
      "Engineered for creators, developers, and power gamers with stunning Retina displays and RTX dedicated graphics.",
    offerBadge: "SAVE UP TO ₹15,000",
    offerDetail: "Use Coupon 'TECHZONE10' for extra 10% off",
    primaryCtaText: "Shop Laptops",
    primaryCtaLink: "/products?category=Laptops",
    secondaryCtaText: "Smart Features",
    secondaryCtaLink: "/features",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=85",
    fallbackKey: "laptops"
  },
  {
    id: "headphones-slide",
    theme: "theme-amber",
    category: "Headphones",
    badgeIcon: Sparkles,
    badgeText: "STUDIO AUDIO SERIES",
    titlePrefix: "Silence The World.",
    titleHighlight: "Sony WH-1000XM5 & AirPods",
    description:
      "Pure acoustic fidelity with industry-leading Active Noise Cancellation and up to 40-hour wireless listening.",
    offerBadge: "FLAT 25% OFF",
    offerDetail: "Free Delivery & 7-Day Hassle-Free Returns",
    primaryCtaText: "Discover Audio",
    primaryCtaLink: "/products?category=Headphones",
    secondaryCtaText: "Explore Earbuds",
    secondaryCtaLink: "/products?category=Earbuds",
    image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=85",
    fallbackKey: "headphones"
  },
  {
    id: "smartwatches-slide",
    theme: "theme-emerald",
    category: "Smartwatches",
    badgeIcon: Zap,
    badgeText: "INTELLIGENT WEARABLES",
    titlePrefix: "Track Every Beat.",
    titleHighlight: "Apple Watch & Galaxy Fit",
    description:
      "24/7 heart rate monitoring, precision GPS tracking, and seamless wireless connectivity on your wrist.",
    offerBadge: "DEALS FROM ₹1,999",
    offerDetail: "100% Genuine Tech · Warranty Backed",
    primaryCtaText: "Shop Smartwatches",
    primaryCtaLink: "/products?category=Smartwatches",
    secondaryCtaText: "All Accessories",
    secondaryCtaLink: "/products?category=Accessories",
    image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1200&q=85",
    fallbackKey: "smartwatches"
  }
];

const AUTOPLAY_INTERVAL_MS = 4500; // 4.5 seconds

const HeroSlider = memo(function HeroSlider({ onNavigate }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 });
  const [touchDeltaX, setTouchDeltaX] = useState(0);

  const totalSlides = HERO_SLIDES.length;
  const timerRef = useRef(null);

  // Next Slide Action
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  // Previous Slide Action
  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Jump directly to Slide
  const handleGoToSlide = useCallback((index) => {
    setCurrentIndex(index);
  }, []);

  // Autoplay setup with pause-on-hover & clean timer destruction
  useEffect(() => {
    if (isHovered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      handleNext();
    }, AUTOPLAY_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHovered, handleNext]);

  // Touch Swipe Gesture Handlers (Mobile & Tablet)
  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length > 0) {
      setTouchStartPos({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      });
      setTouchDeltaX(0);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches.length > 0) {
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = currentX - touchStartPos.x;
      const diffY = currentY - touchStartPos.y;

      // Only track if horizontal movement is dominant (avoids blocking vertical scrolling)
      if (Math.abs(diffX) > Math.abs(diffY)) {
        setTouchDeltaX(diffX);
      }
    }
  };

  const handleTouchEnd = () => {
    const minSwipeDistance = 45; // Threshold in pixels
    if (touchDeltaX < -minSwipeDistance) {
      // Swiped Left -> Next Slide
      handleNext();
    } else if (touchDeltaX > minSwipeDistance) {
      // Swiped Right -> Previous Slide
      handlePrev();
    }
    setTouchDeltaX(0);
  };

  // Safe navigation helper
  const navigateTo = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else if (window.location) {
      window.location.href = path;
    }
  };

  return (
    <section
      className="hero-slider-container"
      id="home-hero-slider"
      aria-label="Promotional Carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Autoplay Paused Status Indicator */}
      <div className="hero-pause-indicator" aria-live="polite">
        <Pause size={12} /> Autoplay Paused
      </div>

      {/* Slider Track */}
      <div
        className="hero-slider-track"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {HERO_SLIDES.map((slide, index) => {
          const BadgeIcon = slide.badgeIcon;
          const isActive = index === currentIndex;

          return (
            <article
              key={slide.id}
              className={`hero-slide ${slide.theme} ${isActive ? "active" : ""}`}
              aria-hidden={!isActive}
            >
              {/* Atmospheric Background Layer with Fallback Handling */}
              <img
                src={slide.image}
                alt=""
                className="hero-slide-bg"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = FALLBACK_IMAGES[slide.fallbackKey] || FALLBACK_IMAGES.mobiles;
                }}
              />
              <div className="hero-slide-ambient" />

              {/* Main Content Layout */}
              <div className="hero-slide-content-wrap">
                {/* Left: Text, Tag & CTAs */}
                <div className="hero-slide-text">
                  <div className="hero-slide-badge">
                    <BadgeIcon size={13} /> {slide.badgeText}
                  </div>

                  <h1 className="hero-slide-title">
                    {slide.titlePrefix}
                    <span>{slide.titleHighlight}</span>
                  </h1>

                  <p className="hero-slide-desc">{slide.description}</p>

                  <div className="hero-slide-offer">
                    <span className="hero-slide-offer-tag">{slide.offerBadge}</span>
                    <span>{slide.offerDetail}</span>
                  </div>

                  <div className="hero-slide-actions">
                    <button
                      type="button"
                      className="hero-btn-primary"
                      onClick={() => navigateTo(slide.primaryCtaLink)}
                      id={`hero-cta-primary-${index}`}
                    >
                      {slide.primaryCtaText} <ArrowRight size={17} />
                    </button>

                    <button
                      type="button"
                      className="hero-btn-secondary"
                      onClick={() => navigateTo(slide.secondaryCtaLink)}
                      id={`hero-cta-secondary-${index}`}
                    >
                      {slide.secondaryCtaText}
                    </button>
                  </div>
                </div>

                {/* Right: Focused Visual Card */}
                <div className="hero-slide-visual">
                  <div className="hero-slide-img-wrap">
                    <img
                      src={slide.image}
                      alt={slide.titleHighlight}
                      className="hero-slide-img"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = FALLBACK_IMAGES[slide.fallbackKey] || FALLBACK_IMAGES.mobiles;
                      }}
                    />
                    <div className="hero-floating-badge">
                      <Sparkles size={16} color="#38bdf8" />
                      <div>
                        <strong>{slide.offerBadge}</strong>
                        <div>{slide.category} Exclusive</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Navigation Arrow Controls */}
      <button
        type="button"
        className="hero-slider-nav-btn prev"
        onClick={handlePrev}
        aria-label="Previous promotional banner"
        title="Previous banner"
        id="hero-slider-prev-btn"
      >
        <ChevronLeft size={24} />
      </button>

      <button
        type="button"
        className="hero-slider-nav-btn next"
        onClick={handleNext}
        aria-label="Next promotional banner"
        title="Next banner"
        id="hero-slider-next-btn"
      >
        <ChevronRight size={24} />
      </button>

      {/* Clickable Pagination Dots */}
      <div
        className="hero-slider-pagination"
        role="tablist"
        aria-label="Slider Pagination"
      >
        {HERO_SLIDES.map((slide, index) => {
          const isActive = index === currentIndex;
          return (
            <button
              type="button"
              key={slide.id}
              className={`hero-dot-btn ${isActive ? "active" : ""}`}
              onClick={() => handleGoToSlide(index)}
              role="tab"
              aria-selected={isActive}
              aria-label={`Go to slide ${index + 1}: ${slide.category}`}
              id={`hero-slider-dot-${index}`}
            >
              <span className="hero-dot-indicator" />
            </button>
          );
        })}
      </div>
    </section>
  );
});

export default HeroSlider;
