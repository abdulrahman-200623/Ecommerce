import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { Sparkles, ChevronLeft, ChevronRight, ThumbsUp } from "lucide-react";
import ProductCard from "./ProductCard";

export default function RecommendedProducts({
  currentProduct,
  allProducts = [],
  add,
  onOpen,
  checkIsWishlisted,
  onToggleWishlist,
  title = "Recommended For You"
}) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef(null);

  const currentId = useMemo(() => {
    if (!currentProduct) return "";
    return String(currentProduct._id || currentProduct.productId || "");
  }, [currentProduct]);

  useEffect(() => {
    let isMounted = true;
    if (!currentId) {
      setRecommendations([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1. Fetch recommendations from API
    axios
      .get(`http://localhost:5000/api/products/${encodeURIComponent(currentId)}/recommendations?limit=8`)
      .then((res) => {
        if (!isMounted) return;
        if (Array.isArray(res.data) && res.data.length > 0) {
          // Double ensure current product is excluded and no duplicates
          const filtered = res.data.filter(
            (p) => String(p._id || p.productId) !== currentId
          );
          setRecommendations(filtered);
        } else {
          // Use client fallback
          fallbackRecommendations();
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        fallbackRecommendations();
        setLoading(false);
      });

    // Client recommendation engine fallback
    function fallbackRecommendations() {
      if (!allProducts || !allProducts.length) {
        setRecommendations([]);
        return;
      }

      const targetPrice = Number(currentProduct?.price) || 0;
      const targetCategory = currentProduct?.category || "";
      const minPrice = targetPrice * 0.6;
      const maxPrice = targetPrice * 1.5;

      const recMap = new Map();

      // Rule 1: Same category, similar price, excluding current
      const stage1 = allProducts.filter((p) => {
        const pid = String(p._id || p.productId);
        const price = Number(p.price) || 0;
        return (
          pid !== currentId &&
          p.category === targetCategory &&
          price >= minPrice &&
          price <= maxPrice
        );
      }).sort((a, b) => (b.rating || 0) - (a.rating || 0));

      for (const p of stage1) recMap.set(String(p._id || p.productId), p);

      // Rule 2: Same category, any price
      if (recMap.size < 8) {
        const stage2 = allProducts.filter((p) => {
          const pid = String(p._id || p.productId);
          return pid !== currentId && p.category === targetCategory && !recMap.has(pid);
        }).sort((a, b) => (b.rating || 0) - (a.rating || 0));

        for (const p of stage2) {
          recMap.set(String(p._id || p.productId), p);
          if (recMap.size >= 8) break;
        }
      }

      // Rule 3: Popular products with high ratings across catalogue
      if (recMap.size < 8) {
        const stage3 = allProducts.filter((p) => {
          const pid = String(p._id || p.productId);
          return pid !== currentId && !recMap.has(pid);
        }).sort((a, b) => (b.rating || 0) - (a.rating || 0));

        for (const p of stage3) {
          recMap.set(String(p._id || p.productId), p);
          if (recMap.size >= 8) break;
        }
      }

      setRecommendations(Array.from(recMap.values()).slice(0, 8));
    }

    return () => {
      isMounted = false;
    };
  }, [currentId, currentProduct?.category, currentProduct?.price, allProducts]);

  const handleScroll = (direction) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.75;
    container.scrollBy({
      left: direction === "next" ? scrollAmount : -scrollAmount,
      behavior: "smooth"
    });
  };

  if (!loading && (!recommendations || recommendations.length === 0)) {
    return null;
  }

  return (
    <section className="techzone-recommendations-section" id="recommended-products-section">
      <div className="sectionHeaderWithNav">
        <div className="sectionTitleGroup">
          <div className="sectionBadge">
            <Sparkles size={14} className="badgeIcon" />
            <span>AI Match & Similar Specs</span>
          </div>
          <h2>{title}</h2>
          <p>
            Curated picks from {currentProduct?.category || "electronics"} tailored to your browsing style
          </p>
        </div>

        {recommendations.length > 4 && (
          <div className="carouselNavButtons">
            <button
              type="button"
              className="carouselNavBtn"
              onClick={() => handleScroll("prev")}
              aria-label="Previous recommendations"
              title="Previous"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className="carouselNavBtn"
              onClick={() => handleScroll("next")}
              aria-label="Next recommendations"
              title="Next"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="recommendationsGrid carouselTrack">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card cardSkeleton">
              <div className="skeletonPic" />
              <div className="skeletonLine short" />
              <div className="skeletonLine long" />
              <div className="skeletonLine medium" />
            </div>
          ))}
        </div>
      ) : (
        <div className="recommendationsGrid carouselTrack" ref={scrollContainerRef}>
          {recommendations.map((p) => {
            const pid = String(p._id || p.productId);
            const wishlisted = checkIsWishlisted ? checkIsWishlisted(pid) : false;
            return (
              <ProductCard
                key={pid}
                p={p}
                add={add}
                onOpen={onOpen}
                isWishlisted={wishlisted}
                onToggleWishlist={onToggleWishlist}
                viewHint="View recommended product"
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
