import express from "express";
import mongoose from "mongoose";

import User from "../models/user.model.js";
import Scan from "../models/scan.model.js";
import Finding from "../models/finding.model.js";
import CleanRecord from "../models/clean.model.js";

import { protect } from "../middleware/auth.js";

const router = express.Router();

/* ---------- ADMIN CHECK ---------- */
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
};

/* ---------- STATS ---------- */
router.get("/stats", protect, isAdmin, async (req, res) => {
  try {
    const [users, scans, clean] = await Promise.all([
      User.countDocuments(),
      Scan.countDocuments(),
      CleanRecord.countDocuments()
    ]);

    const riskAgg = await Finding.aggregate([
      { $group: { _id: "$risk", count: { $sum: 1 } } }
    ]);

    const risks = { critical: 0, high: 0, medium: 0, low: 0 };

    riskAgg.forEach(r => {
      const key = r._id?.toLowerCase();
      if (risks[key] !== undefined) risks[key] = r.count;
    });

    const secretsAgg = await Finding.aggregate([
      { $group: { _id: "$secretType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const topSecrets = secretsAgg.map(s => ({
      name: s._id,
      count: s.count
    }));

    res.json({
      users,
      scans,
      cleanRepos: clean,
      risks,
      topSecret: topSecrets[0]?.name || null,
      topSecrets
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Admin stats failed" });
  }
});

/* ---------- STATUS ---------- */
router.get("/status", protect, isAdmin, (req, res) => {
  res.json({
    backend: true,
    db: mongoose.connection.readyState === 1
  });
});

/* ---------- USERS ---------- */
router.get("/users", protect, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

/* ---------- DELETE USER ---------- */
router.delete("/user/:id", protect, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await User.findByIdAndDelete(id);
    await Finding.deleteMany({ user: id });
    await Scan.deleteMany({ user: id });
    await CleanRecord.deleteMany({ user: id });

    res.json({ message: "User deleted" });

  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
});

export default router;