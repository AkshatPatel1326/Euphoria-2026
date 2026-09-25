import { prisma } from "../../lib/prisma";
import {
  EventStatus,
  RegistrationStatus,
  RegistrationType,
  Role,
  type Event,
  Prisma,
} from "../../../generated/prisma/client";
import { HttpError } from "../../lib/errors";
import type {
  EventFilterQuery,
  EventDetail,
  JwtUserPayload,
  UpdateEventContentInput,
  CoordinatorItem,
} from "../../types";

/**
 * Parses coordinator string (or JSON) into structured array of { name, phone }.
 */
export function parseCoordinatorString(raw?: string | null): CoordinatorItem[] {
  if (!raw || !raw.trim()) return [];

  const trimmed = raw.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item) => item && typeof item === "object")
          .map((item) => ({
            name: String(item.name || "").trim(),
            phone: String(item.phone || "").trim(),
          }))
          .filter((item) => item.name.length > 0 || item.phone.length > 0);
      }
    } catch {}
  }

  const entries = trimmed
    .split(/[\r\n;]+|,(?![^(]*\))/)
    .map((s) => s.trim())
    .filter(Boolean);

  return entries.map((entry) => {
    const sepMatch = entry.match(/^(.+?)\s*(?:-|:|–|—)\s*([0-9\s+()-]{7,20})$/);
    if (sepMatch) {
      return {
        name: sepMatch[1].trim(),
        phone: sepMatch[2].trim(),
      };
    }
    const phoneMatch = entry.match(/^(.+?)\s+([0-9]{10})$/);
    if (phoneMatch) {
      return {
        name: phoneMatch[1].trim(),
        phone: phoneMatch[2].trim(),
      };
    }
    return {
      name: entry.trim(),
      phone: "",
    };
  });
}

/**
 * Formats structured coordinator array into comma-separated string for database persistence.
 */
export function formatCoordinatorArray(items?: CoordinatorItem[] | null): string | null {
  if (!items || items.length === 0) return null;
  const valid = items
    .map((c) => ({
      name: c.name?.trim() || "",
      phone: c.phone?.trim() || "",
    }))
    .filter((c) => c.name.length > 0 || c.phone.length > 0);

  if (valid.length === 0) return null;

  return valid
    .map((c) => (c.phone ? `${c.name} - ${c.phone}` : c.name))
    .join(", ");
}

/**
 * Automatically derives the day of the week (e.g., "Thursday") from a date string.
 * Supports formats such as:
 * - "9 April 2026", "09 April 2026", "April 9, 2026"
 * - "2026-04-09"
 * - "09/04/2026", "9/4/2026", "09-04-2026"
 */
export function deriveDayFromDate(dateStr: string | null | undefined): string | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // 1. Try Date.parse / standard Date constructor
  let d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString("en-US", { weekday: "long" });
  }

  // 2. Handle DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", { weekday: "long" });
    }
  }

  // 3. Handle e.g. "9th April 2026"
  const cleanOrdinal = trimmed.replace(/(\d+)(st|nd|rd|th)/i, "$1");
  d = new Date(cleanOrdinal);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString("en-US", { weekday: "long" });
  }

  return null;
}

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
        _count: {
          select: {
            registrations: {
              where: {
                status: {
                  in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING],
                },
              },
            },
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    return events.map((e) => {
      const { _count, ...rest } = e;
      return {
        ...rest,
        activeRegistrationsCount: _count?.registrations ?? 0,
        facultyCoordinators: parseCoordinatorString(e.facultyCoordinator),
        studentCoordinators: parseCoordinatorString(e.studentCoordinator),
      };
    }) as EventDetail[];
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
        _count: {
          select: {
            registrations: {
              where: {
                status: {
                  in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING],
                },
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new HttpError(`Event '${trimmedIdentifier}' not found`, 404);
    }

    const { _count, ...rest } = event;
    return {
      ...rest,
      activeRegistrationsCount: _count?.registrations ?? 0,
      facultyCoordinators: parseCoordinatorString(event.facultyCoordinator),
      studentCoordinators: parseCoordinatorString(event.studentCoordinator),
    } as EventDetail;
  }

  /**
   * Updates an event's registrationOpen status and/or capacity limit.
   * Backwards compatible helper that routes to updateEventContent.
   */
  public static async updateRegistrationStatus(
    eventId: string,
    params: {
      registrationOpen?: boolean;
      capacity?: number | null;
    },
    currentUser: JwtUserPayload
  ): Promise<EventDetail> {
    return this.updateEventContent(eventId, params, currentUser);
  }

  /**
   * Authoritative Event Content Management System (ECMS) update method.
   * Supports partial updates for basic information, event details, pricing, prizes,
   * registration settings, coordinators, and media/resources.
   *
   * RBAC Enforcement:
   * - ADMIN: Can update any event.
   * - ORGANIZER: Can only update events they are assigned to manage.
   * - PARTICIPANT / Unauthenticated: Rejected with 403 / 401.
   *
   * Synchronization & Safety:
   * - Row-level lock (FOR UPDATE) within transaction guarantees atomicity with concurrent registrations.
   * - Day is automatically derived from Date when Date is updated.
   * - Database is authoritative single source of truth for payment fees and capacity.
   */
  public static async updateEventContent(
    eventId: string,
    params: UpdateEventContentInput,
    currentUser: JwtUserPayload
  ): Promise<EventDetail> {
    if (!eventId || eventId.trim() === "") {
      throw new HttpError("Event ID is required", 400);
    }

    const trimmedId = eventId.trim();

    return await prisma.$transaction(async (tx) => {
      // 1. Lock the Event row FOR UPDATE to synchronize with concurrent registration transactions
      const lockedEvents = await tx.$queryRaw<
        Array<{
          id: string;
          organizerId: string | null;
          minTeamSize: number;
          maxTeamSize: number;
        }>
      >`
        SELECT id, "organizerId", "minTeamSize", "maxTeamSize"
        FROM "Event"
        WHERE id = ${trimmedId}
        FOR UPDATE
      `;

      if (!lockedEvents || lockedEvents.length === 0) {
        throw new HttpError("Event not found", 404);
      }

      const lockedEvent = lockedEvents[0];

      // 2. Enforce RBAC
      const isAdmin = currentUser.role === Role.ADMIN;
      const isAssignedOrganizer =
        currentUser.role === Role.ORGANIZER && lockedEvent.organizerId === currentUser.id;

      if (!isAdmin && !isAssignedOrganizer) {
        throw new HttpError(
          "Access denied. Only Admins or the assigned Organizer can update event content.",
          403
        );
      }

      // 3. Build update payload with strict validation
      const updateData: Prisma.EventUpdateInput = {};

      // Basic Information
      if (params.name !== undefined) {
        if (typeof params.name !== "string" || params.name.trim().length === 0) {
          throw new HttpError("Event title cannot be empty", 400);
        }
        updateData.name = params.name.trim();
      }

      if (params.description !== undefined) {
        if (typeof params.description !== "string") {
          throw new HttpError("Description must be a string", 400);
        }
        updateData.description = params.description.trim();
      }

      if (params.categoryId !== undefined) {
        if (typeof params.categoryId !== "string" || params.categoryId.trim() === "") {
          throw new HttpError("Category ID must be a non-empty string", 400);
        }
        const cat = await tx.category.findUnique({
          where: { id: params.categoryId.trim() },
        });
        if (!cat) {
          throw new HttpError(`Category with ID '${params.categoryId}' does not exist`, 400);
        }
        updateData.category = { connect: { id: params.categoryId.trim() } };
      }

      if (params.eventFamily !== undefined) {
        updateData.eventFamily = params.eventFamily ? params.eventFamily.trim() : null;
      }

      if (params.stage !== undefined) {
        updateData.stage = params.stage ? params.stage.trim() : null;
      }

      // Pricing
      if (params.fee !== undefined) {
        if (typeof params.fee !== "number" || isNaN(params.fee) || params.fee < 0) {
          throw new HttpError("Entry fee must be a non-negative number", 400);
        }
        updateData.fee = params.fee;
      }

      // Registration Type & Team Size
      if (params.registrationType !== undefined) {
        const upperType = String(params.registrationType).toUpperCase();
        if (!["INDIVIDUAL", "GROUP"].includes(upperType)) {
          throw new HttpError("Registration type must be INDIVIDUAL or GROUP", 400);
        }
        updateData.registrationType = upperType as RegistrationType;
      }

      let finalMin = lockedEvent.minTeamSize;
      let finalMax = lockedEvent.maxTeamSize;

      if (params.minTeamSize !== undefined) {
        if (
          typeof params.minTeamSize !== "number" ||
          !Number.isInteger(params.minTeamSize) ||
          params.minTeamSize < 1
        ) {
          throw new HttpError("Minimum team size must be an integer >= 1", 400);
        }
        finalMin = params.minTeamSize;
        updateData.minTeamSize = params.minTeamSize;
      }

      if (params.maxTeamSize !== undefined) {
        if (
          typeof params.maxTeamSize !== "number" ||
          !Number.isInteger(params.maxTeamSize) ||
          params.maxTeamSize < 1
        ) {
          throw new HttpError("Maximum team size must be an integer >= 1", 400);
        }
        finalMax = params.maxTeamSize;
        updateData.maxTeamSize = params.maxTeamSize;
      }

      if (finalMin > finalMax) {
        throw new HttpError("Minimum team size cannot be greater than maximum team size", 400);
      }

      // Registration Status & Capacity
      if (params.registrationOpen !== undefined) {
        if (typeof params.registrationOpen !== "boolean") {
          throw new HttpError("registrationOpen must be a boolean", 400);
        }
        updateData.registrationOpen = params.registrationOpen;
      }

      if (params.capacity !== undefined) {
        if (params.capacity === null) {
          updateData.capacity = null;
        } else if (
          typeof params.capacity === "number" &&
          Number.isInteger(params.capacity) &&
          params.capacity >= 0
        ) {
          updateData.capacity = params.capacity;
        } else {
          throw new HttpError("Registration limit must be null or a non-negative integer", 400);
        }
      }

      // Schedule: Date & derived Day, Time, Venue
      if (params.date !== undefined) {
        if (params.date === null || params.date.trim() === "") {
          updateData.date = null;
          updateData.day = null;
        } else {
          const trimmedDate = params.date.trim();
          updateData.date = trimmedDate;
          const derivedDay = deriveDayFromDate(trimmedDate);
          if (derivedDay) {
            updateData.day = derivedDay;
          }
        }
      }

      if (params.day !== undefined && params.date === undefined) {
        updateData.day = params.day ? params.day.trim() : null;
      }

      if (params.time !== undefined) {
        updateData.time = params.time ? params.time.trim() : null;
      }

      if (params.venue !== undefined) {
        updateData.venue = params.venue ? params.venue.trim() : null;
      }

      // Prizes & Rules / Rulebook
      if (params.prizes !== undefined) {
        updateData.prizes = params.prizes ? params.prizes.trim() : null;
      }

      if (params.rules !== undefined) {
        updateData.rules = params.rules ? params.rules.trim() : null;
      }

      // Media / Resources
      if (params.posterUrl !== undefined) {
        updateData.posterUrl = params.posterUrl ? params.posterUrl.trim() : null;
      }

      // Coordinators (supports structured array or formatted string)
      if (params.facultyCoordinators !== undefined) {
        if (params.facultyCoordinators === null || params.facultyCoordinators.length === 0) {
          updateData.facultyCoordinator = null;
        } else {
          for (let i = 0; i < params.facultyCoordinators.length; i++) {
            const coord = params.facultyCoordinators[i];
            const name = coord.name ? coord.name.trim() : "";
            const phone = coord.phone ? coord.phone.trim() : "";
            if (!name && !phone) {
              throw new HttpError(`Faculty coordinator #${i + 1} cannot be completely empty`, 400);
            }
            if (!name) {
              throw new HttpError(`Faculty coordinator #${i + 1} requires a name`, 400);
            }
            if (!phone) {
              throw new HttpError(`Faculty coordinator #${i + 1} requires a phone number`, 400);
            }
          }
          updateData.facultyCoordinator = formatCoordinatorArray(params.facultyCoordinators);
        }
      } else if (params.facultyCoordinator !== undefined) {
        updateData.facultyCoordinator = params.facultyCoordinator
          ? params.facultyCoordinator.trim()
          : null;
      }

      if (params.studentCoordinators !== undefined) {
        if (params.studentCoordinators === null || params.studentCoordinators.length === 0) {
          updateData.studentCoordinator = null;
        } else {
          for (let i = 0; i < params.studentCoordinators.length; i++) {
            const coord = params.studentCoordinators[i];
            const name = coord.name ? coord.name.trim() : "";
            const phone = coord.phone ? coord.phone.trim() : "";
            if (!name && !phone) {
              throw new HttpError(`Student coordinator #${i + 1} cannot be completely empty`, 400);
            }
            if (!name) {
              throw new HttpError(`Student coordinator #${i + 1} requires a name`, 400);
            }
            if (!phone) {
              throw new HttpError(`Student coordinator #${i + 1} requires a phone number`, 400);
            }
          }
          updateData.studentCoordinator = formatCoordinatorArray(params.studentCoordinators);
        }
      } else if (params.studentCoordinator !== undefined) {
        updateData.studentCoordinator = params.studentCoordinator
          ? params.studentCoordinator.trim()
          : null;
      }

      // 4. Update the event in database
      const updatedEvent = await tx.event.update({
        where: { id: trimmedId },
        data: updateData,
        include: {
          category: true,
          _count: {
            select: {
              registrations: {
                where: {
                  status: {
                    in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING],
                  },
                },
              },
            },
          },
        },
      });

      const { _count, ...rest } = updatedEvent;
      return {
        ...rest,
        activeRegistrationsCount: _count?.registrations ?? 0,
        facultyCoordinators: parseCoordinatorString(updatedEvent.facultyCoordinator),
        studentCoordinators: parseCoordinatorString(updatedEvent.studentCoordinator),
      } as EventDetail;
    });
  }
}

