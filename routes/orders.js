const express = require("express");
const router = express.Router();
const Order = require("../models/order");
const Product = require("../models/product");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const { sendOrderConfirmationEmail, sendOrderStatusEmail, sendLowStockAlert } = require("../utils/emailService");

const restockOrderItems = async (order) => {
  for (const item of order.items) {
    if (!item.productId) {
      continue;
    }

    const product = await Product.findById(item.productId);
    if (product && product.stock != null) {
      product.stock += item.qty;
      await product.save();
    }
  }
};

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
      !customer.email ||
      !customer.address ||
      !customer.pincode ||
      !items ||
      items.length === 0
    ) {
      return res.status(400).json({ error: "Invalid cart order data - email is required" });
    }

    // ✅ CHECK STOCK AVAILABILITY FOR ALL ITEMS (only if stock is being tracked)
    const stockIssues = [];
    for (const item of items) {
      if (item.productId) {
        const product = await Product.findById(item.productId);
        console.log(`📦 Checking stock for ${item.name}:`, {
          productId: item.productId,
          foundProduct: !!product,
          currentStock: product?.stock,
          requestedQty: item.qty,
          stockTracked: product?.stock != null
        });
        
        if (!product) {
          stockIssues.push(`Product "${item.name}" not found`);
        } else if (product.stock != null && product.stock < item.qty) {
          // Only enforce stock limits if stock is actively managed (not undefined/null)
          console.log(`❌ INSUFFICIENT STOCK: ${product.name} - Available: ${product.stock}, Requested: ${item.qty}`);
          stockIssues.push(
            `"${product.name}" - Only ${product.stock} units available, but ${item.qty} requested`
          );
        } else {
          console.log(`✅ Stock OK for ${product.name}`);
        }
      }
    }

    if (stockIssues.length > 0) {
      return res.status(400).json({ 
        error: "Insufficient stock", 
        details: stockIssues 
      });
    }

    const newOrder = new Order({
      customer,
      // optional userId (if frontend provides it)
      userId: req.body.userId,
      items,
      totalAmount,
      paymentMethod: paymentMethod || "COD",
      paymentStatus: paymentStatus || "PENDING",
      orderStatus: "PLACED",
      trackingEvents: [
        {
          status: "PLACED",
          note: "Order placed",
          updatedBy: req.body.userId || null,
        },
      ],
    });

    await newOrder.save();

    // ✅ DECREASE STOCK FOR EACH ITEM AND CHECK FOR LOW STOCK (only if stock is tracked)
    for (const item of items) {
      if (item.productId) {
        const product = await Product.findById(item.productId);
        if (product && product.stock != null) {
          // Only manage stock if it's actively tracked (not undefined/null)
          product.stock -= item.qty;
          await product.save();

          // ✅ CHECK IF STOCK IS NOW BELOW MINIMUM THRESHOLD
          if (product.stock <= product.minimumStockThreshold && product.stock > 0) {
            console.log(`⚠️ Low stock detected for ${product.name}: ${product.stock} units remaining`);
            await sendLowStockAlert({
              productName: product.name,
              productId: product._id,
              currentStock: product.stock,
              minimumThreshold: product.minimumStockThreshold,
            });
          } else if (product.stock === 0) {
            console.log(`🚫 ${product.name} is now OUT OF STOCK`);
            await sendLowStockAlert({
              productName: product.name,
              productId: product._id,
              currentStock: product.stock,
              minimumThreshold: product.minimumStockThreshold,
            });
          }
        }
      }
    }

    // Send confirmation email
    const emailResult = await sendOrderConfirmationEmail({
      customer,
      orderId: newOrder._id,
      items,
      totalAmount,
      createdAt: newOrder.createdAt,
      paymentMethod: newOrder.paymentMethod,
      paymentStatus: newOrder.paymentStatus,
    });

    console.log("📧 Email service result:", emailResult);

    res.status(201).json({
      message: "Cart order placed successfully",
      orderId: newOrder._id,
      emailSent: emailResult.success,
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
      .populate("items.productId", "name price image")
      .sort({ createdAt: -1 });

    console.log("📦 ORDERS FOUND:", orders.length);

    res.json(orders);
  } catch (err) {
    console.error("My orders error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


/* =================================================
   👤 GET MY ORDERS BY USER ID
   ================================================= */
router.get("/my/user/:id", async (req, res) => {
  try {
    const id = req.params.id;

    console.log("👤 USER ID FROM URL:", id);

    const orders = await Order.find({ userId: id })
      .populate("items.productId", "name price image")
      .sort({ createdAt: -1 });

    console.log("📦 ORDERS FOUND FOR USER:", orders.length);

    res.json(orders);
  } catch (err) {
    console.error("My orders by userId error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* =================================================
   📦 GET ALL ORDERS (ADMIN)
   ================================================= */
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("items.productId", "name price image")
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
   🚚 UPDATE ORDER STATUS (ADMIN) - WITH VALIDATION
   ================================================= */
router.patch("/status/:id", async (req, res) => {
  try {
    const { status, note, updatedBy } = req.body;

    const allowed = [
      "PLACED",
      "CONFIRMED",
      "SHIPPED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
      "RETURNED",
    ];

    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid order status" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // ✅ Prevent duplicate status update
    if (order.orderStatus === status) {
      return res.status(400).json({ 
        error: `Order is already in ${status} status. Cannot update to the same status.` 
      });
    }

    // ✅ Validation: Define allowed transitions
    const validTransitions = {
      "PLACED": ["CONFIRMED", "CANCELLED"],
      "CONFIRMED": ["SHIPPED", "CANCELLED"],
      "SHIPPED": ["OUT_FOR_DELIVERY", "CANCELLED"],
      "OUT_FOR_DELIVERY": ["DELIVERED", "CANCELLED"],
      "DELIVERED": ["RETURNED"],
      "CANCELLED": [],
      "RETURNED": [],
    };

    const currentStatus = order.orderStatus;
    const allowedNextStates = validTransitions[currentStatus] || [];

    // ✅ Check if the new status is a valid transition
    if (!allowedNextStates.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid transition: Cannot change from ${currentStatus} to ${status}. Allowed: ${allowedNextStates.join(", ") || "None"}` 
      });
    }

    // ✅ Update order with new status and track event
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: { orderStatus: status },
        $push: { trackingEvents: { status, note: note || "", updatedBy: updatedBy || null } },
      },
      { new: true }
    ).populate("items.productId", "name price image");

    // Send status update email to customer
    const emailResult = await sendOrderStatusEmail(
      updatedOrder.customer,
      updatedOrder._id,
      status,
      note
    );

    console.log("📧 Status update email result:", emailResult);

    res.json({ message: "Order status updated successfully", order: updatedOrder, emailSent: emailResult.success });
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* =================================================
   ❌ CANCEL ORDER (USER)
   ================================================= */
router.patch("/cancel/:id", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (String(order.userId) !== String(userId)) {
      return res.status(403).json({ error: "You can only cancel your own orders" });
    }

    const currentStatus = order.orderStatus || "PLACED";
    const cancellableStatuses = ["PLACED", "CONFIRMED"];

    if (!cancellableStatuses.includes(currentStatus)) {
      return res.status(400).json({
        error: `Order cannot be cancelled once it is ${currentStatus.replaceAll("_", " ")}`,
      });
    }

    await restockOrderItems(order);

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: { orderStatus: "CANCELLED" },
        $push: {
          trackingEvents: {
            status: "CANCELLED",
            note: "Cancelled by customer",
            updatedBy: order.userId || null,
          },
        },
      },
      { new: true }
    ).populate("items.productId", "name price image");

    const emailResult = await sendOrderStatusEmail(
      updatedOrder.customer,
      updatedOrder._id,
      "CANCELLED",
      "Cancelled by customer"
    );

    res.json({
      message: "Order cancelled successfully",
      order: updatedOrder,
      emailSent: emailResult.success,
    });
  } catch (err) {
    console.error("User cancel order error:", err);
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
   🧾 DOWNLOAD INVOICE PDF (IMPROVED LAYOUT)
   ================================================= */
router.get("/invoice/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.productId", "name");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const doc = new PDFDocument({ margin: 40, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order._id}.pdf`
    );

    doc.pipe(res);

    // Attempt to find a Windows font that contains the rupee glyph (₹).
    const findWindowsFont = () => {
      const candidates = [
        "C:\\Windows\\Fonts\\segoeui.ttf",
        "C:\\Windows\\Fonts\\arial.ttf",
        "C:\\Windows\\Fonts\\arialuni.ttf",
        "C:\\Windows\\Fonts\\calibri.ttf",
        "C:\\Windows\\Fonts\\Nirmala.ttf",
      ];
      for (const p of candidates) {
        try {
          if (fs.existsSync(p)) return p;
        } catch (e) {
          // ignore
        }
      }
      return null;
    };

    const currencyFontPath = findWindowsFont();
    const currencySymbol = "₹";

    // Return only numeric formatted amount; symbol is drawn with a font that supports it when available.
    const formatCurrency = (n) => `${Number(n).toFixed(2)}`;

    const writeCurrency = (value, x, y) => {
      const text = `${currencySymbol}${Number(value).toFixed(2)}`;
      if (currencyFontPath) {
        try {
          doc.font(currencyFontPath).text(text, x, y);
          doc.font("Helvetica");
          return;
        } catch (e) {
          // fallthrough to text fallback
        }
      }
      // Fallback when rupee glyph can't be rendered: use 'Rs.' prefix
      doc.text(`Rs.${Number(value).toFixed(2)}`, x, y);
    };

    /* ---------- HEADER: Company + Invoice ---------- */
    doc.fontSize(18).font("Helvetica-Bold").text("Fitness Store", 40, 40);
    doc.fontSize(12).font("Helvetica").text("123 Fitness Ave, Health City", 40, 62);
    doc.fontSize(12).text("Phone: +91-12345-67890", 40, 76);

    doc.fontSize(20).font("Helvetica-Bold").text("INVOICE", { align: "right" });
    doc.moveDown();

    doc.fontSize(10).font("Helvetica");
    doc.text(`Invoice ID: ${order._id}`, { align: "right" });
    doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`, { align: "right" });

    doc.moveDown(2);

    /* ---------- CUSTOMER & ORDER INFO ---------- */
    const customerX = 40;
    const infoX = 320;

    doc.fontSize(12).font("Helvetica-Bold").text("Bill To:", customerX);
    doc.fontSize(11).font("Helvetica").text(order.customer.name || "-", customerX + 60);
    doc.text(order.customer.address || "-", customerX + 60);
    doc.text(`Phone: ${order.customer.phone || "-"}`, customerX + 60);
    doc.text(`Pincode: ${order.customer.pincode || "-"}`, customerX + 60);

    doc.fontSize(12).font("Helvetica-Bold").text("Order Info:", infoX);
    doc.fontSize(11).font("Helvetica").text(`Order ID: ${order._id}`, infoX + 70);
    doc.text(`Status: ${order.orderStatus || '-'}`, infoX + 70);

    doc.moveDown(1.5);

    /* ---------- ITEMS TABLE ---------- */
    const tableTop = doc.y + 10;
    const itemX = 40;
    const qtyX = 320;
    const priceX = 380;
    const totalX = 460;

    doc.fontSize(12).font("Helvetica-Bold");
    doc.text("Item", itemX, tableTop);
    doc.text("Qty", qtyX, tableTop);
    doc.text("Price", priceX, tableTop);
    doc.text("Total", totalX, tableTop);

    const headerBottom = tableTop + 18;
    doc.moveTo(itemX, headerBottom).lineTo(550, headerBottom).stroke();

    let y = headerBottom + 8;
    doc.font("Helvetica").fontSize(11);

    order.items.forEach((item, i) => {
      const name = item.name || (item.productId && item.productId.name) || "Item";
      const qty = item.qty || 1;
      const unit = Number(item.price || 0);
      const lineTotal = unit * qty;

      // wrap long names
      doc.text(name, itemX, y, { width: 260 });
      doc.text(String(qty), qtyX, y);
      doc.text(unit, priceX, y);
      doc.text(lineTotal, totalX, y);

      const itemHeight = doc.heightOfString(name, { width: 260 });
      y += Math.max(itemHeight, 16);
      if (y > 720) {
        doc.addPage();
        y = 40;
      }
    });

    doc.moveTo(itemX, y + 4).lineTo(550, y + 4).stroke();

    /* ---------- AMOUNTS ---------- */
    const subtotal = order.items.reduce((s, it) => s + (Number(it.price || 0) * (it.qty || 1)), 0);
    const tax = 0; // placeholder
    const shipping = 0; // placeholder
    const grandTotal = Number(order.totalAmount || subtotal + tax + shipping);

    y += 12;
    doc.fontSize(12).font("Helvetica-Bold").text("Subtotal:", 380, y);
    doc.font("Helvetica");
    writeCurrency(subtotal, 460, y);
    y += 16;
    doc.font("Helvetica-Bold").text("Tax:", 380, y);
    doc.font("Helvetica");
    writeCurrency(tax, 460, y);
    y += 16;
    doc.font("Helvetica-Bold").text("Shipping:", 380, y);
    doc.font("Helvetica");
    writeCurrency(shipping, 460, y);
    y += 16;
    doc.fontSize(14).font("Helvetica-Bold").text("Total:", 380, y);
    writeCurrency(grandTotal, 460, y);

    y += 28;

    /* ---------- PAYMENT INFO ---------- */
    doc.fontSize(11).font("Helvetica-Bold").text("Payment Method:", 40, y);
    doc.font("Helvetica").text(order.paymentMethod || '-', 160, y);
    y += 16;
    doc.font("Helvetica-Bold").text("Payment Status:", 40, y);
    doc.fillColor(order.paymentStatus === "PAID" ? "green" : "red").font("Helvetica").text(order.paymentStatus || '-', 160, y);
    doc.fillColor("black");

    /* ---------- FOOTER ---------- */
    doc.fontSize(10).text("Thank you for your purchase! Visit again.", 40, 760, { align: "center", width: 520 });

    doc.end();
  } catch (err) {
    console.error("Invoice error:", err);
    res.status(500).json({ error: "Failed to generate invoice" });
  }
});

/* =================================================
   📦 GET SINGLE ORDER (USER/ADMIN) - for tracking
   ================================================= */
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.productId", "name price image");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    console.error("Fetch order error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
