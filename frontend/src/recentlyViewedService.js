import axios from "axios";

const STORAGE_KEY = "techzone_recently_viewed";
const EVENT_NAME = "techzone_recently_viewed_updated";

/**
 * Get recently viewed products from localStorage
 */
export function getStoredRecentlyViewed() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

/**
 * Save recently viewed products to localStorage and emit change event
 */
export function setStoredRecentlyViewed(items) {
  try {
    const limited = Array.isArray(items) ? items.slice(0, 20) : [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: limited }));
  } catch (e) {}
}

/**
 * Clean product representation for history storage
 */
export function formatProductSnapshot(product) {
  if (!product) return null;
  const id = String(product._id || product.productId || product.id);
  const price = Number(product.price) || 0;
  const originalPrice = Number(product.originalPrice || product.price) || price;
  const discount = product.discount || (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);

  return {
    _id: id,
    productId: id,
    name: product.name || "Product",
    description: product.description || "",
    price,
    originalPrice,
    discount,
    category: product.category || "Electronics",
    image: product.image || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500",
    rating: Number(product.rating) || 4.5,
    reviews: Number(product.reviews) || 0,
    stock: product.stock !== undefined ? Number(product.stock) : 10,
    viewedAt: new Date().toISOString()
  };
}

/**
 * Record a product as recently viewed (moves to top, no duplicates, max 20 stored)
 */
export async function recordProductView(product, token) {
  if (!product) return;
  const snapshot = formatProductSnapshot(product);
  if (!snapshot || !snapshot._id) return;

  // 1. Update localStorage immediately (zero latency)
  const current = getStoredRecentlyViewed();
  const filtered = current.filter(
    (item) => String(item._id || item.productId) !== String(snapshot._id)
  );
  const updated = [snapshot, ...filtered].slice(0, 20);
  setStoredRecentlyViewed(updated);

  // 2. If user is logged in, sync to MongoDB
  if (token) {
    try {
      await axios.post(
        `http://localhost:5000/api/recently-viewed/${encodeURIComponent(snapshot._id)}`,
        { product: snapshot },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      // Graceful offline fallback: local storage already preserved
    }
  }
}

/**
 * Fetch remote history for logged in user and merge with local state
 */
export async function fetchRemoteHistory(token) {
  if (!token) return getStoredRecentlyViewed();
  try {
    const res = await axios.get("http://localhost:5000/api/recently-viewed", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.data?.success && Array.isArray(res.data.products)) {
      const remoteProducts = res.data.products;
      if (remoteProducts.length > 0) {
        setStoredRecentlyViewed(remoteProducts);
        return remoteProducts;
      }
    }
  } catch (err) {
    // If request fails, fall back to stored items
  }
  return getStoredRecentlyViewed();
}

/**
 * Merge guest history with user history on login
 */
export async function syncHistoryOnLogin(token) {
  if (!token) return;
  const guestItems = getStoredRecentlyViewed();
  try {
    const res = await axios.post(
      "http://localhost:5000/api/recently-viewed/sync/merge",
      { items: guestItems },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.data?.success && Array.isArray(res.data.products)) {
      setStoredRecentlyViewed(res.data.products);
      return res.data.products;
    }
  } catch (err) {
    // Keep local guest items if sync fails
  }
  return guestItems;
}

/**
 * Clear recently viewed history (both locally and on backend)
 */
export async function clearRecentlyViewed(token) {
  setStoredRecentlyViewed([]);

  if (token) {
    try {
      await axios.delete("http://localhost:5000/api/recently-viewed", {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {}
  }
}

/**
 * Subscribe to recently viewed updates
 */
export function subscribeToRecentlyViewed(callback) {
  const handler = (e) => {
    callback(e.detail || getStoredRecentlyViewed());
  };
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
