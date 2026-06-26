import Scan from "../models/scan.js";
import Finding from "../models/findings.js";
import { scanRepoService } from "../scanner/scanner.js";
import CleanRecord from "../models/cleanRecord.js";

export const runScan = async (req, res) => {
  let result;
  try {
    const { repoUrl } = req.body;

    if (!repoUrl) {
      return res.status(400).json({ error: "repoUrl required" });
    }

    try {
      result = await scanRepoService(repoUrl);
    } catch (error) {
      const status = error.response?.status;

      if (status === 404) {
        return res
          .status(404)
          .json({
            error: "Repository not found. Please check the repository URL.",
          });
      }

      if (status === 401 || status === 403) {
        return res
          .status(401)
          .json({
            error:
              "GitHub PAT token is invalid, expired, lacks permissions, or API rate limit has been reached.",
          });
      } else {
        return res
          .status(500)
          .json({ error: error, message: "Internal Server Error!" });
      }
    }

    const { findings, repo, duration, aiReview } = result;

    if (findings.length === 0) {
      try {
        await CleanRecord.create({
          user: req.user.id,
          repo: repo,
          risk: "Clean",
          scannedAt: new Date(),
          AI: aiReview,
        });

        console.log("Clean record saved");
      } catch (err) {
        console.log("Clean record failed", err.message);
      }
    }

    const stats = {
      critical: findings.filter((f) => f.risk === "Critical").length,
      high: findings.filter((f) => f.risk === "High").length,
      medium: findings.filter((f) => f.risk === "Medium").length,
      low: findings.filter((f) => f.risk === "Low").length,
    };

    const scan = await Scan.create({
      user: req.user.id,
      repos: [repo],
      stats,
      totalFindings: findings.length,
      duration,
      status: "completed",
      aiReview,
    });

    const docs = findings.map((f) => ({
      ...f,
      user: req.user.id,
      scan: scan._id,
    }));

    await Finding.insertMany(docs);

    res.json({
      success: true,
      scanId: scan._id,
      totalFindings: findings.length,
      AI: aiReview,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAiReview = async (req, res) => {
  try {
    const { scanId } = req.params;

    const scan = await Scan.findOne({
      _id: scanId,
      user: req.user.id,
    }).select("aiReview repos stats totalFindings createdAt");

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: "Scan not found",
      });
    }

    return res.status(200).json({
      success: true,
      scanId: scan._id,
      repo: scan.repos?.[0] || null,
      totalFindings: scan.totalFindings,
      stats: scan.stats,
      aiReview: scan.aiReview,
      createdAt: scan.createdAt,
    });
  } catch (err) {
    console.error("Get AI Review Error:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
