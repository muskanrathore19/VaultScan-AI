import express from "express";
import { getLastScanResults } from "../controllers/getLastScanResults.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.get("/last-scan", protect, getLastScanResults);

export default router;
