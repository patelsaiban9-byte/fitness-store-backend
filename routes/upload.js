const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

// ✅ Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "fitness-store", // Folder name in Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [
      {
        width: 1000,
        height: 1000,
        crop: "limit", // Limit dimensions, maintain aspect ratio
        quality: "auto", // Automatic quality optimization
        fetch_format: "auto", // Auto convert to WebP when supported
      },
    ],
  },
});

const upload = multer({ storage });

// ✅ POST route for image upload to Cloudinary
router.post("/", upload.single("image"), async (req, res) => {
  console.log("📤 Upload route called");
  console.log("📁 Request file:", req.file ? "Received" : "Missing");
  console.log("📋 Request body:", req.body);
  
  try {
    if (!req.file) {
      console.log("❌ No file in request");
      return res.status(400).json({ message: "No file uploaded" });
    }

    // ✅ Cloudinary returns secure_url in req.file.path
    const imageUrl = req.file.path;
    console.log("✅ Image uploaded to Cloudinary:", imageUrl);
    console.log("📊 File details:", {
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
    });

    res.status(200).json({ imageUrl });
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error);
    console.error("❌ Error details:", error.message);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({ message: "Failed to upload image", error: error.message });
  }
});

module.exports = router;
