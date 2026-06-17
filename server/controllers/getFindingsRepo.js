import Finding from "../models/findings.js";

export const getRepoFindings = async (req, res) => {
  try {
    const { repo } = req.params;

    const findings = await Finding.find({
      user: req.user.id,
      repo: repo
    })
    .sort({ createdAt: -1 }); // latest first

    // optional: group by scan (if multiple scans exist)
    const grouped = {};

    findings.forEach(f => {
      const scanId = f.scan.toString();

      if (!grouped[scanId]) {
        grouped[scanId] = {
          scanId,
          findings: []
        };
      }

      grouped[scanId].findings.push({
        file: f.file,
        line: f.line || "N/A",   // in case line missing
        secretType: f.secretType,
        risk: f.risk,
        status: f.status,
        createdAt: f.createdAt
      });
    });

    res.json(Object.values(grouped));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch repo findings" });
  }
};