const mongoose = require("mongoose");

const flashSaleSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: [true, "Product ID is required"],
      index: true
    },
    productRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    },
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true
    },
    productImage: {
      type: String,
      default: ""
    },
    originalPrice: {
      type: Number,
      required: [true, "Original price is required"],
      min: [1, "Original price must be greater than zero"]
    },
    salePrice: {
      type: Number,
      required: [true, "Sale price is required"],
      min: [1, "Sale price must be greater than zero"]
    },
    discountPercentage: {
      type: Number,
      required: [true, "Discount percentage is required"],
      min: [1, "Discount percentage must be at least 1%"],
      max: [99, "Discount percentage cannot exceed 99%"]
    },
    startTime: {
      type: Date,
      required: [true, "Sale start time is required"]
    },
    endTime: {
      type: Date,
      required: [true, "Sale end time is required"]
    },
    saleQuantity: {
      type: Number,
      default: 0,
      min: [0, "Sale quantity cannot be negative"]
    },
    soldQuantity: {
      type: Number,
      default: 0,
      min: [0, "Sold quantity cannot be negative"]
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Dynamic status calculation method
flashSaleSchema.methods.calculateStatus = function (now = new Date()) {
  if (!this.isActive) return "Disabled";
  const start = new Date(this.startTime);
  const end = new Date(this.endTime);
  if (now < start) return "Scheduled";
  if (now > end) return "Expired";
  if (this.saleQuantity > 0 && this.soldQuantity >= this.saleQuantity) return "Sold Out";
  return "Active";
};

// Formatter to return complete deal snapshot
flashSaleSchema.methods.toDealSnapshot = function (productDoc = null, now = new Date()) {
  const status = this.calculateStatus(now);
  const prod = productDoc || {};

  return {
    _id: this._id,
    productId: this.productId,
    name: prod.name || this.productName,
    image: prod.image || this.productImage,
    description: prod.description || "",
    category: prod.category || "Electronics",
    rating: prod.rating ?? 4.5,
    reviews: prod.reviews ?? 0,
    stock: typeof prod.stock === "number" ? prod.stock : 10,
    originalPrice: this.originalPrice,
    salePrice: this.salePrice,
    discountPercentage: this.discountPercentage,
    startTime: this.startTime,
    endTime: this.endTime,
    saleQuantity: this.saleQuantity,
    soldQuantity: this.soldQuantity,
    isActive: this.isActive,
    status,
    serverTime: now
  };
};

module.exports = mongoose.model("FlashSale", flashSaleSchema);
