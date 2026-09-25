import type { Request, Response, NextFunction } from "express";
import { SponsorService } from "./sponsor.service";

/**
 * Controller retrieving all festival sponsors
 * GET /api/sponsors
 */
export const getAllSponsorsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const featuredOnly = req.query.featured === "true" || req.query.featured === "1";
    const sponsors = await SponsorService.getAllSponsors(featuredOnly);

    res.status(200).json({
      status: "success",
      count: sponsors.length,
      data: { sponsors },
    });
  } catch (error) {
    next(error);
  }
};
