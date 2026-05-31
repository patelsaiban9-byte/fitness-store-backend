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
      min: 0,
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

module.exports = mongoose.model("Coupon", couponSchema);
