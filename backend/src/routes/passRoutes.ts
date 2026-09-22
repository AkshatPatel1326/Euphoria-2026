import { Router } from "express";
import {
  getAllPassesHandler,
  getPassBySlugHandler,
  purchasePassHandler,
  validatePassCouponHandler,
} from "../controllers/passController";
import { simulatePassPaymentHandler } from "../controllers/paymentSimulationController";
import { optionalAuth } from "../middleware/authMiddleware";

const router = Router();

/**
 * @route   POST /api/passes/validate-coupon
 * @desc    Validate a Festival Pass coupon for Standup Comedy
 * @access  Public
 */
router.post("/validate-coupon", validatePassCouponHandler);

/**
 * @route   GET /api/passes
 * @desc    Get all festival passes
 * @access  Public
 */
router.get("/", getAllPassesHandler);

/**
 * @route   GET /api/passes/:slug
 * @desc    Get festival pass by slug
 * @access  Public
 */
router.get("/:slug", getPassBySlugHandler);

/**
 * @route   POST /api/passes/purchase
 * @desc    Purchase a festival pass (guest with verificationToken or authenticated)
 * @access  Public / Guest or Authenticated
 */
router.post("/purchase", optionalAuth, purchasePassHandler);

/**
 * @route   POST /api/passes/purchases/:id/pay
 * @desc    Simulate payment for pass purchase (requires paymentToken or Admin)
 * @access  Protected by paymentToken or Admin
 */
router.post("/purchases/:id/pay", optionalAuth, simulatePassPaymentHandler);

export default router;
