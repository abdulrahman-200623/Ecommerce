const router = require("express").Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { adminMiddleware, JWT_SECRET } = require("../middleware/auth");
const { ALL_PERMISSION_KEYS } = require("../config/permissions");
const { logActivity } = require("../services/activityLogger");

// Configured admin credentials from environment variables
const ADMIN_CONFIG = {
  get email() {
    return (process.env.ADMIN_EMAIL || "admin@techzone.com").trim().toLowerCase();
  },
  get password() {
    return process.env.ADMIN_PASSWORD || "ChangeThisAdminPassword123!";
  }
};

// In-memory rate limiting for login attempts
const loginAttempts = new Map();
const MAX_ATTEMPTS = 6;
const LOCKOUT_TIME_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(identifier) {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record) return { allowed: true };

  if (now - record.firstAttempt > LOCKOUT_TIME_MS) {
    loginAttempts.delete(identifier);
    return { allowed: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const remainingMinutes = Math.ceil((LOCKOUT_TIME_MS - (now - record.firstAttempt)) / 60000);
    return {
      allowed: false,
      message: `Too many failed login attempts. Please try again in ${remainingMinutes} minute(s).`
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

// Helper: Ensure configured default admin account exists in MongoDB with hashed password
async function ensureAdminUser() {
  try {
    const targetEmail = ADMIN_CONFIG.email;
    let admin = await User.findOne({ email: targetEmail }).select("+password");

    if (!admin) {
      admin = new User({
        name: "TechZone Administrator",
        email: targetEmail,
        password: ADMIN_CONFIG.password,
        role: "admin",
        adminRoleTitle: "General Store Administrator",
        permissions: ALL_PERMISSION_KEYS,
        isActive: true,
        mustChangePassword: false,
        phone: "+91 99999 88888",
        address: {
          street: "TechZone HQ, Admin Wing",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001"
        }
      });
      await admin.save();
      console.log(`[TechZone Admin] Initialized admin user: ${targetEmail}`);
    } else {
      let needsSave = false;
      if (admin.role !== "admin" && admin.role !== "superadmin") {
        admin.role = "admin";
        needsSave = true;
      }
      if (!admin.permissions || admin.permissions.length === 0) {
        admin.permissions = ALL_PERMISSION_KEYS;
        needsSave = true;
      }
      // Check if password matches configured environment password
      const matchesEnv = await admin.comparePassword(ADMIN_CONFIG.password);
      if (!matchesEnv) {
        admin.password = ADMIN_CONFIG.password; // pre('save') hashes it
        needsSave = true;
      }
      if (needsSave) {
        await admin.save();
        console.log(`[TechZone Admin] Synchronized admin user: ${targetEmail}`);
      }
    }
    return admin;
  } catch (err) {
    console.error("[TechZone Admin] Error ensuring admin account:", err.message);
    return null;
  }
}

// Run initial admin verification on module load
ensureAdminUser();

// ==========================================
// 1. ADMIN LOGIN: POST /api/admin/login
// ==========================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const clientIp = req.ip || req.headers["x-forwarded-for"] || "client";
    const rateKey = `${clientIp}_${String(email || "").trim().toLowerCase()}`;

    // Rate limiting check
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
        message: "Please enter both administrator email and password."
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const inputPassword = String(password);

    // 1. Check MongoDB for admin user
    let adminUser = await User.findOne({ email: cleanEmail }).select("+password");
    let isValid = false;

    if (adminUser) {
      // Check if user has admin or superadmin role
      if (adminUser.role !== "admin" && adminUser.role !== "superadmin") {
        recordFailedAttempt(rateKey);
        return res.status(403).json({
          success: false,
          message: "Access denied. This account does not possess administrator privileges."
        });
      }

      // Check if deactivated
      if (adminUser.isActive === false) {
        recordFailedAttempt(rateKey);
        return res.status(403).json({
          success: false,
          message: "Your administrator account has been deactivated. Please contact the Super Administrator."
        });
      }

      isValid = await adminUser.comparePassword(inputPassword);
    }

    // 2. Check environment credentials fallback
    if (!isValid && cleanEmail === ADMIN_CONFIG.email && inputPassword === ADMIN_CONFIG.password) {
      adminUser = await ensureAdminUser();
      isValid = !!adminUser;
    }

    if (!isValid || !adminUser) {
      recordFailedAttempt(rateKey);
      return res.status(401).json({
        success: false,
        message: "Invalid administrator email or password. Please verify your credentials."
      });
    }

    // Successful login: reset rate limit attempts
    clearAttempts(rateKey);

    // Update last login
    adminUser.lastLogin = new Date();
    await adminUser.save();

    // Generate signed admin JWT token with role and permissions
    const permissions = adminUser.role === "superadmin"
      ? ALL_PERMISSION_KEYS
      : (adminUser.permissions || ALL_PERMISSION_KEYS);

    const token = jwt.sign(
      {
        id: adminUser._id,
        userId: adminUser._id,
        email: adminUser.email,
        name: adminUser.name || "TechZone Administrator",
        role: adminUser.role,
        adminRoleTitle: adminUser.adminRoleTitle || "Admin",
        permissions,
        mustChangePassword: !!adminUser.mustChangePassword,
        isAdmin: true,
        isSuperAdmin: adminUser.role === "superadmin"
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Set secure HTTP-only cookie
    res.cookie("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Record login activity
    await logActivity({
      action: "LOGIN_ADMIN",
      description: `Administrator signed in: ${adminUser.name} (${adminUser.email})`,
      performedBy: adminUser,
      target: { id: adminUser._id, name: adminUser.name, type: "Admin" },
      ipAddress: clientIp
    });

    const safeAdmin = adminUser.toSafeObject();

    return res.json({
      success: true,
      message: adminUser.mustChangePassword
        ? "Temporary password detected. Please set a new permanent password to continue."
        : "Administrator authenticated successfully.",
      token,
      mustChangePassword: !!adminUser.mustChangePassword,
      admin: safeAdmin
    });
  } catch (err) {
    console.error("Admin login error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error during administrator authentication."
    });
  }
});

// ==========================================
// 2. CHANGE PASSWORD (REQUIRED ON FIRST LOGIN OR ON DEMAND)
// POST /api/admin/change-password
// ==========================================
router.post("/change-password", adminMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long."
      });
    }

    const adminUser = await User.findById(req.user._id).select("+password");
    if (!adminUser) {
      return res.status(404).json({ success: false, message: "User account not found." });
    }

    // Verify current password if provided
    if (currentPassword) {
      const isMatch = await adminUser.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password does not match. Please verify and try again."
        });
      }
    }

    adminUser.password = newPassword; // Will be hashed via pre-save
    adminUser.mustChangePassword = false;
    await adminUser.save();

    // Re-issue JWT with mustChangePassword = false
    const permissions = adminUser.role === "superadmin"
      ? ALL_PERMISSION_KEYS
      : (adminUser.permissions || []);

    const token = jwt.sign(
      {
        id: adminUser._id,
        userId: adminUser._id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        adminRoleTitle: adminUser.adminRoleTitle || "Admin",
        permissions,
        mustChangePassword: false,
        isAdmin: true,
        isSuperAdmin: adminUser.role === "superadmin"
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.cookie("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000
    });

    await logActivity({
      action: "CHANGE_PASSWORD_SELF",
      description: `Administrator changed password: ${adminUser.email}`,
      performedBy: adminUser,
      target: { id: adminUser._id, name: adminUser.name, type: "Admin" },
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: "Password updated successfully. Welcome to the TechZone Admin Console!",
      token,
      admin: adminUser.toSafeObject()
    });
  } catch (err) {
    console.error("Change password error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update password. Please try again."
    });
  }
});

// ==========================================
// 3. VERIFY ADMIN SESSION: GET /api/admin/verify (or /me)
// ==========================================
router.get("/verify", adminMiddleware, async (req, res) => {
  try {
    const adminUser = req.user;
    return res.json({
      success: true,
      admin: adminUser.toSafeObject ? adminUser.toSafeObject() : adminUser
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error verifying administrator session."
    });
  }
});

router.get("/me", adminMiddleware, async (req, res) => {
  try {
    const adminUser = req.user;
    return res.json({
      success: true,
      admin: adminUser.toSafeObject ? adminUser.toSafeObject() : adminUser
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error verifying administrator session."
    });
  }
});

// ==========================================
// 4. ADMIN LOGOUT: POST /api/admin/logout
// ==========================================
router.post("/logout", (req, res) => {
  res.clearCookie("admin_token", {
    httpOnly: true,
    sameSite: "lax"
  });
  return res.json({
    success: true,
    message: "Administrator logged out successfully."
  });
});

module.exports = router;
