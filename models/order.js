const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // 👤 Customer details
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      address: { type: String, required: true },
      pincode: { type: String, required: true },
      landmark: String,
    },

    // Link order to a registered user (optional)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // 🛒 Cart items
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: String,
        price: Number,
        qty: Number,
      },
    ],

    // 💰 Total amount
    totalAmount: {
      type: Number,
      required: true,
    },

    // 💳 Payment
    paymentMethod: {
      type: String,
      enum: ["COD", "UPI", "CARD"],
      default: "COD",
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
    },

    orderStatus: {
      type: String,
      enum: ["PLACED", "CONFIRMED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED"],
      default: "PLACED",
    },

    // history of status changes for tracking
    trackingEvents: [
      {
        status: {
          type: String,
          enum: ["PLACED", "CONFIRMED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED"],
        },
        note: String,
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
