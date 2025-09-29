const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Path to uploads folder
const uploadDir = path.join(__dirname, "../uploads");

// Ensure uploads folder exists
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer setup
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir); // save files in /uploads
  },
  filename(req, file, cb) {
    // Use timestamp + original file extension
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// POST /api/upload
router.post("/", upload.single("image"), (req, res) => {
  console.log("Upload request received");
  if (!req.file) {
    console.log("No file received");
    return res.status(400).json({ message: "No file uploaded" });
  }
  console.log("File saved:", req.file.filename);

  // Return path starting with /uploads so frontend can access
  res.status(200).json({ imageUrl: `/uploads/${req.file.filename}` });
});

module.exports = router;
