import { Router } from "express";
import {
  sendOtpHandler,
  verifyOtpHandler,
} from "./verification.controller";
import { otpSendLimiter, otpVerifyLimiter } from "../../middleware/rateLimiter";

const router = Router();

/**
 * @route   POST /api/verification/send-otp
 * @desc    Send 6-digit verification code to email
 * @access  Public
 */
router.post("/send-otp", otpSendLimiter, sendOtpHandler);

/**
 * @route   POST /api/verification/verify-otp
 * @desc    Verify 6-digit code and receive strictly scoped verification token
 * @access  Public
 */
router.post("/verify-otp", otpVerifyLimiter, verifyOtpHandler);

export default router;
