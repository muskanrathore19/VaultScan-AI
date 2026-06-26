import Scan from "../models/scan.js";
import Finding from "../models/findings.js";
import mongoose from "mongoose";

export const getSummary = async (req, res) => {
  try {
    const scans = await Scan.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(2);

    if (!scans.length) {
      return res.json({ success: true, data: [] });
    }

    const lastScan = scans[0];
    const prevScan = scans[1] || null;

    const total = await Scan.aggregate([
      { $match: { user: lastScan.user } },
      {
        $group: {
          _id: null,
          critical: { $sum: "$stats.critical" },
          high: { $sum: "$stats.high" },
          medium: { $sum: "$stats.medium" },
          low: { $sum: "$stats.low" },
        },
      },
    ]);

    const totals = total[0] || {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    const getChange = (current, previous) => {
      if (!previous) return { change: "+0", isUp: true };

      const diff = current - previous;

      return {
        change: `${diff >= 0 ? "+" : ""}${diff}`,
        isUp: diff >= 0,
      };
    };

    const lastStats = lastScan.stats;
    const prevStats = prevScan ? prevScan.stats : null;

    const data = [
      {
        title: "Critical Risk",
        count: totals.critical,
        ...getChange(lastStats.critical, prevStats?.critical),
        color: "text-rose-500",
        glow: "shadow-rose-500/20",
      },
      {
        title: "High Risk",
        count: totals.high,
        ...getChange(lastStats.high, prevStats?.high),
        color: "text-orange-500",
        glow: "shadow-orange-500/20",
      },
      {
        title: "Medium Risk",
        count: totals.medium,
        ...getChange(lastStats.medium, prevStats?.medium),
        color: "text-amber-500",
        glow: "shadow-amber-500/20",
      },
      {
        title: "Low Risk",
        count: totals.low,
        ...getChange(lastStats.low, prevStats?.low),
        color: "text-blue-500",
        glow: "shadow-blue-500/20",
      },
    ];

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getExposures = async (req, res) => {
  try {
    const findings = await Finding.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5);

    const data = findings.map((f, i) => ({
      id: f._id,
      title: f.secretType,
      subtitle: f.repo,
      risk: f.risk,
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getFindings = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const grouped = await Finding.aggregate([
      { $match: { user: userId } },

      {
        $addFields: {
          riskLevel: {
            $switch: {
              branches: [
                { case: { $eq: ["$risk", "Critical"] }, then: 4 },
                { case: { $eq: ["$risk", "High"] }, then: 3 },
                { case: { $eq: ["$risk", "Medium"] }, then: 2 },
                { case: { $eq: ["$risk", "Low"] }, then: 1 },
              ],
              default: 0,
            },
          },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$repo",
          secretsFound: { $sum: 1 },
          lastScan: { $max: "$createdAt" },
          scanId: { $first: "$scan" },
          maxRiskLevel: { $max: "$riskLevel" },
        },
      },

      {
        $addFields: {
          risk: {
            $switch: {
              branches: [
                { case: { $eq: ["$maxRiskLevel", 4] }, then: "Critical" },
                { case: { $eq: ["$maxRiskLevel", 3] }, then: "High" },
                { case: { $eq: ["$maxRiskLevel", 2] }, then: "Medium" },
                { case: { $eq: ["$maxRiskLevel", 1] }, then: "Low" },
              ],
              default: "Unknown",
            },
          },
        },
      },

      { $sort: { lastScan: -1 } },
    ]);

    const data = grouped.map((g, i) => ({
      id: i + 1,
      scanId: g.scanId?.toString(),
      asset: g._id,
      account: "GitHub",
      score: g.secretsFound * 20,
      sources: ["GitHub"],
      status: g.risk,
    }));

    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const getActivity = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 95);

    const activity = await Finding.aggregate([
      {
        $match: {
          user: userId,
          createdAt: { $gte: startDate, $lte: today },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: "Asia/Kolkata",
            },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const activityMap = {};
    activity.forEach((a) => {
      activityMap[a._id] = a.count;
    });

    const cells = [];

    for (let i = 0; i < 120; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);

      const key = d.toLocaleDateString("en-CA"); // ✅ FIXED

      const count = activityMap[key] || 0;

      cells.push({
        id: i,
        date: key,
        count,
        intensity: count >= 1,
      });
    }

    res.json({ success: true, data: cells });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
