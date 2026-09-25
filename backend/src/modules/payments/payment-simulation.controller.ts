import type { Response, NextFunction } from "express";
import { PaymentSimulationService } from "./payment-simulation.service";
import type { AuthenticatedRequest, PaymentSimulationInput } from "../../types";
import { HttpError } from "../../lib/errors";

function ensureSimulationAllowed(): void {
  const isProd = process.env.NODE_ENV === "production";
  const gateway = (process.env.PAYMENT_GATEWAY || "").toLowerCase().trim();
  if (isProd || gateway === "easebuzz") {
    throw new HttpError(
      "Payment simulation is disabled. Please initiate payment through the payment gateway.",
      403
    );
  }
}

/**
 * Helper to extract bearer token or body paymentToken
 */
function extractPaymentToken(req: AuthenticatedRequest): string | null {
  const authHeader = req.headers.authorization;
  const bearerToken =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : null;
  return (req.body?.paymentToken as string) || bearerToken;
}

/**
 * Controller handling development/test payment simulations for event registrations
 * POST /api/registrations/:id/pay
 * Access: Scoped paymentToken or Authenticated User/Admin
 */
export const simulatePaymentHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    ensureSimulationAllowed();
    const registrationId = req.params.id as string;
    const input: PaymentSimulationInput = req.body || {};
    const paymentToken = extractPaymentToken(req);

    const result = await PaymentSimulationService.simulatePayment(
      registrationId,
      input,
      req.user || null,
      paymentToken
    );

    res.status(200).json({
      status: "success",
      message:
        result.registrationStatus === "CONFIRMED"
          ? "Payment simulated successfully (CONFIRMED)"
          : "Payment simulation resulted in FAILED payment (retry allowed)",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller handling development/test payment simulations for festival pass purchases
 * POST /api/passes/purchases/:id/pay
 * Access: Scoped paymentToken or Authenticated User/Admin
 */
export const simulatePassPaymentHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    ensureSimulationAllowed();
    const passPurchaseId = req.params.id as string;
    const input: PaymentSimulationInput = req.body || {};
    const paymentToken = extractPaymentToken(req);

    const result = await PaymentSimulationService.simulatePassPayment(
      passPurchaseId,
      input,
      req.user || null,
      paymentToken
    );

    res.status(200).json({
      status: "success",
      message:
        result.status === "CONFIRMED"
          ? "Pass payment simulated successfully (CONFIRMED)"
          : "Pass payment simulation resulted in FAILED payment (retry allowed)",
      data: {
        ...result,
        passPurchaseStatus: result.status,
      },
    });
  } catch (error) {
    next(error);
  }
};
