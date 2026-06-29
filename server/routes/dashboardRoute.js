import express from "express";
import {
  getSummary,
  getActivity,
  getExposures,
  getFindings,
} from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";
import { getAnalytics } from "../controllers/sidebarDashController.js";

const router = express.Router();

router.get("/summary", protect, getSummary);
router.get("/exposures", protect, getExposures);
router.get("/findings", protect, getFindings);
router.get("/activity", protect, getActivity);
router.get("/analytics", protect, getAnalytics);

export default router;
