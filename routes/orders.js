// backend/routes/orders.js
const express = require("express");
const router = express.Router();
const Order = require("../models/order");
const Product = require("../models/product"); // for populating product info
const User = require("../models/user");       // if you want user info too

// -----------------------------
// Place a new order (user only)
// -----------------------------
router.post("/", async (req, res) => {
  try {
    const { name, address, phone, landmark, pincode, productId } = req.body;

    if (!name || !address || !phone || !pincode || !productId) {
      return res.status(400).json({ error: "All required fields must be provided" });
    }

    const newOrder = new Order({
      name,
      address,
      phone,
      landmark,
      pincode,
      productId,
    });

    await newOrder.save();
    res.status(201).json({ message: "Order placed successfully", order: newOrder });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// -----------------------------
// Get all orders (admin only)
// -----------------------------
router.get("/", async (req, res) => {
  try {
    // Populate product info (name, price) for each order
    const orders = await Order.find()
      .populate({ path: "productId", select: "name price" })
      .sort({ createdAt: -1 }); // latest orders first

    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Optional: Delete an order (admin)
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
