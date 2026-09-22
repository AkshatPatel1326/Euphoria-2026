import type { Request, Response, NextFunction } from "express";
import { PassService } from "../services/passService";
import type { AuthenticatedRequest, CreatePassPurchaseInput } from "../types";

/**
 * Controller retrieving all festival passes
 * GET /api/passes
 */
export const getAllPassesHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const passes = await PassService.getAllPasses();

    res.status(200).json({
      status: "success",
      count: passes.length,
      data: { passes },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller retrieving a single festival pass by its slug
 * GET /api/passes/:slug
 */
export const getPassBySlugHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const slug = req.params.slug as string;
    const pass = await PassService.getPassBySlug(slug);

    res.status(200).json({
      status: "success",
      data: { pass },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller creating a festival pass purchase
 * POST /api/passes/purchase
 */
export const purchasePassHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id || null;
    const input: CreatePassPurchaseInput = req.body;

    const result = await PassService.purchasePass(userId, input);

    res.status(201).json({
      status: "success",
      message: "Pass purchase initiated successfully",
      data: {
        purchase: result,
        passPurchase: result,
        paymentToken: result.paymentToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller validating a Festival Pass coupon for Standup Comedy
 * POST /api/passes/validate-coupon
 */
export const validatePassCouponHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawPassId = req.body.passId || req.body.couponCode || req.body.code || "";
    const eventId = req.body.eventId || undefined;

    const result = await PassService.validatePassCoupon(rawPassId, eventId);

    if (!result.valid) {
      res.status(200).json({
        status: "fail",
        valid: false,
        message: result.message || "Invalid or inactive Festival Pass.",
        data: {
          valid: false,
          message: result.message || "Invalid or inactive Festival Pass.",
        },
      });
      return;
    }

    res.status(200).json({
      status: "success",
      valid: true,
      message: "Festival Pass verified",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

