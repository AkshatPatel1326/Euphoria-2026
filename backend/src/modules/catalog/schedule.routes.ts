import { Router } from "express";
import { getAllSchedulesHandler } from "./schedule.controller";

const router = Router();

/**
 * @route   GET /api/schedules
 * @desc    Get all confirmed event timeline schedules
 * @access  Public
 */
router.get("/", getAllSchedulesHandler);

export default router;
