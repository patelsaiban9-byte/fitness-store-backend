// backend/routes/orders.js
const express = require("express");
const router = express.Router();
const Order = require("../models/order");

// Place a new order
router.post("/", async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(400).json({ error: "Bad Request" });
  }
});

// Get all orders (for admin)
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().populate("productId");
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
