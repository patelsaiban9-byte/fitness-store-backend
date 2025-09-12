const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs"); // for password comparison
const jwt = require("jsonwebtoken");

// ------------------ FIXED ADMIN ------------------
const FIXED_ADMIN_EMAIL = "saiban@gmail.com";  // ✅ Change this to your desired admin email
const FIXED_ADMIN_PASSWORD = "saiban123";        // ✅ Change this to your desired admin password

// ------------------ REGISTER ------------------
router.post("/register", async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user (role always "user")
    const user = new User({ email, phone, password, role: "user" });
    await user.save();

    res.status(201).json({ message: "✅ Registered successfully", user });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------ LOGIN ------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // ------------------ FIXED ADMIN LOGIN ------------------
    if (email === FIXED_ADMIN_EMAIL) {
      if (password !== FIXED_ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Invalid admin credentials" });
      }

      // Generate JWT token for admin
      const token = jwt.sign(
        {
          userId: "admin-fixed-id", // optional, any unique ID
          email: FIXED_ADMIN_EMAIL,
          role: "admin",
        },
        process.env.JWT_SECRET_KEY || "defaultsecret",
        { expiresIn: "1h" }
      );

      return res.json({
        message: "✅ Admin login successful",
        token,
        user: {
          id: "admin-fixed-id",
          email: FIXED_ADMIN_EMAIL,
          phone: "N/A",
          role: "admin",
        },
      });
    }

    // ------------------ NORMAL USER LOGIN ------------------
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials (email)" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials (password)" });
    }

    const token = user.generateToken();

    res.json({
      message: "✅ Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
