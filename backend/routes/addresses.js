const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Address = require("../models/address");

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

router.get("/", async (req, res) => {
  try {
    const payload = getTokenPayload(req);
    const userId = getUserIdFromPayload(payload);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const addresses = await Address.find({ userId }).sort({ isDefault: -1, updatedAt: -1 });
    res.status(200).json(addresses);
  } catch (error) {
    console.error("Fetch addresses error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const payload = getTokenPayload(req);
    const userId = getUserIdFromPayload(payload);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { fullName, phone, address, city, state, pincode, isDefault } = req.body;
    if (!fullName || !phone || !address || !city || !state || !pincode) {
      return res.status(400).json({ message: "All address fields are required" });
    }

    if (isDefault) {
      await Address.updateMany({ userId }, { $set: { isDefault: false } });
    }

    const savedAddress = await Address.create({
      userId,
      fullName,
      phone,
      address,
      city,
      state,
      pincode,
      isDefault: Boolean(isDefault),
    });

    res.status(201).json({ message: "Address added", address: savedAddress });
  } catch (error) {
    console.error("Create address error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const payload = getTokenPayload(req);
    const userId = getUserIdFromPayload(payload);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const addressId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({ message: "Valid address id is required" });
    }

    const { fullName, phone, address, city, state, pincode, isDefault } = req.body;
    if (!fullName || !phone || !address || !city || !state || !pincode) {
      return res.status(400).json({ message: "All address fields are required" });
    }

    if (isDefault) {
      await Address.updateMany({ userId }, { $set: { isDefault: false } });
    }

    const updatedAddress = await Address.findOneAndUpdate(
      { _id: addressId, userId },
      {
        fullName,
        phone,
        address,
        city,
        state,
        pincode,
        isDefault: Boolean(isDefault),
      },
      { new: true }
    );

    if (!updatedAddress) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.status(200).json({ message: "Address updated", address: updatedAddress });
  } catch (error) {
    console.error("Update address error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const payload = getTokenPayload(req);
    const userId = getUserIdFromPayload(payload);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const addressId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({ message: "Valid address id is required" });
    }

    const removed = await Address.findOneAndDelete({ _id: addressId, userId });
    if (!removed) {
      return res.status(404).json({ message: "Address not found" });
    }

    if (removed.isDefault) {
      const nextAddress = await Address.findOne({ userId }).sort({ updatedAt: -1 });
      if (nextAddress) {
        await Address.findByIdAndUpdate(nextAddress._id, { $set: { isDefault: true } });
      }
    }

    res.status(200).json({ message: "Address removed" });
  } catch (error) {
    console.error("Delete address error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/:id/default", async (req, res) => {
  try {
    const payload = getTokenPayload(req);
    const userId = getUserIdFromPayload(payload);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const addressId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({ message: "Valid address id is required" });
    }

    const updated = await Address.findOneAndUpdate(
      { _id: addressId, userId },
      { $set: { isDefault: true } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Address not found" });
    }

    await Address.updateMany({ userId, _id: { $ne: addressId } }, { $set: { isDefault: false } });

    res.status(200).json({ message: "Default address updated", address: updated });
  } catch (error) {
    console.error("Set default address error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
