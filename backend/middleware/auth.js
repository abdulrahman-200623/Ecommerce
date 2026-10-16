const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { ALL_PERMISSION_KEYS } = require("../config/permissions");

const JWT_SECRET = process.env.JWT_SECRET || "techzone_super_secret_change_me";

// ==========================================
// 1. STANDARD CUSTOMER AUTH MIDDLEWARE
// ==========================================
async function authMiddleware(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.headers["x-auth-token"]) {
      token = req.headers["x-auth-token"];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in to proceed."
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session token. Please log in again."
      });
    }

    const userId = decoded.id || decoded.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Malformed authentication token payload."
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account no longer exists. Please register or log in."
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "This account has been deactivated. Please contact support."
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authentication."
    });
  }
}

// ==========================================
// 2. OPTIONAL AUTH MIDDLEWARE
// ==========================================
async function optionalAuth(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id || decoded.userId;
        if (userId) {
          const user = await User.findById(userId);
          if (user && user.isActive !== false) {
            req.user = user;
          }
        }
      } catch (e) {
        // Ignore token errors for optional auth
      }
    }
    next();
  } catch (err) {
    next();
  }
}

// ==========================================
// 3. ADMIN MIDDLEWARE (Allows both Admin and Super Admin)
// ==========================================
async function adminMiddleware(req, res, next) {
  try {
    // 1. Check admin secret key header (internal server/automation bypass)
    const ADMIN_SECRET = process.env.ADMIN_SECRET || "techzone-admin-secret";
    const adminKey = req.headers["x-admin-key"] || req.headers["x-admin-auth"];
    if (adminKey && adminKey === ADMIN_SECRET) {
      req.isAdmin = true;
      req.isSuperAdmin = true;
      req.user = {
        _id: "system_admin",
        role: "superadmin",
        name: "TechZone System Admin",
        email: "system@techzone.com",
        permissions: ALL_PERMISSION_KEYS
      };
      return next();
    }

    // 2. Check JWT Bearer token or HTTP-only admin cookies
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.headers["x-auth-token"]) {
      token = req.headers["x-auth-token"];
    } else if (req.cookies && (req.cookies.admin_token || req.cookies.superadmin_token)) {
      token = req.cookies.admin_token || req.cookies.superadmin_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Administrator privileges needed."
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id || decoded.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Invalid session token." });
    }

    let user = await User.findById(userId);

    // Fallback if matching configured environment admin email
    if (!user && decoded.email === (process.env.ADMIN_EMAIL || "admin@techzone.com").toLowerCase()) {
      user = await User.findOne({ email: decoded.email });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: "User account not found." });
    }

    // Check account status
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Your administrator account has been deactivated. Please contact the Super Administrator."
      });
    }

    // Check role authorization (must be admin or superadmin)
    if (user.role !== "admin" && user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Administrator privileges required."
      });
    }

    req.user = user;
    req.isAdmin = true;
    req.isSuperAdmin = user.role === "superadmin";
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Admin authorization failed: " + (err.message || "Invalid credentials.")
    });
  }
}

// ==========================================
// 4. SUPER ADMIN MIDDLEWARE (Strictly Super Admin Only)
// ==========================================
async function superAdminMiddleware(req, res, next) {
  try {
    // 1. Check admin secret key header bypass
    const ADMIN_SECRET = process.env.ADMIN_SECRET || "techzone-admin-secret";
    const adminKey = req.headers["x-admin-key"] || req.headers["x-admin-auth"];
    if (adminKey && adminKey === ADMIN_SECRET) {
      req.isAdmin = true;
      req.isSuperAdmin = true;
      req.user = {
        _id: "system_superadmin",
        role: "superadmin",
        name: "TechZone Super Administrator",
        email: (process.env.SUPERADMIN_EMAIL || "superadmin@techzone.com").toLowerCase(),
        permissions: ALL_PERMISSION_KEYS
      };
      return next();
    }

    // 2. Check JWT Bearer token or cookie
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.headers["x-auth-token"]) {
      token = req.headers["x-auth-token"];
    } else if (req.cookies && (req.cookies.superadmin_token || req.cookies.admin_token)) {
      token = req.cookies.superadmin_token || req.cookies.admin_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Super Administrator privileges needed."
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired Super Administrator session."
      });
    }

    const userId = decoded.id || decoded.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Invalid session token." });
    }

    let user = await User.findById(userId);

    // Fallback check for env superadmin
    if (!user && decoded.email === (process.env.SUPERADMIN_EMAIL || "superadmin@techzone.com").toLowerCase()) {
      user = await User.findOne({ email: decoded.email });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: "Super Admin account not found." });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Super Administrator account is deactivated."
      });
    }

    if (user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Strictly reserved for Super Administrators."
      });
    }

    req.user = user;
    req.isAdmin = true;
    req.isSuperAdmin = true;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Super Admin authorization error: " + (err.message || "Invalid credentials.")
    });
  }
}

// ==========================================
// 5. RBAC PERMISSION CHECKER FACTORY
// ==========================================
function requirePermission(permKey) {
  return (req, res, next) => {
    // If not authenticated yet
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to perform this action."
      });
    }

    // Super Admin has implicit bypass for all permissions
    if (req.isSuperAdmin || req.user.role === "superadmin") {
      return next();
    }

    // Deactivated check
    if (req.user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Your administrator account has been deactivated."
      });
    }

    // Check user permissions list
    const userPermissions = Array.isArray(req.user.permissions) ? req.user.permissions : [];
    if (userPermissions.includes(permKey) || userPermissions.includes("*")) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. You do not have the required permission (${permKey}) to perform this action.`
    });
  };
}

module.exports = {
  authMiddleware,
  adminMiddleware,
  superAdminMiddleware,
  requirePermission,
  optionalAuth,
  JWT_SECRET
};
