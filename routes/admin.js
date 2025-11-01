const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Order = require("../models/order");

// Admin Reports Route
router.get("/reports", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("productId")
      .sort({ createdAt: -1 });

    console.log("Found orders:", orders);

    const reports = orders.map(order => ({
      email: order.name || "Unknown",
      orders: [{
        productName: order.productId ? order.productId.name : "Unknown",
        createdAt: order.createdAt
      }]
    }));

    console.log("Sending reports:", reports);
    res.json(reports);
  } catch (error) {
    console.error("❌ Error generating admin report:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;