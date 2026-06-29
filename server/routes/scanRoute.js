import express from "express";
import { runScan, getAiReview } from "../controllers/scanController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/scan", protect, runScan);
router.get("/scan/:scanId/ai-review", protect, getAiReview);

export default router;
