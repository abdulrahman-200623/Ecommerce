const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      index: true
    },
    sender: {
      type: String,
      required: true,
      enum: ["customer", "admin", "system"],
      index: true
    },
    senderName: {
      type: String,
      default: "Customer"
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    isRead: {
      type: Boolean,
      default: false
    },
    messageType: {
      type: String,
      enum: ["text", "quick_reply", "order_info", "system"],
      default: "text"
    },
    orderData: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    quickReplyKey: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

// Indexes for conversation history retrieval
messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ conversationId: 1, isRead: 1 });

module.exports = mongoose.model("Message", messageSchema);
