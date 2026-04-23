const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const transporter = require("../config/mailer");

// ------------------ FIXED ADMIN ------------------
const FIXED_ADMIN_EMAIL = "saiban@gmail.com";
const FIXED_ADMIN_PASSWORD = "saiban123";

// ------------------ REGISTER ------------------
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({ name, email, phone, password, role: "user" });
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
        { expiresIn: "7d" } // ✅ Extended to 7 days (was 1h)
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

    if (user.isActive === false) {
      return res.status(403).json({ message: "Your account is deactivated. Please contact admin." });
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
        name: user.name,
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

// ------------------ FORGOT PASSWORD (SEND OTP) ------------------
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (email === FIXED_ADMIN_EMAIL) {
      return res.status(400).json({ message: "Password reset not available for admin" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: "If this email exists, OTP has been sent" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordResetOtp: otp,
          passwordResetOtpExpiresAt: expiry,
        },
      }
    );

    const mailOptions = {
      from: process.env.EMAIL_USER || "noreply@fitnessstore.com",
      to: user.email,
      subject: "Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
          <h2>Password Reset OTP</h2>
          <p>Your OTP to reset your password is:</p>
          <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
          <p>This OTP is valid for 10 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Failed to send OTP email" });
  }
});

// ------------------ RESET PASSWORD (VERIFY OTP) ------------------
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or OTP" });
    }

    const isExpired =
      !user.passwordResetOtpExpiresAt || new Date(user.passwordResetOtpExpiresAt).getTime() < Date.now();

    if (!user.passwordResetOtp || user.passwordResetOtp !== otp || isExpired) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          passwordResetOtp: null,
          passwordResetOtpExpiresAt: null,
        },
      }
    );

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
});

// ------------------ ADMIN: USER REPORTS WITH ORDERS ------------------
router.get("/admin/reports", async (req, res) => {
  try {
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

    // Include user orders
    const Order = require("../models/order");
    const userReports = await Promise.all(
      users.map(async (user) => {
        const orders = await Order.find({ userId: user._id }).lean();
        return {
          ...user.toObject(),
          orders: orders.map((o) => ({
            productName: o.productName || "Unknown Product",
            quantity: o.quantity || 1,
            date: o.createdAt || new Date(),
          })),
        };
      })
    );

    res.status(200).json(userReports);
  } catch (error) {
    console.error("Admin report error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
