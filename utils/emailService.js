const transporter = require("../config/mailer");

// Send order confirmation email
const sendOrderConfirmationEmail = async (orderData) => {
  const { customer, orderId, items, totalAmount } = orderData;

  try {
    // Generate HTML email template
    const itemsHtml = items
      .map(
        (item) =>
          `<tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">₹${item.price}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.qty}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.price * item.qty}</td>
          </tr>`
      )
      .join("");

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px;">
        <div style="background-color: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <h2 style="color: #333; text-align: center;">✅ Order Confirmation</h2>
          <hr style="border: 1px solid #ddd;">
          
          <p style="color: #555; font-size: 16px;">Dear <strong>${customer.name}</strong>,</p>
          
          <p style="color: #555; font-size: 14px;">Thank you for your order! We're excited to prepare your fitness products.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Order Details</h3>
            <p style="color: #666; margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <h3 style="color: #333;">Items Ordered:</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Product</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Price</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Qty</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="text-align: right; padding: 15px 0; border-top: 2px solid #ddd; border-bottom: 2px solid #ddd;">
            <h3 style="color: #333; margin: 10px 0;"><strong>Total Amount: ₹${totalAmount}</strong></h3>
          </div>

          <h3 style="color: #333;">Delivery Address:</h3>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #666; margin: 5px 0;">${customer.address}</p>
            <p style="color: #666; margin: 5px 0;">Pincode: ${customer.pincode}</p>
            ${customer.landmark ? `<p style="color: #666; margin: 5px 0;">Landmark: ${customer.landmark}</p>` : ""}
            <p style="color: #666; margin: 5px 0;">Phone: ${customer.phone}</p>
          </div>

          <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4caf50;">
            <p style="color: #2e7d32; margin: 0;"><strong>📦 What's Next?</strong></p>
            <p style="color: #666; margin: 10px 0; font-size: 14px;">You will receive an email update once your order is confirmed and shipped. You can track your order status anytime.</p>
          </div>

          <p style="color: #666; font-size: 14px; margin-top: 20px;">If you have any questions, please don't hesitate to contact us.</p>
          
          <hr style="border: 1px solid #ddd; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            <strong>Fitness Store</strong><br>
            Your trusted fitness equipment provider
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || "noreply@fitnessstore.com",
      to: customer.email,
      subject: `Order Confirmation - Order #${orderId}`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Confirmation email sent:", info.response);
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return { success: false, error: error.message };
  }
};

// Send order status update email
const sendOrderStatusEmail = async (customer, orderId, newStatus, note = "") => {
  try {
    const statusMessages = {
      CONFIRMED: "Your order has been confirmed and is being prepared.",
      SHIPPED: "Your order is on its way to you!",
      OUT_FOR_DELIVERY: "Your order is out for delivery today.",
      DELIVERED: "Your order has been delivered successfully.",
      CANCELLED: "Your order has been cancelled.",
      RETURNED: "Your return has been processed.",
    };

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px;">
        <div style="background-color: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <h2 style="color: #333; text-align: center;">📦 Order Status Update</h2>
          <hr style="border: 1px solid #ddd;">
          
          <p style="color: #555; font-size: 16px;">Dear <strong>${customer.name}</strong>,</p>
          
          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196f3;">
            <p style="color: #1565c0; margin: 0;"><strong>Order #${orderId}</strong></p>
            <p style="color: #1565c0; margin: 10px 0; font-size: 18px;"><strong>${newStatus}</strong></p>
            <p style="color: #555; margin: 10px 0;">${statusMessages[newStatus] || ""}</p>
            ${note ? `<p style="color: #555; margin: 10px 0; font-style: italic;">Note: ${note}</p>` : ""}
          </div>

          <p style="color: #666; font-size: 14px; margin-top: 20px;">Thank you for shopping with us!</p>
          
          <hr style="border: 1px solid #ddd; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            <strong>Fitness Store</strong><br>
            Your trusted fitness equipment provider
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || "noreply@fitnessstore.com",
      to: customer.email,
      subject: `Order Status Update - Order #${orderId}`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Status update email sent:", info.response);
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("❌ Error sending status email:", error);
    return { success: false, error: error.message };
  }
};

// Send low stock alert email to admin
const sendLowStockAlert = async (productData) => {
  const { productName, productId, currentStock, minimumThreshold } = productData;

  try {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    
    if (!adminEmail) {
      console.warn("⚠️ No admin email configured. Skipping low stock alert.");
      return { success: false, error: "Admin email not configured" };
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fff3cd; padding: 20px;">
        <div style="background-color: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); border-left: 4px solid #ff9800;">
          <h2 style="color: #d84315; text-align: center;">⚠️ Low Stock Alert</h2>
          <hr style="border: 1px solid #ddd;">
          
          <p style="color: #555; font-size: 16px;">Dear Admin,</p>
          
          <p style="color: #555; font-size: 14px;">This is an automated alert to inform you that the following product is running low on stock:</p>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff9800;">
            <h3 style="color: #d84315; margin-top: 0;">Product Details</h3>
            <p style="color: #666; margin: 5px 0;"><strong>Product Name:</strong> ${productName}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Product ID:</strong> ${productId}</p>
            <p style="color: #d84315; margin: 5px 0; font-size: 18px;"><strong>Current Stock: ${currentStock} units</strong></p>
            <p style="color: #666; margin: 5px 0;"><strong>Minimum Threshold:</strong> ${minimumThreshold} units</p>
          </div>

          <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f44336;">
            <p style="color: #c62828; margin: 0;"><strong>⚠️ Action Required:</strong></p>
            <p style="color: #666; margin: 10px 0; font-size: 14px;">Please restock this product as soon as possible to avoid running out of stock and disappointing customers.</p>
          </div>

          <p style="color: #666; font-size: 14px; margin-top: 20px;">This is an automated alert from your inventory management system.</p>
          
          <hr style="border: 1px solid #ddd; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            <strong>Fitness Store</strong><br>
            Inventory Management System
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || "noreply@fitnessstore.com",
      to: adminEmail,
      subject: `🚨 Low Stock Alert - ${productName}`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Low stock alert email sent:", info.response);
    return { success: true, message: "Low stock alert email sent successfully" };
  } catch (error) {
    console.error("❌ Error sending low stock alert email:", error);
    return { success: false, error: error.message };
  }
};

// Send return request email to user
const sendReturnRequestEmail = async (returnData) => {
  const { customer, orderId, returnId, items, refundAmount, reason } = returnData;

  try {
    const itemsHtml = items
      .map(
        (item) =>
          `<tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">₹${item.price}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.qty}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.price * item.qty}</td>
          </tr>`
      )
      .join("");

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px;">
        <div style="background-color: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <h2 style="color: #333; text-align: center;">🔄 Return Request Received</h2>
          <hr style="border: 1px solid #ddd;">
          
          <p style="color: #555; font-size: 16px;">Dear <strong>${customer.name}</strong>,</p>
          
          <p style="color: #555; font-size: 14px;">We have received your return request. Our team will review it and get back to you shortly.</p>
          
          <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff9800;">
            <h3 style="color: #333; margin-top: 0;">Return Request Details</h3>
            <p style="color: #666; margin: 5px 0;"><strong>Return ID:</strong> ${returnId}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Status:</strong> <span style="color: #ff9800; font-weight: bold;">PENDING REVIEW</span></p>
          </div>

          <h3 style="color: #333;">Items to Return:</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Product</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Price</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Qty</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="text-align: right; padding: 15px 0; border-top: 2px solid #ddd; border-bottom: 2px solid #ddd;">
            <h3 style="color: #333; margin: 10px 0;"><strong>Refund Amount: ₹${refundAmount}</strong></h3>
          </div>

          <h3 style="color: #333;">Reason for Return:</h3>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #666; margin: 0;">${reason}</p>
          </div>

          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196f3;">
            <p style="color: #1565c0; margin: 0;"><strong>📋 What's Next?</strong></p>
            <p style="color: #666; margin: 10px 0; font-size: 14px;">Our team will review your return request within 24-48 hours. You will receive an email notification once your request is approved or if we need additional information.</p>
          </div>

          <p style="color: #666; font-size: 14px; margin-top: 20px;">If you have any questions, please don't hesitate to contact us.</p>
          
          <hr style="border: 1px solid #ddd; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            <strong>Fitness Store</strong><br>
            Your trusted fitness equipment provider
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || "noreply@fitnessstore.com",
      to: customer.email,
      subject: `Return Request Received - Order #${orderId}`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Return request email sent:", info.response);
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("❌ Error sending return request email:", error);
    return { success: false, error: error.message };
  }
};

// Send return status update email to user
const sendReturnStatusEmail = async (returnData) => {
  const { customer, orderId, returnId, status, refundAmount, adminNotes } = returnData;

  try {
    const statusConfig = {
      APPROVED: {
        color: "#4caf50",
        bgColor: "#e8f5e9",
        icon: "✅",
        title: "Return Request Approved",
        message: "Great news! Your return request has been approved. Your refund will be processed shortly.",
      },
      REJECTED: {
        color: "#f44336",
        bgColor: "#ffebee",
        icon: "❌",
        title: "Return Request Rejected",
        message: "We're sorry, but your return request has been reviewed and cannot be approved at this time.",
      },
      COMPLETED: {
        color: "#2196f3",
        bgColor: "#e3f2fd",
        icon: "✅",
        title: "Refund Completed",
        message: "Your refund has been successfully processed.",
      },
    };

    const config = statusConfig[status] || statusConfig.APPROVED;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px;">
        <div style="background-color: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <h2 style="color: #333; text-align: center;">${config.icon} ${config.title}</h2>
          <hr style="border: 1px solid #ddd;">
          
          <p style="color: #555; font-size: 16px;">Dear <strong>${customer.name}</strong>,</p>
          
          <div style="background-color: ${config.bgColor}; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${config.color};">
            <p style="color: ${config.color}; margin: 0;"><strong>Return ID:</strong> ${returnId}</p>
            <p style="color: ${config.color}; margin: 10px 0;"><strong>Order ID:</strong> ${orderId}</p>
            <p style="color: ${config.color}; margin: 10px 0; font-size: 18px;"><strong>Status: ${status}</strong></p>
            <p style="color: #555; margin: 10px 0;">${config.message}</p>
          </div>

          ${status === "APPROVED" ? `
          <div style="text-align: center; padding: 15px 0; background-color: #f9f9f9; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin: 10px 0;"><strong>Refund Amount: ₹${refundAmount}</strong></h3>
            <p style="color: #666; margin: 5px 0; font-size: 14px;">The refund will be credited to your original payment method within 5-7 business days.</p>
          </div>
          ` : ""}

          ${adminNotes ? `
          <h3 style="color: #333;">Additional Notes:</h3>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #666; margin: 0;">${adminNotes}</p>
          </div>
          ` : ""}

          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196f3;">
            <p style="color: #1565c0; margin: 0;"><strong>📞 Need Help?</strong></p>
            <p style="color: #666; margin: 10px 0; font-size: 14px;">If you have any questions about your return or refund, please contact our customer support team.</p>
          </div>

          <p style="color: #666; font-size: 14px; margin-top: 20px;">Thank you for shopping with us!</p>
          
          <hr style="border: 1px solid #ddd; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            <strong>Fitness Store</strong><br>
            Your trusted fitness equipment provider
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || "noreply@fitnessstore.com",
      to: customer.email,
      subject: `Return Status Update - ${status} - Order #${orderId}`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Return status email sent:", info.response);
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("❌ Error sending return status email:", error);
    return { success: false, error: error.message };
  }
};

// Send feedback acknowledgment email to user
const sendFeedbackThankYouEmail = async (feedbackData) => {
  const { userName, userEmail, rating } = feedbackData;

  try {
    const submittedOn = new Date().toLocaleString();
    const safeRating = Math.max(1, Math.min(5, Number(rating) || 1));
    const stars = "★".repeat(safeRating) + "☆".repeat(5 - safeRating);
    const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER || "support@fitnessstore.com";

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 640px; margin: 0 auto; background: linear-gradient(135deg, #eef6ff 0%, #f7fff1 100%); padding: 24px;">
        <div style="background-color: #ffffff; padding: 0; border-radius: 14px; box-shadow: 0 8px 30px rgba(0,0,0,0.08); overflow: hidden;">
          <div style="background: linear-gradient(90deg, #0077b6 0%, #00a896 100%); padding: 18px 22px;">
            <p style="margin: 0; color: #e9f8ff; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase;">Fitness Store Admin</p>
            <h2 style="margin: 6px 0 0; color: #ffffff; font-size: 24px;">Thank You For Your Feedback</h2>
          </div>

          <div style="padding: 24px;">
            <p style="color: #213547; font-size: 16px; margin-top: 0;">Hello <strong>${userName}</strong>,</p>

            <p style="color: #394b59; font-size: 14px; line-height: 1.7; margin: 0 0 14px;">
              Thank you for sharing your experience with us. Your feedback helps our admin team improve product quality, delivery flow, and support for every customer.
            </p>

            <div style="background: #f0f9ff; border: 1px solid #cae9ff; border-radius: 10px; padding: 14px 16px; margin: 18px 0;">
              <p style="margin: 0; color: #0b4f6c; font-size: 13px; text-transform: uppercase; letter-spacing: 0.3px;"><strong>Feedback Summary</strong></p>
              <p style="margin: 8px 0 0; color: #1f2937; font-size: 15px;">Rating: <strong>${safeRating}/5</strong></p>
              <p style="margin: 6px 0 0; color: #f59e0b; font-size: 20px; letter-spacing: 2px;">${stars}</p>
              <p style="margin: 8px 0 0; color: #4b5563; font-size: 13px;">Submitted on: ${submittedOn}</p>
            </div>

            <div style="background: #f6fff8; border-left: 4px solid #22c55e; border-radius: 6px; padding: 12px 14px; margin: 18px 0;">
              <p style="margin: 0; color: #14532d; font-size: 13px;"><strong>What happens next?</strong></p>
              <p style="margin: 8px 0 0; color: #166534; font-size: 14px; line-height: 1.6;">
                Our team reviews feedback regularly and uses it to improve your shopping experience.
              </p>
            </div>

            <p style="color: #374151; font-size: 14px; line-height: 1.7; margin: 0 0 10px;">
              Need help right now? Contact us at <strong>${supportEmail}</strong>.
            </p>

            <p style="color: #111827; font-size: 14px; margin: 16px 0 0;">
              Regards,<br>
              <strong>Admin Team</strong><br>
              Fitness Store
            </p>
          </div>

          <div style="padding: 14px 22px; background-color: #f8fafc; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
              This is an automated acknowledgment email for your feedback submission.
            </p>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || "noreply@fitnessstore.com",
      to: userEmail,
      subject: "Thank you for your feedback - Fitness Store",
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Feedback thank-you email sent:", info.response);
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("❌ Error sending feedback thank-you email:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
  sendLowStockAlert,
  sendReturnRequestEmail,
  sendReturnStatusEmail,
  sendFeedbackThankYouEmail,
};
