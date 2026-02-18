const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  image: String,
  stock: { type: Number, default: 0, min: 0 },
  minimumStockThreshold: { type: Number, default: 5, min: 0 }
});

module.exports = mongoose.model("Product", productSchema);
