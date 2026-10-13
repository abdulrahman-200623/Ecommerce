const mongoose = require("mongoose");

const recentlyViewedItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  },
  productSnapshot: {
    name: String,
    price: Number,
    originalPrice: Number,
    discount: Number,
    category: String,
    image: String,
    rating: Number,
    reviews: Number,
    stock: Number
  },
  viewedAt: {
    type: Date,
    default: Date.now
  }
});

const recentlyViewedSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    items: [recentlyViewedItemSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("RecentlyViewed", recentlyViewedSchema);
