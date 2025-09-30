const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  pincode: { type: String, required: true },   // ✅ added pincode
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", orderSchema);
