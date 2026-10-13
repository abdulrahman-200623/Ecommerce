import React from "react";
import { Heart, Star, Truck, ShoppingCart } from "lucide-react";

export default function ProductCard({
  p,
  add,
  onOpen,
  isWishlisted,
  onToggleWishlist,
  viewHint = "Click to view details"
}) {
  if (!p) return null;
  const pid = String(p._id || p.productId || p.id || Math.random());
  const wishlisted = !!isWishlisted;
  const ratingScore = p.rating ? Number(p.rating).toFixed(1) : "4.5";
  const reviewCount = p.reviews !== undefined ? p.reviews : 0;
  const price = Number(p.price) || 0;
  const originalPrice = Number(p.originalPrice || p.price) || price;
  const discount = p.discount || (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);
  const inStock = p.stock === undefined || p.stock > 0;

  const handleCardClick = (e) => {
    if (e.target.closest("button") || e.target.closest("a")) return;
    if (onOpen) onOpen(p);
  };

  return (
    <article
      className="card techzone-product-card"
      onClick={handleCardClick}
      id={`product-card-${pid}`}
      style={{ cursor: "pointer" }}
    >
      {discount > 0 && <span className="discount">{discount}% OFF</span>}
      <button
        type="button"
        className={`heart ${wishlisted ? "active" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          if (onToggleWishlist) onToggleWishlist(p);
        }}
        title={wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        aria-label={wishlisted ? `Remove ${p.name} from Wishlist` : `Add ${p.name} to Wishlist`}
        id={`heart-btn-${pid}`}
      >
        <Heart
          size={17}
          fill={wishlisted ? "#EF4444" : "none"}
          color={wishlisted ? "#EF4444" : "#9CA3AF"}
        />
      </button>
      
      <div className="pic">
        <img
          src={p.image || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500"}
          alt={p.name}
          loading="lazy"
        />
      </div>

      <div className="card-body">
        <div className="card-meta-row">
          <span className="card-category-label">{p.category || "Electronics"}</span>
          <div className="rating">
            <Star
              size={12}
              fill={reviewCount > 0 ? "#F59E0B" : "none"}
              color={reviewCount > 0 ? "#F59E0B" : "#D1D5DB"}
            />
            <span>{ratingScore}</span>
            <span className="rating-count">({reviewCount})</span>
          </div>
        </div>

        <h3 title={p.name}>{p.name}</h3>
        <p title={p.description}>{p.description || `${p.category || "Electronics"} from TechZone`}</p>

        <div className="price">
          <strong>₹{price.toLocaleString("en-IN")}</strong>
          {originalPrice > price && <del>₹{originalPrice.toLocaleString("en-IN")}</del>}
          {discount > 0 && <span className="price-save-badge">{discount}% off</span>}
        </div>

        <div className="delivery">
          <span className="delivery-text"><Truck size={13} /> Free Express Delivery</span>
          <span className={`stock-badge ${inStock ? "in-stock" : "out-of-stock"}`}>
            {inStock ? "In Stock" : "Out of Stock"}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="add"
        disabled={!inStock}
        onClick={(e) => {
          e.stopPropagation();
          if (add) add(p);
        }}
        id={`add-btn-${pid}`}
      >
        <ShoppingCart size={15} />
        <span>{inStock ? "Add to Cart" : "Out of Stock"}</span>
      </button>
      <div className="viewHint">{viewHint}</div>
    </article>
  );
}
