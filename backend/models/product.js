const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true, default: "General", trim: true },
  description: String,
  price: { type: Number, required: true },
  image: String,
  stock: { type: Number, default: 0, min: 0 },
  minimumStockThreshold: { type: Number, default: 5, min: 0 },
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  ratingCount: { type: Number, default: 0, min: 0 },
});

module.exports = mongoose.model("Product", productSchema);
