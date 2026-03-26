const express = require("express");
const router = express.Router();
const Order = require("../models/order");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const PDFDocument = require("pdfkit");
const { createCanvas } = require("canvas");
const ChartJS = require("chart.js");

const FIXED_ADMIN_EMAIL = "saiban@gmail.com";

const verifyAdminAccess = (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "No token provided" });
    return null;
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY || "defaultsecret");
    const isAdmin = decoded?.role === "admin" || decoded?.email === FIXED_ADMIN_EMAIL;

    if (!isAdmin) {
      res.status(403).json({ message: "Access denied: Admins only" });
      return null;
    }

    return decoded;
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
    return null;
  }
};

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

// Function to generate bar chart image
const generateBarChart = async (data, title, maxItems = 10) => {
  const canvas = createCanvas(800, 400);
  const ctx = canvas.getContext("2d");
  
  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 800, 400);
  
  // Title
  ctx.fillStyle = "#000000";
  ctx.font = "bold 18px Arial";
  ctx.textAlign = "center";
  ctx.fillText(title, 400, 30);
  
  // Get top items
  const items = data.slice(0, maxItems);
  const maxValue = Math.max(...items.map(d => d.value));
  
  // Draw bars
  const padding = 60;
  const barWidth = (800 - 2 * padding) / items.length;
  const chartHeight = 300;
  
  ctx.fillStyle = "#8884d8";
  items.forEach((item, idx) => {
    const x = padding + idx * barWidth + barWidth * 0.1;
    const barHeight = (item.value / maxValue) * chartHeight;
    const y = 350 - barHeight;
    
    ctx.fillRect(x, y, barWidth * 0.8, barHeight);
    
    // Label
    ctx.fillStyle = "#000000";
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    ctx.save();
    ctx.translate(x + barWidth * 0.4, 360);
    ctx.rotate(-Math.PI / 4);
    ctx.fillText(item.label.substring(0, 15), 0, 0);
    ctx.restore();
    
    // Value on top of bar
    ctx.fillText(item.value.toString(), x + barWidth * 0.4, y - 5);
  });
  
  return canvas.toBuffer("image/png");
};

// Function to generate pie chart image
const generatePieChart = async (data, title) => {
  const canvas = createCanvas(400, 400);
  const ctx = canvas.getContext("2d");
  
  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 400, 400);
  
  // Title
  ctx.fillStyle = "#000000";
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "center";
  ctx.fillText(title, 200, 25);
  
  // Calculate total
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Colors
  const colors = ["#28a745", "#ffc107", "#dc3545"];
  
  // Draw pie
  const centerX = 200;
  const centerY = 200;
  const radius = 120;
  let currentAngle = -Math.PI / 2;
  
  data.forEach((item, idx) => {
    const sliceAngle = (item.value / total) * 2 * Math.PI;
    
    // Draw slice
    ctx.fillStyle = colors[idx] || "#cccccc";
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.closePath();
    ctx.fill();
    
    // Draw label
    const labelAngle = currentAngle + sliceAngle / 2;
    const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
    const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
    
    const percentage = ((item.value / total) * 100).toFixed(0);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(percentage + "%", labelX, labelY);
    
    currentAngle += sliceAngle;
  });
  
  // Legend
  ctx.font = "12px Arial";
  ctx.textAlign = "left";
  data.forEach((item, idx) => {
    ctx.fillStyle = colors[idx] || "#cccccc";
    ctx.fillRect(30, 340 + idx * 20, 15, 15);
    ctx.fillStyle = "#000000";
    ctx.fillText(item.label + ` (${item.value})`, 50, 352 + idx * 20);
  });
  
  return canvas.toBuffer("image/png");
};

// Function to generate line chart image
const generateLineChart = async (data, title) => {
  const canvas = createCanvas(800, 400);
  const ctx = canvas.getContext("2d");
  
  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 800, 400);
  
  // Title
  ctx.fillStyle = "#000000";
  ctx.font = "bold 18px Arial";
  ctx.textAlign = "center";
  ctx.fillText(title, 400, 30);
  
  if (data.length === 0) return canvas.toBuffer("image/png");
  
  // Calculate scales
  const maxSales = Math.max(...data.map(d => d.sales));
  const maxOrders = Math.max(...data.map(d => d.orders));
  
  const padding = 60;
  const charWidth = (800 - 2 * padding) / (data.length - 1 || 1);
  const chartHeight = 300;
  
  // Draw grid
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = 350 - (i * chartHeight / 4);
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(800 - padding, y);
    ctx.stroke();
  }
  
  // Draw lines
  ctx.lineWidth = 3;
  
  // Sales line (blue)
  ctx.strokeStyle = "#8884d8";
  ctx.beginPath();
  data.forEach((item, idx) => {
    const x = padding + idx * charWidth;
    const y = 350 - (item.sales / maxSales) * chartHeight;
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  
  // Orders line (yellow)
  ctx.strokeStyle = "#ffc658";
  ctx.beginPath();
  data.forEach((item, idx) => {
    const x = padding + idx * charWidth;
    const y = 350 - (item.orders / maxOrders) * chartHeight;
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  
  // Draw points
  ctx.fillStyle = "#8884d8";
  data.forEach((item, idx) => {
    const x = padding + idx * charWidth;
    const y = 350 - (item.sales / maxSales) * chartHeight;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fill();
  });
  
  ctx.fillStyle = "#ffc658";
  data.forEach((item, idx) => {
    const x = padding + idx * charWidth;
    const y = 350 - (item.orders / maxOrders) * chartHeight;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fill();
  });
  
  // Labels
  ctx.fillStyle = "#000000";
  ctx.font = "10px Arial";
  ctx.textAlign = "center";
  data.forEach((item, idx) => {
    const x = padding + idx * charWidth;
    ctx.save();
    ctx.translate(x, 365);
    ctx.rotate(-Math.PI / 4);
    ctx.fillText(item.period.substring(0, 10), 0, 0);
    ctx.restore();
  });
  
  // Legend
  ctx.font = "12px Arial";
  ctx.textAlign = "left";
  ctx.fillStyle = "#8884d8";
  ctx.fillRect(100, 380, 15, 15);
  ctx.fillStyle = "#000000";
  ctx.fillText("Sales", 120, 392);
  
  ctx.fillStyle = "#ffc658";
  ctx.fillRect(200, 380, 15, 15);
  ctx.fillStyle = "#000000";
  ctx.fillText("Orders", 220, 392);
  
  return canvas.toBuffer("image/png");
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

    console.log(`📊 Found ${orders.length} orders for period ${safePeriod}`);

    const productMap = new Map();
    const customerMap = new Map();
    const salesTrendMap = new Map();
    let totalUnitsSold = 0;
    let totalRevenue = 0;

    for (const order of orders) {
      const items = Array.isArray(order.items) ? order.items : [];
      const customerEmail = order.customer?.email || order.userId?.toString() || `guest_${order._id}`;
      const customerName = order.customer?.name || "Guest Customer";
      const orderTotal = Number(order.totalAmount || 0);
      
      // Track sales trend based on period
      const orderDate = new Date(order.createdAt);
      let trendKey, trendLabel;
      
      if (safePeriod === "monthly") {
        // Group by month
        trendKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
        trendLabel = orderDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      } else if (safePeriod === "quarterly") {
        // Group by quarter
        const quarter = Math.floor(orderDate.getMonth() / 3) + 1;
        trendKey = `${orderDate.getFullYear()}-Q${quarter}`;
        trendLabel = `Q${quarter} ${orderDate.getFullYear()}`;
      } else {
        // Group by year
        trendKey = `${orderDate.getFullYear()}`;
        trendLabel = `${orderDate.getFullYear()}`;
      }
      
      if (!salesTrendMap.has(trendKey)) {
        salesTrendMap.set(trendKey, {
          trendKey,
          trendLabel,
          totalSales: 0,
          orderCount: 0,
        });
      }
      const trendData = salesTrendMap.get(trendKey);
      trendData.totalSales += orderTotal;
      trendData.orderCount += 1;

      // Track customer data only if order has valid amount
      if (orderTotal > 0) {
        if (!customerMap.has(customerEmail)) {
          customerMap.set(customerEmail, {
            customerName,
            customerEmail,
            totalOrders: 0,
            totalSpent: 0,
          });
        }
        const customerData = customerMap.get(customerEmail);
        customerData.totalOrders += 1;
        customerData.totalSpent += orderTotal;
      }

      // Track product data
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

    // Get top 10 customers by total spent
    const customers = Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
    const topCustomers = customers.slice(0, 10);

    // Get sales trend data sorted by time period
    const salesTrend = Array.from(salesTrendMap.values()).sort((a, b) => 
      a.trendKey.localeCompare(b.trendKey)
    );

    console.log(`👥 Found ${customers.length} unique customers, returning top ${topCustomers.length}`);
    console.log(`📈 Found ${salesTrend.length} ${safePeriod} periods with sales data`);

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
      salesTrend: salesTrend.map((period) => ({
        period: period.trendLabel,
        sales: period.totalSales,
        orders: period.orderCount,
      })),
      topCustomers: topCustomers.map((customer) => ({
        name: customer.customerName,
        email: customer.customerEmail,
        orders: customer.totalOrders,
        spent: customer.totalSpent,
      })),
    });
  } catch (error) {
    console.error("❌ Error generating admin report:", error);
    res.status(500).json({ message: "Failed to generate sales reports" });
  }
});

// PDF Export Route
router.get("/reports-pdf", async (req, res) => {
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
    const customerMap = new Map();
    const salesTrendMap = new Map();
    let totalUnitsSold = 0;
    let totalRevenue = 0;

    for (const order of orders) {
      const items = Array.isArray(order.items) ? order.items : [];
      const customerEmail = order.customer?.email || order.userId?.toString() || `guest_${order._id}`;
      const customerName = order.customer?.name || "Guest Customer";
      const orderTotal = Number(order.totalAmount || 0);

      const orderDate = new Date(order.createdAt);
      let trendKey, trendLabel;

      if (safePeriod === "monthly") {
        trendKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
        trendLabel = orderDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      } else if (safePeriod === "quarterly") {
        const quarter = Math.floor(orderDate.getMonth() / 3) + 1;
        trendKey = `${orderDate.getFullYear()}-Q${quarter}`;
        trendLabel = `Q${quarter} ${orderDate.getFullYear()}`;
      } else {
        trendKey = `${orderDate.getFullYear()}`;
        trendLabel = `${orderDate.getFullYear()}`;
      }

      if (!salesTrendMap.has(trendKey)) {
        salesTrendMap.set(trendKey, {
          trendKey,
          trendLabel,
          totalSales: 0,
          orderCount: 0,
        });
      }

      const trendData = salesTrendMap.get(trendKey);
      trendData.totalSales += orderTotal;
      trendData.orderCount += 1;

      if (orderTotal > 0) {
        if (!customerMap.has(customerEmail)) {
          customerMap.set(customerEmail, {
            customerName,
            customerEmail,
            totalOrders: 0,
            totalSpent: 0,
          });
        }
        const customerData = customerMap.get(customerEmail);
        customerData.totalOrders += 1;
        customerData.totalSpent += orderTotal;
      }

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

    const customers = Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
    const topCustomers = customers.slice(0, 10);

    const salesTrend = Array.from(salesTrendMap.values()).sort((a, b) => 
      a.trendKey.localeCompare(b.trendKey)
    );

    // Create PDF Document
    const doc = new PDFDocument({ margin: 30 });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=sales-report-${safePeriod}-${new Date().getTime()}.pdf`);

    doc.pipe(res);

    // Title
    doc.fontSize(24).font("Helvetica-Bold").text("Sales Report", { align: "center" });
    doc.fontSize(12).font("Helvetica").text(`Period: ${safePeriod.charAt(0).toUpperCase() + safePeriod.slice(1)}`, { align: "center" });
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, { align: "center" });
    doc.moveDown();

    // Summary Section
    doc.fontSize(14).font("Helvetica-Bold").text("Summary Statistics", { underline: true });
    doc.fontSize(11).font("Helvetica");
    
    const summaryData = [
      [`Total Orders`, `${orders.length}`],
      [`Total Units Sold`, `${totalUnitsSold}`],
      [`Total Products`, `${productsWithLevel.length}`],
      [`Total Revenue`, `₹${totalRevenue.toFixed(2)}`],
      [`Highest Selling Product`, `${topProduct?.productName || "N/A"}`],
    ];

    summaryData.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`);
    });

    doc.moveDown();

    // Generate and add charts
    try {
      // Bar Chart - Top Products
      const productChartData = productsWithLevel.slice(0, 10).map(p => ({
        label: p.productName,
        value: p.totalQty
      }));
      
      if (productChartData.length > 0) {
        const barChartImage = await generateBarChart(productChartData, "Top 10 Products by Quantity");
        doc.fontSize(14).font("Helvetica-Bold").text("Product Sales Chart", { underline: true });
        doc.image(barChartImage, { width: 500, height: 250 });
        doc.moveDown();
      }

      // Pie Chart - Product Categories
      const categoryChartData = [
        { label: "High Selling", value: highSelling.length },
        { label: "Medium Selling", value: mediumSelling.length },
        { label: "Low Selling", value: lowSelling.length }
      ].filter(d => d.value > 0);
      
      if (categoryChartData.length > 0) {
        const pieChartImage = await generatePieChart(categoryChartData, "Product Distribution");
        doc.fontSize(14).font("Helvetica-Bold").text("Product Categories Chart", { underline: true });
        doc.image(pieChartImage, { width: 350, height: 280 });
        doc.moveDown();
      }

      // Line Chart - Sales Trend
      const trendChartData = salesTrend.map(t => ({
        period: t.trendLabel,
        sales: t.totalSales,
        orders: t.orderCount
      }));
      
      if (trendChartData.length > 0) {
        const lineChartImage = await generateLineChart(trendChartData, "Sales Trend");
        doc.fontSize(14).font("Helvetica-Bold").text("Sales Trend Chart", { underline: true });
        doc.image(lineChartImage, { width: 500, height: 250 });
        doc.moveDown();
      }
    } catch (chartErr) {
      console.log("⚠️ Warning: Could not generate charts, continuing with text report:", chartErr.message);
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(9).font("Helvetica").text("─".repeat(80));
    doc.text("This is an automatically generated report. For more details, visit the admin dashboard.", { align: "center" });

    doc.end();

  } catch (error) {
    console.error("❌ Error generating PDF report:", error);
    res.status(500).json({ message: "Failed to generate PDF report" });
  }
});

// User Management: View/Search users
router.get("/users", async (req, res) => {
  try {
    const admin = verifyAdminAccess(req, res);
    if (!admin) return;

    const search = String(req.query.search || "").trim();
    const query = { role: { $ne: "admin" } };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-password -passwordResetOtp -passwordResetOtpExpiresAt")
      .sort({ createdAt: -1, _id: -1 });

    res.status(200).json(users);
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// User Management: Activate/Deactivate user
router.patch("/users/:id/status", async (req, res) => {
  try {
    const admin = verifyAdminAccess(req, res);
    if (!admin) return;

    const { isActive } = req.body;
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive (boolean) is required" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(403).json({ message: "Admin account cannot be modified" });
    }

    user.isActive = isActive;
    await user.save();

    const safeUser = await User.findById(req.params.id)
      .select("-password -passwordResetOtp -passwordResetOtpExpiresAt");

    res.status(200).json({
      message: isActive ? "User activated successfully" : "User deactivated successfully",
      user: safeUser,
    });
  } catch (error) {
    console.error("❌ Error updating user status:", error);
    res.status(500).json({ message: "Failed to update user status" });
  }
});

// User Management: Delete user
router.delete("/users/:id", async (req, res) => {
  try {
    const admin = verifyAdminAccess(req, res);
    if (!admin) return;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(403).json({ message: "Admin account cannot be deleted" });
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

module.exports = router;