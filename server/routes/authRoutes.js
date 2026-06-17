import express from "express";
import {
  registerUser,
  loginUser,
  refreshToken,
  forgotPassword,
  resetPassword,
  getProfile,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshToken);

router.post("/forgot", forgotPassword);
router.put("/reset/:token", resetPassword);

router.get("/me", protect, getProfile);

export default router;