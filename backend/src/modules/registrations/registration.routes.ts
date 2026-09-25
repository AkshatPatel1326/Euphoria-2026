import { Router } from "express";
import {
  createRegistrationHandler,
  getMyRegistrationsHandler,
  getRegistrationByIdHandler,
  guestLookupHandler,
  updateRegistrationStatusHandler,
} from "./registration.controller";
import { simulatePaymentHandler } from "../payments/payment-simulation.controller";
import { requireAuth, requireRole, optionalAuth } from "../../middleware/authMiddleware";
import { Role } from "../../../generated/prisma/client";

const router = Router();

/**
 * @route   POST /api/registrations
 * @desc    Create a new registration (guest with verificationToken OR authenticated user)
 * @access  Public / Guest or Authenticated
 */
router.post("/", optionalAuth, createRegistrationHandler);

/**
 * @route   GET /api/registrations/guest-lookup
 * @desc    Retrieve attendee registrations and pass purchases for verified guest
 * @access  Protected by GUEST_LOOKUP scoped token
 */
router.get("/guest-lookup", guestLookupHandler);

/**
 * @route   GET /api/registrations/my-registrations
 * @desc    Get all registrations for authenticated user
 * @access  Authenticated
 */
router.get("/my-registrations", requireAuth, getMyRegistrationsHandler);

/**
 * @route   GET /api/registrations/:id
 * @desc    Get specific registration details
 * @access  Authenticated (Registrant, Team Leader, Organizer, Admin)
 */
router.get("/:id", requireAuth, getRegistrationByIdHandler);

/**
 * @route   POST /api/registrations/:id/pay
 * @desc    Development/Test Payment Simulation
 * @access  Protected by REGISTRATION_PAYMENT scoped paymentToken OR Admin
 */
router.post("/:id/pay", optionalAuth, simulatePaymentHandler);

/**
 * @route   PATCH /api/registrations/:id/status
 * @desc    Manually update registration status
 * @access  Admin or assigned Organizer
 */
router.patch(
  "/:id/status",
  requireAuth,
  requireRole(Role.ADMIN, Role.ORGANIZER),
  updateRegistrationStatusHandler
);

export default router;
