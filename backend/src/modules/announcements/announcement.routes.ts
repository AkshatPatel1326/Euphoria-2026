import { Router } from "express";
import {
  getPublishedAnnouncementsHandler,
  getPublishedAnnouncementByIdHandler,
} from "./announcement.controller";

const router = Router();

/**
 * @route   GET /api/announcements
 * @desc    Get all published announcements for public festival website
 * @access  Public
 */
router.get("/", getPublishedAnnouncementsHandler);

/**
 * @route   GET /api/announcements/:id
 * @desc    Get single published announcement
 * @access  Public
 */
router.get("/:id", getPublishedAnnouncementByIdHandler);

export default router;
