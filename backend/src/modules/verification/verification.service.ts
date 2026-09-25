// ─────────────────────────────────────────────────────────────
// Verification Service — OTP Generation, Hashing, Rate Limiting,
// Scoped JWT Token Issuance & Validation
// ─────────────────────────────────────────────────────────────

import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/errors";
import { emailService } from "./email.service";

export type VerificationPurpose =
  | "EVENT_REGISTRATION"
  | "PASS_PURCHASE"
  | "GUEST_LOOKUP"
  | "REGISTRATION_PAYMENT"
  | "PASS_PAYMENT";

export const VALID_PURPOSES: VerificationPurpose[] = [
  "EVENT_REGISTRATION",
  "PASS_PURCHASE",
  "GUEST_LOOKUP",
  "REGISTRATION_PAYMENT",
  "PASS_PAYMENT",
];

export interface ScopedTokenPayload {
  email: string;
  purpose: VerificationPurpose;
  registrationId?: string;
  passPurchaseId?: string;
  iat?: number;
  exp?: number;
}

import { getJwtSecret } from "../../lib/jwtConfig";

const JWT_SECRET = getJwtSecret();
const OTP_EXPIRY_SECONDS = 600; // 10 minutes
const RESEND_COOLDOWN_SECONDS = 60; // 60 seconds
const MAX_VERIFICATION_ATTEMPTS = 5;

function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp.trim()).digest("hex");
}

export class VerificationService {
  /**
   * Generates a 6-digit numeric OTP, enforces 60s cooldown, persists SHA-256 hash,
   * dispatches via EmailService, and conditionally returns debugOtp only when:
   * NODE_ENV === 'development' AND EXPOSE_DEBUG_OTP === 'true'.
   */
  public static async sendOtp(
    email: string,
    purpose: VerificationPurpose,
    resourceId?: string
  ): Promise<{
    expiresInSeconds: number;
    resendAvailableInSeconds: number;
    debugOtp?: string;
  }> {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new HttpError("A valid email address is required", 400);
    }

    if (!VALID_PURPOSES.includes(purpose)) {
      throw new HttpError(`Invalid verification purpose '${purpose}'`, 400);
    }

    // Enforce 60-second resend cooldown
    const recentOtp = await prisma.verificationOtp.findFirst({
      where: {
        email: normalizedEmail,
        purpose,
        createdAt: {
          gt: new Date(Date.now() - RESEND_COOLDOWN_SECONDS * 1000),
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recentOtp) {
      const remainingSeconds = Math.ceil(
        (recentOtp.createdAt.getTime() + RESEND_COOLDOWN_SECONDS * 1000 - Date.now()) / 1000
      );
      throw new HttpError(
        `Please wait ${remainingSeconds} seconds before requesting a new code`,
        429
      );
    }

    // Generate secure 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);

    // Invalidate any prior active OTPs for this email and purpose
    await prisma.verificationOtp.deleteMany({
      where: {
        email: normalizedEmail,
        purpose,
      },
    });

    // Create fresh OTP record
    await prisma.verificationOtp.create({
      data: {
        email: normalizedEmail,
        otpHash,
        purpose,
        expiresAt,
        attempts: 0,
        verified: false,
      },
    });

    // Dispatch OTP via email service
    await emailService.sendOtp(normalizedEmail, otp, purpose);

    // Debug OTP safety guard: ONLY expose if NODE_ENV === "development" AND EXPOSE_DEBUG_OTP === "true"
    const shouldExposeDebugOtp =
      process.env.NODE_ENV === "development" && process.env.EXPOSE_DEBUG_OTP === "true";

    return {
      expiresInSeconds: OTP_EXPIRY_SECONDS,
      resendAvailableInSeconds: RESEND_COOLDOWN_SECONDS,
      ...(shouldExposeDebugOtp ? { debugOtp: otp } : {}),
    };
  }

  /**
   * Verifies the provided 6-digit OTP against the stored SHA-256 hash.
   * If valid, marks verified and returns a cryptographically signed, strictly-scoped JWT token.
   */
  public static async verifyOtp(
    email: string,
    otp: string,
    purpose: VerificationPurpose,
    resourceId?: string
  ): Promise<{ verificationToken: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedOtp = otp.trim();

    if (!trimmedOtp || trimmedOtp.length !== 6) {
      throw new HttpError("Please provide a valid 6-digit verification code", 400);
    }

    if (!VALID_PURPOSES.includes(purpose)) {
      throw new HttpError(`Invalid verification purpose '${purpose}'`, 400);
    }

    const record = await prisma.verificationOtp.findFirst({
      where: {
        email: normalizedEmail,
        purpose,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      throw new HttpError("Verification code has expired or was not requested", 400);
    }

    if (record.attempts >= MAX_VERIFICATION_ATTEMPTS) {
      // Invalidate on brute force threshold
      await prisma.verificationOtp.delete({ where: { id: record.id } });
      throw new HttpError("Too many incorrect attempts. Please request a new code.", 429);
    }

    const incomingHash = hashOtp(trimmedOtp);
    if (incomingHash !== record.otpHash) {
      await prisma.verificationOtp.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      const remainingAttempts = MAX_VERIFICATION_ATTEMPTS - (record.attempts + 1);
      throw new HttpError(
        `Incorrect code. ${remainingAttempts} attempt(s) remaining.`,
        400
      );
    }

    // Mark verified
    await prisma.verificationOtp.update({
      where: { id: record.id },
      data: { verified: true },
    });

    // Issue strictly-scoped JWT valid for 15 minutes (or 30 mins for GUEST_LOOKUP session)
    const tokenValidity = purpose === "GUEST_LOOKUP" ? "30m" : "15m";
    const payload: ScopedTokenPayload = {
      email: normalizedEmail,
      purpose,
      ...(purpose === "REGISTRATION_PAYMENT" ? { registrationId: resourceId } : {}),
      ...(purpose === "PASS_PAYMENT" ? { passPurchaseId: resourceId } : {}),
    };

    const verificationToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: tokenValidity,
    });

    return { verificationToken };
  }

  /**
   * Issues a short-lived payment token directly upon registration or pass purchase creation.
   */
  public static issuePaymentToken(
    email: string,
    purpose: "REGISTRATION_PAYMENT" | "PASS_PAYMENT",
    resourceId: string
  ): string {
    const payload: ScopedTokenPayload = {
      email: email.trim().toLowerCase(),
      purpose,
      ...(purpose === "REGISTRATION_PAYMENT" ? { registrationId: resourceId } : {}),
      ...(purpose === "PASS_PAYMENT" ? { passPurchaseId: resourceId } : {}),
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
  }

  /**
   * Validates a scoped JWT token against expected purpose, email, and resource ID.
   */
  public static validateScopedToken(
    token: string,
    expectedPurpose: VerificationPurpose,
    expectedEmail?: string,
    expectedResourceId?: string
  ): ScopedTokenPayload {
    if (!token || token.trim() === "") {
      throw new HttpError("Verification or authorization token is required", 401);
    }

    let decoded: ScopedTokenPayload;
    try {
      decoded = jwt.verify(token.trim(), JWT_SECRET) as ScopedTokenPayload;
    } catch {
      throw new HttpError("Invalid or expired verification token", 401);
    }

    // Strict purpose check
    if (decoded.purpose !== expectedPurpose) {
      throw new HttpError(
        `Token purpose mismatch. Expected '${expectedPurpose}', received '${decoded.purpose}'.`,
        403
      );
    }

    // Strict email check (if specified)
    if (
      expectedEmail &&
      decoded.email.trim().toLowerCase() !== expectedEmail.trim().toLowerCase()
    ) {
      throw new HttpError(
        "Verification token email does not match the request email",
        403
      );
    }

    // Strict registrationId check (if specified for REGISTRATION_PAYMENT)
    if (
      expectedPurpose === "REGISTRATION_PAYMENT" &&
      expectedResourceId &&
      decoded.registrationId !== expectedResourceId
    ) {
      throw new HttpError(
        "Payment token is not authorized for this registration",
        403
      );
    }

    // Strict passPurchaseId check (if specified for PASS_PAYMENT)
    if (
      expectedPurpose === "PASS_PAYMENT" &&
      expectedResourceId &&
      decoded.passPurchaseId !== expectedResourceId
    ) {
      throw new HttpError(
        "Payment token is not authorized for this pass purchase",
        403
      );
    }

    return decoded;
  }
}
