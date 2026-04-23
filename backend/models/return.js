const mongoose = require("mongoose");

const returnSchema = new mongoose.Schema(
  {
    // Reference to the order
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    // Reference to the user who requested the return
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Items to return (can be full order or specific items)
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

    // Reason for return
    reason: {
      type: String,
      required: true,
      maxlength: 500,
    },

    // Return status
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "COMPLETED"],
      default: "PENDING",
    },

    // Admin notes (optional)
    adminNotes: {
      type: String,
      maxlength: 500,
    },

    // Who approved/rejected
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Review timestamp
    reviewedAt: {
      type: Date,
    },

    // Total refund amount
    refundAmount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Return", returnSchema);
