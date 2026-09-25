import type { Request, Response, NextFunction } from "express";
import { ScheduleService } from "./schedule.service";

/**
 * Controller retrieving all confirmed event schedule timeline entries
 * GET /api/schedules
 */
export const getAllSchedulesHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schedules = await ScheduleService.getAllSchedules();

    res.status(200).json({
      status: "success",
      count: schedules.length,
      data: { schedules },
    });
  } catch (error) {
    next(error);
  }
};
