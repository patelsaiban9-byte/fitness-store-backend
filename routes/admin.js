const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Order = require("../models/order");

router.get("/reports", async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 });
    const usersWithOrders = await Promise.all(
      users.map(async (user) => {
        const orders = await Order.find({ userId: user._id }).populate("productId", "name price");
        return {
          _id: user._id,
          email: user.email,
          role: user.role,
          orders: orders.map((o) => ({
            productName: o.productId?.name || "Unknown Product",
            price: o.productId?.price || 0,
          })),
        };
      })
    );
    res.json(usersWithOrders);
  } catch (error) {
    console.error("Error fetching admin reports:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
