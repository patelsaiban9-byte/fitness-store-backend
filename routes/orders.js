const express = require("express");
const router = express.Router();
const Order = require("../models/order");

/* =================================================
   🛒 PLACE CART ORDER  (USER)
   ================================================= */
router.post("/cart", async (req, res) => {
  try {
    const { customer, items, totalAmount } = req.body;

    if (
      !customer ||
      !customer.name ||
      !customer.phone ||
      !customer.address ||
      !customer.pincode ||
      !items ||
      items.length === 0
    ) {
      return res.status(400).json({ error: "Invalid cart order data" });
    }

    const newOrder = new Order({
      customer,
      items,
      totalAmount,
    });

    await newOrder.save();

    res.status(201).json({
      message: "Cart order placed successfully",
      orderId: newOrder._id,
    });
  } catch (err) {
    console.error("Cart order error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* =================================================
   📦 GET ALL ORDERS (ADMIN)
   ================================================= */
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("items.productId", "name price")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("Fetch orders error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* =================================================
   ❌ DELETE ORDER (ADMIN)
   ================================================= */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error("Delete order error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
