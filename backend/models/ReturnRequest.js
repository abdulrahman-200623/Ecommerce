const mongoose = require("mongoose");

const returnItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  image: { type: String, default: "" },
  price: { type: Number, required: true },
  qty: { type: Number, required: true, min: 1 },
  originalOrderQty: { type: Number, default: 1 }
});

const returnRequestSchema = new mongoose.Schema(
  {
    returnNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true
    },
    orderNumber: {
      type: String,
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true
    },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, default: "" }
    },
    items: [returnItemSchema],
    totalRefundAmount: {
      type: Number,
      required: true,
      min: 0
    },
    reason: {
      type: String,
      required: [true, "Return reason is required"]
    },
    reasonDetails: {
      type: String,
      default: ""
    },
    photos: {
      type: [String],
      default: []
    },
    resolution: {
      type: String,
      enum: [
        "Refund to Original Payment Method",
        "Refund via UPI / Bank (COD)",
        "Replacement"
      ],
      required: [true, "Requested resolution is required"]
    },
    refundDetails: {
      method: { type: String, default: "" },
      upiId: { type: String, default: "" },
      bankAccount: { type: String, default: "" },
      bankIfsc: { type: String, default: "" },
      transactionReference: { type: String, default: "" },
      refundedAt: { type: Date }
    },
    replacementDetails: {
      replacementOrderId: { type: String, default: "" },
      trackingNumber: { type: String, default: "" },
      carrier: { type: String, default: "" },
      status: { type: String, default: "Processing" },
      shippedAt: { type: Date },
      deliveredAt: { type: Date }
    },
    pickupAddress: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" }
    },
    status: {
      type: String,
      enum: [
        "Requested",
        "Approved",
        "Pickup Scheduled",
        "Item Received",
        "Refund Processing",
        "Refund Completed",
        "Replacement Processing",
        "Replacement Shipped",
        "Replacement Delivered",
        "Rejected",
        "Cancelled"
      ],
      default: "Requested",
      index: true
    },
    rejectionReason: {
      type: String,
      default: ""
    },
    adminNotes: {
      type: String,
      default: ""
    },
    statusTimeline: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: "" }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Method to determine next expected step based on resolution & status
returnRequestSchema.methods.getNextExpectedStep = function () {
  switch (this.status) {
    case "Requested":
      return "TechZone Support is reviewing your return request (typically within 24 hours).";
    case "Approved":
      return "Return approved. Pickup will be scheduled at your delivery address.";
    case "Pickup Scheduled":
      return "Courier pickup agent will collect the item and inspect original packaging.";
    case "Item Received":
      return this.resolution === "Replacement"
        ? "Item received at warehouse. Replacement inspection in progress."
        : "Item received at warehouse. Quality check passed, queuing refund.";
    case "Refund Processing":
      return "Refund is being transmitted to your financial provider / UPI.";
    case "Refund Completed":
      return "Refund successfully credited. Transaction complete.";
    case "Replacement Processing":
      return "Your replacement unit is being prepared and packed.";
    case "Replacement Shipped":
      return "Replacement dispatched! Out for delivery to your address.";
    case "Replacement Delivered":
      return "Replacement unit successfully delivered.";
    case "Rejected":
      return `Request was not approved: ${this.rejectionReason || "Does not meet return policy criteria"}.`;
    case "Cancelled":
      return "Return request was cancelled by customer.";
    default:
      return "Under standard processing.";
  }
};

module.exports = mongoose.model("ReturnRequest", returnRequestSchema);
