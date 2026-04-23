const express = require("express");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

// ✅ Configure Multer with memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

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

    console.log("📁 File details:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    // ✅ Upload to Cloudinary manually
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.v2.uploader.upload_stream(
        {
          folder: "fitness-store",
          allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
          transformation: [
            { width: 1000, height: 1000, crop: "limit", quality: "auto", fetch_format: "auto" }
          ]
        },
        (error, result) => {
          if (error) {
            console.error("❌ Cloudinary upload error:", error);
            reject(error);
          } else {
            console.log("✅ Cloudinary upload success:", result.secure_url);
            resolve(result);
          }
        }
      );
      
      stream.end(req.file.buffer);
    });

    const imageUrl = result.secure_url;
    console.log("✅ Image uploaded to Cloudinary:", imageUrl);

    res.status(200).json({ imageUrl });
  } catch (error) {
    console.error("❌ Upload error:", error);
    console.error("❌ Error details:", error.message);
    res.status(500).json({ message: "Failed to upload image", error: error.message });
  }
});

module.exports = router;
