import http from "http";
import jwt from "jsonwebtoken";
import app from "./app";
import { prisma } from "./lib/prisma";
import { getJwtSecret } from "./lib/jwtConfig";
import {
  Role,
  ParticipantCategory,
  RegistrationType,
  EventStatus,
} from "../generated/prisma/client";

const JWT_SECRET = getJwtSecret();

function makeToken(user: { id: string; email: string; role: Role }) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

let server: http.Server;
let baseUrl: string;

async function request(
  endpoint: string,
  options: {
    method?: string;
    token?: string;
    body?: any;
  } = {}
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const json = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data: json };
}

async function runTests() {
  console.log("=== Starting Euphoria Registration & Payment Test Suite ===");

  // 0. Start local test server
  server = app.listen(0);
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 5000;
  baseUrl = `http://localhost:${port}`;
  console.log(`Test server running at ${baseUrl}`);

  try {
    // 1. Setup Test Users
    console.log("\n1. Setting up test users...");
    const adminUser = await prisma.user.upsert({
      where: { email: "test-admin@euphoria.test" },
      update: { role: Role.ADMIN },
      create: {
        email: "test-admin@euphoria.test",
        name: "Test Admin",
        role: Role.ADMIN,
      },
    });

    const organizerUser = await prisma.user.upsert({
      where: { email: "test-organizer@euphoria.test" },
      update: { role: Role.ORGANIZER },
      create: {
        email: "test-organizer@euphoria.test",
        name: "Test Organizer",
        role: Role.ORGANIZER,
      },
    });

    const participant1 = await prisma.user.upsert({
      where: { email: "test-part1@euphoria.test" },
      update: { role: Role.PARTICIPANT },
      create: {
        email: "test-part1@euphoria.test",
        name: "Participant One",
        role: Role.PARTICIPANT,
      },
    });

    const participant2 = await prisma.user.upsert({
      where: { email: "test-part2@euphoria.test" },
      update: { role: Role.PARTICIPANT },
      create: {
        email: "test-part2@euphoria.test",
        name: "Participant Two",
        role: Role.PARTICIPANT,
      },
    });

    const adminToken = makeToken(adminUser);
    const organizerToken = makeToken(organizerUser);
    const part1Token = makeToken(participant1);
    const part2Token = makeToken(participant2);

    // 2. Setup Test Category & Events
    console.log("\n2. Setting up test category and events...");
    const testCategory = await prisma.category.upsert({
      where: { slug: "test-category" },
      update: {},
      create: {
        slug: "test-category",
        name: "Test Category",
        number: "99",
      },
    });

    // Cleanup previous test registrations/teams/events if needed
    const prevEvents = await prisma.event.findMany({
      where: { categoryId: testCategory.id },
      select: { id: true },
    });
    for (const e of prevEvents) {
      await prisma.registration.deleteMany({ where: { eventId: e.id } });
      await prisma.team.deleteMany({ where: { eventId: e.id } });
    }
    await prisma.event.deleteMany({ where: { categoryId: testCategory.id } });

    // Event A: Closed paid individual event (registrationOpen: false)
    const closedEvent = await prisma.event.create({
      data: {
        name: "Closed Solo Singing",
        description: "Test event that is currently closed",
        categoryId: testCategory.id,
        fee: 150,
        registrationType: RegistrationType.INDIVIDUAL,
        registrationOpen: false,
        status: EventStatus.PUBLISHED,
        capacity: 10,
      },
    });

    // Event B: Group event (registrationOpen: true, min: 2, max: 4)
    const groupEvent = await prisma.event.create({
      data: {
        name: "Group Dance Championship",
        description: "Test group dance event",
        categoryId: testCategory.id,
        fee: 500,
        registrationType: RegistrationType.GROUP,
        registrationOpen: true,
        minTeamSize: 2,
        maxTeamSize: 4,
        status: EventStatus.PUBLISHED,
        capacity: 10,
      },
    });

    // Event C: Free event (fee: 0, registrationOpen: true)
    const freeEvent = await prisma.event.create({
      data: {
        name: "Open Quiz Prelims",
        description: "Test free event",
        categoryId: testCategory.id,
        fee: 0,
        registrationType: RegistrationType.INDIVIDUAL,
        registrationOpen: true,
        status: EventStatus.PUBLISHED,
        capacity: 50,
      },
    });

    // Event D: Capacity-limited event (capacity: 1)
    const capacityLimitedEvent = await prisma.event.create({
      data: {
        name: "Exclusive Masterclass",
        description: "Capacity 1 test event",
        categoryId: testCategory.id,
        fee: 100,
        registrationType: RegistrationType.INDIVIDUAL,
        registrationOpen: true,
        status: EventStatus.PUBLISHED,
        capacity: 1,
      },
    });

    console.log("Events created successfully.");

    // ── TEST 1: Closed Registration Rule & No Admin Bypass ──
    console.log("\n[TEST 1] Closed Registration Enforcement (Strict: No Admin Bypass)");
    const partClosedRes = await request("/api/registrations", {
      method: "POST",
      token: part1Token,
      body: {
        eventId: closedEvent.id,
        participantCategory: "sage",
        personalDetails: {
          fullName: "Aarav",
          email: "aarav@test.com",
          phone: "9876543210",
        },
      },
    });
    console.log(
      "Participant registration on closed event:",
      partClosedRes.status,
      partClosedRes.data?.message
    );
    if (
      partClosedRes.status !== 400 ||
      !partClosedRes.data?.message?.includes("closed")
    ) {
      throw new Error("FAILED: Participant should be blocked on closed event");
    }

    const adminClosedRes = await request("/api/registrations", {
      method: "POST",
      token: adminToken,
      body: {
        eventId: closedEvent.id,
        participantCategory: "general",
        fullName: "Admin Registrant",
        email: "admin-reg@test.com",
        phone: "9876543210",
      },
    });
    console.log(
      "Admin registration on closed event:",
      adminClosedRes.status,
      adminClosedRes.data?.message
    );
    if (
      adminClosedRes.status !== 400 ||
      !adminClosedRes.data?.message?.includes("closed")
    ) {
      throw new Error(
        "FAILED: Admin MUST NOT bypass closed registration rule on normal registration endpoint!"
      );
    }
    console.log("✓ TEST 1 PASSED: Closed event strictly rejects all users including Admin.");

    // ── TEST 2: PATCH /api/events/:id/registration-status ──
    console.log("\n[TEST 2] Dedicated Registration Status Toggle");
    // Participant should get 403
    const partToggleRes = await request(
      `/api/events/${closedEvent.id}/registration-status`,
      {
        method: "PATCH",
        token: part1Token,
        body: { registrationOpen: true },
      }
    );
    console.log("Participant toggling status status code:", partToggleRes.status);
    if (partToggleRes.status !== 403) {
      throw new Error("FAILED: Non-admin/organizer must get 403 Forbidden");
    }

    // Admin opens registration
    const adminToggleRes = await request(
      `/api/events/${closedEvent.id}/registration-status`,
      {
        method: "PATCH",
        token: adminToken,
        body: { registrationOpen: true },
      }
    );
    console.log(
      "Admin toggling status response:",
      adminToggleRes.status,
      adminToggleRes.data?.message
    );
    if (
      adminToggleRes.status !== 200 ||
      adminToggleRes.data?.data?.event?.registrationOpen !== true
    ) {
      throw new Error("FAILED: Admin should be able to open registration");
    }
    console.log("✓ TEST 2 PASSED: Registration status toggle works with proper RBAC.");

    // ── TEST 3: Individual Registration & Frontend Structure Compatibility ──
    console.log("\n[TEST 3] Individual Registration & Frontend Compatibility");
    const regRes = await request("/api/registrations", {
      method: "POST",
      token: part1Token,
      body: {
        eventId: closedEvent.id,
        participantCategory: "sage", // lowercase kebab/camel format from frontend
        personalDetails: {
          fullName: "Aarav Patel",
          email: "aarav.patel@test.com",
          phone: "9876543210",
        },
        scholarNumber: "21BT01001",
        enrollmentNumber: "SU21001",
        institute: "Institute of Advanced Computing",
        course: "B.Tech CSE",
        year: "3rd Year",
        semester: "5th Semester",
        paymentMethod: "upi", // frontend payment method
      },
    });
    console.log("Individual registration response:", regRes.status);
    if (regRes.status !== 201) {
      throw new Error(
        `FAILED: Individual registration failed with status ${regRes.status}: ${JSON.stringify(regRes.data)}`
      );
    }
    const regData = regRes.data.data.registration;
    console.log(
      `Created Reg #${regData.registrationNumber}, Status: ${regData.status}, Payment Status: ${regData.payment?.status}, Method: ${regData.payment?.method}, TxnId: ${regData.payment?.transactionId}`
    );
    if (
      regData.participantCategory !== "SAGE" ||
      regData.status !== "PENDING" ||
      regData.payment?.amount !== 150 ||
      regData.payment?.method !== "UPI" ||
      !regData.payment?.transactionId?.startsWith("TXN_INIT_") ||
      regData.payment?.gatewayReference !== null ||
      regData.payment?.paidAt !== null
    ) {
      throw new Error("FAILED: Registration payment data mismatch with Prisma schema constraints");
    }

    // Duplicate check: Part 1 tries registering again for the same event
    const dupRes = await request("/api/registrations", {
      method: "POST",
      token: part1Token,
      body: {
        eventId: closedEvent.id,
        participantCategory: "sage",
        fullName: "Aarav Patel",
        email: "aarav.patel@test.com",
        phone: "9876543210",
      },
    });
    console.log("Duplicate registration attempt status:", dupRes.status);
    if (dupRes.status !== 400) {
      throw new Error("FAILED: Duplicate registration should be blocked");
    }
    console.log("✓ TEST 3 PASSED: Individual registration and duplicate prevention verified.");

    // ── TEST 4: Group Registration & Team Size Validation ──
    console.log("\n[TEST 4] Group Registration & Team Size Validation (Min: 2, Max: 4)");
    // Missing teamName for group event should be rejected
    const missingTeamNameRes = await request("/api/registrations", {
      method: "POST",
      token: part1Token,
      body: {
        eventId: groupEvent.id,
        participantCategory: "other-college",
        fullName: "Aarav Patel",
        email: "aarav.patel@test.com",
        phone: "9876543210",
        teamName: "",
      },
    });
    console.log("Missing teamName registration status:", missingTeamNameRes.status);
    if (missingTeamNameRes.status !== 400) {
      throw new Error("FAILED: Group registration without teamName should be rejected");
    }

    // Over maximum: leader + 4 members (total size = 5, max = 4)
    const overRes = await request("/api/registrations", {
      method: "POST",
      token: part1Token,
      body: {
        eventId: groupEvent.id,
        participantCategory: "general",
        fullName: "Aarav Patel",
        email: "aarav.patel@test.com",
        phone: "9876543210",
        teamName: "Too Many",
        teamMembers: [
          { fullName: "M1", email: "m1@test.com", phone: "9876543211" },
          { fullName: "M2", email: "m2@test.com", phone: "9876543212" },
          { fullName: "M3", email: "m3@test.com", phone: "9876543213" },
          { fullName: "M4", email: "m4@test.com", phone: "9876543214" },
        ],
      },
    });
    console.log("Over-size team registration status:", overRes.status);
    if (overRes.status !== 400) {
      throw new Error("FAILED: Team size over maxTeamSize should be rejected");
    }

    // Valid group: Leader + teamName (no additional members required)
    const validGroupRes = await request("/api/registrations", {
      method: "POST",
      token: part1Token,
      body: {
        eventId: groupEvent.id,
        participantCategory: "other-college",
        personalDetails: {
          fullName: "Aarav Patel",
          email: "aarav.patel@test.com",
          phone: "9876543210",
        },
        collegeName: "Indore Institute of Tech",
        course: "BBA",
        year: "2nd Year",
        teamName: "Euphoria Beats",
      },
    });
    console.log("Valid group registration status:", validGroupRes.status);
    if (validGroupRes.status !== 201) {
      throw new Error(
        `FAILED: Group registration failed: ${JSON.stringify(validGroupRes.data)}`
      );
    }
    const groupRegData = validGroupRes.data.data.registration;
    console.log(
      `Group Team Name: ${groupRegData.team?.name}, Leader: ${groupRegData.team?.leaderName}`
    );
    if (
      !groupRegData.team ||
      groupRegData.team.name !== "Euphoria Beats" ||
      groupRegData.team.leaderName !== "Aarav Patel"
    ) {
      throw new Error("FAILED: Team record was not created correctly");
    }
    console.log("✓ TEST 4 PASSED: Group registration and team validation verified.");

    // ── TEST 5: Capacity Concurrency Safety ──
    console.log("\n[TEST 5] Capacity Safety & Concurrency Locking (Capacity = 1)");
    // Fire 2 concurrent registration requests for capacityLimitedEvent from part1 and part2
    const [concurrent1, concurrent2] = await Promise.all([
      request("/api/registrations", {
        method: "POST",
        token: part1Token,
        body: {
          eventId: capacityLimitedEvent.id,
          participantCategory: "general",
          fullName: "User One",
          email: "u1@test.com",
          phone: "9876543210",
        },
      }),
      request("/api/registrations", {
        method: "POST",
        token: part2Token,
        body: {
          eventId: capacityLimitedEvent.id,
          participantCategory: "general",
          fullName: "User Two",
          email: "u2@test.com",
          phone: "9876543211",
        },
      }),
    ]);

    console.log(`Concurrent request 1 status: ${concurrent1.status}`);
    console.log(`Concurrent request 2 status: ${concurrent2.status}`);

    const statuses = [concurrent1.status, concurrent2.status].sort();
    if (statuses[0] !== 201 || statuses[1] !== 400) {
      throw new Error(
        `FAILED: Capacity concurrency test failed. Expected [201, 400], got [${statuses.join(", ")}]`
      );
    }
    console.log("✓ TEST 5 PASSED: Exactly 1 concurrent registration succeeded; second failed capacity check.");

    // ── TEST 6: Payment Simulation (Dev/Test Mode) ──
    console.log("\n[TEST 6] Payment Simulation (Development/Test Mode)");
    const targetRegId = regData.id;

    // Simulate FAILED payment
    const failSimRes = await request(`/api/registrations/${targetRegId}/pay`, {
      method: "POST",
      token: part1Token,
      body: {
        method: "UPI",
        simulateStatus: "FAILED",
      },
    });
    console.log("Failed payment simulation status:", failSimRes.status);
    if (
      failSimRes.status !== 200 ||
      failSimRes.data?.data?.payment?.status !== "FAILED" ||
      failSimRes.data?.data?.registrationStatus !== "PENDING"
    ) {
      throw new Error("FAILED: Payment failure simulation did not maintain PENDING registration");
    }
    console.log("Payment failure simulation verified: payment is FAILED, registration remains PENDING.");

    // Simulate SUCCESS payment
    const successSimRes = await request(`/api/registrations/${targetRegId}/pay`, {
      method: "POST",
      token: part1Token,
      body: {
        method: "UPI",
        simulateStatus: "SUCCESS",
      },
    });
    console.log("Success payment simulation status:", successSimRes.status);
    if (
      successSimRes.status !== 200 ||
      successSimRes.data?.data?.payment?.status !== "SUCCESS" ||
      successSimRes.data?.data?.registrationStatus !== "CONFIRMED"
    ) {
      throw new Error("FAILED: Payment success simulation failed to confirm registration");
    }
    console.log(
      `Payment success verified: payment is SUCCESS (${successSimRes.data?.data?.payment?.transactionId}), registration is CONFIRMED.`
    );

    // Attempting payment again on already CONFIRMED registration
    const rePayRes = await request(`/api/registrations/${targetRegId}/pay`, {
      method: "POST",
      token: part1Token,
      body: { method: "CARD" },
    });
    console.log("Repeated payment on confirmed registration status:", rePayRes.status);
    if (rePayRes.status !== 400) {
      throw new Error("FAILED: Re-paying an already confirmed registration should be blocked");
    }
    console.log("✓ TEST 6 PASSED: Payment simulation works as specified for both failure and success cases.");

    // ── TEST 7: Free Event Auto-Confirmation ──
    console.log("\n[TEST 7] Free Event Auto-Confirmation (Fee = 0)");
    const freeRegRes = await request("/api/registrations", {
      method: "POST",
      token: part2Token,
      body: {
        eventId: freeEvent.id,
        participantCategory: "sage",
        personalDetails: {
          fullName: "Free Participant",
          email: "free@test.com",
          phone: "9876543210",
        },
        scholarNumber: "21BT09999",
        enrollmentNumber: "SU21999",
        institute: "Institute of Engineering and Technology",
        year: "1st Year",
      },
    });
    console.log("Free event registration status:", freeRegRes.status);
    if (freeRegRes.status !== 201) {
      throw new Error("FAILED: Free event registration failed");
    }
    const freeRegData = freeRegRes.data.data.registration;
    console.log(
      `Free event registration status: ${freeRegData.status}, Payment status: ${freeRegData.payment?.status}`
    );
    if (
      freeRegData.status !== "CONFIRMED" ||
      freeRegData.payment?.status !== "SUCCESS" ||
      freeRegData.payment?.amount !== 0
    ) {
      throw new Error("FAILED: Free event should be auto-confirmed with 0 amount");
    }
    console.log("✓ TEST 7 PASSED: Free event automatically confirmed upon creation.");

    // ── TEST 8: GET Queries & Permissions ──
    console.log("\n[TEST 8] Queries & Authorization Verification");
    // My Registrations
    const myRegs = await request("/api/registrations/my-registrations", {
      token: part1Token,
    });
    console.log("Participant 1 my-registrations count:", myRegs.data?.count);
    if (myRegs.status !== 200 || (myRegs.data?.count || 0) < 2) {
      throw new Error("FAILED: my-registrations did not return expected count");
    }

    // Event Registrations (Admin)
    const eventRegsAdmin = await request(`/api/events/${closedEvent.id}/registrations`, {
      token: adminToken,
    });
    console.log("Admin event registrations count:", eventRegsAdmin.data?.count);
    if (eventRegsAdmin.status !== 200 || (eventRegsAdmin.data?.count || 0) < 1) {
      throw new Error("FAILED: Admin should be able to list event registrations");
    }

    // Event Registrations (Non-organizer participant -> 403)
    const eventRegsPart = await request(`/api/events/${closedEvent.id}/registrations`, {
      token: part1Token,
    });
    console.log("Participant event registrations status:", eventRegsPart.status);
    if (eventRegsPart.status !== 403) {
      throw new Error("FAILED: Regular participant must not list other participants' registrations");
    }
    console.log("✓ TEST 8 PASSED: Authorization and list queries work correctly.");

    console.log("\n=======================================================");
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! ALL REQUIREMENTS MET!");
    console.log("=======================================================\n");
  } finally {
    if (server) {
      server.close();
    }
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error("Test suite error:", err);
  process.exit(1);
});
