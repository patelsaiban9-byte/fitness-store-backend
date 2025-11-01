const express = require("express");
const router = express.Router();
const User = require("../models/user");

// ✅ Admin: Get all registered users
router.get("/reports", async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error("Error fetching admin reports:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
