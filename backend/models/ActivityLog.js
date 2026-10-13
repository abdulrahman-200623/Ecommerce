const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    performedBy: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      name: { type: String, default: "System Administrator" },
      email: { type: String, default: "" },
      role: { type: String, default: "superadmin" }
    },
    target: {
      id: { type: String, default: "" },
      name: { type: String, default: "" },
      type: { type: String, default: "Admin" }
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ "performedBy.id": 1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
