const express = require("express");
const connectDb = require("./config/db");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// Routes
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const authRoutes = require("./routes/auth");
const uploadRoutes = require("./routes/upload");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Ensure backend_upload folder exists
const uploadDir = path.join(__dirname, "backend_upload");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Serve static backend_upload folder so frontend can access images
app.use("/backend_upload", express.static(uploadDir));

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
