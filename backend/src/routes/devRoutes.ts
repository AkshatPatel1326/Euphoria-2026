import { Router, type Request, type Response, type NextFunction } from "express";
import { HttpError } from "../lib/errors";
import { emailService } from "../services/emailService";
import { prisma } from "../lib/prisma";
import type { PassConfirmationData, RegistrationConfirmationData } from "../services/emailService";

const router = Router();

// Strict development environment guard
router.use((_req: Request, _res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV !== "development") {
    return next(
      new HttpError(
        "Development testing endpoints are strictly forbidden and disabled in this environment.",
        403
      )
    );
  }
  next();
});

/**
 * POST /api/dev/test-email
 * DEVELOPMENT-ONLY: Dispatches test confirmation email using real templates & SMTP
 */
router.post("/test-email", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, recipientEmail } = req.body || {};
    const defaultRecipient =
      process.env.SMTP_USER || process.env.ADMIN_EMAIL || "test@example.com";
    const targetEmail = (recipientEmail || defaultRecipient).trim().toLowerCase();

    if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      throw new HttpError("A valid recipientEmail is required", 400);
    }

    if (type === "PASS_PURCHASE_CONFIRMED" || type === "pass") {
      const dbPass = await prisma.pass.findFirst({
        where: { status: "AVAILABLE" },
      });

      const unitPrice = dbPass?.price ?? 799;
      const quantity = req.body.quantity ? Math.max(1, Math.min(10, Number(req.body.quantity))) : 3;
      const totalAmount = unitPrice * quantity;

      const devPassData: PassConfirmationData = {
        id: "dev-pass-test-id",
        passNumber: req.body.passNumber || `DEV-PASS-${Date.now().toString(36).toUpperCase()}`,
        fullName: req.body.fullName || "Euphoria Test User",
        email: targetEmail,
        phone: req.body.phone || "9876543210",
        participantCategory: "SAGE",
        quantity,
        createdAt: new Date(),
        pass: {
          name: dbPass?.name || "EUPHORIA 2026 - GENERAL PASS",
          subtitle: dbPass?.subtitle || "GENERAL PASS",
          price: unitPrice,
        },
        payment: {
          amount: totalAmount,
          status: "SUCCESS",
          transactionId: `TXN_DEV_PASS_${Date.now()}`,
          gatewayReference: "EASE_DEV_REF_001",
          method: "UPI",
          paidAt: new Date(),
        },
        holders: [
          {
            holderIndex: 1,
            fullName: req.body.fullName || "Euphoria Test User",
            email: targetEmail,
            phone: req.body.phone || "9876543210",
          },
          ...(quantity > 1
            ? Array.from({ length: quantity - 1 }, (_, i) => ({
                holderIndex: i + 2,
                fullName: `Recipient ${i + 2}`,
                email: `recipient${i + 2}@example.com`,
                phone: `98765432${(i + 10).toString().padStart(2, "0")}`,
              }))
            : []),
        ],
      };

      await emailService.sendPassConfirmation(targetEmail, devPassData);

      return res.status(200).json({
        status: "success",
        message: `Pass purchase confirmation test email successfully sent to ${targetEmail}`,
        data: {
          type: "PASS_PURCHASE_CONFIRMED",
          recipient: targetEmail,
          sampleData: devPassData,
        },
      });
    }

    if (type === "EVENT_REGISTRATION_CONFIRMED" || type === "event") {
      // Look up real event dynamically from database
      const eventFilter = req.body.eventId
        ? { id: req.body.eventId }
        : req.body.eventName
        ? { name: { contains: req.body.eventName, mode: "insensitive" as const } }
        : { name: { contains: "Arm Wrestling", mode: "insensitive" as const } };

      const dbEvent = await prisma.event.findFirst({
        where: eventFilter,
        include: { category: true },
      });

      const eventData = dbEvent
        ? {
            name: dbEvent.name,
            description: dbEvent.description,
            fee: dbEvent.fee,
            date: dbEvent.date,
            day: dbEvent.day,
            time: dbEvent.time,
            venue: dbEvent.venue,
            registrationType: dbEvent.registrationType,
            category: dbEvent.category ? { name: dbEvent.category.name } : null,
          }
        : {
            name: "Arm Wrestling",
            description: "A one-on-one arm wrestling competition for the strongest on campus.",
            fee: 150,
            date: "27 October 2026",
            day: "Tuesday",
            time: "8:30AM to 4:30PM",
            venue: "Phase 2 Sports Complex",
            registrationType: "INDIVIDUAL",
            category: {
              name: "Sports",
            },
          };

      const devRegData: RegistrationConfirmationData = {
        id: "dev-reg-test-id",
        registrationNumber: req.body.registrationNumber || `DEV-REG-${Date.now().toString(36).toUpperCase()}`,
        fullName: req.body.fullName || "Euphoria Test Participant",
        email: targetEmail,
        phone: req.body.phone || "9876543210",
        participantCategory: "SAGE",
        createdAt: new Date(),
        event: eventData,
        team: req.body.team || null,
        payment: {
          amount: eventData.fee ?? 150,
          status: "SUCCESS",
          transactionId: `TXN_DEV_REG_${Date.now()}`,
          gatewayReference: "EASE_DEV_REG_REF_001",
          method: "UPI",
        },
      };

      await emailService.sendRegistrationConfirmation(targetEmail, devRegData);

      return res.status(200).json({
        status: "success",
        message: `Event registration confirmation test email successfully sent to ${targetEmail}`,
        data: {
          type: "EVENT_REGISTRATION_CONFIRMED",
          recipient: targetEmail,
          sampleData: devRegData,
        },
      });
    }

    throw new HttpError(
      `Invalid test email type '${type}'. Allowed: PASS_PURCHASE_CONFIRMED, EVENT_REGISTRATION_CONFIRMED`,
      400
    );
  } catch (error) {
    next(error);
  }
});

export default router;
