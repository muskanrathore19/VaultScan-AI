import Scan from "../models/Scan.js";
import CleanRecord from "../models/CleanRecord.js";
import { formatDistanceToNowStrict } from "date-fns";

export const getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    const scans = await Scan.find({
      user: userId,
      status: "completed",
    })
      .sort({ createdAt: -1 })
      .select("totalFindings createdAt");

    const clean = await CleanRecord.find({
      user: userId
    })

    console.log(clean.length)

    const totalScans = scans.length;

    const totalFindings = scans.reduce(
      (sum, scan) => sum + (scan.totalFindings || 0),
      0
    );

    const latestScan = scans[0];

    let lastScan = null;

    const formatLastScan = (date) => {
      if (!date) return "Never";

      const diffMs = Date.now() - new Date(date).getTime();
      const minutes = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMs / 3600000);

      if (minutes < 60) {
        return `${minutes}m ago`;
      }

      if (hours < 48) {
        return `${hours}h ago`;
      }

      return "Long time ago";
    };

    if (latestScan) {
      lastScan = formatLastScan(latestScan.createdAt);

    }

    const avgFindings =
      totalScans > 0
        ? totalFindings / totalScans
        : 0;

    const risk = Math.min(
      Math.round(avgFindings * 5),
      100
    );

    const trend = scans
      .slice(0, 7)
      .reverse()
      .map(scan => scan.totalFindings || 0);


    return res.json({
      scans: totalScans,
      findings: totalFindings,
      risk,
      lastScan,
      version: "v1.0.0",
      trend,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      msg: "Server error",
    });
  }
};