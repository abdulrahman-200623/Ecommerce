const router = require("express").Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { authMiddleware, JWT_SECRET } = require("../middleware/auth");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDIAN_PHONE_REGEX = /^(\+91[\-\s]?)?[6-9]\d{9}$/;
const PINCODE_REGEX = /^\d{6}$/;

function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      userId: user._id,
      email: user.email,
      name: user.name,
      role: user.role || "customer"
    },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

// ==========================================
// 1. REGISTER NEW USER
// ==========================================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid full name (at least 2 characters)."
      });
    }

    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address."
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long."
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email address already exists. Please log in."
      });
    }

    // Optional phone validation
    let cleanPhone = (phone || "").trim();
    if (cleanPhone && !INDIAN_PHONE_REGEX.test(cleanPhone.replace(/\s+/g, ""))) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit mobile number."
      });
    }

    // Optional address validation
    const street = address?.street?.trim() || (typeof address === "string" ? address.trim() : "");
    const city = address?.city?.trim() || "";
    const state = address?.state?.trim() || "";
    const pincode = address?.pincode?.trim() || "";

    if (pincode && !PINCODE_REGEX.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: "PIN code must be a 6-digit number."
      });
    }

    const newUser = new User({
      name: name.trim(),
      email: cleanEmail,
      password,
      phone: cleanPhone,
      address: {
        street,
        city,
        state,
        pincode
      }
    });

    await newUser.save();
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: "Account created successfully! Welcome to TechZone.",
      token,
      user: newUser.toSafeObject()
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create account. Please try again."
    });
  }
});

// ==========================================
// 2. LOGIN USER
// ==========================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and password."
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password. Please verify your credentials."
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password. Please verify your credentials."
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: "Logged in successfully.",
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Login failed. Please try again."
    });
  }
});

// ==========================================
// 3. GET LOGGED-IN USER PROFILE (PROTECTED)
// ==========================================
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    // req.user is verified and attached by authMiddleware
    res.json({
      success: true,
      user: req.user.toSafeObject()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user profile."
    });
  }
});

// Alias: GET /me
router.get("/me", authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user.toSafeObject()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user profile."
    });
  }
});

// ==========================================
// 4. UPDATE LOGGED-IN USER PROFILE (PROTECTED)
// ==========================================
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { name, phone, address, currentPassword, newPassword } = req.body;

    // Validate Name
    if (name !== undefined) {
      if (!name || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: "Full name must be at least 2 characters long."
        });
      }
      user.name = name.trim();
    }

    // Validate Phone
    if (phone !== undefined) {
      const cleanPhone = phone.trim();
      if (cleanPhone && !INDIAN_PHONE_REGEX.test(cleanPhone.replace(/\s+/g, ""))) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid 10-digit mobile number."
        });
      }
      user.phone = cleanPhone;
    }

    // Validate Address fields
    if (address !== undefined) {
      const street = address.street !== undefined ? address.street.trim() : (user.address?.street || "");
      const city = address.city !== undefined ? address.city.trim() : (user.address?.city || "");
      const state = address.state !== undefined ? address.state.trim() : (user.address?.state || "");
      const pincode = address.pincode !== undefined ? address.pincode.trim() : (user.address?.pincode || "");

      if (pincode && !PINCODE_REGEX.test(pincode)) {
        return res.status(400).json({
          success: false,
          message: "PIN code must be a valid 6-digit number."
        });
      }

      user.address = {
        street,
        city,
        state,
        pincode
      };
    }

    // Optional Password Update
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is required to set a new password."
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters long."
        });
      }

      // Re-fetch user with password to verify current password
      const userWithPass = await User.findById(user._id).select("+password");
      const isMatch = await userWithPass.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password does not match. Please verify and try again."
        });
      }

      user.password = newPassword;
    }

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully!",
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update profile."
    });
  }
});

module.exports = router;
