import { Router } from "express";
import {
  registerHandler,
  loginHandler,
  getMeHandler,
} from "./auth.controller";
import { requireAuth } from "../../middleware/authMiddleware";
import { authLimiter } from "../../middleware/rateLimiter";

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new participant user
 * @access  Public
 */
router.post("/register", authLimiter, registerHandler);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & return JWT token
 * @access  Public
 */
router.post("/login", authLimiter, loginHandler);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private (Bearer Token required)
 */
router.get("/me", requireAuth, getMeHandler);

export default router;
