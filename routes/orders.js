const express = require("express");
const router = express.Router();
const Order = require("../models/order");
const PDFDocument = require("pdfkit");

/* =================================================
   🛒 PLACE CART ORDER (USER)
   ================================================= */
router.post("/cart", async (req, res) => {
  try {
    const {
      customer,
      items,
      totalAmount,
      paymentMethod,
      paymentStatus,
    } = req.body;

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
      paymentMethod: paymentMethod || "COD",
      paymentStatus: paymentStatus || "PENDING",
      orderStatus: "PLACED",
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
   👤 GET MY ORDERS (USER – BY NAME ✅ SAFE FINAL)
   ================================================= */
router.get("/my/:name", async (req, res) => {
  try {
    const name = String(req.params.name).trim();

    // 🔐 SAFE REGEX FIX (ONLY CHANGE)
    const escapeRegex = (text) =>
      text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

    const safeName = escapeRegex(name);

    console.log("👤 NAME FROM URL:", safeName);

    const orders = await Order.find({
      "customer.name": { $regex: new RegExp(`^${safeName}$`, "i") },
    })
      .populate("items.productId", "name price")
      .sort({ createdAt: -1 });

    console.log("📦 ORDERS FOUND:", orders.length);

    res.json(orders);
  } catch (err) {
    console.error("My orders error:", err);
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
   💳 UPDATE PAYMENT STATUS (ADMIN)
   ================================================= */
router.patch("/payment/:id", async (req, res) => {
  try {
    const { paymentStatus } = req.body;

    if (!["PENDING", "PAID", "FAILED"].includes(paymentStatus)) {
      return res.status(400).json({ error: "Invalid payment status" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ message: "Payment status updated", order: updatedOrder });
  } catch (err) {
    console.error("Payment update error:", err);
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

/* =================================================
   🧾 DOWNLOAD INVOICE PDF (ENHANCED DESIGN – FIXED)
   ================================================= */
router.get("/invoice/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.productId", "name");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order._id}.pdf`
    );

    doc.pipe(res);

    /* ---------- HEADER ---------- */
    doc.fontSize(24).text("INVOICE", { align: "center" });
    doc.moveDown();

    doc.fontSize(12);
    doc.text(`Invoice ID: ${order._id}`);
    doc.text(`Date: ${new Date(order.createdAt).toDateString()}`);
    doc.moveDown();

    /* ---------- CUSTOMER ---------- */
    doc.fontSize(14).text("Customer Details", { underline: true });
    doc.fontSize(12);
    doc.text(`Name: ${order.customer.name}`);
    doc.text(`Phone: ${order.customer.phone}`);
    doc.text(`Address: ${order.customer.address}`);
    doc.text(`Pincode: ${order.customer.pincode}`);
    doc.moveDown();

    /* ---------- ITEMS ---------- */
    doc.fontSize(14).text("Order Items", { underline: true });
    doc.moveDown(0.5);

    order.items.forEach((item, i) => {
      doc.text(
        `${i + 1}. ${item.name} × ${item.qty} = ₹${item.price * item.qty}`
      );
    });

    doc.moveDown();
    doc.fontSize(14).text(`Total Amount: ₹${order.totalAmount}`, {
      align: "right",
    });

    doc.moveDown(2);

    /* ---------- PAYMENT INFO (SPACING FIX) ---------- */
    doc.fontSize(12).font("Helvetica-Bold").text("Payment Status:");
    doc.font("Helvetica")
      .fillColor(order.paymentStatus === "PAID" ? "green" : "red")
      .text(order.paymentStatus, 160, doc.y - 15);

    doc.moveDown(0.5);

    doc.font("Helvetica-Bold")
      .fillColor("black")
      .text("Payment Method:");
    doc.font("Helvetica")
      .text(order.paymentMethod, 160, doc.y - 15);

    doc.moveDown(2);

    doc.fontSize(10).text("Thank you for shopping with us ❤️", {
      align: "center",
    });

    doc.end();
  } catch (err) {
    console.error("Invoice error:", err);
    res.status(500).json({ error: "Failed to generate invoice" });
  }
});

module.exports = router;
