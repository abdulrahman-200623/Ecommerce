import React, { useState, useEffect, useMemo } from "react";
import { ZoomIn, X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

export default function ProductGallery({ product, title }) {
  const images = useMemo(() => {
    if (Array.isArray(product?.images) && product.images.length > 0) {
      const valid = product.images.filter((img) => img && typeof img === "string" && img.trim() !== "");
      if (valid.length > 0) return valid;
    }
    if (product?.image && typeof product.image === "string" && product.image.trim() !== "") {
      return [product.image.trim()];
    }
    return ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80"];
  }, [product?.images, product?.image]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isHoverZooming, setIsHoverZooming] = useState(false);
  const [zoomCoords, setZoomCoords] = useState({ x: 50, y: 50 });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Reset active image whenever product changes
  useEffect(() => {
    setActiveIndex(0);
    setIsHoverZooming(false);
  }, [product?._id, product?.productId]);

  // Safe active image URL
  const currentImage = images[activeIndex] || images[0];

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomCoords({ x, y });
  };

  const handlePrev = (e) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsLightboxOpen(false);
      else if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, images.length]);

  return (
    <div className="tz-gallery-container" id="product-gallery">
      {/* Main Image Display Stage */}
      <div
        className={`tz-gallery-main-stage ${isHoverZooming ? "is-zooming" : ""}`}
        onMouseEnter={() => setIsHoverZooming(true)}
        onMouseLeave={() => setIsHoverZooming(false)}
        onMouseMove={handleMouseMove}
        onClick={() => setIsLightboxOpen(true)}
        title="Hover to zoom, click to expand view"
        id="product-gallery-main-stage"
      >
        <img
          key={currentImage}
          src={currentImage}
          alt={`${title || product?.name || "Product"} - View ${activeIndex + 1}`}
          className="tz-gallery-main-img"
          style={
            isHoverZooming
              ? {
                  transformOrigin: `${zoomCoords.x}% ${zoomCoords.y}%`,
                  transform: "scale(2.2)"
                }
              : { transform: "scale(1)" }
          }
          loading="eager"
        />

        {/* Counter Badge */}
        <div className="tz-gallery-top-bar">
          <span className="tz-gallery-counter-pill">
            {activeIndex + 1} / {images.length}
          </span>
          <button
            type="button"
            className="tz-gallery-zoom-trigger"
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(true);
            }}
            title="Click to view full high-res image"
            aria-label="Enlarge image"
            id="gallery-zoom-button"
          >
            <ZoomIn size={15} />
            <span>Hover / Click to Zoom</span>
          </button>
        </div>

        {/* Navigation arrows if multiple images */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              className="tz-gallery-nav-arrow arrow-left"
              onClick={handlePrev}
              aria-label="Previous image"
              title="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className="tz-gallery-nav-arrow arrow-right"
              onClick={handleNext}
              aria-label="Next image"
              title="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Row */}
      {images.length > 1 && (
        <div className="tz-gallery-thumbnails" role="tablist" aria-label="Product image thumbnails">
          {images.map((imgUrl, idx) => {
            const isActive = activeIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`tz-gallery-thumb ${isActive ? "active" : ""}`}
                onClick={() => setActiveIndex(idx)}
                title={`View angle ${idx + 1}`}
                id={`gallery-thumb-${idx}`}
              >
                <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} loading="lazy" />
                <span className="tz-thumb-badge">{idx + 1}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="tz-lightbox-overlay"
          onClick={() => setIsLightboxOpen(false)}
          id="gallery-lightbox-modal"
        >
          <div className="tz-lightbox-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tz-lightbox-header">
              <div className="tz-lightbox-title">
                <strong>{title || product?.name}</strong>
                <span>Photo {activeIndex + 1} of {images.length}</span>
              </div>
              <button
                type="button"
                className="tz-lightbox-close"
                onClick={() => setIsLightboxOpen(false)}
                aria-label="Close modal"
              >
                <X size={22} />
              </button>
            </div>

            <div className="tz-lightbox-stage">
              <img
                src={currentImage}
                alt={`${title || product?.name} - Enlarge view ${activeIndex + 1}`}
                className="tz-lightbox-img"
              />
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    className="tz-lightbox-arrow arrow-prev"
                    onClick={handlePrev}
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={28} />
                  </button>
                  <button
                    type="button"
                    className="tz-lightbox-arrow arrow-next"
                    onClick={handleNext}
                    aria-label="Next image"
                  >
                    <ChevronRight size={28} />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="tz-lightbox-thumbs">
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`tz-lightbox-thumb ${activeIndex === idx ? "active" : ""}`}
                    onClick={() => setActiveIndex(idx)}
                  >
                    <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
