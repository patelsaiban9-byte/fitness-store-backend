const express = require("express");
const router = express.Router();
const Order = require("../models/order");
const jwt = require("jsonwebtoken");

const FIXED_ADMIN_EMAIL = "saiban@gmail.com";

const getPeriodStartDate = (period) => {
  const now = new Date();
  const start = new Date(now);

  if (period === "yearly") {
    start.setMonth(now.getMonth() - 12);
  } else if (period === "quarterly") {
    start.setMonth(now.getMonth() - 3);
  } else {
    start.setMonth(now.getMonth() - 1);
  }

  return start;
};

const getSalesLevel = (qty, maxQty) => {
  if (!maxQty || maxQty <= 0) return "low";
  const ratio = qty / maxQty;
  if (ratio >= 0.7) return "high";
  if (ratio >= 0.3) return "medium";
  return "low";
};

// Admin Sales Reports Route
router.get("/reports", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY || "defaultsecret");

    const isAdmin = decoded?.role === "admin" || decoded?.email === FIXED_ADMIN_EMAIL;
    if (!isAdmin) {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    const period = (req.query.period || "monthly").toString().toLowerCase();
    const safePeriod = ["monthly", "quarterly", "yearly"].includes(period)
      ? period
      : "monthly";

    const startDate = getPeriodStartDate(safePeriod);

    const orders = await Order.find({
      createdAt: { $gte: startDate },
      orderStatus: { $nin: ["CANCELLED", "RETURNED"] },
    }).lean();

    const productMap = new Map();
    let totalUnitsSold = 0;
    let totalRevenue = 0;

    for (const order of orders) {
      const items = Array.isArray(order.items) ? order.items : [];
      for (const item of items) {
        const productName = item?.name || "Unknown Product";
        const qty = Number(item?.qty || 0);
        const price = Number(item?.price || 0);

        if (!productMap.has(productName)) {
          productMap.set(productName, {
            productName,
            totalQty: 0,
            totalRevenue: 0,
          });
        }

        const current = productMap.get(productName);
        current.totalQty += qty;
        current.totalRevenue += qty * price;

        totalUnitsSold += qty;
        totalRevenue += qty * price;
      }
    }

    const products = Array.from(productMap.values()).sort((a, b) => b.totalQty - a.totalQty);
    const maxQty = products.length > 0 ? products[0].totalQty : 0;

    const productsWithLevel = products.map((product) => ({
      ...product,
      level: getSalesLevel(product.totalQty, maxQty),
    }));

    const highSelling = productsWithLevel.filter((p) => p.level === "high");
    const mediumSelling = productsWithLevel.filter((p) => p.level === "medium");
    const lowSelling = productsWithLevel.filter((p) => p.level === "low");

    const topProduct = productsWithLevel[0] || null;

    res.status(200).json({
      period: safePeriod,
      range: {
        startDate,
        endDate: new Date(),
      },
      summary: {
        totalOrders: orders.length,
        totalProducts: productsWithLevel.length,
        totalUnitsSold,
        totalRevenue,
        topProduct,
      },
      chartData: productsWithLevel.map((product) => ({
        label: product.productName,
        qty: product.totalQty,
        revenue: product.totalRevenue,
        level: product.level,
      })),
      groups: {
        highSelling,
        mediumSelling,
        lowSelling,
      },
    });
  } catch (error) {
    console.error("❌ Error generating admin report:", error);
    res.status(500).json({ message: "Failed to generate sales reports" });
  }
});

module.exports = router;