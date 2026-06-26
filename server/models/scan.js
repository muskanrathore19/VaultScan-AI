import mongoose from "mongoose";

const scanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    repos: [String],
    aiReview: String,

    stats: {
      critical: Number,
      high: Number,
      medium: Number,
      low: Number,
    },

    totalFindings: Number,

    status: {
      type: String,
      enum: ["running", "completed", "failed"],
      default: "running",
    },
  },
  { timestamps: true },
);

export default mongoose.models.Scan || mongoose.model("Scan", scanSchema);
