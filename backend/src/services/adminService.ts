import { prisma } from "../lib/prisma";
import {
  Role,
  RegistrationStatus,
  PaymentStatus,
  type Prisma,
  type Event,
  type Pass,
} from "../../generated/prisma/client";
import { HttpError } from "../lib/errors";
import type {
  JwtUserPayload,
  AdminOverviewStats,
  AdminRegistrationQuery,
  AdminPassPurchaseQuery,
  PaginatedResult,
  RegistrationDetail,
  PassPurchaseDetail,
} from "../types";

export class AdminService {
  /**
   * Retrieves aggregated metrics and recent activity for Admin Dashboard.
   * Admins see festival-wide metrics; Organizers see metrics scoped to their events.
   */
  public static async getOverviewStats(
    currentUser: JwtUserPayload
  ): Promise<AdminOverviewStats> {
    const isAdmin = currentUser.role === Role.ADMIN;
    const isOrganizer = currentUser.role === Role.ORGANIZER;

    if (!isAdmin && !isOrganizer) {
      throw new HttpError("Access denied. Admin or Organizer privileges required.", 403);
    }

    const registrationWhere: Prisma.RegistrationWhereInput = isAdmin
      ? {}
      : { event: { organizerId: currentUser.id } };

    // Parallel aggregate queries for speed and efficiency
    const [
      totalRegistrations,
      regConfirmed,
      regPending,
      regCancelled,
      regRejected,
      recentRegistrations,
      categories,
    ] = await Promise.all([
      prisma.registration.count({ where: registrationWhere }),
      prisma.registration.count({
        where: { ...registrationWhere, status: RegistrationStatus.CONFIRMED },
      }),
      prisma.registration.count({
        where: { ...registrationWhere, status: RegistrationStatus.PENDING },
      }),
      prisma.registration.count({
        where: { ...registrationWhere, status: RegistrationStatus.CANCELLED },
      }),
      prisma.registration.count({
        where: { ...registrationWhere, status: RegistrationStatus.REJECTED },
      }),
      prisma.registration.findMany({
        where: registrationWhere,
        include: {
          event: { include: { category: true } },
          team: { include: { members: true } },
          payment: true,
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.category.findMany({
        include: {
          events: {
            select: {
              id: true,
              registrations: {
                where: registrationWhere,
                select: { id: true },
              },
            },
          },
        },
      }),
    ]);

    // Calculate category breakdown
    const registrationsByCategory = categories.map((cat) => {
      const count = cat.events.reduce(
        (sum, ev) => sum + ev.registrations.length,
        0
      );
      return {
        id: cat.id,
        name: cat.name,
        count,
      };
    });

    // Pass metrics and global revenue (Admin-only)
    let totalPassPurchases = 0;
    let passesConfirmed = 0;
    let passesPending = 0;
    let passesCancelled = 0;
    let passesRejected = 0;
    let recentPassPurchases: PassPurchaseDetail[] = [];
    let totalRevenue = 0;

    if (isAdmin) {
      const [
        totalPasses,
        pConfirmed,
        pPending,
        pCancelled,
        pRejected,
        recentPasses,
        revenueSum,
      ] = await Promise.all([
        prisma.passPurchase.count(),
        prisma.passPurchase.count({
          where: { status: RegistrationStatus.CONFIRMED },
        }),
        prisma.passPurchase.count({
          where: { status: RegistrationStatus.PENDING },
        }),
        prisma.passPurchase.count({
          where: { status: RegistrationStatus.CANCELLED },
        }),
        prisma.passPurchase.count({
          where: { status: RegistrationStatus.REJECTED },
        }),
        prisma.passPurchase.findMany({
          include: { pass: true, payment: true, holders: { orderBy: { holderIndex: "asc" } } },
          orderBy: { createdAt: "desc" },
          take: 6,
        }),
        prisma.payment.aggregate({
          where: { status: PaymentStatus.SUCCESS },
          _sum: { amount: true },
        }),
      ]);

      totalPassPurchases = totalPasses;
      passesConfirmed = pConfirmed;
      passesPending = pPending;
      passesCancelled = pCancelled;
      passesRejected = pRejected;
      recentPassPurchases = recentPasses as unknown as PassPurchaseDetail[];
      totalRevenue = revenueSum._sum.amount || 0;
    } else {
      // For Organizer, sum revenue only from successful payments for their events
      const organizerRevenue = await prisma.payment.aggregate({
        where: {
          status: PaymentStatus.SUCCESS,
          registration: {
            event: { organizerId: currentUser.id },
          },
        },
        _sum: { amount: true },
      });
      totalRevenue = organizerRevenue._sum.amount || 0;
    }

    return {
      totalRegistrations,
      registrationsByStatus: {
        confirmed: regConfirmed,
        pending: regPending,
        cancelled: regCancelled,
        rejected: regRejected,
      },
      totalPassPurchases,
      passesByStatus: {
        confirmed: passesConfirmed,
        pending: passesPending,
        cancelled: passesCancelled,
        rejected: passesRejected,
      },
      totalRevenue,
      registrationsByCategory,
      recentRegistrations: recentRegistrations as unknown as RegistrationDetail[],
      recentPassPurchases,
    };
  }

  /**
   * Builds Prisma where input for registration queries.
   */
  private static buildRegistrationWhere(
    currentUser: JwtUserPayload,
    query: AdminRegistrationQuery
  ): Prisma.RegistrationWhereInput {
    const isAdmin = currentUser.role === Role.ADMIN;
    const isOrganizer = currentUser.role === Role.ORGANIZER;

    if (!isAdmin && !isOrganizer) {
      throw new HttpError("Access denied.", 403);
    }

    const where: Prisma.RegistrationWhereInput = {};

    if (isOrganizer) {
      where.event = { organizerId: currentUser.id };
    }

    if (query.eventId && query.eventId.trim() !== "") {
      where.eventId = query.eventId.trim();
    }

    if (query.categoryId && query.categoryId.trim() !== "") {
      where.event = {
        ...((where.event as Prisma.EventWhereInput) || {}),
        categoryId: query.categoryId.trim(),
      };
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.participantCategory) {
      where.participantCategory = query.participantCategory;
    }

    if (query.paymentStatus) {
      where.payment = { status: query.paymentStatus };
    }

    if (query.search && query.search.trim() !== "") {
      const s = query.search.trim();
      where.OR = [
        { fullName: { contains: s, mode: "insensitive" } },
        { email: { contains: s, mode: "insensitive" } },
        { phone: { contains: s, mode: "insensitive" } },
        { registrationNumber: { contains: s, mode: "insensitive" } },
        { scholarNumber: { contains: s, mode: "insensitive" } },
        { enrollmentNumber: { contains: s, mode: "insensitive" } },
        { collegeName: { contains: s, mode: "insensitive" } },
        { institute: { contains: s, mode: "insensitive" } },
        { team: { name: { contains: s, mode: "insensitive" } } },
        {
          team: {
            members: {
              some: {
                OR: [
                  { fullName: { contains: s, mode: "insensitive" } },
                  { email: { contains: s, mode: "insensitive" } },
                  { phone: { contains: s, mode: "insensitive" } },
                ],
              },
            },
          },
        },
      ];
    }

    return where;
  }

  /**
   * Retrieves paginated, filtered registrations.
   */
  public static async getRegistrations(
    currentUser: JwtUserPayload,
    query: AdminRegistrationQuery
  ): Promise<PaginatedResult<RegistrationDetail>> {
    const where = this.buildRegistrationWhere(currentUser, query);

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      prisma.registration.count({ where }),
      prisma.registration.findMany({
        where,
        include: {
          event: { include: { category: true } },
          team: { include: { members: true } },
          payment: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      items: items as unknown as RegistrationDetail[],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieves all matching registrations for CSV export without pagination truncation.
   */
  public static async getRegistrationsForExport(
    currentUser: JwtUserPayload,
    query: AdminRegistrationQuery
  ): Promise<RegistrationDetail[]> {
    const where = this.buildRegistrationWhere(currentUser, query);

    const items = await prisma.registration.findMany({
      where,
      include: {
        event: { include: { category: true } },
        team: { include: { members: true } },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5000, // Safety cap to prevent memory exhaustion
    });

    return items as unknown as RegistrationDetail[];
  }

  /**
   * Protected permanent deletion of a registration.
   * Strictly Role.ADMIN only.
   * Guard: Cannot delete CONFIRMED or paid registration unless Cancelled/Rejected first.
   */
  public static async deleteRegistration(
    registrationId: string,
    currentUser: JwtUserPayload
  ): Promise<{ id: string; registrationNumber: string }> {
    if (currentUser.role !== Role.ADMIN) {
      throw new HttpError(
        "Access denied. Only Admins can permanently delete registrations.",
        403
      );
    }

    const reg = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { team: true, payment: true },
    });

    if (!reg) {
      throw new HttpError("Registration not found.", 404);
    }

    if (
      reg.status === RegistrationStatus.CONFIRMED ||
      reg.payment?.status === PaymentStatus.SUCCESS
    ) {
      throw new HttpError(
        "Cannot delete an active or paid registration. Please Cancel or Reject it first.",
        400
      );
    }

    return await prisma.$transaction(async (tx) => {
      // If group registration with team, delete team (members cascade from team)
      if (reg.teamId) {
        await tx.registration.update({
          where: { id: registrationId },
          data: { teamId: null },
        });
        await tx.team.delete({ where: { id: reg.teamId } }).catch(() => null);
      }

      await tx.registration.delete({
        where: { id: registrationId },
      });

      return {
        id: reg.id,
        registrationNumber: reg.registrationNumber,
      };
    });
  }

  /**
   * Builds Prisma where input for pass purchases.
   */
  private static buildPassWhere(
    currentUser: JwtUserPayload,
    query: AdminPassPurchaseQuery
  ): Prisma.PassPurchaseWhereInput {
    if (currentUser.role !== Role.ADMIN) {
      throw new HttpError("Access denied. Pass management is Admin-only.", 403);
    }

    const where: Prisma.PassPurchaseWhereInput = {};

    if (query.passId && query.passId.trim() !== "") {
      where.passId = query.passId.trim();
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.participantCategory) {
      where.participantCategory = query.participantCategory;
    }

    if (query.paymentStatus) {
      where.payment = { status: query.paymentStatus };
    }

    if (query.search && query.search.trim() !== "") {
      const s = query.search.trim();
      where.OR = [
        { fullName: { contains: s, mode: "insensitive" } },
        { email: { contains: s, mode: "insensitive" } },
        { phone: { contains: s, mode: "insensitive" } },
        { passNumber: { contains: s, mode: "insensitive" } },
        { collegeName: { contains: s, mode: "insensitive" } },
        { institute: { contains: s, mode: "insensitive" } },
        {
          holders: {
            some: {
              OR: [
                { fullName: { contains: s, mode: "insensitive" } },
                { email: { contains: s, mode: "insensitive" } },
                { phone: { contains: s, mode: "insensitive" } },
              ],
            },
          },
        },
      ];
    }

    return where;
  }

  /**
   * Retrieves paginated, filtered pass purchases (Admin-only).
   */
  public static async getPassPurchases(
    currentUser: JwtUserPayload,
    query: AdminPassPurchaseQuery
  ): Promise<PaginatedResult<PassPurchaseDetail>> {
    const where = this.buildPassWhere(currentUser, query);

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      prisma.passPurchase.count({ where }),
      prisma.passPurchase.findMany({
        where,
        include: { pass: true, payment: true, holders: { orderBy: { holderIndex: "asc" } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      items: items as unknown as PassPurchaseDetail[],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieves all matching pass purchases for CSV export without pagination truncation.
   */
  public static async getPassPurchasesForExport(
    currentUser: JwtUserPayload,
    query: AdminPassPurchaseQuery
  ): Promise<PassPurchaseDetail[]> {
    const where = this.buildPassWhere(currentUser, query);

    const items = await prisma.passPurchase.findMany({
      where,
      include: { pass: true, payment: true, holders: { orderBy: { holderIndex: "asc" } } },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });

    return items as unknown as PassPurchaseDetail[];
  }

  /**
   * Retrieves a single pass purchase by ID (Admin-only).
   */
  public static async getPassPurchaseById(
    id: string,
    currentUser: JwtUserPayload
  ): Promise<PassPurchaseDetail> {
    if (currentUser.role !== Role.ADMIN) {
      throw new HttpError("Access denied. Admin privileges required.", 403);
    }

    const purchase = await prisma.passPurchase.findUnique({
      where: { id },
      include: { pass: true, payment: true, holders: { orderBy: { holderIndex: "asc" } } },
    });

    if (!purchase) {
      throw new HttpError("Pass purchase not found.", 404);
    }

    return purchase as unknown as PassPurchaseDetail;
  }

  /**
   * Updates pass purchase status (Admin-only).
   * Auto-syncs payment if confirmed.
   */
  public static async updatePassPurchaseStatus(
    id: string,
    newStatus: RegistrationStatus,
    currentUser: JwtUserPayload
  ): Promise<PassPurchaseDetail> {
    if (currentUser.role !== Role.ADMIN) {
      throw new HttpError("Access denied. Admin privileges required.", 403);
    }

    const purchase = await prisma.passPurchase.findUnique({
      where: { id },
      include: { payment: true },
    });

    if (!purchase) {
      throw new HttpError("Pass purchase not found.", 404);
    }

    return await prisma.$transaction(async (tx) => {
      if (
        newStatus === RegistrationStatus.CONFIRMED &&
        purchase.payment &&
        purchase.payment.status !== PaymentStatus.SUCCESS
      ) {
        await tx.payment.update({
          where: { id: purchase.payment.id },
          data: {
            status: PaymentStatus.SUCCESS,
            paidAt: new Date(),
          },
        });
      }

      const updated = await tx.passPurchase.update({
        where: { id },
        data: { status: newStatus },
        include: { pass: true, payment: true },
      });

      return updated as unknown as PassPurchaseDetail;
    });
  }

  /**
   * Protected permanent deletion of a pass purchase (Admin-only).
   * Guard: Cannot delete CONFIRMED or paid purchase unless Cancelled/Rejected first.
   */
  public static async deletePassPurchase(
    id: string,
    currentUser: JwtUserPayload
  ): Promise<{ id: string; passNumber: string }> {
    if (currentUser.role !== Role.ADMIN) {
      throw new HttpError(
        "Access denied. Only Admins can permanently delete pass purchases.",
        403
      );
    }

    const purchase = await prisma.passPurchase.findUnique({
      where: { id },
      include: { payment: true },
    });

    if (!purchase) {
      throw new HttpError("Pass purchase not found.", 404);
    }

    if (
      purchase.status === RegistrationStatus.CONFIRMED ||
      purchase.payment?.status === PaymentStatus.SUCCESS
    ) {
      throw new HttpError(
        "Cannot delete an active or paid pass purchase. Please Cancel or Reject it first.",
        400
      );
    }

    await prisma.passPurchase.delete({
      where: { id },
    });

    return {
      id: purchase.id,
      passNumber: purchase.passNumber,
    };
  }

  /**
   * Update the fee for an event (Admin ONLY)
   */
  public static async updateEventPrice(
    eventId: string,
    fee: number,
    currentUser: JwtUserPayload
  ): Promise<Event> {
    if (currentUser.role !== Role.ADMIN) {
      throw new HttpError(
        "Access denied. Only Administrators can update event prices.",
        403
      );
    }

    if (!eventId || typeof eventId !== "string" || eventId.trim() === "") {
      throw new HttpError("Event ID is required.", 400);
    }

    if (
      fee === undefined ||
      fee === null ||
      typeof fee !== "number" ||
      isNaN(fee) ||
      !isFinite(fee) ||
      fee < 0
    ) {
      throw new HttpError(
        "Invalid fee amount. Price must be a valid non-negative number.",
        400
      );
    }

    if (fee > 100000) {
      throw new HttpError(
        "Fee exceeds maximum permissible amount (₹1,00,000).",
        400
      );
    }

    const trimmedId = eventId.trim();
    const event = await prisma.event.findFirst({
      where: {
        OR: [{ id: trimmedId }, { slug: trimmedId }],
      },
    });

    if (!event) {
      throw new HttpError("Event not found.", 404);
    }

    const sanitizedFee = Math.round(fee * 100) / 100;

    const updatedEvent = await prisma.event.update({
      where: { id: event.id },
      data: { fee: sanitizedFee },
      include: {
        category: true,
      },
    });

    return updatedEvent;
  }

  /**
   * Update the price for a festival pass (Admin ONLY)
   */
  public static async updatePassPrice(
    passId: string,
    price: number | null,
    currentUser: JwtUserPayload
  ): Promise<Pass> {
    if (currentUser.role !== Role.ADMIN) {
      throw new HttpError(
        "Access denied. Only Administrators can update festival pass prices.",
        403
      );
    }

    if (!passId || typeof passId !== "string" || passId.trim() === "") {
      throw new HttpError("Pass ID is required.", 400);
    }

    if (price !== null) {
      if (
        typeof price !== "number" ||
        isNaN(price) ||
        !isFinite(price) ||
        price < 0
      ) {
        throw new HttpError(
          "Invalid pass price. Price must be a valid non-negative number or null.",
          400
        );
      }

      if (price > 100000) {
        throw new HttpError(
          "Pass price exceeds maximum permissible amount (₹1,00,000).",
          400
        );
      }
    }

    const trimmedId = passId.trim();
    const pass = await prisma.pass.findFirst({
      where: {
        OR: [{ id: trimmedId }, { slug: trimmedId }],
      },
    });

    if (!pass) {
      throw new HttpError("Festival pass not found.", 404);
    }

    const sanitizedPrice = price !== null ? Math.round(price * 100) / 100 : null;

    const updatedPass = await prisma.pass.update({
      where: { id: pass.id },
      data: { price: sanitizedPrice },
    });

    return updatedPass;
  }
}
