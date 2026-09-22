import { prisma } from "../lib/prisma";
import {
  RegistrationType,
  EventStatus,
} from "../../generated/prisma/client";

/**
 * Temporary End-to-End Easebuzz Sandbox Test Event Seeder.
 * 
 * Creates:
 * 1. Category: TEST (slug: "test")
 * 2. Event: "EUPHORIA TEST EVENT — DELETE AFTER TESTING" (slug: "test-event-easebuzz-sandbox")
 *    - Fee: ₹1
 *    - Team size: 1 (Individual)
 *    - Registration open: true
 *    - Status: PUBLISHED
 * 
 * Run with:
 *   npx tsx src/scripts/seed-test-event.ts
 */

async function main() {
  console.log("===============================================================");
  console.log("🛠️  SEEDING TEMPORARY EASEBUZZ SANDBOX TEST EVENT");
  console.log("===============================================================\n");

  // 1. Upsert Test Category
  const testCategory = await prisma.category.upsert({
    where: { slug: "test" },
    update: {
      name: "TEST",
      description: "Temporary Sandbox Testing Category — Delete after testing",
    },
    create: {
      id: "cat-test-sandbox",
      name: "TEST",
      slug: "test",
      description: "Temporary Sandbox Testing Category — Delete after testing",
    },
  });

  console.log(`✓ Test Category verified: [${testCategory.id}] ${testCategory.name} (slug: ${testCategory.slug})`);

  // 2. Upsert Test Event
  const testEvent = await prisma.event.upsert({
    where: { slug: "test-event-easebuzz-sandbox" },
    update: {
      name: "EUPHORIA TEST EVENT — DELETE AFTER TESTING",
      description: "Temporary ₹1 test event to verify complete end-to-end Easebuzz Sandbox payment, verification, and email workflow. Delete after testing.",
      categoryId: testCategory.id,
      fee: 1, // Exactly ₹1 for real Easebuzz Sandbox testing
      registrationType: RegistrationType.INDIVIDUAL,
      minTeamSize: 1,
      maxTeamSize: 1,
      registrationOpen: true,
      status: EventStatus.PUBLISHED,
      date: "Sandbox QA Testing",
      day: "Day 1",
      time: "Anytime",
      venue: "Easebuzz Sandbox Gateway",
      prizes: "N/A — QA Sandbox Testing",
      rules: "Temporary test event for verifying Easebuzz sandbox checkout, server-side hash verification, and transactional email delivery.",
    },
    create: {
      id: "test-event-easebuzz-sandbox",
      slug: "test-event-easebuzz-sandbox",
      name: "EUPHORIA TEST EVENT — DELETE AFTER TESTING",
      description: "Temporary ₹1 test event to verify complete end-to-end Easebuzz Sandbox payment, verification, and email workflow. Delete after testing.",
      categoryId: testCategory.id,
      fee: 1, // Exactly ₹1 for real Easebuzz Sandbox testing
      registrationType: RegistrationType.INDIVIDUAL,
      minTeamSize: 1,
      maxTeamSize: 1,
      registrationOpen: true,
      status: EventStatus.PUBLISHED,
      date: "Sandbox QA Testing",
      day: "Day 1",
      time: "Anytime",
      venue: "Easebuzz Sandbox Gateway",
      prizes: "N/A — QA Sandbox Testing",
      rules: "Temporary test event for verifying Easebuzz sandbox checkout, server-side hash verification, and transactional email delivery.",
    },
  });

  console.log(`✓ Test Event verified: [${testEvent.id}] ${testEvent.name}`);
  console.log(`   - Category:  ${testCategory.name}`);
  console.log(`   - Fee:       ₹${testEvent.fee}`);
  console.log(`   - Team Size: ${testEvent.minTeamSize}`);
  console.log(`   - Status:    ${testEvent.status} (registrationOpen: ${testEvent.registrationOpen})`);
  console.log("\n===============================================================");
  console.log("✅ SEED COMPLETE. Test event is ready for QA testing.");
  console.log("===============================================================");

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("❌ Failed to seed test event:", err);
  await prisma.$disconnect();
  process.exit(1);
});
