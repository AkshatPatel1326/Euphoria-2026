// ─────────────────────────────────────────────────────────────
// Easebuzz Payment Gateway Service (Test/Sandbox & Production)
// ─────────────────────────────────────────────────────────────

import crypto from "node:crypto";
import { prisma } from "../../lib/prisma";
import {
  PaymentStatus,
  PaymentMethod,
  RegistrationStatus,
  Role,
} from "../../../generated/prisma/client";
import { HttpError } from "../../lib/errors";
import { VerificationService } from "../verification/verification.service";
import { emailService } from "../verification/email.service";
import { PaymentSimulationService } from "./payment-simulation.service";
import type {
  InitiatePaymentInput,
  InitiatePaymentResult,
  JwtUserPayload,
} from "../../types";

/**
 * Normalizes payment mode from Easebuzz callback to Prisma PaymentMethod
 */
function parsePaymentMode(mode?: string): PaymentMethod {
  if (!mode) return PaymentMethod.OTHER;
  const upper = mode.toUpperCase();
  if (upper.includes("UPI")) return PaymentMethod.UPI;
  if (upper.includes("NB") || upper.includes("NET")) return PaymentMethod.NETBANKING;
  if (upper.includes("CARD") || upper.includes("CC") || upper.includes("DC")) return PaymentMethod.CARD;
  return PaymentMethod.OTHER;
}

export class EasebuzzService {
  /**
   * Generates SHA-512 initiate hash according to official Easebuzz specifications:
   * key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
   */
  public static generateInitiateHash(params: {
    key: string;
    txnid: string;
    amount: string;
    productinfo: string;
    firstname: string;
    email: string;
    udf1?: string;
    udf2?: string;
    udf3?: string;
    udf4?: string;
    udf5?: string;
    salt: string;
  }): string {
    const sequence = [
      params.key.trim(),
      params.txnid.trim(),
      params.amount.trim(),
      params.productinfo.trim(),
      params.firstname.trim(),
      params.email.trim(),
      (params.udf1 || "").trim(),
      (params.udf2 || "").trim(),
      (params.udf3 || "").trim(),
      (params.udf4 || "").trim(),
      (params.udf5 || "").trim(),
      "", // udf6
      "", // udf7
      "", // udf8
      "", // udf9
      "", // udf10
      params.salt.trim(),
    ];

    const hashString = sequence.join("|");
    return crypto.createHash("sha512").update(hashString).digest("hex").toLowerCase();
  }

  /**
   * Verifies SHA-512 response hash using official Easebuzz reverse hash formula:
   * salt|status|udf10|udf9|udf8|udf7|udf6|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
   *
   * Strict adherence to official specification:
   * Uses exact raw callback values without trimming, normalizing whitespace/casing, or reformatting.
   * Compares with received hash using secure constant-time timingSafeEqual.
   */
  public static verifyResponseHash(
    body: Record<string, any>,
    salt: string
  ): boolean {
    const rawHash = body.hash != null ? String(body.hash) : "";
    const receivedHash = rawHash.trim().toLowerCase();
    if (!receivedHash || receivedHash.length !== 128) {
      return false;
    }

    const cleanSalt = salt.trim();

    const sequence = [
      cleanSalt,
      body.status != null ? String(body.status) : "",
      body.udf10 != null ? String(body.udf10) : "",
      body.udf9 != null ? String(body.udf9) : "",
      body.udf8 != null ? String(body.udf8) : "",
      body.udf7 != null ? String(body.udf7) : "",
      body.udf6 != null ? String(body.udf6) : "",
      body.udf5 != null ? String(body.udf5) : "",
      body.udf4 != null ? String(body.udf4) : "",
      body.udf3 != null ? String(body.udf3) : "",
      body.udf2 != null ? String(body.udf2) : "",
      body.udf1 != null ? String(body.udf1) : "",
      body.email != null ? String(body.email) : "",
      body.firstname != null ? String(body.firstname) : "",
      body.productinfo != null ? String(body.productinfo) : "",
      body.amount != null ? String(body.amount) : "",
      body.txnid != null ? String(body.txnid) : "",
      body.key != null ? String(body.key) : "",
    ];

    const reverseHashString = sequence.join("|");
    const computedHash = crypto
      .createHash("sha512")
      .update(reverseHashString)
      .digest("hex")
      .toLowerCase();

    try {
      return crypto.timingSafeEqual(
        Buffer.from(computedHash, "utf8"),
        Buffer.from(receivedHash, "utf8")
      );
    } catch {
      return false;
    }
  }

  /**
   * Performs server-side transaction status verification using Easebuzz Transaction V2 API:
   * Endpoint:
   *   Production: https://dashboard.easebuzz.in/transaction/v2/retrieve
   *   Test: https://testdashboard.easebuzz.in/transaction/v2/retrieve
   * Verification Hash: sha512(key|txnid|salt)
   */
  public static async verifyTransactionServerSide(
    txnid: string
  ): Promise<{
    verified: boolean;
    status: string;
    amount: number;
    easepayid: string | null;
    rawResponse?: Record<string, any>;
    errorMessage?: string;
  }> {
    const key = process.env.EASEBUZZ_KEY?.trim();
    const salt = process.env.EASEBUZZ_SALT?.trim();
    const isProd = (process.env.EASEBUZZ_ENV || "prod").toLowerCase() === "prod";

    if (!key || !salt) {
      throw new HttpError("Server configuration error: Easebuzz credentials are not configured.", 500);
    }

    const endpoint = isProd
      ? "https://dashboard.easebuzz.in/transaction/v2/retrieve"
      : "https://testdashboard.easebuzz.in/transaction/v2/retrieve";

    const hashString = `${key}|${txnid.trim()}|${salt}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex").toLowerCase();

    const formData = new URLSearchParams({
      key,
      txnid: txnid.trim(),
      hash,
    });

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        return {
          verified: false,
          status: "HTTP_ERROR",
          amount: 0,
          easepayid: null,
          errorMessage: `Easebuzz S2S returned HTTP ${response.status}`,
        };
      }

      const data: any = await response.json();

      if (data && data.status === true && data.msg) {
        const msg = data.msg;
        const s2sStatus = (msg.status || "").toLowerCase().trim();
        const s2sAmount = parseFloat(msg.amount) || 0;
        const easepayid = msg.easepayid || null;

        return {
          verified: true,
          status: s2sStatus,
          amount: s2sAmount,
          easepayid,
          rawResponse: msg,
        };
      }

      return {
        verified: false,
        status: "GATEWAY_ERROR",
        amount: 0,
        easepayid: null,
        errorMessage: data?.error_desc || data?.msg || "Transaction retrieval returned falsy status",
      };
    } catch (err: any) {
      console.error("[EasebuzzService] Network error during S2S transaction verification:", err?.message);
      return {
        verified: false,
        status: "NETWORK_ERROR",
        amount: 0,
        easepayid: null,
        errorMessage: err?.message || "Failed to communicate with Easebuzz S2S API",
      };
    }
  }

  /**
   * Initiates payment for an Event Registration or Festival Pass Purchase.
   * Reuses existing Payment record to strictly preserve unique database relations across retries.
   */
  public static async initiatePayment(
    input: InitiatePaymentInput,
    currentUser: JwtUserPayload | null,
    headerToken?: string | null
  ): Promise<InitiatePaymentResult> {
    const isRegistration = Boolean(input.registrationId && input.registrationId.trim() !== "");
    const isPass = Boolean(input.passPurchaseId && input.passPurchaseId.trim() !== "");

    if (!isRegistration && !isPass) {
      throw new HttpError("Either registrationId or passPurchaseId is required", 400);
    }

    const paymentToken = input.paymentToken || headerToken;
    const gatewayMode = (process.env.PAYMENT_GATEWAY || "simulation").toLowerCase().trim();

    // ─────────────────────────────────────────────────────────
    // 1. Resolve Target Record & Ownership
    // ─────────────────────────────────────────────────────────
    let targetId: string;
    let targetType: "REGISTRATION" | "PASS";
    let amount: number;
    let fullName: string;
    let email: string;
    let phone: string;
    let productInfo: string;
    let existingPayment: any;

    if (isRegistration) {
      targetId = input.registrationId!.trim();
      targetType = "REGISTRATION";

      const reg = await prisma.registration.findUnique({
        where: { id: targetId },
        include: { event: true, payment: true },
      });

      if (!reg) throw new HttpError("Registration not found", 404);

      // Ownership authorization
      const isAdmin = currentUser?.role === Role.ADMIN;
      const isOwnerUser = Boolean(currentUser?.id && reg.userId && reg.userId === currentUser.id);
      let isTokenAuthorized = false;

      if (paymentToken) {
        try {
          const decoded = VerificationService.validateScopedToken(
            paymentToken,
            "REGISTRATION_PAYMENT",
            reg.email,
            reg.id
          );
          if (decoded) isTokenAuthorized = true;
        } catch {
          // invalid token
        }
      }

      if (!isAdmin && !isOwnerUser && !isTokenAuthorized) {
        throw new HttpError(
          "Access denied. Valid authorization matching this registration is required.",
          403
        );
      }

      if (reg.status === RegistrationStatus.CONFIRMED) {
        throw new HttpError("This registration is already confirmed and paid", 400);
      }

      // Backend authoritative amount (e.g. ₹49 for Standup Comedy with Festival Pass, or full fee)
      amount = reg.payment?.amount ?? (reg.discountAmount ? Math.max(0, reg.event.fee - reg.discountAmount) : reg.event.fee);

      if (amount <= 0) {
        throw new HttpError("This event is free and does not require payment", 400);
      }
      fullName = reg.fullName;
      email = reg.email;
      phone = reg.phone;
      productInfo = `Euphoria 2026 - ${reg.event.name}`.slice(0, 80);
      existingPayment = reg.payment;
    } else {
      targetId = input.passPurchaseId!.trim();
      targetType = "PASS";

      const purchase = await prisma.passPurchase.findUnique({
        where: { id: targetId },
        include: { pass: true, payment: true },
      });

      if (!purchase) throw new HttpError("Pass purchase not found", 404);

      // Ownership authorization
      const isAdmin = currentUser?.role === Role.ADMIN;
      const isOwnerUser = Boolean(currentUser?.id && purchase.userId && purchase.userId === currentUser.id);
      let isTokenAuthorized = false;

      if (paymentToken) {
        try {
          const decoded = VerificationService.validateScopedToken(
            paymentToken,
            "PASS_PAYMENT",
            purchase.email,
            purchase.id
          );
          if (decoded) isTokenAuthorized = true;
        } catch {
          // invalid token
        }
      }

      if (!isAdmin && !isOwnerUser && !isTokenAuthorized) {
        throw new HttpError(
          "Access denied. Valid authorization matching this pass purchase is required.",
          403
        );
      }

      if (purchase.status === RegistrationStatus.CONFIRMED) {
        throw new HttpError("This pass purchase is already confirmed and paid", 400);
      }

      amount = (purchase.pass.price || 0) * purchase.quantity;
      if (amount <= 0) {
        throw new HttpError("This pass is free and does not require payment", 400);
      }

      fullName = purchase.fullName;
      email = purchase.email;
      phone = purchase.phone;
      productInfo = `Euphoria 2026 - ${purchase.pass.name}`.slice(0, 80);
      existingPayment = purchase.payment;
    }

    // ─────────────────────────────────────────────────────────
    // 2. Simulation Mode Fallback (Preserved for offline dev)
    // ─────────────────────────────────────────────────────────
    if (gatewayMode === "simulation") {
      if (targetType === "REGISTRATION") {
        const simResult = await PaymentSimulationService.simulatePayment(
          targetId,
          { method: input.paymentMethod || "UPI", simulateStatus: "SUCCESS", paymentToken: paymentToken || undefined },
          currentUser,
          paymentToken
        );
        return {
          mode: "SIMULATION",
          txnid: simResult.payment.transactionId || `SIM_${Date.now()}`,
          amount,
          registrationStatus: simResult.registrationStatus,
          payment: { id: simResult.payment.id, status: simResult.payment.status },
          simulationResult: simResult,
        };
      } else {
        const simResult = await PaymentSimulationService.simulatePassPayment(
          targetId,
          { method: input.paymentMethod || "UPI", simulateStatus: "SUCCESS", paymentToken: paymentToken || undefined },
          currentUser,
          paymentToken
        );
        return {
          mode: "SIMULATION",
          txnid: simResult.payment?.transactionId || `SIM_PASS_${Date.now()}`,
          amount,
          passPurchaseStatus: simResult.status,
          payment: simResult.payment ? { id: simResult.payment.id, status: simResult.payment.status } : undefined,
          simulationResult: simResult,
        };
      }
    }

    // ─────────────────────────────────────────────────────────
    // 3. Easebuzz Gateway Initiation
    // ─────────────────────────────────────────────────────────
    const key = process.env.EASEBUZZ_KEY;
    const salt = process.env.EASEBUZZ_SALT;
    const envMode = (process.env.EASEBUZZ_ENV || "test").toLowerCase().trim();

    if (!key || !salt) {
      throw new HttpError(
        "Easebuzz gateway credentials are not configured on this server.",
        500
      );
    }

    const isProd = envMode === "prod" || envMode === "production";

    const initiateEndpoint = isProd
      ? "https://pay.easebuzz.in/payment/initiateLink"
      : "https://testpay.easebuzz.in/payment/initiateLink";

    const checkoutBase = isProd
      ? "https://pay.easebuzz.in/pay/"
      : "https://testpay.easebuzz.in/pay/";

    const backendBaseUrl = process.env.APP_BACKEND_URL || "http://localhost:5000";

    // Generate unique transaction ID for this attempt
    const prefix = targetType === "REGISTRATION" ? "EUPH_REG" : "EUPH_PASS";
    const txnid = `${prefix}_${targetId.slice(-6)}_${Date.now()}`;

    // ─────────────────────────────────────────────────────────
    // 4. Unique Relationship Retry Safety
    // ─────────────────────────────────────────────────────────
    // Update or create the singular linked Payment record in place without violating unique constraints
    await prisma.$transaction(async (tx) => {
      if (existingPayment) {
        const priorHistory = Array.isArray(existingPayment.gatewayResponse?.history)
          ? existingPayment.gatewayResponse.history
          : existingPayment.gatewayResponse ? [existingPayment.gatewayResponse] : [];

        await tx.payment.update({
          where: { id: existingPayment.id },
          data: {
            amount,
            status: PaymentStatus.PENDING,
            transactionId: txnid,
            gatewayReference: null,
            gatewayResponse: {
              currentAttempt: { initiatedAt: new Date().toISOString(), txnid },
              history: priorHistory,
            },
          },
        });
      } else {
        if (targetType === "REGISTRATION") {
          await tx.payment.create({
            data: {
              registrationId: targetId,
              amount,
              currency: "INR",
              status: PaymentStatus.PENDING,
              transactionId: txnid,
              gatewayResponse: {
                currentAttempt: { initiatedAt: new Date().toISOString(), txnid },
              },
            },
          });
        } else {
          await tx.payment.create({
            data: {
              passPurchaseId: targetId,
              amount,
              currency: "INR",
              status: PaymentStatus.PENDING,
              transactionId: txnid,
              gatewayResponse: {
                currentAttempt: { initiatedAt: new Date().toISOString(), txnid },
              },
            },
          });
        }
      }
    });

    // ─────────────────────────────────────────────────────────
    // 5. Call Easebuzz initiateLink
    // ─────────────────────────────────────────────────────────
    const formattedAmount = amount.toFixed(2);
    const surl = `${backendBaseUrl}/api/payments/easebuzz/response`;
    const furl = `${backendBaseUrl}/api/payments/easebuzz/response`;
    const cleanFirstName = (fullName.trim().split(" ")[0] || "Participant")
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 50) || "Participant";
    const cleanPhone = phone.replace(/\D/g, "").slice(-10) || "9999999999";
    // Truncate to maximum 40 characters, clean whitespace, and trim to prevent trailing spaces
    let cleanProductInfo = productInfo
      .replace(/[—–]/g, "-")
      .replace(/[^a-zA-Z0-9\s_-]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (cleanProductInfo.length > 40) {
      cleanProductInfo = cleanProductInfo.slice(0, 40).trim();
    }
    if (!cleanProductInfo) {
      cleanProductInfo = "Euphoria 2026";
    }

    const hash = this.generateInitiateHash({
      key,
      txnid,
      amount: formattedAmount,
      productinfo: cleanProductInfo,
      firstname: cleanFirstName,
      email,
      udf1: targetType,
      udf2: targetId,
      salt,
    });

    const formData = new URLSearchParams({
      key,
      txnid,
      amount: formattedAmount,
      productinfo: cleanProductInfo,
      firstname: cleanFirstName,
      email,
      phone: cleanPhone,
      surl,
      furl,
      hash,
      udf1: targetType,
      udf2: targetId,
    });

    let easebuzzRes: any;
    try {
      const response = await fetch(initiateEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: formData.toString(),
      });

      easebuzzRes = await response.json();
    } catch (err: any) {
      console.error("[EasebuzzService] Network error calling initiateLink:", err.message);
      throw new HttpError("Failed to communicate with payment gateway. Please try again.", 502);
    }

    if (!easebuzzRes || easebuzzRes.status !== 1 || !easebuzzRes.data) {
      console.error("[EasebuzzService] Easebuzz returned initiation error:", easebuzzRes);
      const errMsg = easebuzzRes?.error_desc || easebuzzRes?.data || "Payment initiation failed";
      throw new HttpError(`Easebuzz initiation error: ${errMsg}`, 400);
    }

    const accessKey = easebuzzRes.data;
    const paymentUrl = `${checkoutBase}${accessKey}`;

    return {
      mode: "EASEBUZZ",
      accessKey,
      paymentUrl,
      txnid,
      amount,
    };
  }

  /**
   * Handles Easebuzz browser callback or S2S webhook response.
   * Fully validates reverse hash, amounts, S2S gateway status, and performs idempotent reconciliation.
   */
  public static async handlePaymentCallback(
    body: Record<string, any>
  ): Promise<{
    status: "success" | "failed" | "cancelled";
    txnid: string;
    targetType: string;
    targetId: string;
    redirectUrl: string;
  }> {
    const salt = process.env.EASEBUZZ_SALT?.trim();
    if (!salt) {
      throw new HttpError("Server configuration error: EASEBUZZ_SALT is not set.", 500);
    }

    const txnid = (body.txnid != null ? String(body.txnid) : "").trim();
    const incomingStatus = (body.status != null ? String(body.status) : "").toLowerCase().trim();
    const easepayid = body.easepayid != null ? String(body.easepayid).trim() : null;

    // Safe diagnostic log: Callback received (No secrets/salts)
    console.log(
      `[EasebuzzService] Payment callback received: txnid=${txnid || "missing"}, status=${incomingStatus || "missing"}, easepayid=${easepayid || "none"}, amount=${body.amount ?? "none"}`
    );

    // 1. Strict Reverse Hash Verification (Exact raw callback fields per official specification)
    const isValidSignature = this.verifyResponseHash(body, salt);
    console.log(
      `[EasebuzzService] Reverse hash signature verification: ${isValidSignature ? "PASSED" : "FAILED"} for txnid=${txnid || "unknown"}`
    );

    if (!isValidSignature) {
      console.error("[EasebuzzService] Security error: Reverse hash signature verification failed for txnid:", txnid || "unknown");
      throw new HttpError("Payment callback signature verification failed.", 400);
    }

    if (!txnid) {
      throw new HttpError("Missing txnid in payment callback.", 400);
    }

    // 2. Find Payment Record
    const payment = await prisma.payment.findUnique({
      where: { transactionId: txnid },
      include: {
        registration: {
          include: {
            event: { include: { category: true } },
            team: { include: { members: true } },
          },
        },
        passPurchase: {
          include: {
            pass: true,
            holders: { orderBy: { holderIndex: "asc" } },
          },
        },
      },
    });

    if (!payment) {
      console.error("[EasebuzzService] Payment record not found for txnid:", txnid);
      throw new HttpError("Payment record not found for this transaction ID.", 404);
    }

    const targetType = body.udf1 || (payment.registrationId ? "REGISTRATION" : "PASS");
    const targetId = body.udf2 || payment.registrationId || payment.passPurchaseId || "";
    const frontendBaseUrl = process.env.APP_FRONTEND_URL || "http://localhost:5173";

    // 3. Amount Reconciliation
    const incomingAmount = parseFloat(body.amount);
    if (isNaN(incomingAmount) || Math.abs(incomingAmount - payment.amount) > 0.01) {
      console.error(
        `[EasebuzzService] Amount mismatch for txnid ${txnid}! Stored: ${payment.amount}, Received: ${body.amount}`
      );
      throw new HttpError("Payment amount mismatch detected.", 400);
    }
    console.log(`[EasebuzzService] Local amount comparison: PASSED (stored=${payment.amount}, received=${incomingAmount}) for txnid=${txnid}`);

    // 4. Target Ownership Check
    if (body.udf1 && body.udf1 !== (payment.registrationId ? "REGISTRATION" : "PASS")) {
      console.error(`[EasebuzzService] Target type mismatch for txnid ${txnid}! Stored: ${payment.registrationId ? "REGISTRATION" : "PASS"}, Received: ${body.udf1}`);
      throw new HttpError("Payment target type mismatch detected.", 400);
    }
    if (body.udf2 && body.udf2 !== (payment.registrationId || payment.passPurchaseId)) {
      console.error(`[EasebuzzService] Target ID mismatch for txnid ${txnid}! Stored: ${payment.registrationId || payment.passPurchaseId}, Received: ${body.udf2}`);
      throw new HttpError("Payment target ID mismatch detected.", 400);
    }

    // 5. Idempotency Guard: if already SUCCESS, don't duplicate mutations or emails
    const registrationNumber = payment.registration?.registrationNumber;
    const passNumber = payment.passPurchase?.passNumber;
    const identifier = registrationNumber || passNumber || "";

    if (payment.status === PaymentStatus.SUCCESS) {
      console.log(`[EasebuzzService] Transaction ${txnid} is already marked SUCCESS. Returning existing result idempotently.`);
      return {
        status: "success",
        txnid,
        targetType,
        targetId,
        redirectUrl: `${frontendBaseUrl}/payment/result?status=success&txnid=${txnid}&type=${targetType}&id=${targetId}&number=${identifier}`,
      };
    }

    // 6. Reconcile Status
    const isSuccess = incomingStatus === "success";
    const isCancelled = incomingStatus === "usercancelled";
    const mode = parsePaymentMode(body.mode);

    if (isSuccess) {
      // 7. Server-Side Transaction Verification via Easebuzz Transaction V2 API
      const s2sVerification = await this.verifyTransactionServerSide(txnid);
      console.log(
        `[EasebuzzService] Server-side S2S transaction verification: ${s2sVerification.verified ? "SUCCESS" : "FAILED"} (gateway status: ${s2sVerification.status}, amount: ${s2sVerification.amount}) for txnid=${txnid}`
      );

      if (!s2sVerification.verified || s2sVerification.status !== "success") {
        console.error(
          `[EasebuzzService] S2S verification failed for txnid ${txnid}: ${s2sVerification.errorMessage || "gateway reported status is not success"}`
        );
        throw new HttpError(
          `Server-side transaction verification failed: ${s2sVerification.errorMessage || "gateway status not success"}`,
          400
        );
      }

      if (Math.abs(s2sVerification.amount - payment.amount) > 0.01) {
        console.error(
          `[EasebuzzService] S2S verification amount mismatch for txnid ${txnid}: stored=${payment.amount}, gateway=${s2sVerification.amount}`
        );
        throw new HttpError("Server-side transaction verification failed: gateway amount mismatch.", 400);
      }

      // 8. Atomic Database Update (Payment SUCCESS & Registration/Pass CONFIRMED)
      const confirmedGatewayReference = easepayid || s2sVerification.easepayid;

      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.SUCCESS,
            gatewayReference: confirmedGatewayReference,
            method: mode,
            paidAt: new Date(),
            gatewayResponse: body,
          },
        });

        if (payment.registrationId) {
          await tx.registration.update({
            where: { id: payment.registrationId },
            data: { status: RegistrationStatus.CONFIRMED },
          });
        } else if (payment.passPurchaseId) {
          await tx.passPurchase.update({
            where: { id: payment.passPurchaseId },
            data: { status: RegistrationStatus.CONFIRMED },
          });
        }
      });
      console.log(`[EasebuzzService] Database confirmation: Payment marked SUCCESS, order confirmed for txnid=${txnid}`);

      // 9. Email State Handling (Section 9 & 12)
      // Attempt email ONLY after payment confirmation in DB.
      // Mark confirmationEmailSent = true ONLY if the email dispatch actually succeeds.
      const isEmailAlreadySent = Boolean(
        payment.registration?.confirmationEmailSent ?? payment.passPurchase?.confirmationEmailSent
      );

      if (!isEmailAlreadySent) {
        if (payment.registration) {
          try {
            await emailService.sendRegistrationConfirmation(payment.registration.email, {
              ...payment.registration,
              payment: {
                amount: payment.amount,
                status: "SUCCESS",
                transactionId: txnid,
                gatewayReference: confirmedGatewayReference,
                method: mode,
              },
            });

            await prisma.registration.update({
              where: { id: payment.registration.id },
              data: {
                confirmationEmailSent: true,
                confirmationEmailSentAt: new Date(),
              },
            });
            console.log(`[EasebuzzService] Registration confirmation email: SUCCESS for txnid=${txnid}`);
          } catch (err: any) {
            // Non-fatal for payment: log error, leave confirmationEmailSent false so it remains retryable
            console.error(
              `[EasebuzzService] Non-fatal: Registration confirmation email delivery failed for txnid=${txnid}:`,
              err?.message
            );
          }
        } else if (payment.passPurchase) {
          try {
            await emailService.sendPassConfirmation(payment.passPurchase.email, {
              ...payment.passPurchase,
              payment: {
                amount: payment.amount,
                status: "SUCCESS",
                transactionId: txnid,
                gatewayReference: confirmedGatewayReference,
                method: mode,
              },
            });

            await prisma.passPurchase.update({
              where: { id: payment.passPurchase.id },
              data: {
                confirmationEmailSent: true,
                confirmationEmailSentAt: new Date(),
              },
            });
            console.log(`[EasebuzzService] Pass confirmation email: SUCCESS for txnid=${txnid}`);
          } catch (err: any) {
            // Non-fatal for payment: log error, leave confirmationEmailSent false so it remains retryable
            console.error(
              `[EasebuzzService] Non-fatal: Pass purchase confirmation email delivery failed for txnid=${txnid}:`,
              err?.message
            );
          }
        }
      } else {
        console.log(`[EasebuzzService] Confirmation email already previously sent for txnid=${txnid}. Skipping duplicate.`);
      }

      return {
        status: "success",
        txnid,
        targetType,
        targetId,
        redirectUrl: `${frontendBaseUrl}/payment/result?status=success&txnid=${txnid}&type=${targetType}&id=${targetId}&number=${identifier}`,
      };
    } else {
      const finalPaymentStatus = isCancelled ? PaymentStatus.CANCELLED : PaymentStatus.FAILED;

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: finalPaymentStatus,
          gatewayReference: easepayid,
          gatewayResponse: body,
        },
      });

      console.log(`[EasebuzzService] Payment marked ${finalPaymentStatus} for txnid=${txnid}`);
      const resultStatus = isCancelled ? "cancelled" : "failed";
      return {
        status: resultStatus,
        txnid,
        targetType,
        targetId,
        redirectUrl: `${frontendBaseUrl}/payment/result?status=${resultStatus}&txnid=${txnid}&type=${targetType}&id=${targetId}`,
      };
    }
  }
}
