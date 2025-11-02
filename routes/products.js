const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Product = require("../models/product");

// ===== Multer Config =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../upload"));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// ✅ Get all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get single product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Add new product (with optional image upload)
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const imagePath = req.file
      ? `/upload/${req.file.filename}` // ✅ fixed: added leading slash
      : req.body.image
      ? String(req.body.image).replace(/^\/+/, "/")
      : "";

    const newProduct = new Product({
      ...req.body,
      image: imagePath,
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add product" });
  }
});

// ✅ Update product by ID (with optional image upload)
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.image = `/upload/${req.file.filename}`; // ✅ fixed
    } else if (req.body.image) {
      updateData.image = String(req.body.image).replace(/^\/+/, "/");
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update product" });
  }
});

// ✅ Delete product by ID
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete product" });
  }
});

module.exports = router;
