import Finding from "../models/findings.js";
import CleanRecord from "../models/CleanRecord.js";
import Scan from "../models/Scan.js";

export const getLastScanResults = async (req, res) => {
  try {
    const userId = req.user.id;

    const lastScan = await Scan.findOne({ user: userId }).sort({
      createdAt: -1,
    });

    if (!lastScan) {
      return res.json({ type: "none", data: [] });
    }

    const findings = await Finding.find({
      user: userId,
      scan: lastScan._id,
    });

    if (findings.length > 0) {
      return res.json({
        type: "findings",
        data: findings,
        id: lastScan._id,
      });
    }

    const clean = await CleanRecord.findOne({
      user: userId,
      repo: lastScan.repo,
    }).sort({ createdAt: -1 });

    if (clean) {
      return res.json({
        type: "clean",
        data: clean,
        id: lastScan._id,
      });
    }

    return res.json({ type: "none", data: [] });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err });
  }
};
