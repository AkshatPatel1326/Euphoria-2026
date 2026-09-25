import { prisma } from "../../lib/prisma";
import {
  PassStatus,
  RegistrationStatus,
  PaymentStatus,
  PaymentMethod,
  ParticipantCategory,
  type Pass,
} from "../../../generated/prisma/client";
import { HttpError } from "../../lib/errors";
import { VerificationService } from "../verification/verification.service";
import { normalizeParticipantCategory, normalizePaymentMethod } from "../registrations/registration.service";
import { emailService } from "../verification/email.service";
import type { CreatePassPurchaseInput, PassPurchaseDetail } from "../../types";
import crypto from "crypto";
import {
  isValidSageInstitute,
  isValidSageYear,
  YEAR_TO_SEMESTER_MAP,
} from "../../lib/academic";

/**
 * Generates unique Festival Pass ID with required format:
 * EUPH-2026-PAS-XXXXXXXX (8 uppercase alphanumeric characters)
 */
export function generateFestivalPassId(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // 32 uppercase chars
  let result = "";
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return `EUPH-2026-PAS-${result}`;
}

export class PassService {
  /**
   * Retrieves all festival passes.
   */
  public static async getAllPasses(): Promise<Pass[]> {
    const passes = await prisma.pass.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

    return passes;
  }

  /**
   * Retrieves a single festival pass by its slug.
   */
  public static async getPassBySlug(slug: string): Promise<Pass> {
    if (!slug || slug.trim() === "") {
      throw new HttpError("Pass slug is required", 400);
    }

    const normalizedSlug = slug.trim().toLowerCase();

    const pass = await prisma.pass.findUnique({
      where: {
        slug: normalizedSlug,
      },
    });

    if (!pass) {
      throw new HttpError(`Pass with slug '${slug}' not found`, 404);
    }

    return pass;
  }

  /**
   * Creates a festival pass purchase for a guest or authenticated user
   */
  public static async purchasePass(
    userId: string | null | undefined,
    input: CreatePassPurchaseInput
  ): Promise<PassPurchaseDetail & { paymentToken?: string | null }> {
    if (!input.passId || input.passId.trim() === "") {
      throw new HttpError("passId is required", 400);
    }

    const pass = await prisma.pass.findFirst({
      where: {
        OR: [
          { id: input.passId.trim() },
          { slug: input.passId.trim().toLowerCase() },
        ],
      },
    });

    if (!pass) {
      throw new HttpError("Festival pass not found", 404);
    }

    if (pass.status === PassStatus.INACTIVE || pass.status === PassStatus.SOLD_OUT) {
      throw new HttpError("This pass is currently unavailable for purchase", 400);
    }

    const fullName = input.fullName?.trim();
    const email = input.email?.trim().toLowerCase();
    const phone = input.phone?.trim();

    if (!fullName) {
      throw new HttpError("Full name is required", 400);
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpError("A valid email address is required", 400);
    }
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      throw new HttpError("A valid 10-digit phone number is required", 400);
    }

    // Guest verification requirement: if not authenticated, verificationToken is mandatory and strictly checked
    if (!userId) {
      if (!input.verificationToken || input.verificationToken.trim() === "") {
        throw new HttpError("Email verification is required for pass purchases", 400);
      }
      VerificationService.validateScopedToken(
        input.verificationToken,
        "PASS_PURCHASE",
        email
      );
    }

    // Validate pass category: ONLY SAGE or OTHER_COLLEGE allowed (reject GENERAL)
    const rawCategory = (input.participantCategory || "")
      .toString()
      .trim()
      .toUpperCase()
      .replace(/[-\s/]+/g, "_");

    if (rawCategory === "GENERAL" || rawCategory === "GENERAL_PARTICIPANT") {
      throw new HttpError(
        "General Public category is not available for festival passes. Allowed categories: SAGE Student, Other College/School Student",
        400
      );
    }
    if (
      rawCategory !== "SAGE" &&
      rawCategory !== "SAGE_STUDENT" &&
      rawCategory !== "SAGE_UNIVERSITY_STUDENT" &&
      rawCategory !== "OTHER_COLLEGE" &&
      rawCategory !== "OTHER_COLLEGE_STUDENT" &&
      rawCategory !== "OTHER_COLLEGE_SCHOOL_STUDENT" &&
      rawCategory !== "OTHER_COLLEGE_SCHOOL"
    ) {
      throw new HttpError(
        "Invalid participant category. Allowed categories: SAGE Student, Other College/School Student",
        400
      );
    }

    const participantCategory =
      rawCategory === "SAGE" ||
      rawCategory === "SAGE_STUDENT" ||
      rawCategory === "SAGE_UNIVERSITY_STUDENT"
        ? ParticipantCategory.SAGE
        : ParticipantCategory.OTHER_COLLEGE;

    let institute = input.institute?.trim() || null;
    let year = input.year?.trim() || null;
    let semester: string | null = null;
    let collegeName = input.collegeName?.trim() || null;

    if (participantCategory === ParticipantCategory.SAGE) {
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
    } else {
      if (!collegeName) {
        throw new HttpError(
          "College/School name is required for Other College/School students",
          400
        );
      }
      // Non-SAGE students: SAGE-specific academic fields must not be set
      institute = null;
      year = null;
      semester = null;
    }

    // Strictly validate quantity: integer between 1 and 10
    const rawQuantity = input.quantity !== undefined ? Number(input.quantity) : 1;
    if (
      isNaN(rawQuantity) ||
      !Number.isInteger(rawQuantity) ||
      rawQuantity < 1 ||
      rawQuantity > 10
    ) {
      throw new HttpError("Pass quantity must be an integer between 1 and 10", 400);
    }
    const quantity = rawQuantity;

    // 6. Recipient Data Integrity Enforcement (Phase 4 & Phase 5)
    // Business rules:
    // - Payer details count as Pass #1 (financial payer + first pass holder).
    // - Total quantity: 1 to 10 passes.
    // - Expected additional recipient count: quantity - 1.
    // - Single pass (quantity = 1): exactly 0 additional recipients allowed.
    // - Bulk pass (quantity > 1): exactly quantity - 1 additional recipients required.
    const providedRecipients = input.recipients || [];
    const expectedRecipientCount = quantity - 1;

    if (quantity === 1) {
      if (providedRecipients.length > 0) {
        throw new HttpError(
          "Single pass purchase must not include additional recipients (expected 0 recipients).",
          400
        );
      }
    } else {
      if (providedRecipients.length !== expectedRecipientCount) {
        throw new HttpError(
          `Bulk purchase of ${quantity} passes requires exactly ${expectedRecipientCount} recipient record(s) (received ${providedRecipients.length}).`,
          400
        );
      }
    }

    // Validate each additional recipient and prevent duplicate emails
    const validatedRecipients: Array<{
      holderIndex: number;
      fullName: string;
      email: string;
      phone: string;
    }> = [];

    const seenEmails = new Set<string>([email]);

    for (let i = 0; i < providedRecipients.length; i++) {
      const r = providedRecipients[i];
      const recipientNumber = i + 2; // Pass Recipient 2, 3, ..., N
      const rName = (r?.fullName || "").trim();
      const rEmail = (r?.email || "").trim().toLowerCase();
      const rPhone = (r?.phone || "").trim();

      if (!rName) {
        throw new HttpError(`Pass Recipient ${recipientNumber} full name is required`, 400);
      }
      if (!rEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rEmail)) {
        throw new HttpError(`Pass Recipient ${recipientNumber} has an invalid email address`, 400);
      }
      if (!rPhone || rPhone.replace(/\D/g, "").length < 10) {
        throw new HttpError(`Pass Recipient ${recipientNumber} requires a valid 10-digit phone number`, 400);
      }

      // Rule 11: Do not duplicate payer as additional recipient, and prevent duplicate recipient emails
      if (rEmail === email) {
        throw new HttpError(
          `Pass Recipient ${recipientNumber} cannot have the same email as the purchaser / payer (${email}). The purchaser is already Pass 1.`,
          400
        );
      }
      if (seenEmails.has(rEmail)) {
        throw new HttpError(
          `Duplicate recipient email detected: ${rEmail} is entered multiple times. Each pass recipient must have a unique email address.`,
          400
        );
      }
      seenEmails.add(rEmail);

      validatedRecipients.push({
        holderIndex: recipientNumber,
        fullName: rName,
        email: rEmail,
        phone: rPhone,
      });
    }

    // Phase 5: Construct complete pass-holder records
    // Pass 1 -> Primary Purchaser / Payer
    // Pass 2..N -> Additional recipients
    // Result: exactly totalQuantity pass-holder records linked to this single order
    const allHoldersToCreate = [
      {
        holderIndex: 1,
        fullName,
        email,
        phone,
      },
      ...validatedRecipients.map((h) => ({
        holderIndex: h.holderIndex,
        fullName: h.fullName,
        email: h.email,
        phone: h.phone,
      })),
    ];

    const unitPrice = pass.price || 0;
    const totalAmount = unitPrice * quantity;
    const isFree = totalAmount <= 0;

    return await prisma.$transaction(async (tx) => {
      let passNumber = generateFestivalPassId();
      let attempts = 0;
      while (await tx.passPurchase.findUnique({ where: { passNumber } })) {
        passNumber = generateFestivalPassId();
        attempts++;
        if (attempts > 10) throw new HttpError("Failed to generate unique Pass ID", 500);
      }

      const initialStatus = isFree ? RegistrationStatus.CONFIRMED : RegistrationStatus.PENDING;

      const passPurchase = await tx.passPurchase.create({
        data: {
          passNumber,
          passId: pass.id,
          userId: userId || null,
          fullName,
          email,
          phone,
          participantCategory,
          collegeName,
          institute,
          year,
          semester,
          quantity,
          status: initialStatus,
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
          confirmationEmailSent: isFree,
          confirmationEmailSentAt: isFree ? new Date() : null,
          holders: {
            create: allHoldersToCreate,
          },
        },
      });

      const initialPaymentMethod = normalizePaymentMethod(input.paymentMethod);

      if (isFree) {
        await tx.payment.create({
          data: {
            passPurchaseId: passPurchase.id,
            amount: 0,
            currency: "INR",
            method: PaymentMethod.OTHER,
            status: PaymentStatus.SUCCESS,
            transactionId: `FREE_PASS_${Date.now()}`,
            gatewayReference: "FREE_PASS_PURCHASE",
            paidAt: new Date(),
          },
        });
      } else {
        await tx.payment.create({
          data: {
            passPurchaseId: passPurchase.id,
            amount: totalAmount,
            currency: "INR",
            method: initialPaymentMethod,
            status: PaymentStatus.PENDING,
            transactionId: `TXN_INIT_PASS_${passPurchase.id}_${Date.now()}`,
            gatewayReference: null,
            paidAt: null,
          },
        });
      }

      const createdPurchase = await tx.passPurchase.findUnique({
        where: { id: passPurchase.id },
        include: {
          pass: true,
          payment: true,
          holders: { orderBy: { holderIndex: "asc" } },
        },
      });

      const paymentToken = !isFree
        ? VerificationService.issuePaymentToken(email, "PASS_PAYMENT", passPurchase.id)
        : null;

      const passResult = {
        ...(createdPurchase as unknown as PassPurchaseDetail),
        paymentToken,
      };

      if (isFree && createdPurchase) {
        try {
          await emailService.sendPassConfirmation(email, createdPurchase as any);
        } catch (err: any) {
          console.error(
            "[PassService] Non-fatal error sending free pass confirmation email:",
            err?.message
          );
        }
      }

      return passResult;
    });
  }

  /**
   * Retrieves all pass purchases for a verified guest email
   * Searches by payer email OR any recipient holder email
   */
  public static async getPassPurchasesByEmail(email: string): Promise<PassPurchaseDetail[]> {
    const normalizedEmail = email.trim().toLowerCase();
    const purchases = await prisma.passPurchase.findMany({
      where: {
        OR: [
          { email: { equals: normalizedEmail, mode: "insensitive" } },
          { holders: { some: { email: { equals: normalizedEmail, mode: "insensitive" } } } },
        ],
      },
      include: {
        pass: true,
        payment: true,
        holders: { orderBy: { holderIndex: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return purchases as unknown as PassPurchaseDetail[];
  }

  /**
   * Validates a Festival Pass ID as a coupon code for Standup Comedy registration.
   * Enforces:
   * 1. The Pass ID exists.
   * 2. The Pass belongs to a successfully paid / confirmed Festival Pass order.
   * 3. The Pass is active and not cancelled / failed.
   * 4. The Pass has not already been used for Standup Comedy.
   * 5. The requested registration is actually for Standup Comedy (if eventId is provided).
   */
  public static async validatePassCoupon(
    rawPassId: string,
    eventId?: string
  ): Promise<{
    valid: boolean;
    message?: string;
    discountedPrice?: number;
    discountAmount?: number;
    originalPrice?: number;
    passId?: string;
  }> {
    if (!rawPassId || typeof rawPassId !== "string" || !rawPassId.trim()) {
      return { valid: false, message: "Please enter your Festival Pass ID." };
    }

    const passId = rawPassId.trim().toUpperCase();

    // Verify format: EUPH-2026-PAS-XXXXXXXX
    if (!passId.startsWith("EUPH-2026-PAS-")) {
      return {
        valid: false,
        message: "Invalid Festival Pass format. Expected format: EUPH-2026-PAS-XXXXXXXX",
      };
    }

    // 1. Verify Event is Standup Comedy (if eventId provided)
    if (eventId) {
      const event = await prisma.event.findFirst({
        where: {
          OR: [{ id: eventId.trim() }, { slug: eventId.trim() }],
        },
      });
      if (
        event &&
        event.id !== "cultural-12" &&
        event.slug !== "cultural-12" &&
        !event.name.toLowerCase().includes("standup comedy") &&
        !event.name.toLowerCase().includes("pankaj")
      ) {
        return {
          valid: false,
          message: "Festival Pass discount is only applicable for Standup Comedy.",
        };
      }
    }

    // 2. Query PassPurchase with payment record
    const passPurchase = await prisma.passPurchase.findUnique({
      where: { passNumber: passId },
      include: { payment: true },
    });

    if (!passPurchase) {
      return {
        valid: false,
        message: "Invalid or inactive Festival Pass.",
      };
    }

    // 3. Status must be CONFIRMED and payment must be SUCCESS
    const isPaid =
      passPurchase.status === RegistrationStatus.CONFIRMED &&
      (passPurchase.payment?.status === PaymentStatus.SUCCESS ||
        passPurchase.payment?.amount === 0);

    if (!isPaid) {
      return {
        valid: false,
        message: "Invalid or inactive Festival Pass.",
      };
    }

    // 4. Check if coupon was already redeemed for Standup Comedy
    if (passPurchase.standupDiscountUsed || passPurchase.standupRegistrationId) {
      return {
        valid: false,
        message: "This Festival Pass has already been used for Standup Comedy.",
      };
    }

    // 5. Also check active registrations referencing this pass ID
    const activeReg = await prisma.registration.findFirst({
      where: {
        appliedPassId: passId,
        status: { in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING] },
      },
    });

    if (activeReg) {
      return {
        valid: false,
        message: "This Festival Pass has already been used for Standup Comedy.",
      };
    }

    return {
      valid: true,
      passId: passPurchase.passNumber,
      originalPrice: 199,
      discountAmount: 150,
      discountedPrice: 49,
    };
  }
}
