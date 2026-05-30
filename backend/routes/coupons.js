const express = require("express");
const router = express.Router();
const Coupon = require("../models/coupon");

router.get("/active", async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.aggregate([
      {
        $match: {
          isActive: true,
          expiryDate: { $gte: now },
          $or: [
            { usageLimit: 0 },
            { $expr: { $gt: ["$usageLimit", "$usedCount"] } },
          ],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          code: 1,
          discountType: 1,
          discountValue: 1,
          minOrderAmount: 1,
          maxDiscountAmount: 1,
          expiryDate: 1,
          usageLimit: 1,
          usedCount: 1,
          description: 1,
          isActive: 1,
        },
      },
    ]);

    res.status(200).json(coupons);
  } catch (error) {
    console.error("❌ Error fetching active coupons:", error);
    res.status(500).json({ error: "Failed to fetch active coupons" });
  }
});

module.exports = router;
