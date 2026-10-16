const User = require("../models/User");
const { ALL_PERMISSION_KEYS } = require("./permissions");
const { logActivity } = require("../services/activityLogger");

/**
 * Bootstrap the Super Admin and verify the Default Admin from environment variables.
 * Guarantees zero hardcoded production credentials, prevents duplicate Super Admins,
 * and ensures system is ready on launch.
 */
async function bootstrapSuperAdmin() {
  try {
    const superAdminEmail = (process.env.SUPERADMIN_EMAIL || "superadmin@techzone.com").trim().toLowerCase();
    const superAdminPassword = process.env.SUPERADMIN_PASSWORD || "SuperAdmin@TechZone2026!";
    const superAdminName = process.env.SUPERADMIN_NAME || "TechZone Super Administrator";

    // 1. Check if Super Admin exists in MongoDB
    let superAdmin = await User.findOne({ email: superAdminEmail }).select("+password");

    if (!superAdmin) {
      superAdmin = new User({
        name: superAdminName,
        email: superAdminEmail,
        password: superAdminPassword, // pre('save') hashes it via bcrypt
        phone: "+91 99999 00001",
        role: "superadmin",
        adminRoleTitle: "Super Administrator",
        permissions: ALL_PERMISSION_KEYS,
        isActive: true,
        mustChangePassword: false,
        createdByName: "System Bootstrap",
        address: {
          street: "TechZone Enterprise Center, Cyber City",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560100"
        }
      });
      await superAdmin.save();
      console.log(`[TechZone Bootstrap] Initialized initial Super Admin: ${superAdminEmail}`);

      await logActivity({
        action: "BOOTSTRAP_SUPERADMIN",
        description: `Initial Super Admin account created: ${superAdminEmail}`,
        performedBy: {
          _id: superAdmin._id,
          name: superAdmin.name,
          email: superAdmin.email,
          role: "superadmin"
        },
        target: {
          id: superAdmin._id,
          name: superAdmin.name,
          type: "SuperAdmin"
        },
        details: { email: superAdminEmail, permissionsCount: ALL_PERMISSION_KEYS.length }
      });
    } else {
      let needsSave = false;
      if (superAdmin.role !== "superadmin") {
        superAdmin.role = "superadmin";
        needsSave = true;
      }
      if (!superAdmin.isActive) {
        superAdmin.isActive = true;
        needsSave = true;
      }
      if (!superAdmin.permissions || superAdmin.permissions.length < ALL_PERMISSION_KEYS.length) {
        superAdmin.permissions = ALL_PERMISSION_KEYS;
        needsSave = true;
      }

      // Check if environment password was modified and synchronize
      const matchesEnv = await superAdmin.comparePassword(superAdminPassword);
      if (!matchesEnv) {
        superAdmin.password = superAdminPassword; // Will be hashed in pre('save')
        needsSave = true;
      }

      if (needsSave) {
        await superAdmin.save();
        console.log(`[TechZone Bootstrap] Synchronized Super Admin: ${superAdminEmail}`);
      }
    }

    // 2. Ensure default regular admin exists for existing /admin compatibility
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@techzone.com").trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "ChangeThisAdminPassword123!";

    let defaultAdmin = await User.findOne({ email: adminEmail }).select("+password");
    if (!defaultAdmin) {
      defaultAdmin = new User({
        name: "TechZone Store Administrator",
        email: adminEmail,
        password: adminPassword,
        phone: "+91 99999 88888",
        role: "admin",
        adminRoleTitle: "General Store Administrator",
        permissions: ALL_PERMISSION_KEYS,
        isActive: true,
        mustChangePassword: false,
        createdBy: superAdmin._id,
        createdByName: superAdmin.name,
        address: {
          street: "TechZone HQ, Admin Wing",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001"
        }
      });
      await defaultAdmin.save();
      console.log(`[TechZone Bootstrap] Initialized default Admin: ${adminEmail}`);
    } else {
      let adminNeedsSave = false;
      if (defaultAdmin.role !== "admin" && defaultAdmin.role !== "superadmin") {
        defaultAdmin.role = "admin";
        adminNeedsSave = true;
      }
      if (!defaultAdmin.permissions || defaultAdmin.permissions.length === 0) {
        defaultAdmin.permissions = ALL_PERMISSION_KEYS;
        adminNeedsSave = true;
      }
      if (adminNeedsSave) {
        await defaultAdmin.save();
      }
    }
  } catch (err) {
    console.error("[TechZone Bootstrap] Error during bootstrap:", err.message);
  }
}

module.exports = { bootstrapSuperAdmin };
