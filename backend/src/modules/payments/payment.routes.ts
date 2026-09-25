import { Router } from "express";
import {
  initiatePaymentHandler,
  handleEasebuzzResponseHandler,
  handleEasebuzzWebhookHandler,
} from "./payment.controller";
import { optionalAuth } from "../../middleware/authMiddleware";
import { paymentLimiter } from "../../middleware/rateLimiter";

const router = Router();

/**
 * @route   POST /api/payments/easebuzz/initiate
 * @desc    Initiate Easebuzz payment session (or simulation if gateway=simulation)
 * @access  Protected by scoped paymentToken or Authenticated User/Admin
 */
router.post("/easebuzz/initiate", paymentLimiter, optionalAuth, initiatePaymentHandler);

/**
 * @route   POST /api/payments/easebuzz/response
 * @desc    Handle Easebuzz browser redirect POST (SURL/FURL) and redirect to frontend
 * @access  Public (called by participant browser on return from Easebuzz)
 */
router.post("/easebuzz/response", handleEasebuzzResponseHandler);

/**
 * @route   POST /api/payments/easebuzz/webhook
 * @desc    Handle Easebuzz Server-to-Server (S2S) Webhook notification
 * @access  Public (called by Easebuzz server)
 */
router.post("/easebuzz/webhook", handleEasebuzzWebhookHandler);

export default router;
