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

    // 🛒 Cart items (multiple products)
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

    // 💰 Total cart amount
    totalAmount: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
