import mongoose from "mongoose";

const findingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    scan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scan",
    },

    repo: String,
    file: String,
    line: String,

    secretType: String, // AWS_KEY, JWT_SECRET etc

    risk: {
      type: String,
      enum: ["Critical", "High", "Medium", "Low"],
    },

    status: {
      type: String,
      enum: ["active", "resolved"],
      default: "active",
    },
  },
  { timestamps: true },
);

export default mongoose.models.Finding ||
  mongoose.model("Finding", findingSchema);
