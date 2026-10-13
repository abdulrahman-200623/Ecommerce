import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  History,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertTriangle,
  X,
  Search,
  ArrowRight,
  Sparkles
} from "lucide-react";
import ProductCard from "./ProductCard";
import {
  getStoredRecentlyViewed,
  clearRecentlyViewed,
  fetchRemoteHistory,
  subscribeToRecentlyViewed
} from "./recentlyViewedService";

export default function RecentlyViewedSection({
  currentProductId = null,
  add,
  onOpen,
  checkIsWishlisted,
  onToggleWishlist,
  token = null,
  showToast,
  isHomePage = false,
  onNavigate
}) {
  const [historyItems, setHistoryItems] = useState(() => getStoredRecentlyViewed());
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showViewAllModal, setShowViewAllModal] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [isClearing, setIsClearing] = useState(false);
  const scrollContainerRef = useRef(null);

  // Subscribe to real-time storage/API updates
  useEffect(() => {
    const unsubscribe = subscribeToRecentlyViewed((updated) => {
      setHistoryItems(updated);
    });
    return () => unsubscribe();
  }, []);

  // Fetch remote history on mount if user is logged in
  useEffect(() => {
    if (token) {
      fetchRemoteHistory(token).then((items) => {
        if (Array.isArray(items)) setHistoryItems(items);
      });
    }
  }, [token]);

  // Filter items: On product details page, NEVER show the current product
  const displayedItems = useMemo(() => {
    if (!historyItems || !historyItems.length) return [];
    const normalizedCurrent = currentProductId ? String(currentProductId) : null;
    return historyItems
      .filter((p) => {
        if (!p) return false;
        const pid = String(p._id || p.productId || "");
        if (normalizedCurrent && pid === normalizedCurrent) return false;
        return true;
      })
      .slice(0, 10); // Display maximum of 10 unique products
  }, [historyItems, currentProductId]);

  // All items for "View All" modal, excluding current product if on detail page
  const allModalItems = useMemo(() => {
    if (!historyItems || !historyItems.length) return [];
    const normalizedCurrent = currentProductId ? String(currentProductId) : null;
    let list = historyItems.filter((p) => {
      if (!p) return false;
      const pid = String(p._id || p.productId || "");
      if (normalizedCurrent && pid === normalizedCurrent) return false;
      return true;
    });

    if (modalSearch.trim()) {
      const q = modalSearch.toLowerCase();
      list = list.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }
    return list;
  }, [historyItems, currentProductId, modalSearch]);

  const handleScroll = (direction) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.75;
    container.scrollBy({
      left: direction === "next" ? scrollAmount : -scrollAmount,
      behavior: "smooth"
    });
  };

  const handleConfirmClear = async () => {
    setIsClearing(true);
    try {
      await clearRecentlyViewed(token);
      setHistoryItems([]);
      setShowClearConfirm(false);
      setShowViewAllModal(false);
      if (showToast) {
        showToast(
          "History Cleared",
          "Your recently viewed products history has been cleared.",
          "wishlist-remove",
          "🗑️"
        );
      }
    } catch (e) {
      console.error("Error clearing history:", e);
    } finally {
      setIsClearing(false);
    }
  };

  const handleProductClick = (product) => {
    if (showViewAllModal) setShowViewAllModal(false);
    if (onOpen) onOpen(product);
  };

  return (
    <section className="techzone-recently-viewed-section" id="recently-viewed-section">
      {/* Section Header */}
      <div className="sectionHeaderWithNav">
        <div className="sectionTitleGroup">
          <div className="sectionBadge historyBadge">
            <History size={14} className="badgeIcon" />
            <span>Browsing History</span>
          </div>
          <h2>Recently Viewed Products</h2>
          <p>
            {displayedItems.length > 0
              ? `You've checked out these ${displayedItems.length} products recently`
              : "Keep track of items you look at across TechZone"}
          </p>
        </div>

        {/* Section Actions: Clear History & View All & Carousel Nav */}
        {displayedItems.length > 0 && (
          <div className="recentlyViewedActions">
            <button
              type="button"
              className="clearHistoryBtn"
              onClick={() => setShowClearConfirm(true)}
              title="Clear browsing history"
              aria-label="Clear browsing history"
              id="clear-recently-viewed-btn"
            >
              <Trash2 size={15} />
              <span>Clear History</span>
            </button>

            {historyItems.length > 4 && (
              <button
                type="button"
                className="viewAllHistoryBtn"
                onClick={() => setShowViewAllModal(true)}
                title="View complete browsing history"
                aria-label="View complete browsing history"
                id="view-all-recently-viewed-btn"
              >
                <span>View All ({historyItems.length})</span>
                <ExternalLink size={14} />
              </button>
            )}

            {displayedItems.length > 4 && (
              <div className="carouselNavButtons">
                <button
                  type="button"
                  className="carouselNavBtn"
                  onClick={() => handleScroll("prev")}
                  aria-label="Previous viewed products"
                  title="Previous"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  className="carouselNavBtn"
                  onClick={() => handleScroll("next")}
                  aria-label="Next viewed products"
                  title="Next"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content: Products Carousel or Friendly Empty State */}
      {displayedItems.length > 0 ? (
        <div className="recommendationsGrid carouselTrack" ref={scrollContainerRef}>
          {displayedItems.map((p) => {
            const pid = String(p._id || p.productId);
            const wishlisted = checkIsWishlisted ? checkIsWishlisted(pid) : false;
            return (
              <ProductCard
                key={`rv-${pid}`}
                p={p}
                add={add}
                onOpen={handleProductClick}
                isWishlisted={wishlisted}
                onToggleWishlist={onToggleWishlist}
                viewHint="Revisit product"
              />
            );
          })}
        </div>
      ) : (
        /* Friendly Empty State */
        <div className="recentlyViewedEmptyState" id="recently-viewed-empty">
          <div className="emptyStateIconCircle">
            <Eye size={36} color="#60a5fa" />
          </div>
          <h3>No Recently Viewed Products</h3>
          <p>
            {currentProductId
              ? "This is your first product in this browsing session. Products you check out will appear here."
              : "You haven't viewed any products yet. Browse through our catalog to explore trending electronics."}
          </p>
          <button
            type="button"
            className="primaryBtn emptyExploreBtn"
            onClick={() => (onNavigate ? onNavigate("/products") : window.location.assign("/products"))}
          >
            Explore Electronics <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Confirmation Dialog Modal for Clear History */}
      {showClearConfirm && (
        <div
          className="tzModalOverlay"
          onClick={() => setShowClearConfirm(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-clear-title"
        >
          <div className="tzModalDialog" onClick={(e) => e.stopPropagation()}>
            <div className="tzModalIconWrap warning">
              <AlertTriangle size={32} color="#f59e0b" />
            </div>
            <h3 id="confirm-clear-title">Clear Browsing History?</h3>
            <p>
              Are you sure you want to remove all {historyItems.length} recently viewed items from your
              history? This action cannot be undone.
            </p>
            <div className="tzModalBtnRow">
              <button
                type="button"
                className="tzModalCancelBtn"
                onClick={() => setShowClearConfirm(false)}
                disabled={isClearing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="tzModalDangerBtn"
                onClick={handleConfirmClear}
                disabled={isClearing}
                id="confirm-clear-history-submit-btn"
              >
                {isClearing ? "Clearing..." : "Yes, Clear History"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* "View All" Browsing History Modal */}
      {showViewAllModal && (
        <div
          className="tzModalOverlay"
          onClick={() => setShowViewAllModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="view-all-modal-title"
        >
          <div
            className="tzModalDialog viewAllModalDialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="viewAllModalHeader">
              <div>
                <h3 id="view-all-modal-title">Complete Browsing History</h3>
                <span className="viewAllCountBadge">
                  {allModalItems.length} {allModalItems.length === 1 ? "product" : "products"}
                </span>
              </div>
              <div className="viewAllHeaderActions">
                <button
                  type="button"
                  className="clearHistoryBtn small"
                  onClick={() => setShowClearConfirm(true)}
                  title="Clear all history"
                >
                  <Trash2 size={14} /> Clear
                </button>
                <button
                  type="button"
                  className="viewAllCloseBtn"
                  onClick={() => setShowViewAllModal(false)}
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Search inside history */}
            <div className="viewAllSearchWrap">
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search within your viewed products..."
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                autoFocus
              />
              {modalSearch && (
                <button
                  type="button"
                  className="searchClearBtn"
                  onClick={() => setModalSearch("")}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Grid of All Viewed Products */}
            <div className="viewAllGridContainer">
              {allModalItems.length > 0 ? (
                <div className="viewAllProductsGrid">
                  {allModalItems.map((p) => {
                    const pid = String(p._id || p.productId);
                    const wishlisted = checkIsWishlisted ? checkIsWishlisted(pid) : false;
                    return (
                      <ProductCard
                        key={`modal-rv-${pid}`}
                        p={p}
                        add={add}
                        onOpen={handleProductClick}
                        isWishlisted={wishlisted}
                        onToggleWishlist={onToggleWishlist}
                        viewHint="Click to view details"
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="viewAllEmptyFilter">
                  <p>No products match "{modalSearch}".</p>
                  <button
                    type="button"
                    className="primaryBtn small"
                    onClick={() => setModalSearch("")}
                  >
                    Clear Search Filter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
