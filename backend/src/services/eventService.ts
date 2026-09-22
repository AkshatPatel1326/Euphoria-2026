import { prisma } from "../lib/prisma";
import {
  EventStatus,
  RegistrationType,
  Role,
  type Event,
  Prisma,
} from "../../generated/prisma/client";
import { HttpError } from "../lib/errors";
import type { EventFilterQuery, EventDetail, JwtUserPayload } from "../types";

export class EventService {
  /**
   * Retrieves all published events matching the provided query filters.
   */
  public static async getEvents(filters: EventFilterQuery = {}): Promise<EventDetail[]> {
    const { category, registrationType, registrationOpen, search } = filters;

    const where: Prisma.EventWhereInput = {
      status: EventStatus.PUBLISHED,
    };

    // Exclude test events from public listings unless explicitly requested via category filter or ENABLE_TEST_EVENT env
    const isTestExplicitlyRequested =
      category &&
      (category.toLowerCase().trim() === "test" ||
        category.toLowerCase().trim() === "test-category" ||
        category.trim() === "cat-test-sandbox");
    const allowTestEvents =
      process.env.ENABLE_TEST_EVENT === "true" || Boolean(isTestExplicitlyRequested);

    if (!allowTestEvents) {
      where.category = {
        slug: { notIn: ["test", "test-category"] },
      };
    }

    // Filter by Category (slug or ID)
    if (category && typeof category === "string" && category.trim() !== "") {
      const normalizedCategory = category.trim().toLowerCase();
      where.OR = [
        { category: { slug: normalizedCategory } },
        { categoryId: category.trim() },
      ];
    }

    // Filter by Registration Type (INDIVIDUAL or GROUP)
    if (registrationType && typeof registrationType === "string") {
      const upperType = registrationType.trim().toUpperCase();
      if (upperType === "INDIVIDUAL") {
        where.registrationType = RegistrationType.INDIVIDUAL;
      } else if (upperType === "GROUP") {
        where.registrationType = RegistrationType.GROUP;
      }
    }

    // Filter by Registration Open status
    if (registrationOpen !== undefined && registrationOpen !== null) {
      if (typeof registrationOpen === "boolean") {
        where.registrationOpen = registrationOpen;
      } else if (typeof registrationOpen === "string") {
        if (registrationOpen.toLowerCase() === "true" || registrationOpen === "1") {
          where.registrationOpen = true;
        } else if (registrationOpen.toLowerCase() === "false" || registrationOpen === "0") {
          where.registrationOpen = false;
        }
      }
    }

    // Keyword search across event name and description
    if (search && typeof search === "string" && search.trim() !== "") {
      const term = search.trim();
      const searchCondition: Prisma.EventWhereInput[] = [
        { name: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
      ];

      if (where.OR) {
        // Combine with existing category OR clause using AND
        where.AND = [
          { OR: where.OR },
          { OR: searchCondition },
        ];
        delete where.OR;
      } else {
        where.OR = searchCondition;
      }
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return events as EventDetail[];
  }

  /**
   * Retrieves a single event by ID or slug, including category and schedule information.
   */
  public static async getEventByIdOrSlug(identifier: string): Promise<EventDetail> {
    if (!identifier || identifier.trim() === "") {
      throw new HttpError("Event identifier is required", 400);
    }

    const trimmedIdentifier = identifier.trim();

    const event = await prisma.event.findFirst({
      where: {
        OR: [
          { id: trimmedIdentifier },
          { slug: trimmedIdentifier },
        ],
        status: EventStatus.PUBLISHED,
      },
      include: {
        category: true,
        schedules: {
          orderBy: {
            date: "asc",
          },
        },
      },
    });

    if (!event) {
      throw new HttpError(`Event '${trimmedIdentifier}' not found`, 404);
    }

    return event as EventDetail;
  }

  /**
   * Updates an event's registrationOpen status (Admin or assigned Organizer only)
   */
  public static async updateRegistrationStatus(
    eventId: string,
    registrationOpen: boolean,
    currentUser: JwtUserPayload
  ): Promise<Event> {
    if (!eventId || eventId.trim() === "") {
      throw new HttpError("Event ID is required", 400);
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId.trim() },
    });

    if (!event) {
      throw new HttpError("Event not found", 404);
    }

    const isAdmin = currentUser.role === Role.ADMIN;
    const isAssignedOrganizer =
      currentUser.role === Role.ORGANIZER && event.organizerId === currentUser.id;

    if (!isAdmin && !isAssignedOrganizer) {
      throw new HttpError(
        "Access denied. Only Admins or the assigned Organizer can update event registration status.",
        403
      );
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId.trim() },
      data: { registrationOpen },
      include: {
        category: true,
      },
    });

    return updatedEvent;
  }
}

