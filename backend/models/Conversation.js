const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    customerId: {
      type: String,
      required: true,
      index: true
    },
    customerName: {
      type: String,
      default: "Customer"
    },
    customerEmail: {
      type: String,
      default: ""
    },
    isGuest: {
      type: Boolean,
      default: true
    },
    guestTokenHash: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["open", "pending", "resolved"],
      default: "open",
      index: true
    },
    unreadCountCustomer: {
      type: Number,
      default: 0
    },
    unreadCountAdmin: {
      type: Number,
      default: 0
    },
    lastMessage: {
      text: { type: String, default: "" },
      sender: { type: String, enum: ["customer", "admin", "system"], default: "system" },
      createdAt: { type: Date, default: Date.now }
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    orderNumber: {
      type: String,
      default: ""
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    metadata: {
      userAgent: { type: String, default: "" },
      currentPage: { type: String, default: "" },
      ipAddress: { type: String, default: "" }
    }
  },
  { timestamps: true }
);

// Compound indexes for optimal performance
conversationSchema.index({ customerId: 1, lastMessageAt: -1 });
conversationSchema.index({ status: 1, lastMessageAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);
