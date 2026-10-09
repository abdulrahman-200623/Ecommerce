const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true, default: 1 },
  image: { type: String }
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: "" },
    address: { type: String, required: true },
    city: { type: String, default: "" },
    pincode: { type: String, default: "" }
  },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
    default: "Pending"
  },
  paymentMethod: { type: String, default: "Card / UPI" },
  paymentStatus: { type: String, default: "Paid" },
  notes: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
