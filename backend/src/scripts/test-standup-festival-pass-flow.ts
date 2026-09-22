import { prisma } from "../lib/prisma";
import { PassService, generateFestivalPassId } from "../services/passService";
import { RegistrationService } from "../services/registrationService";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../lib/jwtConfig";
import { RegistrationStatus, PaymentStatus } from "../../generated/prisma/client";

async function runTests() {
  console.log("===============================================================");
  console.log("🧪 TESTING FESTIVAL PASS → STANDUP COMEDY DISCOUNT FLOW");
  console.log("===============================================================\n");

  const testPassNumber = "EUPH-2026-PAS-TEST01A9";
  const standupEventId = "cultural-12";

  // 1. Verify ID format rules
  console.log("1. Verifying Festival Pass vs Event Registration ID formats...");
  const generatedPassId = generateFestivalPassId();
  console.log(`   Generated Pass ID: ${generatedPassId}`);
  if (!generatedPassId.startsWith("EUPH-2026-PAS-")) {
    throw new Error(`Pass ID must start with EUPH-2026-PAS-, got ${generatedPassId}`);
  }
  if (generatedPassId.includes("REG")) {
    throw new Error(`Pass ID must NEVER contain REG`);
  }
  const passIdSuffix = generatedPassId.replace("EUPH-2026-PAS-", "");
  if (passIdSuffix.length !== 8) {
    throw new Error(`Pass ID suffix must be 8 alphanumeric chars, got length ${passIdSuffix.length}`);
  }
  console.log("   ✓ Festival Pass ID format confirmed: EUPH-2026-PAS-XXXXXXXX");

  // 2. Verify Local Test Festival Pass
  console.log("\n2. Verifying TEST Festival Pass in database...");
  let testPass = await prisma.passPurchase.findUnique({
    where: { passNumber: testPassNumber },
    include: { payment: true },
  });

  if (!testPass) {
    throw new Error(`Test pass ${testPassNumber} not found in database. Run setup script first.`);
  }

  // Reset to unused state before testing
  await prisma.passPurchase.update({
    where: { passNumber: testPassNumber },
    data: {
      status: RegistrationStatus.CONFIRMED,
      standupDiscountUsed: false,
      standupRegistrationId: null,
    },
  });
  console.log(`   ✓ Found test pass: ${testPass.passNumber}, status: ${testPass.status}, standupDiscountUsed: false`);

  // 3. Test Coupon Validation endpoint logic
  console.log("\n3. Testing Coupon Validation API logic...");

  // Test invalid pass format
  const formatRes = await PassService.validatePassCoupon("EUPH-2026-REG-12345678", standupEventId);
  if (formatRes.valid) throw new Error("Expected invalid format to be rejected");
  console.log(`   ✓ Non-PAS format rejected: "${formatRes.message}"`);

  // Test non-existent pass
  const invalidRes = await PassService.validatePassCoupon("EUPH-2026-PAS-NONEXIST", standupEventId);
  if (invalidRes.valid) throw new Error("Expected non-existent pass to be rejected");
  console.log(`   ✓ Non-existent pass rejected: "${invalidRes.message}"`);

  // Test unrelated event with valid pass
  const otherEventRes = await PassService.validatePassCoupon(testPassNumber, "test-event-easebuzz-sandbox");
  if (otherEventRes.valid) throw new Error("Expected valid pass to be rejected for non-standup event");
  console.log(`   ✓ Unrelated event rejected: "${otherEventRes.message}"`);

  // Test Standup Comedy with valid pass
  const validRes = await PassService.validatePassCoupon(testPassNumber, standupEventId);
  if (!validRes.valid || validRes.discountedPrice !== 49 || validRes.discountAmount !== 150) {
    throw new Error(`Expected valid pass on standup to return 49, got: ${JSON.stringify(validRes)}`);
  }
  console.log(`   ✓ Valid pass approved for Standup: original=₹${validRes.originalPrice}, discount=₹${validRes.discountAmount}, payable=₹${validRes.discountedPrice}`);

  const createTestToken = (email: string) =>
    jwt.sign({ email: email.trim().toLowerCase(), purpose: "EVENT_REGISTRATION" }, getJwtSecret(), {
      expiresIn: "10m",
    });

  // 4. Test Normal Standup Registration (WITHOUT PASS -> ₹199)
  console.log("\n4. Testing Normal Standup Registration (NO PASS)...");
  const testEmail1 = `attendee.normal.${Date.now()}@example.com`;
  const token1 = createTestToken(testEmail1);

  const reg1 = await RegistrationService.createRegistration(null, {
    eventId: standupEventId,
    participantCategory: "GENERAL",
    fullName: "Normal Attendee",
    email: testEmail1,
    phone: "9988776655",
    verificationToken: token1,
    paymentMethod: "UPI",
  });

  const payment1 = await prisma.payment.findFirst({ where: { registrationId: reg1.id } });
  if (!payment1 || payment1.amount !== 199) {
    throw new Error(`Expected regular Standup registration payment to be 199, got ${payment1?.amount}`);
  }
  if (reg1.appliedPassId !== null) {
    throw new Error(`Expected appliedPassId to be null, got ${reg1.appliedPassId}`);
  }
  if (!reg1.registrationNumber.startsWith("EUPH-2026-REG-")) {
    throw new Error(`Registration Number must start with EUPH-2026-REG-, got ${reg1.registrationNumber}`);
  }
  console.log(`   ✓ Normal Standup created: ${reg1.registrationNumber}, fee=₹${payment1.amount} (Regular Price)`);

  // 5. Test Discounted Standup Registration (WITH PASS -> ₹49)
  console.log("\n5. Testing Discounted Standup Registration WITH Test Pass...");
  const testEmail2 = `attendee.passholder.${Date.now()}@example.com`;
  const token2 = createTestToken(testEmail2);

  const reg2 = await RegistrationService.createRegistration(null, {
    eventId: standupEventId,
    participantCategory: "GENERAL",
    fullName: "Passholder Attendee",
    email: testEmail2,
    phone: "9876501234",
    verificationToken: token2,
    festivalPassId: testPassNumber,
    paymentMethod: "UPI",
  });

  const payment2 = await prisma.payment.findFirst({ where: { registrationId: reg2.id } });
  if (!payment2 || payment2.amount !== 49) {
    throw new Error(`Expected discounted Standup registration payment to be 49, got ${payment2?.amount}`);
  }
  if (reg2.appliedPassId !== testPassNumber) {
    throw new Error(`Expected appliedPassId to be ${testPassNumber}, got ${reg2.appliedPassId}`);
  }
  if (reg2.discountAmount !== 150) {
    throw new Error(`Expected discountAmount to be 150, got ${reg2.discountAmount}`);
  }
  console.log(`   ✓ Discounted Standup created: ${reg2.registrationNumber}, fee=₹${payment2.amount}, appliedPass=${reg2.appliedPassId}`);

  // Check database state of the pass
  const updatedPass = await prisma.passPurchase.findUnique({
    where: { passNumber: testPassNumber },
  });
  if (!updatedPass?.standupDiscountUsed || updatedPass.standupRegistrationId !== reg2.registrationNumber) {
    throw new Error(`Expected pass to be marked used with standupRegistrationId=${reg2.registrationNumber}, got ${JSON.stringify(updatedPass)}`);
  }
  console.log(`   ✓ Test Pass marked used in DB: standupDiscountUsed=${updatedPass.standupDiscountUsed}, standupRegistrationId=${updatedPass.standupRegistrationId}`);

  // 6. Test Re-using the same pass (Expected REJECTION)
  console.log("\n6. Testing Re-use of the same Festival Pass (Must be REJECTED)...");
  const reuseVal = await PassService.validatePassCoupon(testPassNumber, standupEventId);
  if (reuseVal.valid) {
    throw new Error("Expected already-used pass to be rejected by validation API");
  }
  console.log(`   ✓ Coupon validation rejected reuse: "${reuseVal.message}"`);

  const testEmail3 = `attendee.cheat.${Date.now()}@example.com`;
  const token3 = createTestToken(testEmail3);
  let rejectedOnRegistration = false;
  try {
    await RegistrationService.createRegistration(null, {
      eventId: standupEventId,
      participantCategory: "GENERAL",
      fullName: "Cheat Attendee",
      email: testEmail3,
      phone: "9123456789",
      verificationToken: token3,
      festivalPassId: testPassNumber,
      paymentMethod: "UPI",
    });
  } catch (err: any) {
    rejectedOnRegistration = true;
    console.log(`   ✓ Registration rejected re-use with error: "${err.message}"`);
  }

  if (!rejectedOnRegistration) {
    throw new Error("Expected backend createRegistration to reject already-used Festival Pass!");
  }

  // 7. Test Duplicate Registration ID Protection
  console.log("\n7. Testing Duplicate Registration ID Protection...");
  let duplicateRejected = false;
  try {
    await prisma.registration.create({
      data: {
        registrationNumber: reg2.registrationNumber, // Duplicate!
        eventId: standupEventId,
        participantCategory: "GENERAL",
        fullName: "Duplicate Attempter",
        email: `dup.${Date.now()}@example.com`,
        phone: "9000000000",
      },
    });
  } catch (err: any) {
    duplicateRejected = true;
    console.log(`   ✓ Duplicate registrationNumber database uniqueness enforced: ${err.code || "P2002"}`);
  }

  if (!duplicateRejected) {
    throw new Error("Expected database to reject duplicate registrationNumber!");
  }

  // 8. Clean up test registrations & reset test pass for user testing
  console.log("\n8. Cleaning up test registrations & resetting test pass for local testing...");
  await prisma.payment.deleteMany({
    where: { registrationId: { in: [reg1.id, reg2.id] } },
  });
  await prisma.registration.deleteMany({
    where: { id: { in: [reg1.id, reg2.id] } },
  });

  await prisma.passPurchase.update({
    where: { passNumber: testPassNumber },
    data: {
      status: RegistrationStatus.CONFIRMED,
      standupDiscountUsed: false,
      standupRegistrationId: null,
    },
  });
  console.log(`   ✓ Reset ${testPassNumber} to standupDiscountUsed=false for user testing.`);

  console.log("\n===============================================================");
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
  console.log("===============================================================\n");
}

runTests()
  .catch((err) => {
    console.error("❌ TEST FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
