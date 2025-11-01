const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Order = require("../models/order");

// ✅ Admin Reports Route (match by email)
router.get("/reports", async (req, res) => {
  try {
    const users = await User.find();

    const reports = await Promise.all(
      users.map(async (user) => {
        // Match orders where name or email matches user email
        const orders = await Order.find({
          $or: [
            { name: user.email }, // exact email match
            { name: user.email.split("@")[0] }, // prefix match
          ],
        }).populate("productId", "name price");

        return {
          email: user.email,
          totalOrders: orders.length,
          orders: orders.map((order) => ({
            name: order.name,
            address: order.address,
            phone: order.phone,
            pincode: order.pincode,
            product: order.productId ? order.productId.name : "Unknown",
            price: order.productId ? order.productId.price : "N/A",
            createdAt: order.createdAt,
          })),
        };
      })
    );

    res.json(reports);
  } catch (error) {
    console.error("❌ Error generating admin report:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;
