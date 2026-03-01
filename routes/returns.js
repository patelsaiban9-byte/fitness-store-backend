const express = require("express");
const router = express.Router();
const Return = require("../models/return");
const Order = require("../models/order");
const Product = require("../models/product");
const { sendReturnRequestEmail, sendReturnStatusEmail } = require("../utils/emailService");

/* =================================================
   📦 CREATE RETURN REQUEST (USER)
   ================================================= */
router.post("/", async (req, res) => {
  try {
    const { orderId, userId, items, reason, refundAmount } = req.body;

    // Validate required fields
    if (!orderId || !userId || !items || !reason || !refundAmount) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if order exists and belongs to user
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.userId.toString() !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Check if order is eligible for return (e.g., DELIVERED status)
    if (order.orderStatus !== "DELIVERED") {
      return res.status(400).json({ 
        error: "Only delivered orders can be returned" 
      });
    }

    // Check if return request already exists for this order
    const existingReturn = await Return.findOne({ 
      orderId, 
      status: { $in: ["PENDING", "APPROVED"] } 
    });
    
    if (existingReturn) {
      return res.status(400).json({ 
        error: "A return request already exists for this order" 
      });
    }

    // Create new return request
    const newReturn = new Return({
      orderId,
      userId,
      items,
      reason,
      refundAmount,
      status: "PENDING",
    });

    await newReturn.save();

    // ✅ Send return request email to user
    try {
      await sendReturnRequestEmail({
        customer: order.customer,
        orderId: order._id.toString().slice(-8).toUpperCase(),
        returnId: newReturn._id.toString().slice(-8).toUpperCase(),
        items: items,
        refundAmount: refundAmount,
        reason: reason,
      });
    } catch (emailErr) {
      console.error("⚠️ Failed to send return request email:", emailErr.message);
      // Don't fail the request if email fails
    }

    res.status(201).json({ 
      message: "Return request submitted successfully",
      returnRequest: newReturn 
    });
  } catch (err) {
    console.error("❌ Create return error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* =================================================
   📋 GET ALL RETURNS (ADMIN)
   ================================================= */
router.get("/admin/all", async (req, res) => {
  try {
    const returns = await Return.find()
      .populate("orderId")
      .populate("userId", "name email")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 });

    res.json(returns);
  } catch (err) {
    console.error("❌ Fetch all returns error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* =================================================
   📋 GET USER'S RETURNS
   ================================================= */
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const returns = await Return.find({ userId })
      .populate("orderId")
      .sort({ createdAt: -1 });

    res.json(returns);
  } catch (err) {
    console.error("❌ Fetch user returns error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* =================================================
   📋 GET RETURN BY ID
   ================================================= */
router.get("/:returnId", async (req, res) => {
  try {
    const { returnId } = req.params;

    const returnRequest = await Return.findById(returnId)
      .populate("orderId")
      .populate("userId", "name email phone")
      .populate("reviewedBy", "name");

    if (!returnRequest) {
      return res.status(404).json({ error: "Return request not found" });
    }

    res.json(returnRequest);
  } catch (err) {
    console.error("❌ Fetch return error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* =================================================
   ✅ APPROVE RETURN (ADMIN)
   ================================================= */
router.patch("/:returnId/approve", async (req, res) => {
  try {
    const { returnId } = req.params;
    const { adminNotes, adminId } = req.body;

    const returnRequest = await Return.findById(returnId);
    if (!returnRequest) {
      return res.status(404).json({ error: "Return request not found" });
    }

    if (returnRequest.status !== "PENDING") {
      return res.status(400).json({ 
        error: "Only pending returns can be approved" 
      });
    }

    // Validate adminId is a valid ObjectId
    const mongoose = require("mongoose");
    const isValidAdminId = adminId && mongoose.Types.ObjectId.isValid(adminId);

    // Update return status
    returnRequest.status = "APPROVED";
    returnRequest.adminNotes = adminNotes || "";
    returnRequest.reviewedBy = isValidAdminId ? adminId : null;
    returnRequest.reviewedAt = new Date();

    await returnRequest.save();

    // Update order status to RETURNED
    await Order.findByIdAndUpdate(returnRequest.orderId, {
      orderStatus: "RETURNED",
      $push: {
        trackingEvents: {
          status: "RETURNED",
          note: "Return request approved",
          updatedBy: isValidAdminId ? adminId : null,
        },
      },
    });

    // Restore stock for returned items
    for (const item of returnRequest.items) {
      if (item.productId) {
        const product = await Product.findById(item.productId);
        if (product && product.stock != null) {
          product.stock += item.qty;
          await product.save();
        }
      }
    }

    // ✅ Send approval email to user
    try {
      const order = await Order.findById(returnRequest.orderId);
      if (order) {
        await sendReturnStatusEmail({
          customer: order.customer,
          orderId: order._id.toString().slice(-8).toUpperCase(),
          returnId: returnRequest._id.toString().slice(-8).toUpperCase(),
          status: "APPROVED",
          refundAmount: returnRequest.refundAmount,
          adminNotes: returnRequest.adminNotes,
        });
      }
    } catch (emailErr) {
      console.error("⚠️ Failed to send approval email:", emailErr.message);
      // Don't fail the request if email fails
    }

    res.json({ 
      message: "Return approved successfully",
      returnRequest 
    });
  } catch (err) {
    console.error("❌ Approve return error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* =================================================
   ❌ REJECT RETURN (ADMIN)
   ================================================= */
router.patch("/:returnId/reject", async (req, res) => {
  try {
    const { returnId } = req.params;
    const { adminNotes, adminId } = req.body;

    const returnRequest = await Return.findById(returnId);
    if (!returnRequest) {
      return res.status(404).json({ error: "Return request not found" });
    }

    if (returnRequest.status !== "PENDING") {
      return res.status(400).json({ 
        error: "Only pending returns can be rejected" 
      });
    }

    // Validate adminId is a valid ObjectId
    const mongoose = require("mongoose");
    const isValidAdminId = adminId && mongoose.Types.ObjectId.isValid(adminId);

    // Update return status
    returnRequest.status = "REJECTED";
    returnRequest.adminNotes = adminNotes || "";
    returnRequest.reviewedBy = isValidAdminId ? adminId : null;
    returnRequest.reviewedAt = new Date();

    await returnRequest.save();

    // ✅ Send rejection email to user
    try {
      const order = await Order.findById(returnRequest.orderId);
      if (order) {
        await sendReturnStatusEmail({
          customer: order.customer,
          orderId: order._id.toString().slice(-8).toUpperCase(),
          returnId: returnRequest._id.toString().slice(-8).toUpperCase(),
          status: "REJECTED",
          refundAmount: returnRequest.refundAmount,
          adminNotes: returnRequest.adminNotes,
        });
      }
    } catch (emailErr) {
      console.error("⚠️ Failed to send rejection email:", emailErr.message);
      // Don't fail the request if email fails
    }

    res.json({ 
      message: "Return rejected successfully",
      returnRequest 
    });
  } catch (err) {
    console.error("❌ Reject return error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* =================================================
   🗑️ DELETE RETURN (ADMIN)
   ================================================= */
router.delete("/:returnId", async (req, res) => {
  try {
    const { returnId } = req.params;

    const returnRequest = await Return.findByIdAndDelete(returnId);
    if (!returnRequest) {
      return res.status(404).json({ error: "Return request not found" });
    }

    res.json({ message: "Return request deleted successfully" });
  } catch (err) {
    console.error("❌ Delete return error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
