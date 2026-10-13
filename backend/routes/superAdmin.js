const router = require("express").Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const ActivityLog = require("../models/ActivityLog");
const { superAdminMiddleware, JWT_SECRET } = require("../middleware/auth");
const { ALL_PERMISSIONS, ALL_PERMISSION_KEYS } = require("../config/permissions");
const { logActivity } = require("../services/activityLogger");

// ==========================================
// RATE LIMITING FOR SUPER ADMIN LOGIN
// ==========================================
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME_MS = 15 * 60 * 1000; // 15 mins

function checkRateLimit(identifier) {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record) return { allowed: true };

  if (now - record.firstAttempt > LOCKOUT_TIME_MS) {
    loginAttempts.delete(identifier);
    return { allowed: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const remainingMins = Math.ceil((LOCKOUT_TIME_MS - (now - record.firstAttempt)) / 60000);
    return {
      allowed: false,
      message: `Too many failed Super Admin login attempts. Account temporarily locked for ${remainingMins} minute(s).`
    };
  }

  return { allowed: true };
}

function recordFailedAttempt(identifier) {
  const now = Date.now();
  const record = loginAttempts.get(identifier) || { count: 0, firstAttempt: now };
  record.count += 1;
  loginAttempts.set(identifier, record);
}

function clearAttempts(identifier) {
  loginAttempts.delete(identifier);
}

// ==========================================
// 1. SUPER ADMIN LOGIN: POST /api/superadmin/login
// ==========================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const clientIp = req.ip || req.headers["x-forwarded-for"] || "client";
    const rateKey = `superadmin_${clientIp}_${String(email || "").trim().toLowerCase()}`;

    // Rate limiting guard
    const rateCheck = checkRateLimit(rateKey);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: rateCheck.message
      });
    }

    if (!email || !password || !String(email).trim() || !String(password).trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide both Super Administrator email and password."
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const inputPassword = String(password);

    // Look for user in MongoDB
    let superAdmin = await User.findOne({ email: cleanEmail }).select("+password");

    // Fallback: If not found, check if credentials match configured environment variables
    const envEmail = (process.env.SUPERADMIN_EMAIL || "superadmin@techzone.com").trim().toLowerCase();
    const envPassword = process.env.SUPERADMIN_PASSWORD || "SuperAdmin@TechZone2026!";

    if (!superAdmin && cleanEmail === envEmail) {
      const { bootstrapSuperAdmin } = require("../config/bootstrap");
      await bootstrapSuperAdmin();
      superAdmin = await User.findOne({ email: cleanEmail }).select("+password");
    }

    if (!superAdmin) {
      recordFailedAttempt(rateKey);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials. Super Administrator access not found."
      });
    }

    // Role check: Strictly superadmin only!
    if (superAdmin.role !== "superadmin") {
      recordFailedAttempt(rateKey);
      return res.status(403).json({
        success: false,
        message: "Access Denied. This account is not authorized as a Super Administrator. Standard administrators should log in via the /admin portal."
      });
    }

    // Active status check
    if (superAdmin.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "This Super Administrator account is currently inactive."
      });
    }

    // Compare bcrypt password
    const isMatch = await superAdmin.comparePassword(inputPassword);
    if (!isMatch) {
      recordFailedAttempt(rateKey);
      return res.status(401).json({
        success: false,
        message: "Invalid Super Administrator credentials. Please check your password."
      });
    }

    // Clear rate limiter upon success
    clearAttempts(rateKey);

    // Update last login
    superAdmin.lastLogin = new Date();
    await superAdmin.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        id: superAdmin._id,
        userId: superAdmin._id,
        email: superAdmin.email,
        name: superAdmin.name,
        role: "superadmin",
        isSuperAdmin: true,
        permissions: ALL_PERMISSION_KEYS
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Set secure HTTP-only cookie
    res.cookie("superadmin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000 // 24h
    });

    // Record activity log
    await logActivity({
      action: "LOGIN_SUPERADMIN",
      description: `Super Admin signed in: ${superAdmin.email}`,
      performedBy: superAdmin,
      target: { id: superAdmin._id, name: superAdmin.name, type: "SuperAdmin" },
      ipAddress: clientIp
    });

    return res.json({
      success: true,
      message: "Super Administrator authenticated successfully.",
      token,
      user: superAdmin.toSafeObject()
    });
  } catch (err) {
    console.error("Super Admin login error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error during Super Administrator authentication."
    });
  }
});

// ==========================================
// 2. VERIFY SESSION: GET /api/superadmin/verify
// ==========================================
router.get("/verify", superAdminMiddleware, async (req, res) => {
  try {
    return res.json({
      success: true,
      user: req.user.toSafeObject ? req.user.toSafeObject() : req.user
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error verifying Super Administrator session."
    });
  }
});

router.get("/me", superAdminMiddleware, async (req, res) => {
  try {
    return res.json({
      success: true,
      user: req.user.toSafeObject ? req.user.toSafeObject() : req.user
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error verifying Super Administrator session."
    });
  }
});

// ==========================================
// 3. LOGOUT: POST /api/superadmin/logout
// ==========================================
router.post("/logout", (req, res) => {
  res.clearCookie("superadmin_token", { httpOnly: true, sameSite: "lax" });
  return res.json({
    success: true,
    message: "Super Administrator signed out successfully."
  });
});

// ==========================================
// 4. STATS: GET /api/superadmin/stats
// ==========================================
router.get("/stats", superAdminMiddleware, async (req, res) => {
  try {
    const [
      totalAdmins,
      activeAdmins,
      inactiveAdmins,
      totalProducts,
      totalOrders,
      totalCustomers,
      recentActivities
    ] = await Promise.all([
      User.countDocuments({ role: { $in: ["admin", "superadmin"] } }),
      User.countDocuments({ role: "admin", isActive: true }),
      User.countDocuments({ role: "admin", isActive: false }),
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments({ role: "customer" }),
      ActivityLog.find().sort({ createdAt: -1 }).limit(10).lean()
    ]);

    return res.json({
      success: true,
      stats: {
        totalAdmins,
        activeAdmins,
        inactiveAdmins,
        totalProducts,
        totalOrders,
        totalCustomers
      },
      recentActivities
    });
  } catch (err) {
    console.error("Super Admin stats error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load Super Admin dashboard statistics."
    });
  }
});

// ==========================================
// 5. LIST ADMINS: GET /api/superadmin/admins
// ==========================================
router.get("/admins", superAdminMiddleware, async (req, res) => {
  try {
    const { q = "", role = "all", status = "all", page = 1, limit = 25 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};

    // Role filter: default show all admins & superadmins
    if (role === "admin" || role === "superadmin") {
      filter.role = role;
    } else {
      filter.role = { $in: ["admin", "superadmin"] };
    }

    // Status filter
    if (status === "active") {
      filter.isActive = true;
    } else if (status === "inactive") {
      filter.isActive = false;
    }

    // Search query
    if (q && String(q).trim()) {
      const regex = new RegExp(String(q).trim(), "i");
      filter.$or = [{ name: regex }, { email: regex }, { phone: regex }, { adminRoleTitle: regex }];
    }

    const [admins, totalCount] = await Promise.all([
      User.find(filter)
        .sort({ role: 1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter)
    ]);

    // Sanitize safe representation
    const sanitizedAdmins = admins.map((a) => ({
      _id: a._id,
      name: a.name,
      email: a.email,
      phone: a.phone || "",
      role: a.role,
      adminRoleTitle: a.adminRoleTitle || (a.role === "superadmin" ? "Super Administrator" : "Admin"),
      permissions: a.permissions || [],
      isActive: a.isActive !== false,
      mustChangePassword: !!a.mustChangePassword,
      createdBy: a.createdBy || null,
      createdByName: a.createdByName || "",
      lastLogin: a.lastLogin || null,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt
    }));

    return res.json({
      success: true,
      admins: sanitizedAdmins,
      totalCount,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.max(1, Math.ceil(totalCount / limitNum)),
        hasMore: skip + admins.length < totalCount
      }
    });
  } catch (err) {
    console.error("List admins error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve administrator accounts."
    });
  }
});

// ==========================================
// 6. CREATE ADMIN: POST /api/superadmin/admins
// ==========================================
router.post("/admins", superAdminMiddleware, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      adminRoleTitle,
      permissions = [],
      isActive = true
    } = req.body || {};

    // Validate fields
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Full name must be at least 2 characters long."
      });
    }

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address."
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Temporary password must be at least 6 characters long."
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check email uniqueness
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: `An account with email "${cleanEmail}" already exists. Email must be unique.`
      });
    }

    // Filter valid permissions
    const sanitizedPermissions = Array.isArray(permissions)
      ? permissions.filter((p) => ALL_PERMISSION_KEYS.includes(p))
      : [];

    // Create new admin
    const newAdmin = new User({
      name: name.trim(),
      email: cleanEmail,
      phone: (phone || "").trim(),
      password, // Will be bcrypt-hashed in pre-save hook
      role: "admin", // Public/API cannot create superadmin
      adminRoleTitle: (adminRoleTitle || "Store Admin").trim(),
      permissions: sanitizedPermissions.length > 0 ? sanitizedPermissions : ["dashboard", "products", "orders"],
      isActive: isActive !== false,
      mustChangePassword: true, // Required to change temporary password on first login
      createdBy: req.user._id,
      createdByName: req.user.name || "Super Admin"
    });

    await newAdmin.save();

    // Log activity
    await logActivity({
      action: "CREATE_ADMIN",
      description: `Created new admin: ${newAdmin.name} (${newAdmin.email}) with ${newAdmin.permissions.length} permissions`,
      performedBy: req.user,
      target: { id: newAdmin._id, name: newAdmin.name, type: "Admin" },
      details: {
        role: newAdmin.role,
        adminRoleTitle: newAdmin.adminRoleTitle,
        permissions: newAdmin.permissions,
        isActive: newAdmin.isActive
      },
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: `Admin account for "${newAdmin.name}" created successfully. Temporary credentials have been issued.`,
      admin: newAdmin.toSafeObject()
    });
  } catch (err) {
    console.error("Create admin error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to create administrator account."
    });
  }
});

// ==========================================
// 7. UPDATE ADMIN DETAILS & PERMISSIONS: PUT /api/superadmin/admins/:id
// ==========================================
router.put("/admins/:id", superAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, adminRoleTitle, permissions, isActive } = req.body || {};

    const targetAdmin = await User.findById(id);
    if (!targetAdmin) {
      return res.status(404).json({
        success: false,
        message: "Administrator account not found."
      });
    }

    // Protect Super Admin from self-deactivation or demotion
    const isSelf = String(targetAdmin._id) === String(req.user._id);
    if (isSelf && isActive === false) {
      return res.status(400).json({
        success: false,
        message: "Security Protection: You cannot deactivate your own Super Admin account."
      });
    }

    if (targetAdmin.role === "superadmin" && !isSelf) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: You cannot modify another Super Administrator account."
      });
    }

    if (name && name.trim().length >= 2) {
      targetAdmin.name = name.trim();
    }

    if (phone !== undefined) {
      targetAdmin.phone = String(phone).trim();
    }

    if (adminRoleTitle && targetAdmin.role !== "superadmin") {
      targetAdmin.adminRoleTitle = String(adminRoleTitle).trim();
    }

    if (isActive !== undefined && !isSelf) {
      targetAdmin.isActive = Boolean(isActive);
    }

    if (Array.isArray(permissions) && targetAdmin.role !== "superadmin") {
      targetAdmin.permissions = permissions.filter((p) => ALL_PERMISSION_KEYS.includes(p));
    }

    await targetAdmin.save();

    await logActivity({
      action: "UPDATE_ADMIN",
      description: `Updated admin profile/permissions for ${targetAdmin.name} (${targetAdmin.email})`,
      performedBy: req.user,
      target: { id: targetAdmin._id, name: targetAdmin.name, type: "Admin" },
      details: {
        adminRoleTitle: targetAdmin.adminRoleTitle,
        permissionsCount: targetAdmin.permissions?.length,
        isActive: targetAdmin.isActive
      },
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Admin account for "${targetAdmin.name}" updated successfully.`,
      admin: targetAdmin.toSafeObject()
    });
  } catch (err) {
    console.error("Update admin error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update administrator account."
    });
  }
});

// ==========================================
// 8. TOGGLE STATUS: PATCH /api/superadmin/admins/:id/status
// ==========================================
router.patch("/admins/:id/status", superAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Status parameter 'isActive' must be a boolean."
      });
    }

    const targetAdmin = await User.findById(id);
    if (!targetAdmin) {
      return res.status(404).json({
        success: false,
        message: "Administrator account not found."
      });
    }

    // Protection against self-deactivation or superadmin deactivation
    if (String(targetAdmin._id) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: "Security Protection: You cannot change the active status of your own account."
      });
    }

    if (targetAdmin.role === "superadmin") {
      return res.status(400).json({
        success: false,
        message: "Super Administrator status cannot be disabled."
      });
    }

    targetAdmin.isActive = isActive;
    await targetAdmin.save();

    await logActivity({
      action: isActive ? "ACTIVATE_ADMIN" : "DEACTIVATE_ADMIN",
      description: `${isActive ? "Activated" : "Deactivated"} admin account: ${targetAdmin.name} (${targetAdmin.email})`,
      performedBy: req.user,
      target: { id: targetAdmin._id, name: targetAdmin.name, type: "Admin" },
      details: { isActive },
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Admin account "${targetAdmin.name}" has been ${isActive ? "activated" : "deactivated"}.`,
      admin: targetAdmin.toSafeObject()
    });
  } catch (err) {
    console.error("Toggle status error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update administrator status."
    });
  }
});

// ==========================================
// 9. RESET PASSWORD: POST /api/superadmin/admins/:id/reset-password
// ==========================================
router.post("/admins/:id/reset-password", superAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body || {};

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long."
      });
    }

    const targetAdmin = await User.findById(id);
    if (!targetAdmin) {
      return res.status(404).json({
        success: false,
        message: "Administrator account not found."
      });
    }

    targetAdmin.password = newPassword; // Will be hashed via pre-save hook
    targetAdmin.mustChangePassword = true; // Admin must set a new password on their next login
    await targetAdmin.save();

    await logActivity({
      action: "RESET_PASSWORD",
      description: `Reset security password for admin: ${targetAdmin.name} (${targetAdmin.email})`,
      performedBy: req.user,
      target: { id: targetAdmin._id, name: targetAdmin.name, type: "Admin" },
      details: { forcedPasswordChange: true },
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Password reset successfully for "${targetAdmin.name}". They must change it upon their next login.`
    });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to reset administrator password."
    });
  }
});

// ==========================================
// 10. DELETE ADMIN: DELETE /api/superadmin/admins/:id
// ==========================================
router.delete("/admins/:id", superAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const targetAdmin = await User.findById(id);
    if (!targetAdmin) {
      return res.status(404).json({
        success: false,
        message: "Administrator account not found."
      });
    }

    // Protection: Prevent self-deletion
    if (String(targetAdmin._id) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: "Security Protection: You cannot delete your own Super Administrator account."
      });
    }

    // Protection: Prevent deleting another superadmin
    if (targetAdmin.role === "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Security Protection: Super Administrator accounts cannot be deleted."
      });
    }

    await User.findByIdAndDelete(id);

    await logActivity({
      action: "DELETE_ADMIN",
      description: `Permanently deleted admin account: ${targetAdmin.name} (${targetAdmin.email})`,
      performedBy: req.user,
      target: { id: targetAdmin._id, name: targetAdmin.name, type: "Admin" },
      details: { email: targetAdmin.email, role: targetAdmin.role },
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Administrator account "${targetAdmin.name}" (${targetAdmin.email}) has been permanently deleted.`
    });
  } catch (err) {
    console.error("Delete admin error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete administrator account."
    });
  }
});

// ==========================================
// 11. ACTIVITY LOGS: GET /api/superadmin/activity-logs
// ==========================================
router.get("/activity-logs", superAdminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, action = "all", search = "" } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (action && action !== "all") {
      filter.action = action;
    }

    if (search && String(search).trim()) {
      const regex = new RegExp(String(search).trim(), "i");
      filter.$or = [
        { description: regex },
        { "performedBy.name": regex },
        { "performedBy.email": regex },
        { "target.name": regex },
        { action: regex }
      ];
    }

    const [logs, totalCount] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ActivityLog.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      logs,
      totalCount,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.max(1, Math.ceil(totalCount / limitNum)),
        hasMore: skip + logs.length < totalCount
      }
    });
  } catch (err) {
    console.error("Activity logs error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load audit activity logs."
    });
  }
});

// ==========================================
// 12. PERMISSIONS DEFINITIONS: GET /api/superadmin/permissions-list
// ==========================================
router.get("/permissions-list", superAdminMiddleware, (req, res) => {
  return res.json({
    success: true,
    permissions: ALL_PERMISSIONS
  });
});

// ==========================================
// 13. SUPER ADMIN SETTINGS: PUT /api/superadmin/settings
// ==========================================
router.put("/settings", superAdminMiddleware, async (req, res) => {
  try {
    const { name, phone, currentPassword, newPassword } = req.body || {};
    const superAdmin = await User.findById(req.user._id).select("+password");

    if (!superAdmin) {
      return res.status(404).json({ success: false, message: "User account not found." });
    }

    if (name && name.trim().length >= 2) {
      superAdmin.name = name.trim();
    }

    if (phone !== undefined) {
      superAdmin.phone = String(phone).trim();
    }

    // Password change
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is required to set a new password."
        });
      }

      const isMatch = await superAdmin.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password does not match. Please verify."
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters long."
        });
      }

      superAdmin.password = newPassword;
    }

    await superAdmin.save();

    await logActivity({
      action: "UPDATE_SUPERADMIN_SETTINGS",
      description: "Super Admin updated account profile/security settings",
      performedBy: superAdmin,
      target: { id: superAdmin._id, name: superAdmin.name, type: "SuperAdmin" },
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: "Super Administrator settings updated successfully.",
      user: superAdmin.toSafeObject()
    });
  } catch (err) {
    console.error("Super Admin settings error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update Super Administrator settings."
    });
  }
});

module.exports = router;
