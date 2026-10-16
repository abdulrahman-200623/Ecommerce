/**
 * TechZone RBAC Permissions Definitions
 */
const ALL_PERMISSIONS = [
  {
    key: "dashboard",
    label: "Dashboard Access",
    category: "General",
    description: "Access regular admin dashboard overview, sales summaries & metrics"
  },
  {
    key: "products",
    label: "Product Management",
    category: "Catalog",
    description: "View and search catalog products, pricing, specifications & stock levels"
  },
  {
    key: "products_manage",
    label: "Add, Edit & Delete Products",
    category: "Catalog",
    description: "Create new products, edit details/pricing, adjust inventory & remove products"
  },
  {
    key: "categories",
    label: "Category Management",
    category: "Catalog",
    description: "Create new product categories, rename, reorganize and remove categories"
  },
  {
    key: "orders",
    label: "Order Management",
    category: "Sales",
    description: "Inspect customer orders, update order status (Processing, Shipped, Delivered) & cancel orders"
  },
  {
    key: "customers",
    label: "Customer Management",
    category: "Users",
    description: "View customer profiles, registration details, addresses & purchasing history"
  },
  {
    key: "returns",
    label: "Return & Refund Management",
    category: "Sales",
    description: "Review customer return requests, approve/reject refunds & configure return policy"
  },
  {
    key: "coupons",
    label: "Coupon & Flash Sale Management",
    category: "Marketing",
    description: "Create and manage promotional discount coupons and configure flash sale campaigns"
  },
  {
    key: "inventory",
    label: "Inventory Management",
    category: "Catalog",
    description: "Perform quick stock level adjustments, replenishment & stock alert monitoring"
  },
  {
    key: "reports",
    label: "Reports & Analytics",
    category: "Analytics",
    description: "Inspect revenue analytics, sales trends, top products and export CSV/JSON backups"
  },
  {
    key: "reviews",
    label: "Manage Customer Reviews",
    category: "Content",
    description: "Moderate customer product reviews, filter verified purchases & delete spam reviews"
  }
];

const ALL_PERMISSION_KEYS = ALL_PERMISSIONS.map((p) => p.key);

module.exports = {
  ALL_PERMISSIONS,
  ALL_PERMISSION_KEYS
};
