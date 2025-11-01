const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ------------------ FIXED ADMIN ------------------
const FIXED_ADMIN_EMAIL = "saiban@gmail.com";
const FIXED_ADMIN_PASSWORD = "saiban123";

// ------------------ REGISTER ------------------
router.post("/register", async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

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

    // Fixed admin login
    if (email === FIXED_ADMIN_EMAIL) {
      if (password !== FIXED_ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Invalid admin credentials" });
      }

      const token = jwt.sign(
        { userId: "admin-fixed-id", email: FIXED_ADMIN_EMAIL, role: "admin" },
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

    // Normal user login
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

// ------------------ ADMIN: USER REPORTS ------------------
router.get("/admin/reports", async (req, res) => {
  try {
    // Optional: simple fixed admin check (for security)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY || "defaultsecret");

    if (decoded.email !== FIXED_ADMIN_EMAIL) {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    // Fetch all users (excluding passwords)
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (error) {
    console.error("Admin report error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
