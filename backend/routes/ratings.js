const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Rating = require("../models/rating");
const Product = require("../models/product");

const router = express.Router();

const getTokenPayload = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, process.env.JWT_SECRET_KEY || "defaultsecret");
  } catch {
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
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const ratings = await Rating.find({ userId })
      .populate("productId", "name image")
      .sort({ createdAt: -1 });

    res.status(200).json(ratings);
  } catch (error) {
    console.error("Fetch ratings error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const payload = getTokenPayload(req);
    const userId = getUserIdFromPayload(payload);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const ratingId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(ratingId)) {
      return res.status(400).json({ message: "Valid rating id is required" });
    }

    const { rating } = req.body;
    const safeRating = Number(rating);
    if (!Number.isFinite(safeRating) || safeRating < 1 || safeRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const existingRating = await Rating.findOne({ _id: ratingId, userId });
    if (!existingRating) {
      return res.status(404).json({ message: "Rating not found" });
    }

    existingRating.rating = safeRating;
    existingRating.createdAt = new Date();
    await existingRating.save();

    res.status(200).json({ message: "Rating updated", rating: existingRating });
  } catch (error) {
    console.error("Update rating error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
