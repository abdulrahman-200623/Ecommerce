const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    originalPrice: Number,
    discount: Number,
    category: { type: String, required: true },
    image: String,
    images: { type: [String], default: [] },
    rating: { type: Number, default: 4.5 },
    reviews: { type: Number, default: 0 },
    stock: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Synchronize images array and primary image before saving
schema.pre("save", function (next) {
  if (Array.isArray(this.images) && this.images.length > 0) {
    this.images = this.images.map((img) => String(img).trim()).filter(Boolean);
    if (!this.image || !this.images.includes(this.image)) {
      this.image = this.images[0];
    }
  } else if (this.image) {
    this.images = [this.image.trim()];
  }
  next();
});

module.exports = mongoose.model("Product", schema);
