const mongoose = require("mongoose");

const supportConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "default_config",
      unique: true
    },
    isOnline: {
      type: Boolean,
      default: true
    },
    statusMessage: {
      type: String,
      default: "Support team is active and ready to assist you!"
    },
    offlineNotice: {
      type: String,
      default: "Our support agents are currently away. Leave a message and we'll respond as soon as we're back online!"
    },
    businessHours: {
      type: String,
      default: "Monday - Sunday: 9:00 AM - 9:00 PM IST"
    },
    welcomeMessage: {
      type: String,
      default: "Welcome to TechZone Support! 👋 How can we help you today with your electronics order or product query?"
    },
    autoReplyQuickReplies: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupportConfig", supportConfigSchema);
