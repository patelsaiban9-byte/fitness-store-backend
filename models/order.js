const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // 👤 Customer details
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      pincode: { type: String, required: true },
      landmark: String,
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
      enum: ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"],
      default: "PLACED",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
