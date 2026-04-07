const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Wishlist = require("../models/wishlist");

const router = express.Router();

const getTokenPayload = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];

  try {
    return jwt.verify(token, process.env.JWT_SECRET_KEY || "defaultsecret");
  } catch (error) {
    return null;
  }
};

const getUserIdFromPayload = (payload) => {
  if (!payload || !mongoose.Types.ObjectId.isValid(payload.userId)) {
    return null;
  }

  return payload.userId;
};

router.get("/my", async (req, res) => {
  try {
    const payload = getTokenPayload(req);
    const userId = getUserIdFromPayload(payload);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const wishlistItems = await Wishlist.find({ userId })
      .populate("productId", "name price image stock minimumStockThreshold category")
      .sort({ createdAt: -1 });

    res.status(200).json(wishlistItems);
  } catch (error) {
    console.error("Fetch wishlist error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/count", async (req, res) => {
  try {
    const payload = getTokenPayload(req);
    const userId = getUserIdFromPayload(payload);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const count = await Wishlist.countDocuments({ userId });
    res.status(200).json({ count });
  } catch (error) {
    console.error("Fetch wishlist count error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/add", async (req, res) => {
  try {
    const payload = getTokenPayload(req);
    const userId = getUserIdFromPayload(payload);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { productId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Valid productId is required" });
    }

    const existing = await Wishlist.findOne({ userId, productId });
    if (existing) {
      return res.status(409).json({ message: "Already in wishlist" });
    }

    const wishlistItem = new Wishlist({ userId, productId });
    await wishlistItem.save();

    res.status(201).json({ message: "Added to wishlist", wishlistItem });
  } catch (error) {
    console.error("Add to wishlist error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/remove/:productId", async (req, res) => {
  try {
    const payload = getTokenPayload(req);
    const userId = getUserIdFromPayload(payload);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Valid productId is required" });
    }

    const deleted = await Wishlist.findOneAndDelete({ userId, productId });

    if (!deleted) {
      return res.status(404).json({ message: "Item not found in wishlist" });
    }

    res.status(200).json({ message: "Removed from wishlist" });
  } catch (error) {
    console.error("Remove wishlist error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
