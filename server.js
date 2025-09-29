const express = require("express");
const connectDb = require("./config/db");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

// Routes
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const authRoutes = require("./routes/auth");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// ✅ Ensure uploads folder exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ Serve static uploads (must be BEFORE routes)
app.use("/uploads", express.static(uploadDir));

// Default route
app.get("/", (req, res) => {
  res.send("Welcome to the Health & Fitness Store API 🚀");
});

// ✅ Multer setup for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // save inside /backend/uploads
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // unique filename
  },
});
const upload = multer({ storage });

// ✅ Upload route
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  // Return the relative path so frontend can use `${API_URL}${imageUrl}`
  res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

// API routes
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);

// Start server after DB connection
(async () => {
  try {
    await connectDb();
    app.listen(5000, () => {
      console.log("🚀 Server running at http://localhost:5000");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
  }
})();
