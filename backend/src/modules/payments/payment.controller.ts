import type { Request, Response, NextFunction } from "express";
import { EasebuzzService } from "./easebuzz.service";
import type { AuthenticatedRequest, InitiatePaymentInput } from "../../types";

/**
 * Controller to initiate Easebuzz payment session
 * POST /api/payments/easebuzz/initiate
 */
export const initiatePaymentHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const input: InitiatePaymentInput = req.body || {};
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : null;

    const result = await EasebuzzService.initiatePayment(
      input,
      req.user || null,
      bearerToken
    );

    res.status(200).json({
      status: "success",
      message:
        result.mode === "EASEBUZZ"
          ? "Payment session initialized successfully"
          : "Payment simulated successfully (dev mode)",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to handle Easebuzz browser redirect POST (SURL / FURL)
 * POST /api/payments/easebuzz/response
 */
export const handleEasebuzzResponseHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const payload = req.body || {};
    const result = await EasebuzzService.handlePaymentCallback(payload);

    // Redirect browser to frontend result page
    res.redirect(302, result.redirectUrl);
  } catch (error: any) {
    const txnid = req.body?.txnid ? String(req.body.txnid).slice(0, 80) : "";
    console.error(
      `[PaymentController] Payment callback processing failed${txnid ? ` for txnid ${txnid}` : ""}:`,
      error.message
    );
    const frontendBaseUrl = process.env.APP_FRONTEND_URL || "http://localhost:5173";
    const txnidParam = txnid ? `&txnid=${encodeURIComponent(txnid)}` : "";
    res.redirect(
      302,
      `${frontendBaseUrl}/payment/result?status=failed${txnidParam}&error=${encodeURIComponent(
        error.message || "Payment processing failed"
      )}`
    );
  }
};

/**
 * Controller to handle Easebuzz Server-to-Server (S2S) Webhook callback
 * POST /api/payments/easebuzz/webhook
 */
export const handleEasebuzzWebhookHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const payload = req.body || {};
    await EasebuzzService.handlePaymentCallback(payload);

    res.status(200).json({
      status: "success",
      message: "Webhook processed successfully",
    });
  } catch (error) {
    next(error);
  }
};
