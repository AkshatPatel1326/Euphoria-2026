import { prisma } from "../lib/prisma";
import {
  RegistrationStatus,
  PaymentStatus,
  PaymentMethod,
  ParticipantCategory,
  RegistrationType,
  Role,
  type Prisma,
} from "../../generated/prisma/client";
import { HttpError } from "../lib/errors";
import { VerificationService } from "./verificationService";
import { emailService } from "./emailService";
import type {
  CreateRegistrationInput,
  RegistrationDetail,
  JwtUserPayload,
} from "../types";
import {
  isValidSageInstitute,
  isValidSageYear,
  YEAR_TO_SEMESTER_MAP,
} from "../lib/academic";

/**
 * Helper to normalize participant category strings from frontend or enum values
 */
export function normalizeParticipantCategory(
  cat: ParticipantCategory | string | undefined
): ParticipantCategory {
  if (!cat) {
    throw new HttpError("Participant category is required", 400);
  }

  const raw = cat.toString().trim();
  const normalized = raw.toUpperCase().replace(/[-\s/]+/g, "_");
  if (
    normalized === "SAGE" ||
    normalized === "SAGE_STUDENT" ||
    normalized === "SAGE_UNIVERSITY_STUDENT"
  ) {
    return ParticipantCategory.SAGE;
  }
  if (
    normalized === "OTHER_COLLEGE" ||
    normalized === "OTHER_COLLEGE_STUDENT" ||
    normalized === "OTHER_COLLEGE_SCHOOL_STUDENT" ||
    normalized === "OTHER_COLLEGE_SCHOOL"
  ) {
    return ParticipantCategory.OTHER_COLLEGE;
  }
  if (normalized === "GENERAL" || normalized === "GENERAL_PARTICIPANT") {
    return ParticipantCategory.GENERAL;
  }

  throw new HttpError(
    `Invalid participant category '${cat}'. Allowed: SAGE, OTHER_COLLEGE, GENERAL`,
    400
  );
}

/**
 * Helper to normalize payment method if provided
 */
export function normalizePaymentMethod(
  method: PaymentMethod | string | undefined
): PaymentMethod | null {
  if (!method) return null;
  const m = method.toString().trim().toUpperCase();
  if (m === "UPI") return PaymentMethod.UPI;
  if (m === "CARD") return PaymentMethod.CARD;
  if (m === "NETBANKING") return PaymentMethod.NETBANKING;
  if (m === "OTHER") return PaymentMethod.OTHER;
  return null;
}

/**
 * Helper to generate unique registration number
 * Example: EUPH-2026-REG-8192ABCD
 */
function generateRegistrationNumber(): string {
  const timestamp = Date.now().toString().slice(-4);
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EUPH-2026-REG-${timestamp}${randomSuffix}`;
}

/**
 * Centralized Registration Service implementing all business rules,
 * capacity checks with row locking, and duplicate prevention.
 */
export class RegistrationService {
  /**
   * Creates a new event registration (individual or team) within a Prisma transaction
   * with row-level locking on the Event to guarantee capacity safety and no race conditions.
   * Supports both authenticated users and verified guests.
   */
  public static async createRegistration(
    userId: string | null | undefined,
    input: CreateRegistrationInput
  ): Promise<RegistrationDetail & { paymentToken?: string | null }> {
    if (!input.eventId || input.eventId.trim() === "") {
      throw new HttpError("eventId is required", 400);
    }

    const participantCategory = normalizeParticipantCategory(
      input.participantCategory
    );

    // Extract snapshot personal details supporting either nested personalDetails or flat structure
    const fullName = (
      input.personalDetails?.fullName ||
      input.fullName ||
      ""
    ).trim();
    const email = (
      input.personalDetails?.email ||
      input.email ||
      ""
    ).trim().toLowerCase();
    const phone = (
      input.personalDetails?.phone ||
      input.phone ||
      ""
    ).trim();

    if (!fullName) {
      throw new HttpError("Full name is required", 400);
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpError("A valid email address is required", 400);
    }
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      throw new HttpError("A valid 10-digit phone number is required", 400);
    }

    // Guest verification requirement: if not authenticated, verificationToken is strictly required
    if (!userId) {
      if (!input.verificationToken || input.verificationToken.trim() === "") {
        throw new HttpError("Email verification is required for guest registrations", 400);
      }
      VerificationService.validateScopedToken(
        input.verificationToken,
        "EVENT_REGISTRATION",
        email
      );
    }

    let scholarNumber = input.scholarNumber?.trim() || null;
    let enrollmentNumber = input.enrollmentNumber?.trim() || null;
    let collegeName = input.collegeName?.trim() || null;
    let course = input.course?.trim() || null;
    let year = input.year?.trim() || null;
    let city = input.city?.trim() || null;
    let institute = input.institute?.trim() || null;
    let semester: string | null = null;

    // Execute atomic registration within Prisma transaction with row-level lock
    return await prisma.$transaction(async (tx) => {
      // 1. Lock the Event row in PostgreSQL to serialize concurrent registration requests
      const lockedEvents = await tx.$queryRaw<
        Array<{
          id: string;
          name: string;
          status: string;
          registrationOpen: boolean;
          capacity: number | null;
          registrationDeadline: Date | null;
          registrationType: string;
          minTeamSize: number;
          maxTeamSize: number;
          fee: number;
        }>
      >`
        SELECT id, name, status, "registrationOpen", capacity, "registrationDeadline", "registrationType", "minTeamSize", "maxTeamSize", fee
        FROM "Event"
        WHERE id = ${input.eventId.trim()}
        FOR UPDATE
      `;

      if (!lockedEvents || lockedEvents.length === 0) {
        throw new HttpError("Event not found", 404);
      }

      const eventLock = lockedEvents[0];

      // 2. Check Event publication status
      if (eventLock.status !== "PUBLISHED") {
        throw new HttpError("This event is not published for registrations", 400);
      }

      // 3. STRICT CLOSED REGISTRATION RULE:
      // If registrationOpen is false, registration is strictly blocked for all users (NO admin bypass)
      if (!eventLock.registrationOpen) {
        throw new HttpError(
          "Registrations for this event are currently closed",
          400
        );
      }

      // 4. Check registration deadline
      if (
        eventLock.registrationDeadline &&
        new Date() > new Date(eventLock.registrationDeadline)
      ) {
        throw new HttpError(
          "The registration deadline for this event has passed",
          400
        );
      }

      // 5. Prevent duplicate active registrations by email (or userId) for this event
      const existingRegistration = await tx.registration.findFirst({
        where: {
          eventId: eventLock.id,
          status: {
            in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING],
          },
          OR: [
            { email: { equals: email, mode: "insensitive" } },
            ...(userId ? [{ userId }] : []),
          ],
        },
      });

      if (existingRegistration) {
        throw new HttpError(
          "An active registration already exists for this email address and event",
          400
        );
      }

      // 6. CAPACITY SAFETY:
      // Capacity represents the maximum number of active Registration records
      // (individual registration or team registration = 1 record toward capacity).
      if (eventLock.capacity !== null) {
        const activeRegistrationCount = await tx.registration.count({
          where: {
            eventId: eventLock.id,
            status: {
              in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING],
            },
          },
        });

        if (activeRegistrationCount >= eventLock.capacity) {
          throw new HttpError(
            "Event has reached maximum registration capacity",
            400
          );
        }
      }

      // 7. Validate Participant Category and category-specific requirements
      if (participantCategory === ParticipantCategory.SAGE) {
        if (!scholarNumber) {
          throw new HttpError("Scholar number is required for SAGE University students", 400);
        }
        if (!enrollmentNumber) {
          throw new HttpError("Enrollment number is required for SAGE University students", 400);
        }
        if (!institute) {
          throw new HttpError("Please select your institute", 400);
        }
        if (!isValidSageInstitute(institute)) {
          throw new HttpError("Invalid institute selected", 400);
        }
        if (!year) {
          throw new HttpError("Please select your year", 400);
        }
        if (!isValidSageYear(year)) {
          throw new HttpError("Invalid academic year selected", 400);
        }

        // Strictly derive semester from valid year
        semester = YEAR_TO_SEMESTER_MAP[year];

        // If client provided a semester, verify it matches
        if (input.semester && input.semester.trim() !== semester) {
          throw new HttpError(`Semester mismatch: ${year} must correspond to ${semester}`, 400);
        }

        // SAGE students do not have an external college name
        collegeName = null;
      } else if (participantCategory === ParticipantCategory.OTHER_COLLEGE) {
        if (!collegeName) {
          throw new HttpError("College/School name is required for Other College/School students", 400);
        }

        // Other College/School students: SAGE-specific fields must not be stored
        scholarNumber = null;
        enrollmentNumber = null;
        institute = null;
        semester = null;
      } else if (participantCategory === ParticipantCategory.GENERAL) {
        // General category: student-only fields must not be stored
        scholarNumber = null;
        enrollmentNumber = null;
        collegeName = null;
        institute = null;
        course = null;
        year = null;
        semester = null;
      }

      // 8. Handle Group vs Individual validation and Team creation
      let teamId: string | null = null;

      const isTeam =
        eventLock.registrationType === RegistrationType.GROUP ||
        eventLock.maxTeamSize > 1;

      if (isTeam) {
        const teamName = input.teamName?.trim();
        if (!teamName) {
          throw new HttpError(
            "Team name is required for team/group event registrations",
            400
          );
        }

        const membersInput = input.teamMembers || [];

        // Backward-compatible: If optional team members are provided, ensure total count does not exceed maxTeamSize
        if (membersInput.length > 0) {
          const totalTeamSize = 1 + membersInput.length;
          if (totalTeamSize > eventLock.maxTeamSize) {
            throw new HttpError(
              `Group registration allows at most ${eventLock.maxTeamSize} team members (including team leader)`,
              400
            );
          }

          // Validate each provided member has valid name, email, phone and doesn't match leader
          for (let i = 0; i < membersInput.length; i++) {
            const m = membersInput[i];
            if (!m.fullName || !m.fullName.trim()) {
              throw new HttpError(`Team member #${i + 1} name is required`, 400);
            }
            if (!m.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email.trim())) {
              throw new HttpError(
                `Team member #${i + 1} has an invalid email address`,
                400
              );
            }
            const mEmail = m.email.trim().toLowerCase();
            if (mEmail === email) {
              throw new HttpError(
                `Team member #${i + 1} (${m.fullName}) has the same email as the team leader`,
                400
              );
            }
            if (!m.phone || m.phone.replace(/\D/g, "").length < 10) {
              throw new HttpError(
                `Team member #${i + 1} requires a valid 10-digit phone number`,
                400
              );
            }
          }
        }

        // Create Team and associated TeamMembers (if optional members provided)
        const team = await tx.team.create({
          data: {
            name: teamName,
            eventId: eventLock.id,
            leaderId: userId || null,
            leaderName: fullName,
            leaderEmail: email,
            leaderPhone: phone,
            ...(membersInput.length > 0
              ? {
                  members: {
                    create: membersInput.map((m) => ({
                      fullName: m.fullName.trim(),
                      email: m.email.trim().toLowerCase(),
                      phone: m.phone.trim(),
                      scholarNumber: m.scholarNumber?.trim() || null,
                      collegeName: m.collegeName?.trim() || null,
                    })),
                  },
                }
              : {}),
          },
        });

        teamId = team.id;
      }

      // 8. Handle Standup Comedy Festival Pass coupon validation & pricing
      const isStandupComedy =
        eventLock.id === "cultural-12" ||
        eventLock.name.toLowerCase().includes("standup comedy") ||
        eventLock.name.toLowerCase().includes("pankaj");

      let appliedPassNumber: string | null = null;
      let passDiscountAmount = 0;
      let finalPayableFee = eventLock.fee; // Default: ₹199 for Standup, or normal fee for other events

      if (input.festivalPassId && input.festivalPassId.trim()) {
        const enteredPassId = input.festivalPassId.trim().toUpperCase();

        if (!isStandupComedy) {
          throw new HttpError("Festival Pass coupon discount is only applicable for Standup Comedy.", 400);
        }

        // Row-level lock the PassPurchase row using SELECT ... FOR UPDATE to serialize concurrent requests
        const lockedPasses = await tx.$queryRaw<
          Array<{
            id: string;
            passNumber: string;
            status: string;
            standupDiscountUsed: boolean;
            standupRegistrationId: string | null;
          }>
        >`
          SELECT id, "passNumber", status, "standupDiscountUsed", "standupRegistrationId"
          FROM "PassPurchase"
          WHERE UPPER("passNumber") = ${enteredPassId}
          FOR UPDATE
        `;

        if (!lockedPasses || lockedPasses.length === 0) {
          throw new HttpError("Invalid or inactive Festival Pass.", 400);
        }

        const passRow = lockedPasses[0];

        if (passRow.status !== "CONFIRMED") {
          throw new HttpError("Invalid or inactive Festival Pass.", 400);
        }

        if (passRow.standupDiscountUsed || passRow.standupRegistrationId) {
          throw new HttpError("This Festival Pass has already been used for Standup Comedy.", 400);
        }

        // Verify pass payment status
        const passPayment = await tx.payment.findFirst({
          where: { passPurchaseId: passRow.id },
        });

        if (!passPayment || (passPayment.status !== PaymentStatus.SUCCESS && passPayment.amount > 0)) {
          throw new HttpError("Invalid or inactive Festival Pass.", 400);
        }

        // Prevent duplicate usage from any existing active registration
        const existingRegWithPass = await tx.registration.findFirst({
          where: {
            appliedPassId: passRow.passNumber,
            status: { in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING] },
          },
        });

        if (existingRegWithPass) {
          throw new HttpError("This Festival Pass has already been used for Standup Comedy.", 400);
        }

        appliedPassNumber = passRow.passNumber;
        passDiscountAmount = Math.max(0, eventLock.fee - 49); // 199 - 49 = 150
        finalPayableFee = 49;
      }

      // 9. Generate unique registration number with duplicate protection
      let registrationNumber = generateRegistrationNumber();
      let regIdAttempts = 0;
      while (await tx.registration.findUnique({ where: { registrationNumber } })) {
        registrationNumber = generateRegistrationNumber();
        regIdAttempts++;
        if (regIdAttempts > 10) throw new HttpError("Failed to generate unique Registration ID", 500);
      }

      const isFreeEvent = finalPayableFee <= 0;
      const initialStatus = isFreeEvent
        ? RegistrationStatus.CONFIRMED
        : RegistrationStatus.PENDING;

      // 10. Create Registration record (supports optional userId and records email verification)
      const registration = await tx.registration.create({
        data: {
          registrationNumber,
          userId: userId || null,
          eventId: eventLock.id,
          teamId,
          participantCategory,
          status: initialStatus,
          fullName,
          email,
          phone,
          scholarNumber,
          enrollmentNumber,
          collegeName,
          institute,
          course,
          year,
          semester,
          city,
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
          confirmationEmailSent: isFreeEvent,
          confirmationEmailSentAt: isFreeEvent ? new Date() : null,
          appliedPassId: appliedPassNumber,
          discountAmount: passDiscountAmount,
        },
      });

      // 11. Mark Pass as used for Standup Comedy atomically
      if (appliedPassNumber) {
        await tx.passPurchase.update({
          where: { passNumber: appliedPassNumber },
          data: {
            standupDiscountUsed: true,
            standupRegistrationId: registration.registrationNumber,
          },
        });
      }

      // 12. Create initial Payment record with backend-authoritative amount
      const initialPaymentMethod = normalizePaymentMethod(input.paymentMethod);

      if (isFreeEvent) {
        await tx.payment.create({
          data: {
            amount: 0,
            currency: "INR",
            method: PaymentMethod.OTHER,
            status: PaymentStatus.SUCCESS,
            transactionId: `FREE_REG_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            gatewayReference: "FREE_EVENT_REGISTRATION",
            paidAt: new Date(),
            registrationId: registration.id,
          },
        });
      } else {
        await tx.payment.create({
          data: {
            amount: finalPayableFee,
            currency: "INR",
            method: initialPaymentMethod,
            status: PaymentStatus.PENDING,
            transactionId: `TXN_INIT_${registration.id}_${Date.now()}`,
            gatewayReference: null,
            paidAt: null,
            registrationId: registration.id,
          },
        });
      }

      // 11. Retrieve complete populated registration
      const createdRegistration = await tx.registration.findUnique({
        where: { id: registration.id },
        include: {
          event: {
            include: {
              category: true,
            },
          },
          team: {
            include: {
              members: true,
            },
          },
          payment: true,
        },
      });

      // 12. Issue short-lived payment authorization token if paid event
      const paymentToken = !isFreeEvent
        ? VerificationService.issuePaymentToken(email, "REGISTRATION_PAYMENT", registration.id)
        : null;

      const registrationResult = {
        ...(createdRegistration as unknown as RegistrationDetail),
        paymentToken,
      };

      // 13. Dispatch confirmation email for free event registrations
      if (isFreeEvent && createdRegistration) {
        try {
          await emailService.sendRegistrationConfirmation(email, createdRegistration as any);
        } catch (err: any) {
          console.error(
            "[RegistrationService] Non-fatal error sending free event confirmation email:",
            err?.message
          );
        }
      }

      return registrationResult;
    });
  }

  /**
   * Retrieves all registrations for a verified guest email
   */
  public static async getGuestRegistrationsByEmail(
    email: string
  ): Promise<RegistrationDetail[]> {
    const normalizedEmail = email.trim().toLowerCase();
    const registrations = await prisma.registration.findMany({
      where: {
        email: { equals: normalizedEmail, mode: "insensitive" },
      },
      include: {
        event: {
          include: {
            category: true,
          },
        },
        team: {
          include: {
            members: true,
          },
        },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return registrations as unknown as RegistrationDetail[];
  }

  /**
   * Retrieves all registrations for the authenticated user
   */
  public static async getUserRegistrations(
    userId: string
  ): Promise<RegistrationDetail[]> {
    const registrations = await prisma.registration.findMany({
      where: { userId },
      include: {
        event: {
          include: {
            category: true,
          },
        },
        team: {
          include: {
            members: true,
          },
        },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return registrations as unknown as RegistrationDetail[];
  }

  /**
   * Retrieves single registration by ID with authorization verification
   */
  public static async getRegistrationById(
    registrationId: string,
    currentUser: JwtUserPayload
  ): Promise<RegistrationDetail> {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        event: {
          include: {
            category: true,
          },
        },
        team: {
          include: {
            members: true,
          },
        },
        payment: true,
      },
    });

    if (!registration) {
      throw new HttpError("Registration not found", 404);
    }

    const isOwner = registration.userId === currentUser.id;
    const isTeamLeader = registration.team?.leaderId === currentUser.id;
    const isAdmin = currentUser.role === Role.ADMIN;
    const isOrganizer =
      currentUser.role === Role.ORGANIZER &&
      registration.event.organizerId === currentUser.id;

    if (!isOwner && !isTeamLeader && !isAdmin && !isOrganizer) {
      throw new HttpError(
        "Access denied. You do not have permission to view this registration.",
        403
      );
    }

    return registration as unknown as RegistrationDetail;
  }

  /**
   * Retrieves all registrations for a specific event (Admin or assigned Organizer only)
   */
  public static async getEventRegistrations(
    eventId: string,
    currentUser: JwtUserPayload,
    filters?: { status?: RegistrationStatus; search?: string }
  ): Promise<RegistrationDetail[]> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new HttpError("Event not found", 404);
    }

    const isAdmin = currentUser.role === Role.ADMIN;
    const isAssignedOrganizer =
      currentUser.role === Role.ORGANIZER &&
      event.organizerId === currentUser.id;

    if (!isAdmin && !isAssignedOrganizer) {
      throw new HttpError(
        "Access denied. Only Admins or the assigned Organizer can view event registrations.",
        403
      );
    }

    const whereClause: Prisma.RegistrationWhereInput = {
      eventId,
    };

    if (filters?.status) {
      whereClause.status = filters.status;
    }

    if (filters?.search && filters.search.trim() !== "") {
      const query = filters.search.trim();
      whereClause.OR = [
        { fullName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { registrationNumber: { contains: query, mode: "insensitive" } },
      ];
    }

    const registrations = await prisma.registration.findMany({
      where: whereClause,
      include: {
        event: {
          include: {
            category: true,
          },
        },
        team: {
          include: {
            members: true,
          },
        },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return registrations as unknown as RegistrationDetail[];
  }

  /**
   * Allows Admin or assigned Organizer to update a registration status manually
   */
  public static async updateRegistrationStatus(
    registrationId: string,
    newStatus: RegistrationStatus,
    currentUser: JwtUserPayload
  ): Promise<RegistrationDetail> {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        event: true,
        payment: true,
      },
    });

    if (!registration) {
      throw new HttpError("Registration not found", 404);
    }

    const isAdmin = currentUser.role === Role.ADMIN;
    const isAssignedOrganizer =
      currentUser.role === Role.ORGANIZER &&
      registration.event.organizerId === currentUser.id;

    if (!isAdmin && !isAssignedOrganizer) {
      throw new HttpError(
        "Access denied. Only Admins or assigned Organizers can update registration status.",
        403
      );
    }

    return await prisma.$transaction(async (tx) => {
      // If manually confirming, also confirm payment if pending
      if (
        newStatus === RegistrationStatus.CONFIRMED &&
        registration.payment &&
        registration.payment.status !== PaymentStatus.SUCCESS
      ) {
        await tx.payment.update({
          where: { id: registration.payment.id },
          data: {
            status: PaymentStatus.SUCCESS,
            paidAt: new Date(),
          },
        });
      }

      const updated = await tx.registration.update({
        where: { id: registrationId },
        data: { status: newStatus },
        include: {
          event: {
            include: {
              category: true,
            },
          },
          team: {
            include: {
              members: true,
            },
          },
          payment: true,
        },
      });

      return updated as unknown as RegistrationDetail;
    });
  }
}
