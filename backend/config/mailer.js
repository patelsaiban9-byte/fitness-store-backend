const nodemailer = require("nodemailer");

// Create transporter using environment variables or default Gmail
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_PASSWORD || "your-app-password",
  },
  tls: {
    rejectUnauthorized: false, // Fix for SSL certificate issue
  },
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.log("❌ Email service not configured properly:", error);
  } else {
    console.log("✅ Email service ready");
  }
});

module.exports = transporter;
