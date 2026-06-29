import express from "express";
import mongoose from "mongoose";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

import User from "../models/User.js";
import Scan from "../models/scan.js";
import Finding from "../models/findings.js";
import CleanRecord from "../models/cleanRecord.js";

const router = express.Router();

router.get("/dashboard", protect, adminOnly, async (req, res) => {
  try {
    const [users, scans, clean] = await Promise.all([
      User.countDocuments(),
      Scan.countDocuments(),
      CleanRecord.countDocuments(),
    ]);

    const riskAgg = await Finding.aggregate([
      { $group: { _id: "$risk", count: { $sum: 1 } } },
    ]);

    const risks = { critical: 0, high: 0, medium: 0, low: 0 };

    riskAgg.forEach((r) => {
      const key = r._id?.toLowerCase();
      if (risks[key] !== undefined) {
        risks[key] = r.count;
      }
    });

    const secretsAgg = await Finding.aggregate([
      { $group: { _id: "$secretType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const topSecrets = secretsAgg.map((s) => ({
      name: s._id,
      count: s.count,
    }));

    res.json({
      users,
      scans,
      cleanRepos: clean,
      risks,
      topSecret: topSecrets[0]?.name || null,
      topSecrets,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Admin dashboard failed" });
  }
});

router.get("/status", protect, adminOnly, (req, res) => {
  res.json({
    backend: true,
    db: mongoose.connection.readyState === 1,
  });
});

router.get("/users", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

router.delete("/user/:id", protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user._id.toString() === id) {
      return res.status(403).json({
        message: "You cannot delete your own account.",
      });
    }

    await User.findByIdAndDelete(id);

    // cascade delete (IMPORTANT)
    await Finding.deleteMany({ user: id });
    await Scan.deleteMany({ user: id });
    await CleanRecord.deleteMany({ user: id });

    res.json({ message: "User and related data deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

export default router;
