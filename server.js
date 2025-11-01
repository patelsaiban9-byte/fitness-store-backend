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
const adminRoutes = require("./routes/admin"); // ✅ Admin routes (reports etc.)

// ✅ Middleware
app.use(express.json());

// ✅ CORS setup
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Local development
      "https://fitness-store-frontend-5qxu.vercel.app", // Deployed frontend
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ✅ Ensure backend_upload folder exists
const uploadDir = path.join(__dirname, "backend_upload");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use("/backend_upload", express.static(uploadDir));

// ✅ Mount all routes
app.use("/api/upload", uploadRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes); // ✅ Admin route added

// ✅ Default route
app.get("/", (req, res) => {
  res.send("Welcome to Health & Fitness Store API 🚀");
});

// ✅ 404 fallback for invalid routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ✅ Start server
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
