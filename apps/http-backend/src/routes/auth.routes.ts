import express, { Router } from "express";
import {
  googleCallback,
  googleStart,
  me,
  resendVerification,
  signin,
  signout,
  signup,
  updateProfile,
  verifyEmail,
} from "../controllers/auth.controller.js";
import { middleware } from "../middlewares/authMiddleware.js";
const router: Router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/signout", signout);
router.get("/auth/google", googleStart);
router.get("/auth/google/callback", googleCallback);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.get("/me", middleware, me);
router.patch("/me", middleware, updateProfile);

export default router;
