import { Router } from "express";
import type { HealthCheckResponse } from "../types";
import authRoutes from "./authRoutes";
import categoryRoutes from "./categoryRoutes";
import eventRoutes from "./eventRoutes";
import passRoutes from "./passRoutes";
import sponsorRoutes from "./sponsorRoutes";
import scheduleRoutes from "./scheduleRoutes";
import registrationRoutes from "./registrationRoutes";
import verificationRoutes from "./verificationRoutes";
import adminRoutes from "./adminRoutes";
import paymentRoutes from "./paymentRoutes";
import announcementRoutes from "./announcementRoutes";

const router = Router();

/**
 * Health check endpoint
 * GET /api/health
 */
router.get("/health", (_req, res) => {
  const response: HealthCheckResponse = {
    status: "ok",
    message: "Euphoria Backend API is running successfully",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || "development",
  };

  res.status(200).json(response);
});

/**
 * Authentication routes
 * /api/auth
 */
router.use("/auth", authRoutes);

/**
 * Festival Catalog & Discovery routes
 * /api/categories, /api/events, /api/passes, /api/sponsors, /api/schedules
 */
router.use("/categories", categoryRoutes);
router.use("/events", eventRoutes);
router.use("/passes", passRoutes);
router.use("/sponsors", sponsorRoutes);
router.use("/schedules", scheduleRoutes);
router.use("/announcements", announcementRoutes);

/**
 * Registration & Payment simulation routes
 * /api/registrations
 */
router.use("/registrations", registrationRoutes);

/**
 * Verification & OTP routes
 * /api/verification
 */
router.use("/verification", verificationRoutes);

/**
 * Admin Management Portal routes
 * /api/admin
 */
router.use("/admin", adminRoutes);

/**
 * Payment Gateway routes (Easebuzz & Simulation)
 * /api/payments
 */
router.use("/payments", paymentRoutes);

/**
 * Development-only testing routes (guarded by NODE_ENV !== "production")
 * /api/dev
 */
if (process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const devRoutes = require("./devRoutes").default;
  router.use("/dev", devRoutes);
}

export default router;

