const express = require("express");
const connectDb = require("./config/db");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// Routes
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const authRoutes = require("./routes/auth");
const uploadRoutes = require("./routes/upload"); // ✅ Upload route

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Uploads folder created at:", uploadDir);
}

// Serve static uploads
app.use("/uploads", express.static(uploadDir));

// Default route
app.get("/", (req, res) => {
  res.send("Welcome to the Health & Fitness Store API 🚀");
});

// Upload route
app.use("/api/upload", uploadRoutes);

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
