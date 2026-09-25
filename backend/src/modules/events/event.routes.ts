import { Router } from "express";
import {
  getEventsHandler,
  getEventByIdOrSlugHandler,
  updateEventRegistrationStatusHandler,
  updateEventHandler,
} from "./event.controller";
import { getEventRegistrationsHandler } from "../registrations/registration.controller";
import { requireAuth, requireRole } from "../../middleware/authMiddleware";
import { Role } from "../../../generated/prisma/client";

const router = Router();

/**
 * @route   GET /api/events
 * @desc    Get all published events with optional filtering (category, registrationType, registrationOpen, search)
 * @access  Public
 */
router.get("/", getEventsHandler);

/**
 * @route   GET /api/events/:idOrSlug
 * @desc    Get single event by ID or slug with category and schedule details
 * @access  Public
 */
router.get("/:idOrSlug", getEventByIdOrSlugHandler);

/**
 * @route   PATCH /api/events/:id
 * @desc    Update event content, pricing, schedule, media, or registration settings
 * @access  Admin or assigned Organizer
 */
router.patch(
  "/:id",
  requireAuth,
  requireRole(Role.ADMIN, Role.ORGANIZER),
  updateEventHandler
);

/**
 * @route   PATCH /api/events/:id/registration-status
 * @desc    Explicitly open or close registration for an event
 * @access  Admin or assigned Organizer
 */
router.patch(
  "/:id/registration-status",
  requireAuth,
  requireRole(Role.ADMIN, Role.ORGANIZER),
  updateEventRegistrationStatusHandler
);

/**
 * @route   GET /api/events/:id/registrations
 * @desc    Get all registrations for an event
 * @access  Admin or assigned Organizer
 */
router.get(
  "/:id/registrations",
  requireAuth,
  requireRole(Role.ADMIN, Role.ORGANIZER),
  getEventRegistrationsHandler
);

export default router;

