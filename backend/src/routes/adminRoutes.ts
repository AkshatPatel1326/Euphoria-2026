import { Router } from "express";
import {
  getOverviewStatsHandler,
  getRegistrationsHandler,
  exportRegistrationsHandler,
  deleteRegistrationHandler,
  getPassPurchasesHandler,
  exportPassPurchasesHandler,
  getPassPurchaseByIdHandler,
  updatePassPurchaseStatusHandler,
  deletePassPurchaseHandler,
  updateEventPriceHandler,
  updatePassPriceHandler,
} from "../controllers/adminController";
import {
  getAdminAnnouncementsHandler,
  createAnnouncementHandler,
  updateAnnouncementHandler,
  togglePublishAnnouncementHandler,
  togglePinAnnouncementHandler,
  deleteAnnouncementHandler,
} from "../controllers/announcementController";
import { requireAuth, requireRole } from "../middleware/authMiddleware";
import { Role } from "../../generated/prisma/client";

const router = Router();

// All admin routes require authentication
router.use(requireAuth);

/**
 * @route   GET /api/admin/overview
 * @desc    Overview dashboard metrics & recent activity
 * @access  Admin or Organizer (Organizer scoped to their events)
 */
router.get(
  "/overview",
  requireRole(Role.ADMIN, Role.ORGANIZER),
  getOverviewStatsHandler
);

/**
 * @route   GET /api/admin/registrations
 * @desc    Paginated, filtered list of event registrations
 * @access  Admin or Organizer (Organizer scoped to their events)
 */
router.get(
  "/registrations",
  requireRole(Role.ADMIN, Role.ORGANIZER),
  getRegistrationsHandler
);

/**
 * @route   GET /api/admin/registrations/export
 * @desc    Export complete filtered registration dataset for CSV export
 * @access  Admin or Organizer (Organizer scoped to their events)
 */
router.get(
  "/registrations/export",
  requireRole(Role.ADMIN, Role.ORGANIZER),
  exportRegistrationsHandler
);

/**
 * @route   DELETE /api/admin/registrations/:id
 * @desc    Permanently delete a cancelled/rejected registration
 * @access  Admin ONLY
 */
router.delete(
  "/registrations/:id",
  requireRole(Role.ADMIN),
  deleteRegistrationHandler
);

/**
 * @route   GET /api/admin/pass-purchases
 * @desc    Paginated, filtered list of festival pass purchases
 * @access  Admin ONLY
 */
router.get(
  "/pass-purchases",
  requireRole(Role.ADMIN),
  getPassPurchasesHandler
);

/**
 * @route   GET /api/admin/pass-purchases/export
 * @desc    Export complete filtered pass purchases dataset for CSV export
 * @access  Admin ONLY
 */
router.get(
  "/pass-purchases/export",
  requireRole(Role.ADMIN),
  exportPassPurchasesHandler
);

/**
 * @route   GET /api/admin/pass-purchases/:id
 * @desc    Get single festival pass purchase details
 * @access  Admin ONLY
 */
router.get(
  "/pass-purchases/:id",
  requireRole(Role.ADMIN),
  getPassPurchaseByIdHandler
);

/**
 * @route   PATCH /api/admin/pass-purchases/:id/status
 * @desc    Update pass purchase status (Confirm, Cancel, Reject)
 * @access  Admin ONLY
 */
router.patch(
  "/pass-purchases/:id/status",
  requireRole(Role.ADMIN),
  updatePassPurchaseStatusHandler
);

/**
 * @route   DELETE /api/admin/pass-purchases/:id
 * @desc    Permanently delete a cancelled/rejected pass purchase
 * @access  Admin ONLY
 */
router.delete(
  "/pass-purchases/:id",
  requireRole(Role.ADMIN),
  deletePassPurchaseHandler
);

/**
 * @route   PATCH /api/admin/events/:id/price
 * @desc    Update fee for an event
 * @access  Admin ONLY
 */
router.patch(
  "/events/:id/price",
  requireRole(Role.ADMIN),
  updateEventPriceHandler
);

/**
 * @route   PATCH /api/admin/passes/:id/price
 * @desc    Update price for a festival pass
 * @access  Admin ONLY
 */
router.patch(
  "/passes/:id/price",
  requireRole(Role.ADMIN),
  updatePassPriceHandler
);

/**
 * ─────────────────────────────────────────────────────────────
 * ANNOUNCEMENTS & DYNAMIC UPDATES (Strictly Admin ONLY)
 * ─────────────────────────────────────────────────────────────
 */

/**
 * @route   GET /api/admin/announcements
 * @desc    Get all announcements
 * @access  Admin ONLY
 */
router.get(
  "/announcements",
  requireRole(Role.ADMIN),
  getAdminAnnouncementsHandler
);

/**
 * @route   POST /api/admin/announcements
 * @desc    Create an announcement
 * @access  Admin ONLY
 */
router.post(
  "/announcements",
  requireRole(Role.ADMIN),
  createAnnouncementHandler
);

/**
 * @route   PUT /api/admin/announcements/:id
 * @desc    Update an announcement
 * @access  Admin ONLY
 */
router.put(
  "/announcements/:id",
  requireRole(Role.ADMIN),
  updateAnnouncementHandler
);

/**
 * @route   PATCH /api/admin/announcements/:id/publish
 * @desc    Toggle publish status
 * @access  Admin ONLY
 */
router.patch(
  "/announcements/:id/publish",
  requireRole(Role.ADMIN),
  togglePublishAnnouncementHandler
);

/**
 * @route   PATCH /api/admin/announcements/:id/pin
 * @desc    Toggle pin status
 * @access  Admin ONLY
 */
router.patch(
  "/announcements/:id/pin",
  requireRole(Role.ADMIN),
  togglePinAnnouncementHandler
);

/**
 * @route   DELETE /api/admin/announcements/:id
 * @desc    Delete an announcement
 * @access  Admin ONLY
 */
router.delete(
  "/announcements/:id",
  requireRole(Role.ADMIN),
  deleteAnnouncementHandler
);

export default router;
