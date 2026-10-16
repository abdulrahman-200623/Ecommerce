const mongoose = require("mongoose");

const returnConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "default_policy",
      unique: true
    },
    returnWindowDays: {
      type: Number,
      default: 7,
      min: [1, "Return window must be at least 1 day"],
      max: [90, "Return window cannot exceed 90 days"]
    },
    allowReplacement: {
      type: Boolean,
      default: true
    },
    allowPartialReturns: {
      type: Boolean,
      default: true
    },
    requirePhotos: {
      type: Boolean,
      default: false
    },
    supportedReasons: {
      type: [String],
      default: [
        "Product damaged",
        "Defective or not working",
        "Wrong product delivered",
        "Missing parts or accessories",
        "Product does not match the description",
        "Received a different item than ordered",
        "Other reason"
      ]
    },
    codRefundMethod: {
      type: String,
      default: "UPI / Bank Transfer"
    },
    policyDescription: {
      type: String,
      default: "Items can be returned within 7 days of delivery. Product must be in original condition with box, accessories, and tags intact."
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ReturnConfig", returnConfigSchema);
