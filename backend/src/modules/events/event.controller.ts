import type { Request, Response, NextFunction } from "express";
import { EventService } from "./event.service";
import type { EventFilterQuery, AuthenticatedRequest } from "../../types";
import { HttpError } from "../../lib/errors";

/**
 * Controller retrieving all published events with optional filtering
 * GET /api/events
 */
export const getEventsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters: EventFilterQuery = {
      category: req.query.category as string | undefined,
      registrationType: req.query.registrationType as string | undefined,
      registrationOpen: req.query.registrationOpen as string | undefined,
      search: req.query.search as string | undefined,
    };

    const events = await EventService.getEvents(filters);

    res.status(200).json({
      status: "success",
      count: events.length,
      data: { events },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller retrieving a single event by ID or slug
 * GET /api/events/:idOrSlug
 */
export const getEventByIdOrSlugHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const idOrSlug = req.params.idOrSlug as string;
    const event = await EventService.getEventByIdOrSlug(idOrSlug);

    res.status(200).json({
      status: "success",
      data: { event },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller updating registrationOpen status and/or capacity limit for an event (Admin or assigned Organizer)
 * PATCH /api/events/:id/registration-status
 */
export const updateEventRegistrationStatusHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError("Authentication required", 401);
    }

    const id = req.params.id as string;
    const { registrationOpen, capacity } = req.body;

    if (registrationOpen === undefined && capacity === undefined) {
      throw new HttpError("At least one of 'registrationOpen' or 'capacity' must be provided", 400);
    }

    if (registrationOpen !== undefined && typeof registrationOpen !== "boolean") {
      throw new HttpError("Field 'registrationOpen' must be a boolean", 400);
    }

    let parsedCapacity: number | null | undefined = undefined;
    if (capacity !== undefined) {
      if (capacity === null) {
        parsedCapacity = null;
      } else if (typeof capacity === "number") {
        if (!Number.isInteger(capacity)) {
          throw new HttpError("Registration limit must be an integer, decimals are not allowed", 400);
        }
        if (capacity < 0) {
          throw new HttpError("Registration limit cannot be negative", 400);
        }
        parsedCapacity = capacity;
      } else {
        throw new HttpError("Registration limit must be null or a non-negative integer", 400);
      }
    }

    const updatedEvent = await EventService.updateRegistrationStatus(
      id,
      {
        registrationOpen,
        capacity: parsedCapacity,
      },
      req.user
    );

    let message = "Event registration settings updated successfully";
    if (registrationOpen !== undefined && parsedCapacity !== undefined) {
      message = `Event registration is now ${registrationOpen ? "open" : "closed"} with limit ${parsedCapacity === null ? "Unlimited" : parsedCapacity}`;
    } else if (registrationOpen !== undefined) {
      message = `Event registration is now ${registrationOpen ? "open" : "closed"}`;
    } else if (parsedCapacity !== undefined) {
      message = `Event registration limit set to ${parsedCapacity === null ? "Unlimited" : parsedCapacity}`;
    }

    res.status(200).json({
      status: "success",
      message,
      data: { event: updatedEvent },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller updating full event content, pricing, prizes, media, or registration settings
 * (Admin or assigned Organizer)
 * PATCH /api/events/:id
 */
export const updateEventHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError("Authentication required", 401);
    }

    const id = req.params.id as string;
    const updatedEvent = await EventService.updateEventContent(id, req.body, req.user);

    res.status(200).json({
      status: "success",
      message: `Event '${updatedEvent.name}' updated successfully`,
      data: { event: updatedEvent },
    });
  } catch (error) {
    next(error);
  }
};

