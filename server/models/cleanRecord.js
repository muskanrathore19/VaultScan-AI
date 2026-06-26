import mongoose from "mongoose";

const cleanRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    repo: {
      type: String,
      required: true,
    },
    scannedAt: {
      type: Date,
      default: Date.now,
    },
    risk: {
      type: String,
      enum: ["Clean"],
      default: "Clean",
    },
  },
  { timestamps: true },
);

export default mongoose.models.CleanRecord ||
  mongoose.model("CleanRecord", cleanRecordSchema);
