const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true, default: 1 },
  image: { type: String }
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, default: "" },
      address: { type: String, required: true },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" }
    },
    items: [orderItemSchema],
    subtotal: { type: Number },
    discount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    shippingMethod: { type: String, default: "Standard Delivery" },
    couponCode: { type: String, default: "" },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled", "Returned"],
      default: "Pending"
    },
    paymentMethod: { type: String, default: "Cash on Delivery" },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending"
    },
    paymentDetails: {
      transactionId: { type: String, default: "" },
      gatewayOrderId: { type: String, default: "" },
      paymentSignature: { type: String, default: "" }
    },
    statusTimeline: [
      {
        status: { type: String },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: "" }
      }
    ],
    estimatedDeliveryDate: { type: Date },
    notes: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
