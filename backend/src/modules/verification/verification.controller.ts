// ─────────────────────────────────────────────────────────────
// Verification Controller — Endpoints for OTP dispatch & verification
// ─────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction } from "express";
import { VerificationService, type VerificationPurpose } from "./verification.service";
import { HttpError } from "../../lib/errors";

export async function sendOtpHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, purpose, resourceId } = req.body;

    if (!email || typeof email !== "string") {
      throw new HttpError("Email is required", 400);
    }
    if (!purpose || typeof purpose !== "string") {
      throw new HttpError("Purpose is required", 400);
    }

    const result = await VerificationService.sendOtp(
      email,
      purpose as VerificationPurpose,
      resourceId
    );

    res.status(200).json({
      status: "success",
      message: "Verification code sent to email",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyOtpHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, otp, purpose, resourceId } = req.body;

    if (!email || typeof email !== "string") {
      throw new HttpError("Email is required", 400);
    }
    if (!otp || typeof otp !== "string") {
      throw new HttpError("Verification code is required", 400);
    }
    if (!purpose || typeof purpose !== "string") {
      throw new HttpError("Purpose is required", 400);
    }

    const result = await VerificationService.verifyOtp(
      email,
      otp,
      purpose as VerificationPurpose,
      resourceId
    );

    res.status(200).json({
      status: "success",
      message: "Email verified successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
