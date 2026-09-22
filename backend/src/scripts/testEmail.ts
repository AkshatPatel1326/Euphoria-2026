import "dotenv/config";
import { prisma } from "../lib/prisma";
import { emailService } from "../services/emailService";
import type { PassConfirmationData, RegistrationConfirmationData } from "../services/emailService";

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.error("❌ ERROR: Test email script is strictly disabled in production mode!");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const typeArg = args.find((a) => a.startsWith("--type="))?.split("=")[1]?.toLowerCase() || "both";
  const toArg = args.find((a) => a.startsWith("--to="))?.split("=")[1] || process.env.SMTP_USER || "test@example.com";

  console.log("==================================================");
  console.log("📨 Euphoria 2026 Development Email Test Runner");
  console.log("==================================================");
  console.log(`Target Recipient: ${toArg}`);
  console.log(`Email Type:       ${typeArg}`);
  console.log(`Environment:      ${process.env.NODE_ENV || "development"}`);
  console.log("--------------------------------------------------");

  if (typeArg === "pass" || typeArg === "both") {
    console.log("\n📦 1. Dispatching PASS PURCHASE CONFIRMED test email...");
    const devPassData: PassConfirmationData = {
      id: "dev-pass-test-id",
      passNumber: "DEV-TEST-001",
      fullName: "Euphoria Test User",
      email: toArg,
      phone: "9876543210",
      participantCategory: "SAGE",
      quantity: 3,
      createdAt: new Date(),
      pass: {
        name: "EUPHORIA 2026 - GENERAL PASS",
        subtitle: "GENERAL PASS",
        price: 799,
      },
      payment: {
        amount: 2397,
        status: "SUCCESS",
        transactionId: "TXN_DEV_TEST_001",
        gatewayReference: "EASE_DEV_001",
        method: "UPI",
        paidAt: new Date(),
      },
      holders: [
        {
          holderIndex: 2,
          fullName: "Aarav Sharma",
          email: "aarav.dev@example.com",
          phone: "9876543211",
        },
        {
          holderIndex: 3,
          fullName: "Priya Verma",
          email: "priya.dev@example.com",
          phone: "9876543212",
        },
      ],
    };

    try {
      await emailService.sendPassConfirmation(toArg, devPassData);
      console.log("✅ PASS CONFIRMATION EMAIL: Successfully dispatched!");
    } catch (err: any) {
      console.error("❌ PASS CONFIRMATION EMAIL FAILED:", err.message);
    }
  }

  if (typeArg === "event" || typeArg === "both") {
    console.log("\n🎟️  2. Dispatching EVENT REGISTRATION CONFIRMED test email...");
    const dbEvent = await prisma.event.findFirst({
      where: { name: { contains: "Arm Wrestling", mode: "insensitive" } },
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
      registrationNumber: `DEV-REG-${Date.now().toString(36).toUpperCase()}`,
      fullName: "Euphoria Test Participant",
      email: toArg,
      phone: "9876543210",
      participantCategory: "SAGE",
      createdAt: new Date(),
      event: eventData,
      team: {
        name: "Euphoria Warriors",
        leaderName: "Euphoria Test Participant",
        members: [
          {
            fullName: "Rohan Gupta",
            email: "rohan.dev@example.com",
            phone: "9876543213",
          },
          {
            fullName: "Simran Kaur",
            email: "simran.dev@example.com",
            phone: "9876543214",
          },
        ],
      },
      payment: {
        amount: eventData.fee ?? 150,
        status: "SUCCESS",
        transactionId: `TXN_DEV_REG_${Date.now()}`,
        gatewayReference: "EASE_DEV_REG_001",
        method: "UPI",
      },
    };

    try {
      await emailService.sendRegistrationConfirmation(toArg, devRegData);
      console.log("✅ EVENT CONFIRMATION EMAIL: Successfully dispatched!");
    } catch (err: any) {
      console.error("❌ EVENT CONFIRMATION EMAIL FAILED:", err.message);
    }
  }

  console.log("\n==================================================");
  console.log("✨ Test script completed.");
  console.log("==================================================\n");
}

main()
  .catch((err) => {
    console.error("Fatal test script error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
