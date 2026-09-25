import type { Request, Response, NextFunction } from "express";
import { RegistrationService } from "./registration.service";
import { PassService } from "../passes/pass.service";
import { VerificationService } from "../verification/verification.service";
import type {
  AuthenticatedRequest,
  CreateRegistrationInput,
  UpdateRegistrationStatusInput,
} from "../../types";
import { HttpError } from "../../lib/errors";
import { RegistrationStatus } from "../../../generated/prisma/client";

/**
 * Controller creating a new event registration (authenticated user or verified guest)
 * POST /api/registrations
 */
export const createRegistrationHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id || null;
    const input: CreateRegistrationInput = req.body;

    const result = await RegistrationService.createRegistration(
      userId,
      input
    );

    res.status(201).json({
      status: "success",
      message: "Registration initiated successfully",
      data: {
        registration: result,
        paymentToken: result.paymentToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller retrieving current authenticated user's registrations
 * GET /api/registrations/my-registrations
 */
export const getMyRegistrationsHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError("Authentication required", 401);
    }

    const registrations = await RegistrationService.getUserRegistrations(
      req.user.id
    );

    res.status(200).json({
      status: "success",
      count: registrations.length,
      data: { registrations },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller retrieving a single registration by ID
 * GET /api/registrations/:id
 */
export const getRegistrationByIdHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError("Authentication required", 401);
    }

    const registrationId = req.params.id as string;
    const registration = await RegistrationService.getRegistrationById(
      registrationId,
      req.user
    );

    res.status(200).json({
      status: "success",
      data: { registration },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller retrieving attendee registrations and pass purchases for a verified guest email
 * GET /api/registrations/guest-lookup
 * Access: Requires Authorization: Bearer <guestSessionToken> with purpose GUEST_LOOKUP
 */
export const guestLookupHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = (req.query.token as string)?.trim() || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7).trim() : undefined);
    if (!token) {
      throw new HttpError("Guest lookup authorization token is required", 401);
    }

    const decoded = VerificationService.validateScopedToken(token, "GUEST_LOOKUP");

    const [registrations, passPurchases] = await Promise.all([
      RegistrationService.getGuestRegistrationsByEmail(decoded.email),
      PassService.getPassPurchasesByEmail(decoded.email),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        email: decoded.email,
        registrations,
        passPurchases,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller retrieving all registrations for a given event (Admin/Organizer)
 * GET /api/events/:id/registrations
 */
export const getEventRegistrationsHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError("Authentication required", 401);
    }

    const eventId = req.params.id as string;
    const statusQuery = req.query.status as RegistrationStatus | undefined;
    const searchQuery = req.query.search as string | undefined;

    const registrations = await RegistrationService.getEventRegistrations(
      eventId,
      req.user,
      { status: statusQuery, search: searchQuery }
    );

    res.status(200).json({
      status: "success",
      count: registrations.length,
      data: { registrations },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller updating registration status (Admin/Organizer)
 * PATCH /api/registrations/:id/status
 */
export const updateRegistrationStatusHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError("Authentication required", 401);
    }

    const registrationId = req.params.id as string;
    const input: UpdateRegistrationStatusInput = req.body;

    if (!input.status || !Object.values(RegistrationStatus).includes(input.status)) {
      throw new HttpError(
        `Invalid status. Allowed values: ${Object.values(RegistrationStatus).join(", ")}`,
        400
      );
    }

    const registration = await RegistrationService.updateRegistrationStatus(
      registrationId,
      input.status,
      req.user
    );

    res.status(200).json({
      status: "success",
      message: "Registration status updated successfully",
      data: { registration },
    });
  } catch (error) {
    next(error);
  }
};
