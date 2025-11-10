// ✅ Load environment variables
require("dotenv").config();

const express = require("express");
const connectDb = require("./config/db");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

// ✅ Import Routes
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const authRoutes = require("./routes/auth");
const uploadRoutes = require("./routes/upload");
const adminRoutes = require("./routes/admin");

// ✅ Middleware
app.use(express.json());

// ✅ CORS setup
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Local frontend
      "https://fitness-store-frontend-5qxu.vercel.app", // Deployed frontend
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ✅ Ensure 'upload' folder exists (only if not in serverless environment)
// In serverless environments like AWS Lambda, use /tmp instead
const isServerless = 
  process.env.AWS_LAMBDA_FUNCTION_NAME || 
  process.env.VERCEL || 
  process.env.NETLIFY ||
  __dirname.startsWith("/var/task"); // AWS Lambda detection

const uploadDir = isServerless 
  ? path.join("/tmp", "upload") 
  : path.join(__dirname, "upload");

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  // ✅ Serve static images from /upload (for browser access)
  app.use("/upload", express.static(uploadDir));
} catch (error) {
  // In serverless environments, static file serving may not be needed
  // since files are uploaded directly to Cloudinary
  console.log("ℹ️  Upload directory not available (using Cloudinary for storage)");
}

// ✅ Mount Routes
app.use("/api/upload", uploadRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// ✅ Default Route
app.get("/", (req, res) => {
  res.send("Welcome to Health & Fitness Store API 🚀");
});

// ✅ 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ✅ Start Server
(async () => {
  try {
    await connectDb();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () =>
      console.log(`🚀 Server running at http://localhost:${PORT}`)
    );
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
})();
