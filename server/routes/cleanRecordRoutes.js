import express from "express";
import { getCleanRecords } from "../controllers/cleanRecordController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// fetch all clean scans
router.get("/", protect, getCleanRecords);

export default router;