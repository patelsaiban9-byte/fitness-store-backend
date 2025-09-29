const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Path to uploads folder (backend/uploads)
const uploadDir = path.join(__dirname, "../uploads");

// Ensure uploads folder exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Uploads folder created:", uploadDir);
}

// Multer configuration
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

// Limit file size to 5MB
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// POST /api/upload
router.post("/", upload.single("image"), (req, res) => {
  console.log("Upload request received");
  if (!req.file) {
    console.log("No file received");
    return res.status(400).json({ message: "No file uploaded" });
  }
  console.log("File saved:", req.file.filename);
  res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

module.exports = router;
