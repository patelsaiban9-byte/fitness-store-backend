const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Feedback = require("../models/feedback");

const router = express.Router();

const FIXED_ADMIN_EMAIL = "saiban@gmail.com";

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

router.post("/", async (req, res) => {
  try {
    const payload = getTokenPayload(req);
    if (!payload) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { rating, message, userName, userEmail } = req.body;

    const safeRating = Number(rating);
    if (!Number.isFinite(safeRating) || safeRating < 1 || safeRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const safeMessage = String(message || "").trim();
    if (safeMessage.length < 5) {
      return res.status(400).json({ message: "Feedback message must be at least 5 characters" });
    }

    const nameFromPayload = String(payload.name || "").trim();
    const emailFromPayload = String(payload.email || "").trim();

    const finalUserName = String(userName || nameFromPayload || "Customer").trim();
    const finalUserEmail = String(userEmail || emailFromPayload || "").trim().toLowerCase();

    if (!finalUserEmail) {
      return res.status(400).json({ message: "Email is required to submit feedback" });
    }

    const doc = {
      userName: finalUserName,
      userEmail: finalUserEmail,
      rating: safeRating,
      message: safeMessage,
    };

    if (mongoose.Types.ObjectId.isValid(payload.userId)) {
      doc.userId = payload.userId;
    }

    const feedback = new Feedback(doc);
    await feedback.save();

    res.status(201).json({ message: "Feedback submitted successfully", feedback });
  } catch (error) {
    console.error("Create feedback error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/my", async (req, res) => {
  try {
    const payload = getTokenPayload(req);
    if (!payload) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const query = {};

    if (mongoose.Types.ObjectId.isValid(payload.userId)) {
      query.userId = payload.userId;
    } else if (payload.email) {
      query.userEmail = String(payload.email).toLowerCase();
    } else {
      return res.status(400).json({ message: "Unable to resolve user identity" });
    }

    const myFeedback = await Feedback.find(query).sort({ createdAt: -1 });
    res.status(200).json(myFeedback);
  } catch (error) {
    console.error("Fetch my feedback error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/admin/all", async (req, res) => {
  try {
    const payload = getTokenPayload(req);
    if (!payload) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const isAdmin = payload.role === "admin" || payload.email === FIXED_ADMIN_EMAIL;
    if (!isAdmin) {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    const feedbackList = await Feedback.find().sort({ createdAt: -1 });
    res.status(200).json(feedbackList);
  } catch (error) {
    console.error("Fetch all feedback error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
