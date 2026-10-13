const ActivityLog = require("../models/ActivityLog");

/**
 * Record an administrative activity audit entry
 */
async function logActivity({
  action,
  description,
  performedBy = {},
  target = {},
  details = {},
  ipAddress = ""
}) {
  try {
    const entry = new ActivityLog({
      action,
      description,
      performedBy: {
        id: performedBy._id || performedBy.id || null,
        name: performedBy.name || "System Administrator",
        email: performedBy.email || "",
        role: performedBy.role || "superadmin"
      },
      target: {
        id: target.id || target._id ? String(target.id || target._id) : "",
        name: target.name || "",
        type: target.type || "Admin"
      },
      details,
      ipAddress: ipAddress || ""
    });
    await entry.save();
    return entry;
  } catch (err) {
    console.error("[ActivityLogger] Error logging action:", err.message);
    return null;
  }
}

module.exports = { logActivity };
