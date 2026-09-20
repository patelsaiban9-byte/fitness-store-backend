const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      unique: true,
    },
    discountType: {
      type: String,
      required: true,
      enum: ["percentage", "fixed"],
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      default: 1,
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

couponSchema.pre("validate", function (next) {
  if (this.discountType === "percentage" && Number(this.discountValue) > 100) {
    this.invalidate("discountValue", "Percentage discount cannot exceed 100%.");
  }

  if (this.expiryDate && new Date(this.expiryDate) < new Date(new Date().toDateString())) {
    this.invalidate("expiryDate", "Expiry date cannot be in the past.");
  }

  if (this.usageLimit !== undefined && Number(this.usageLimit) <= 0) {
    this.invalidate("usageLimit", "Usage limit must be greater than 0.");
  }

  if (this.discountValue !== undefined && Number(this.discountValue) < 0) {
    this.invalidate("discountValue", "Discount value cannot be negative.");
  }

  if (this.minOrderAmount !== undefined && Number(this.minOrderAmount) < 0) {
    this.invalidate("minOrderAmount", "Minimum order amount cannot be negative.");
  }

  if (this.maxDiscountAmount !== undefined && Number(this.maxDiscountAmount) < 0) {
    this.invalidate("maxDiscountAmount", "Maximum discount cannot be negative.");
  }

  next();
});

module.exports = mongoose.model("Coupon", couponSchema);
