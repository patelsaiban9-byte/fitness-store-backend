// ✅ Load environment variables
require("dotenv").config({ path: __dirname + "/.env" });

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
const returnRoutes = require("./routes/returns");
const feedbackRoutes = require("./routes/feedback");
const wishlistRoutes = require("./routes/wishlist");

// ✅ Middleware
app.use(express.json());

// ✅ CORS setup
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://fitness-store-frontend.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy block: origin ${origin} not allowed`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  next();
});

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
app.use("/api/returns", returnRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/wishlist", wishlistRoutes);

// ✅ Default Route
app.get("/", (req, res) => {
  res.send("Welcome to Health & Fitness Store API 🚀");
});

// ✅ 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ✅ Start Server (only for local development)
if (process.env.NODE_ENV !== "production") {
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
} else {
  // ✅ Connect to DB in production (Vercel)
  connectDb().catch(err => console.error("❌ DB connection error:", err));
}

// ✅ Export for Vercel serverless
module.exports = app;
