import http from "http";
import app from "../app";

async function runPhase3Verification() {
  console.log("==================================================");
  console.log("🧪 Running Phase 3 Confirmation Email Verification");
  console.log("==================================================");

  const server = app.listen(0);
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 5000;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. Test POST /api/dev/test-email with PASS_PURCHASE_CONFIRMED
    console.log("\n[Test 1] Testing POST /api/dev/test-email (PASS_PURCHASE_CONFIRMED)...");
    const passRes = await fetch(`${baseUrl}/api/dev/test-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "PASS_PURCHASE_CONFIRMED",
        recipientEmail: "sage.euphoria@sageuniversity.in",
      }),
    });

    const passJson = await passRes.json();
    console.log("Pass test email status:", passRes.status, passJson.message);
    if (passRes.status !== 200 || passJson.status !== "success") {
      throw new Error(`Test 1 Failed: Expected 200, got ${passRes.status}: ${JSON.stringify(passJson)}`);
    }
    console.log("✓ Test 1 Passed: PASS_PURCHASE_CONFIRMED endpoint works.");

    // 2. Test POST /api/dev/test-email with EVENT_REGISTRATION_CONFIRMED
    console.log("\n[Test 2] Testing POST /api/dev/test-email (EVENT_REGISTRATION_CONFIRMED)...");
    const eventRes = await fetch(`${baseUrl}/api/dev/test-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "EVENT_REGISTRATION_CONFIRMED",
        recipientEmail: "sage.euphoria@sageuniversity.in",
      }),
    });

    const eventJson = await eventRes.json();
    console.log("Event test email status:", eventRes.status, eventJson.message);
    if (eventRes.status !== 200 || eventJson.status !== "success") {
      throw new Error(`Test 2 Failed: Expected 200, got ${eventRes.status}: ${JSON.stringify(eventJson)}`);
    }
    console.log("✓ Test 2 Passed: EVENT_REGISTRATION_CONFIRMED endpoint works.");

    // 3. Test Invalid Type Validation
    console.log("\n[Test 3] Testing Invalid Email Type Validation...");
    const invalidRes = await fetch(`${baseUrl}/api/dev/test-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "INVALID_TYPE",
        recipientEmail: "sage.euphoria@sageuniversity.in",
      }),
    });
    console.log("Invalid type status:", invalidRes.status);
    if (invalidRes.status !== 400) {
      throw new Error(`Test 3 Failed: Expected 400 for invalid type, got ${invalidRes.status}`);
    }
    console.log("✓ Test 3 Passed: Invalid type is rejected with 400 Bad Request.");

    // 4. Test Invalid Email Validation
    console.log("\n[Test 4] Testing Invalid Email Validation...");
    const invalidEmailRes = await fetch(`${baseUrl}/api/dev/test-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "PASS_PURCHASE_CONFIRMED",
        recipientEmail: "not-an-email",
      }),
    });
    console.log("Invalid email status:", invalidEmailRes.status);
    if (invalidEmailRes.status !== 400) {
      throw new Error(`Test 4 Failed: Expected 400 for invalid email, got ${invalidEmailRes.status}`);
    }
    console.log("✓ Test 4 Passed: Invalid email rejected with 400 Bad Request.");

    // 5. Test Production Guard
    console.log("\n[Test 5] Testing NODE_ENV=production Guard...");
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const prodRes = await fetch(`${baseUrl}/api/dev/test-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "PASS_PURCHASE_CONFIRMED",
        recipientEmail: "sage.euphoria@sageuniversity.in",
      }),
    });
    process.env.NODE_ENV = originalEnv;
    console.log("Production guard status code:", prodRes.status);
    if (prodRes.status !== 403 && prodRes.status !== 404) {
      throw new Error(`Test 5 Failed: Expected 403 or 404 in production, got ${prodRes.status}`);
    }
    console.log("✓ Test 5 Passed: Development endpoint is strictly blocked when NODE_ENV === production.");

    console.log("\n==================================================");
    console.log("🎉 ALL PHASE 3 VERIFICATION TESTS PASSED!");
    console.log("==================================================\n");
  } finally {
    server.close();
  }
}

runPhase3Verification().catch((err) => {
  console.error("Phase 3 Verification Failed:", err);
  process.exit(1);
});
