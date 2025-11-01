const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// ✅ Use /uploads folder
const uploadDir = path.join(__dirname, "../uploads");

// ✅ Ensure the /uploads folder exists
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ✅ Multer storage configuration
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    // Sanitize file name and avoid collisions
    const safeName = file.originalname
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._-]/g, "");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// ✅ POST /api/upload
router.post("/", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  console.log("✅ File saved:", req.file.filename);

  // ✅ Return file path for frontend (e.g. /uploads/1730456189-img.jpg)
  res.status(200).json({ imageUrl: `/uploads/${req.file.filename}` });
});

module.exports = router;
