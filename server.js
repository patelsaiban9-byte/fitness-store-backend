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

// ✅ CORS setup: allow both local dev and deployed frontend
app.use(
  cors({
    origin: [
      "http://localhost:5173", // local dev
      "https://fitness-store-frontend-5qxu.vercel.app", // deployed Vercel frontend
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Handle preflight requests globally
app.options("*", cors());

// Ensure backend_upload folder exists
const uploadDir = path.join(__dirname, "backend_upload");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Serve static files
app.use("/backend_upload", express.static(uploadDir));

// API Routes
app.use("/api/upload", uploadRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);

// Default route
app.get("/", (req, res) => res.send("Welcome to Health & Fitness Store API 🚀"));

// Start server
(async () => {
  try {
    await connectDb();

    // Use PORT from Render or fallback to 5000
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () =>
      console.log(`🚀 Server running at http://localhost:${PORT}`)
    );
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1); // ensure Render marks deploy as failed if DB connection fails
  }
})();
