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

// ✅ CORS setup
const allowedOrigins = [
  "http://localhost:5173",
  "https://fitness-store-frontend-5qxu.vercel.app",
  "https://fitness-store-frontend-bu4v.vercel.app", // add your new Vercel URL
];

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// Handle preflight requests for all routes
app.options("*", cors());

// Serve backend_upload folder
const uploadDir = path.join(__dirname, "backend_upload");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use("/backend_upload", express.static(uploadDir));

// Routes
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
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
  } catch (error) {
    console.error("❌ Failed to start server:", error);
  }
})();
