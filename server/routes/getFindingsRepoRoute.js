import express from "express";
import { getRepoFindings } from "../controllers/getFindingsRepo.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.get("/repo/:repo", protect, getRepoFindings);

export default router;