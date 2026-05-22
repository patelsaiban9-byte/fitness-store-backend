const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const multer = require("multer");
const CloudinaryStorage = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const Product = require("../models/product");
const Rating = require("../models/rating");

// ===== Cloudinary Storage Config =====
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "fitness-store",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [
      {
        width: 1000,
        height: 1000,
        crop: "limit",
        quality: "auto",
        fetch_format: "auto",
      },
    ],
  },
});

const upload = multer({ storage });

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ✅ Helper to ensure image is full URL (backward compatibility with old paths)
const ensureFullImageUrl = (imagePath, req) => {
  if (!imagePath) return "";
  
  // If already a full URL (Cloudinary or existing full URLs), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If old relative path, try to convert (for backward compatibility)
  // This handles old images that might still be on local filesystem
  if (imagePath.startsWith('/upload/') || imagePath.startsWith('upload/')) {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.get('host') || req.headers.host;
    const baseUrl = process.env.BACKEND_URL || `${protocol}://${host}`;
    const filename = imagePath.replace(/^\/?upload\//, "");
    return `${baseUrl}/upload/${filename}`;
  }
  
  return imagePath;
};

// ✅ Get all products (fix image URLs to be full URLs)
router.get("/", async (req, res) => {
  try {
    const category = (req.query.category || "").trim();
    const normalizedCategory = escapeRegex(category);
    const filter = category
      ? { category: { $regex: `^${normalizedCategory}$`, $options: "i" } }
      : {};

    const products = await Product.find(filter);
    
    // ✅ Fix any relative paths to full URLs before sending
    const productsWithFullUrls = products.map(product => ({
      ...product.toObject(),
      image: product.image ? ensureFullImageUrl(product.image, req) : product.image
    }));
    
    res.json(productsWithFullUrls);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get products by category
router.get("/category/:category", async (req, res) => {
  try {
    const category = (req.params.category || "").trim();
    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    const normalizedCategory = escapeRegex(category);

    const products = await Product.find({
      category: { $regex: `^${normalizedCategory}$`, $options: "i" },
    });

    const productsWithFullUrls = products.map((product) => ({
      ...product.toObject(),
      image: product.image ? ensureFullImageUrl(product.image, req) : product.image,
    }));

    res.json(productsWithFullUrls);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get single product by ID (fix image URL to be full URL and include rating stats)
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ✅ Calculate average rating and rating count from rating records
    const [ratingStats] = await Rating.aggregate([
      { $match: { productId: product._id } },
      {
        $group: {
          _id: "$productId",
          averageRating: { $avg: "$rating" },
          ratingCount: { $sum: 1 },
        },
      },
    ]);

    const productData = product.toObject();
    if (productData.image) {
      productData.image = ensureFullImageUrl(productData.image, req);
    }

    productData.averageRating = ratingStats?.averageRating
      ? Number(ratingStats.averageRating.toFixed(1))
      : 0;
    productData.ratingCount = ratingStats?.ratingCount || 0;

    res.json(productData);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Add new product (with optional image upload to Cloudinary)
router.post("/", upload.single("image"), async (req, res) => {
  try {
    let imagePath = "";
    
    if (req.file) {
      // ✅ Cloudinary upload - req.file.path contains the full Cloudinary URL
      imagePath = req.file.path;
      console.log("✅ Product image uploaded to Cloudinary:", imagePath);
    } else if (req.body.image) {
      // ✅ Existing URL or path - ensure it's full URL (backward compatibility)
      imagePath = ensureFullImageUrl(req.body.image, req);
    }

    const newProduct = new Product({
      ...req.body,
      image: imagePath,
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    console.error("❌ Error adding product:", err);
    res.status(500).json({ message: "Failed to add product", error: err.message });
  }
});

// ✅ Update product by ID (with optional image upload to Cloudinary)
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    if (req.file) {
      // ✅ Cloudinary upload - req.file.path contains the full Cloudinary URL
      // TODO: Optionally delete old Cloudinary image if exists
      updateData.image = req.file.path;
      console.log("✅ Product image updated in Cloudinary:", updateData.image);
    } else if (req.body.image) {
      // ✅ Existing URL or path - ensure it's full URL (backward compatibility)
      updateData.image = ensureFullImageUrl(req.body.image, req);
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
    console.error("❌ Error updating product:", err);
    res.status(500).json({ message: "Failed to update product", error: err.message });
  }
});

// ✅ Update product stock (dedicated endpoint for restocking)
router.patch("/:id/stock", async (req, res) => {
  try {
    const { stock, minimumStockThreshold } = req.body;
    
    const updateData = {};
    if (stock !== undefined) {
      if (stock < 0) {
        return res.status(400).json({ message: "Stock cannot be negative" });
      }
      updateData.stock = stock;
    }
    if (minimumStockThreshold !== undefined) {
      if (minimumStockThreshold < 0) {
        return res.status(400).json({ message: "Minimum stock threshold cannot be negative" });
      }
      updateData.minimumStockThreshold = minimumStockThreshold;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No stock data provided" });
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ 
      message: "Stock updated successfully", 
      product: updated 
    });
  } catch (err) {
    console.error("❌ Error updating stock:", err);
    res.status(500).json({ message: "Failed to update stock", error: err.message });
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

// ✅ Submit or update a user rating for a product
router.post("/:id/rate", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  let payload;

  try {
    payload = jwt.verify(token, process.env.JWT_SECRET_KEY || "defaultsecret");
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  const userId = payload?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { rating } = req.body;
  const safeRating = Number(rating);

  if (!Number.isFinite(safeRating) || safeRating < 1 || safeRating > 5) {
    return res.status(400).json({ message: "Rating must be a number between 1 and 5" });
  }

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const existingRating = await Rating.findOne({
      productId: req.params.id,
      userId,
    });

    if (existingRating) {
      existingRating.rating = safeRating;
      existingRating.createdAt = new Date();
      await existingRating.save();
    } else {
      await Rating.create({ productId: req.params.id, userId, rating: safeRating });
    }

    const [ratingStats] = await Rating.aggregate([
      { $match: { productId: product._id } },
      {
        $group: {
          _id: "$productId",
          averageRating: { $avg: "$rating" },
          ratingCount: { $sum: 1 },
        },
      },
    ]);

    product.ratingCount = ratingStats?.ratingCount || 0;
    product.averageRating = ratingStats?.averageRating
      ? Number(ratingStats.averageRating.toFixed(1))
      : 0;

    await product.save();

    res.json({
      message: "Rating submitted successfully",
      averageRating: product.averageRating,
      ratingCount: product.ratingCount,
    });
  } catch (err) {
    console.error("❌ Rating submit error:", err);
    res.status(500).json({ message: "Failed to submit rating" });
  }
});

module.exports = router;
