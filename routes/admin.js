const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Order = require("../models/order");

router.get("/reports", async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 });
    const allOrders = await Order.find({}).populate("productId", "name price");

    const usersWithOrders = users.map((user) => {
      const userOrders = allOrders.filter(
        (order) =>
          order.name?.toLowerCase() === user.email?.split("@")[0]?.toLowerCase() ||
          order.name?.toLowerCase() === user.name?.toLowerCase()
      );

      const totalAmount = userOrders.reduce(
        (sum, order) => sum + (order.productId?.price || 0),
        0
      );

      return {
        _id: user._id,
        email: user.email,
        role: user.role,
        totalOrders: userOrders.length,
        totalAmount,
        orders: userOrders.map((o) => ({
          productName: o.productId?.name || "Unknown Product",
          price: o.productId?.price || 0,
        })),
      };
    });

    res.json(usersWithOrders);
  } catch (error) {
    console.error("Error fetching admin reports:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
