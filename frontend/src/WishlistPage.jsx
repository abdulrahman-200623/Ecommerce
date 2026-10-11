import React from "react";
import {
  Heart,
  ShoppingCart,
  Trash2,
  Star,
  Truck,
  ArrowRight,
  ShoppingBag,
  Sparkles
} from "lucide-react";

export default function WishlistPage({
  wishlist = [],
  onRemove,
  onAddToCart,
  onClearWishlist,
  onAddAllToCart,
  onOpenProduct,
  onNavigate
}) {
  const navigate = (path) => {
    if (typeof onNavigate === "function") {
      onNavigate(path);
    } else {
      window.history.pushState({}, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  const handleOpen = (item) => {
    const id = item.productId || item._id;
    if (typeof onOpenProduct === "function") {
      onOpenProduct(item);
    } else {
      navigate("/products/" + encodeURIComponent(id));
    }
  };

  return (
    <main className="page wishlistPage" id="wishlist-page">
      {/* Header */}
      <div className="wishlistHeader">
        <div>
          <h1>
            <Heart size={32} fill="#ef4444" color="#ef4444" />
            My Wishlist
          </h1>
          <p>
            {wishlist.length === 0
              ? "Save products you love to your personal wishlist"
              : `You have ${wishlist.length} item${wishlist.length > 1 ? "s" : ""} in your saved list`}
          </p>
        </div>
        <div className="wishlistHeaderActions">
          <button
            className="backBtn"
            style={{ margin: 0 }}
            onClick={() => navigate("/products")}
            id="continue-shopping-top-btn"
          >
            ← Continue Shopping
          </button>
          {wishlist.length > 0 && (
            <>
              <button
                className="primaryBtn"
                onClick={onAddAllToCart}
                id="add-all-to-cart-btn"
                title="Add all wishlist items into cart"
              >
                <ShoppingCart size={16} /> Add All to Cart
              </button>
              <button
                className="clearWishlistBtn"
                onClick={onClearWishlist}
                id="clear-wishlist-btn"
                title="Clear all items from wishlist"
              >
                <Trash2 size={16} /> Clear Wishlist
              </button>
            </>
          )}
        </div>
      </div>

      {/* Empty State */}
      {wishlist.length === 0 ? (
        <section className="emptyWishlist" aria-label="Empty wishlist message">
          <div className="emptyHeartCircle">
            <Heart size={44} color="#f43f5e" />
          </div>
          <h2>Your Wishlist is Empty</h2>
          <p>
            You haven't added any products to your wishlist yet.
            Browse our top collection of electronics, phones, headphones, and laptops,
            then tap the heart icon on any card to save it for later!
          </p>
          <button
            className="primaryBtn"
            onClick={() => navigate("/products")}
            id="explore-products-btn"
          >
            <ShoppingBag size={18} /> Continue Shopping <ArrowRight size={17} />
          </button>
        </section>
      ) : (
        /* Wishlist Items Grid */
        <section className="wishlistGrid" aria-label="Wishlist items">
          {wishlist.map((item) => {
            const id = item.productId || item._id;
            const originalPrice = item.originalPrice || item.price;
            const discount =
              item.discount ||
              (originalPrice > item.price
                ? Math.round(((originalPrice - item.price) / originalPrice) * 100)
                : 0);

            return (
              <article
                key={id}
                className="wishlistCard"
                onClick={() => handleOpen(item)}
                id={`wishlist-card-${id}`}
              >
                <div className="wishlistCardTop">
                  {discount > 0 ? (
                    <span className="discount">{discount}% OFF</span>
                  ) : (
                    <span className="wishlistCat">{item.category || "Electronics"}</span>
                  )}
                  <button
                    className="wishlistRemoveIconBtn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(id);
                    }}
                    title="Remove from wishlist"
                    aria-label={`Remove ${item.name} from wishlist`}
                    id={`remove-wishlist-icon-${id}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="pic">
                  <img
                    src={
                      item.image ||
                      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=700&q=80"
                    }
                    alt={item.name}
                    loading="lazy"
                  />
                </div>

                <div className="wishlistCardBody">
                  <div className="wishlistCat">{item.category || "Tech"}</div>
                  <div className="rating">
                    <Star size={13} fill="#f4a300" /> {item.rating || 4.5}{" "}
                    <span>({item.reviews || 0})</span>
                  </div>
                  <h3>{item.name}</h3>
                  <p>{item.description || "High quality electronics product with top performance."}</p>
                  <div className="price">
                    <strong>₹{Number(item.price).toLocaleString("en-IN")}</strong>
                    {originalPrice > item.price && (
                      <del>₹{Number(originalPrice).toLocaleString("en-IN")}</del>
                    )}
                    {discount > 0 && <b>{discount}% off</b>}
                  </div>
                  <div className="delivery">
                    <Truck size={14} /> Free Delivery <span>In Stock</span>
                  </div>
                </div>

                <div
                  className="wishlistCardActions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="add"
                    onClick={() => onAddToCart(item)}
                    id={`add-to-cart-${id}`}
                  >
                    <ShoppingCart size={16} /> Add to Cart
                  </button>
                  <button
                    className="wishlistSecondaryRemoveBtn"
                    onClick={() => onRemove(id)}
                    id={`remove-btn-${id}`}
                  >
                    Remove
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
