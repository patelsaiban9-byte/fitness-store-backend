const express = require("express");
const connectDb = require("./config/db");
const cors = require("cors");
const path = require("path");
const multer = require("multer"); // ✅ for file uploads

// Routes
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const authRoutes = require("./routes/auth");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Default route
app.get("/", (req, res) => {
  res.send("Welcome to the Health & Fitness Store API 🚀");
});

// ✅ Multer setup for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads")); // save inside /backend/uploads
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
  res.json({ imageUrl: `/uploads/${req.file.filename}` }); // return path to frontend
});

// API routes
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);

// serve static uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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
