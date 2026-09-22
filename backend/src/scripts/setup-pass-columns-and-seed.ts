import { prisma } from "../lib/prisma";

async function main() {
  console.log("Checking and applying schema alterations if needed...");

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "PassPurchase" ADD COLUMN IF NOT EXISTS "standupDiscountUsed" BOOLEAN NOT NULL DEFAULT false;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "PassPurchase" ADD COLUMN IF NOT EXISTS "standupRegistrationId" TEXT;
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "PassPurchase_standupRegistrationId_key" ON "PassPurchase"("standupRegistrationId");
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Registration" ADD COLUMN IF NOT EXISTS "appliedPassId" TEXT;
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "Registration_appliedPassId_key" ON "Registration"("appliedPassId");
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Registration" ADD COLUMN IF NOT EXISTS "discountAmount" DOUBLE PRECISION DEFAULT 0;
  `);

  console.log("Database columns and indexes confirmed.");

  // Check general pass
  let generalPass = await prisma.pass.findUnique({
    where: { slug: "euphoria-2026-general" }
  });

  if (!generalPass) {
    generalPass = await prisma.pass.create({
      data: {
        slug: "euphoria-2026-general",
        name: "EUPHORIA 2026 FESTIVAL PASS",
        subtitle: "ALL-ACCESS FESTIVAL PASS",
        tagline: "Your entry into the grand celebration.",
        price: 799,
        status: "AVAILABLE",
        features: [
          "Access to all 3 days",
          "Entry to all concerts & celebrity nights",
          "Discounted entry to Standup Comedy (₹49)",
          "Euphoria 2026 welcome kit & badge"
        ],
        audiences: ["Students", "Outsiders", "Delegates"]
      }
    });
    console.log("Created general pass:", generalPass.id);
  }

  // Create or update TEST pass record EUPH-2026-PAS-TEST01A9
  const testPassNumber = "EUPH-2026-PAS-TEST01A9";

  const existing = await prisma.passPurchase.findUnique({
    where: { passNumber: testPassNumber },
    include: { payment: true }
  });

  if (!existing) {
    const created = await prisma.passPurchase.create({
      data: {
        passNumber: testPassNumber,
        passId: generalPass.id,
        fullName: "Test Passholder (DEV LOCAL ONLY)",
        email: "testpass.dev@sageuniversity.edu.in",
        phone: "9876543210",
        participantCategory: "GENERAL",
        collegeName: "SAGE University Bhopal",
        quantity: 1,
        status: "CONFIRMED",
        isEmailVerified: true,
        standupDiscountUsed: false,
        standupRegistrationId: null,
        payment: {
          create: {
            amount: 799,
            currency: "INR",
            method: "UPI",
            status: "SUCCESS",
            transactionId: "TXN_DEV_TEST_PAS_001",
            gatewayReference: "EASEBUZZ_DEV_REF_TEST_001",
            paidAt: new Date()
          }
        }
      },
      include: { payment: true }
    });
    console.log("✅ Seeded test Festival Pass:", created.passNumber);
  } else {
    // Reset test pass to unused state for dev testing
    const updated = await prisma.passPurchase.update({
      where: { passNumber: testPassNumber },
      data: {
        status: "CONFIRMED",
        standupDiscountUsed: false,
        standupRegistrationId: null,
      },
      include: { payment: true }
    });
    console.log("✅ Test Festival Pass exists and reset to unused:", updated.passNumber);
  }
}

main()
  .catch((e) => {
    console.error("Migration/Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
