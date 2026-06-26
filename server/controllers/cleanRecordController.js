import CleanRecord from "../models/CleanRecord.js";

export const getCleanRecords = async (req, res) => {
  try {
    const records = await CleanRecord.find({
      user: req.user.id,
    }).sort({ scannedAt: -1 });

    res.status(200).json({
      success: true,
      data: records,
    });
  } catch (error) {
    res.status(500).json({
      error: error,
      success: false,
      message: "Failed to fetch clean records",
    });
  }
};
