import { prisma } from "../lib/prisma";

/**
 * Reusable Database Cleanup Script for Euphoria Development & Test Data.
 * 
 * Safety Rules:
 * - Will NOT execute deletions unless the `--execute` flag is explicitly passed.
 * - By default (without `--execute`), performs a safe read-only DRY RUN.
 * - Strictly preserves all official categories, events, passes, sponsors, and schedules.
 * - Strictly preserves the official administrator account (admin@sageuniversity.in).
 * - Deletes in strict foreign-key dependency order within a transaction.
 */

async function main() {
  const isExecute = process.argv.includes("--execute");
  const keepAkshat = process.argv.includes("--keep-manual-test");

  console.log("===============================================================");
  console.log(`🧹 EUPHORIA DATABASE TEST-DATA CLEANUP ${isExecute ? "[EXECUTION MODE]" : "[DRY RUN MODE]"}`);
  console.log("===============================================================\n");

  if (!isExecute) {
    console.log("⚠️  DRY RUN ONLY: No database changes will be made.");
    console.log("👉 To actually execute deletions, re-run with: npx tsx src/scripts/clean-test-data.ts --execute\n");
  }

  // 1. Audit records targeted for cleanup
  const whereEmailFilter = keepAkshat
    ? { not: { equals: "23eng2cse0029@sageuniversity.in", mode: "insensitive" as const } }
    : undefined;

  const paymentsCount = await prisma.payment.count();
  const teamMembersCount = await prisma.teamMember.count();
  const registrationsCount = await prisma.registration.count({
    where: whereEmailFilter ? { email: whereEmailFilter } : undefined,
  });
  const teamsCount = await prisma.team.count();
  const passPurchasesCount = await prisma.passPurchase.count({
    where: whereEmailFilter ? { email: whereEmailFilter } : undefined,
  });
  const otpsCount = await prisma.verificationOtp.count({
    where: whereEmailFilter ? { email: whereEmailFilter } : undefined,
  });

  // Test events and test categories
  const testCategories = await prisma.category.findMany({
    where: { slug: { in: ["test", "test-category"] } },
  });
  const testCategoryIds = testCategories.map((c) => c.id);
  const testEvents = testCategoryIds.length > 0
    ? await prisma.event.findMany({ where: { categoryId: { in: testCategoryIds } } })
    : [];

  // Test users to remove (all test users except admin@sageuniversity.in)
  const testUsers = await prisma.user.findMany({
    where: {
      email: {
        not: "admin@sageuniversity.in",
      },
    },
    select: { id: true, email: true, role: true },
  });

  console.log("📊 INVENTORY OF IDENTIFIED TEST DATA:");
  console.log(`   - Payments:              ${paymentsCount} record(s)`);
  console.log(`   - Team Members:          ${teamMembersCount} record(s)`);
  console.log(`   - Registrations:         ${registrationsCount} record(s)`);
  console.log(`   - Teams:                 ${teamsCount} record(s)`);
  console.log(`   - Pass Purchases:        ${passPurchasesCount} record(s)`);
  console.log(`   - Verification OTPs:     ${otpsCount} record(s)`);
  console.log(`   - Test Events:           ${testEvents.length} record(s) (${testEvents.map((e) => e.name).join(", ") || "none"})`);
  console.log(`   - Test Categories:       ${testCategories.length} (${testCategories.map((c) => c.slug).join(", ") || "none"})`);
  console.log(`   - Test Users:            ${testUsers.length} record(s) (${testUsers.map((u) => u.email).join(", ") || "none"})\n`);

  console.log("🛡️  PRESERVED PERMANENT FESTIVAL CONFIGURATION:");
  const officialCategoriesCount = await prisma.category.count({
    where: { slug: { notIn: ["test", "test-category"] } },
  });
  const officialEventsCount = await prisma.event.count({
    where: { categoryId: { notIn: testCategoryIds } },
  });
  const officialPassesCount = await prisma.pass.count();
  const officialSponsorsCount = await prisma.sponsor.count();
  const officialSchedulesCount = await prisma.schedule.count();

  console.log(`   ✓ Official Categories:   ${officialCategoriesCount}`);
  console.log(`   ✓ Official Events:       ${officialEventsCount}`);
  console.log(`   ✓ Official Passes:       ${officialPassesCount}`);
  console.log(`   ✓ Official Sponsors:     ${officialSponsorsCount}`);
  console.log(`   ✓ Official Schedules:    ${officialSchedulesCount}`);
  console.log(`   ✓ Primary Admin User:    admin@sageuniversity.in (PRESERVED)\n`);

  if (!isExecute) {
    console.log("===============================================================");
    console.log("🔒 DRY RUN COMPLETE. ZERO RECORDS WERE DELETED.");
    console.log("===============================================================");
    await prisma.$disconnect();
    return;
  }

  // Execute safe transactional deletion in dependency order
  console.log("⏳ Executing deletion in dependency order within transaction...");

  await prisma.$transaction(async (tx) => {
    // 1. Delete Payments
    if (whereEmailFilter) {
      await tx.payment.deleteMany({
        where: {
          OR: [
            { registration: { email: whereEmailFilter } },
            { passPurchase: { email: whereEmailFilter } },
          ],
        },
      });
    } else {
      await tx.payment.deleteMany({});
    }

    // 2. Delete Team Members
    await tx.teamMember.deleteMany({});

    // 3. Delete Registrations
    if (whereEmailFilter) {
      await tx.registration.deleteMany({ where: { email: whereEmailFilter } });
    } else {
      await tx.registration.deleteMany({});
    }

    // 4. Delete Teams
    await tx.team.deleteMany({});

    // 5. Delete Pass Purchases
    if (whereEmailFilter) {
      await tx.passPurchase.deleteMany({ where: { email: whereEmailFilter } });
    } else {
      await tx.passPurchase.deleteMany({});
    }

    // 6. Delete Verification OTPs
    if (whereEmailFilter) {
      await tx.verificationOtp.deleteMany({ where: { email: whereEmailFilter } });
    } else {
      await tx.verificationOtp.deleteMany({});
    }

    // 7. Delete Test Events & Test Categories
    if (testCategoryIds.length > 0) {
      await tx.event.deleteMany({ where: { categoryId: { in: testCategoryIds } } });
      await tx.category.deleteMany({ where: { id: { in: testCategoryIds } } });
    }

    // 8. Delete Test Users (preserving admin@sageuniversity.in)
    await tx.user.deleteMany({
      where: {
        email: {
          not: "admin@sageuniversity.in",
        },
      },
    });
  });

  console.log("✅ CLEANUP COMPLETED SUCCESSFULLY. All test data removed cleanly.");
  console.log("===============================================================");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("❌ Cleanup failed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
