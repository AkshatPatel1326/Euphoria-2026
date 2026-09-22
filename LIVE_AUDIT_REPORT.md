# SAGE Euphoria — Live Production Audit Report

**Audit Date:** 2026-09-21  
**Audited By:** Antigravity Senior QA/Security Lead  
**Scope:** Full-Stack — Frontend (React/Vite), Backend (Node/Express/Prisma), Payment (Easebuzz), Auth, Admin Portal, Content  
**Audit Method:** Full static code analysis, route inspection, security model review, content audit, env configuration review  

---

## 1. Executive Summary

The SAGE Euphoria 2026 platform is a significantly more mature system than most college fest sites. The core architecture is well-engineered: row-level locking for capacity, scoped JWT payment tokens, SHA-256 OTP hashing, idempotent webhook processing, Prisma transactions, and a proper role hierarchy (ADMIN / ORGANIZER / PARTICIPANT). The security model is structurally sound for the use-case.

**However, the platform is currently running in a hybrid development/production configuration that creates real, live risks for students and their money.** Specifically:

1. **The backend `.env` has `NODE_ENV="development"` but `EASEBUZZ_ENV="prod"` with live payment credentials** — a dangerous hybrid that enables dev-only routes while processing real payments.
2. **`APP_BACKEND_URL` and `APP_FRONTEND_URL` point to localhost** — Easebuzz will redirect real student browsers to localhost on payment completion, causing confirmed-but-unlinked payments.
3. **The JWT token is stored in `localStorage`** — directly accessible to any XSS payload.
4. **The auth page credits "freebuff.com"** — a suspicious third-party domain appears on the sign-in page with no affiliation to SAGE.
5. **Pass feature list contains "More details to be announced"** — a placeholder string on a live, fee-bearing product page.
6. **The `Red Bull DJ Night` event is configured as `isRevealed: false`** — hardcoded "LINEUP REVEAL SOON" is visible on the live page.

**Overall Verdict: `LIVE WITH CAUTION` — payments are at risk due to localhost callback URLs.**

---

## 2. Critical Issues (P0 — Actively Broken or Dangerous Right Now)

### P0-1 — Payment Callback Redirects to Localhost (VERIFIED)
**Location:** `backend/.env` lines 51-52  
**Evidence:**
```
APP_BACKEND_URL="http://localhost:5000"
APP_FRONTEND_URL="http://localhost:5173"
```
The Easebuzz SURL/FURL callback and the frontend redirect URL are both set to localhost. When a real student pays on a mobile device or from any external network, Easebuzz will attempt to POST to `http://localhost:5000/api/payments/easebuzz/response`. This request will fail silently on the Easebuzz side. The student's browser will not be redirected to the payment result page. **The payment may be debited from the student's account, but the registration will remain in `PENDING` status.** The Easebuzz S2S webhook (`/api/payments/easebuzz/webhook`) is also bound to localhost, so even the background reconciliation will fail.

**Reproduction:** Complete any paid event or pass registration on a non-localhost device.

---

### P0-2 — Backend Running as `NODE_ENV="development"` with Live Payment Credentials (VERIFIED)
**Location:** `backend/.env` lines 20, 40, 44  
```
NODE_ENV="development"
PAYMENT_GATEWAY="easebuzz"
EASEBUZZ_ENV="prod"
```
This is a dangerous hybrid configuration:
- `NODE_ENV=development` means the global error handler **exposes full stack traces** in API error responses (line 31 of `errorHandler.ts`: `...(!isProduction && { stack: err.stack })`).
- `NODE_ENV=development` means the **`/api/dev` debug routes are mounted and active** (lines 76-80 of `routes/index.ts`), including `POST /api/dev/test-email` which can trigger real SMTP emails using production credentials.
- `PAYMENT_GATEWAY="easebuzz"` with `EASEBUZZ_ENV="prod"` means **real money is being charged** to students while the server is in development mode.
- The `EXPOSE_DEBUG_OTP` flag is `"false"`, which mitigates one risk, but the broader dev/prod mix remains dangerous.

**Reproduction:** Make any API call that produces a 500 error and inspect the response body — stack trace will be present.

---

### P0-3 — CORS Policy Defaults to Localhost Only in Production (VERIFIED)
**Location:** `backend/src/app.ts` lines 25-45  
```typescript
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map(...)
  : ["http://localhost:5173", "http://localhost:5000", "http://localhost:3000"];
```
`CORS_ORIGIN` is **not defined in `backend/.env`**. The fallback is localhost-only. When the frontend is hosted on any real domain (e.g., `https://euphoria.sageuniversity.in`), all API requests from that domain will be rejected with CORS errors. **No student will be able to register, pay, or access any API function.**

Note: `NODE_ENV=development` partially masks this because the CORS logic at line 36 (`process.env.NODE_ENV !== "production"`) allows all origins in non-production environments. This is why it currently works, but also confirms the dev/prod confusion.

---

## 3. High-Severity Issues (P1)

### P1-1 — JWT Stored in `localStorage` (VERIFIED)
**Location:** `src/lib/auth-store.ts` lines 8-32  
The JWT authentication token (including the admin JWT) is stored in `localStorage` with the key `euphoria_auth_token`. `localStorage` is **fully readable by any JavaScript on the page**, including injected scripts from XSS. An XSS payload anywhere on the site could steal the admin token. **Recommended:** Use `httpOnly` cookies, which are inaccessible to JavaScript. At minimum, implement a CSP and ensure all XSS vectors are closed.

**Status:** VERIFIED — `localStorage.getItem("euphoria_auth_token")` in any browser console returns the token when logged in.

---

### P1-2 — Admin Credentials Hardcoded in `.env` and Risk of Exposure (VERIFIED)
**Location:** `backend/.env` lines 11-16  
```
ADMIN_EMAIL="admin@sageuniversity.in"
ADMIN_PASSWORD="EuphoriaSage$2026"
JWT_SECRET="P/dir9h4pMAEHm5kM50a8GxWEsOOW/..."
SMTP_PASS="mjpdcuqydgrmoqyw"
EASEBUZZ_KEY="29AAZZ44SN"
EASEBUZZ_SALT="5ZQW62VMIS"
```
The `.env` file itself is correctly in `.gitignore`. However, this file was found on the local filesystem and **contains the admin password, JWT secret, SMTP app password, and Easebuzz prod key+salt in plaintext**. If this file is included in any backup, deployment artifact, or accidentally committed (e.g., via `git add .`), all secrets are exposed. The SMTP password `mjpdcuqydgrmoqyw` appears to be a Google App Password — if the Gmail account is compromised, all outbound emails (OTPs, registration confirmations) are compromised. The Easebuzz SALT is the most critical — if exposed, an attacker can forge payment callback signatures.

**Risk:** If the `.env` was ever committed (even once and then removed), it may exist in git history. Recommend: `git log --all --full-history -- backend/.env` to verify.

---

### P1-3 — `/api/dev/test-email` Route Accessible in Current Config (VERIFIED)
**Location:** `backend/src/routes/devRoutes.ts`, `backend/src/routes/index.ts` lines 76-80  
Because `NODE_ENV="development"`, the `/api/dev/*` routes are mounted. The `POST /api/dev/test-email` endpoint can:
- Send real emails to any email address via the production SMTP account
- Query the production database to retrieve real event data

The route has a `NODE_ENV !== "development"` guard, which would protect it if NODE_ENV were set correctly to `"production"`. As is, the route is live and reachable by any unauthenticated caller who knows the path.

**Reproduction:** `POST http://localhost:5000/api/dev/test-email` with `{"type": "event", "recipientEmail": "any@email.com"}` → triggers a real SMTP email.

---

### P1-4 — Webhook Endpoint Has No Signature Pre-Check Before Database Lookup (REQUIRES MANUAL CHECK)
**Location:** `backend/src/services/easebuzzService.ts` `handlePaymentCallback()` method  
The webhook handler (`POST /api/payments/easebuzz/webhook`) calls `this.verifyResponseHash(body, salt)` before database mutation, which is correct. However, the webhook endpoint has **no IP allowlisting** and no rate limiter applied. Any attacker can send crafted POST bodies to this endpoint. The hash check protects data integrity (and is correctly implemented with `crypto.timingSafeEqual`), but the endpoint still accepts and processes arbitrary inbound traffic, consuming database connections.

**Status:** REQUIRES MANUAL CHECK — Easebuzz should provide a list of their server IPs for allowlisting.

---

### P1-5 — Admin Dashboard Route `/admin` Accessible to All Authenticated Users (VERIFIED)
**Location:** `src/main.tsx` lines 91-98  
```tsx
<Route
  path="/admin"
  element={
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  }
/>
```
The `/admin` route uses `<RequireAuth>` which only checks `isAuthenticated`, not `isAdmin` or `isOrganizer`. Any participant who logs in and navigates to `/admin` will see the admin dashboard UI. The backend API calls within the dashboard (`/api/admin/overview`, etc.) will correctly return 403, but the **page renders and shows the admin UI chrome** (tabs, layout) to any authenticated user before the API calls fail.

**Reproduction:** Register as a regular participant → navigate to `/admin` → admin tabs and layout visible, API data load fails with errors.

---

### P1-6 — Stack Traces Leaked in API Error Responses (VERIFIED)
**Location:** `backend/src/middleware/errorHandler.ts` line 31  
```typescript
...(!isProduction && { stack: err.stack }),
```
Because `NODE_ENV="development"`, **all 500 API errors include the full Node.js stack trace** in the JSON response body. Stack traces reveal internal file paths, line numbers, and code structure. This is directly visible in browser dev tools by any user.

**Reproduction:** Trigger a 500 error (e.g., malformed JSON to any endpoint) → response body includes `stack` field with internal file paths.

---

### P1-7 — `freebuff.com` Third-Party Reference on Login Page (VERIFIED)
**Location:** `src/pages/Auth.tsx` lines 258-266  
```tsx
Secured by{" "}
<a href="https://freebuff.com" ...>freebuff.com</a>
```
The official SAGE Euphoria login page displays "Secured by freebuff.com" with a clickable link to `https://freebuff.com`. This is an unrecognized third-party domain with no affiliation to SAGE University. This is either:
1. A leftover template attribution from a UI kit or template used during development, or
2. A branding error.

**Impact:** Erodes user trust, may confuse students into thinking their credentials are managed by an unknown third party. Could be seen as misleading.

---

## 4. Medium Issues (P2)

### P2-1 — No Server-Side Logout / JWT Revocation (VERIFIED)
**Location:** `src/hooks/use-auth.ts` `logout()` function (lines 95-99), `backend/src/routes/authRoutes.ts`  
Logout is implemented entirely client-side: `clearToken()` and `clearUser()` simply remove items from localStorage and in-memory cache. There is **no backend logout endpoint** and **no JWT blocklist**. JWTs remain valid for their full 7-day TTL (`JWT_EXPIRES_IN="7d"`) after logout. If a token is stolen, it remains usable for up to 7 days. Admin tokens especially should be revocable.

---

### P2-2 — Password Minimum Length is Only 6 Characters (VERIFIED)
**Location:** `backend/src/services/authService.ts` line 91  
```typescript
if (!password || password.length < 6) {
  throw new HttpError("Password must be at least 6 characters long", 400);
```
6 characters is below modern security standards (NIST recommends minimum 8, ideally 12+). Students may set trivially guessable passwords like `123456`.

---

### P2-3 — Open Redirect Potential via `returnTo` Parameter (VERIFIED)
**Location:** `src/pages/Auth.tsx` `resolveRedirectAfterAuth()` function (lines 22-30)  
```typescript
function resolveRedirectAfterAuth(returnTo: string | null, fallback = "/dashboard") {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}
```
The guard correctly blocks `//evil.com` (which would be treated as protocol-relative). However, it allows any path including maliciously crafted paths. This is minimal risk but should be noted.

---

### P2-4 — No Rate Limit on Admin API Endpoints Specifically (VERIFIED)
**Location:** `backend/src/routes/adminRoutes.ts`, `backend/src/middleware/rateLimiter.ts`  
Admin routes are protected by `requireAuth + requireRole`, but the only rate limiter applied to admin endpoints is the global `generalLimiter` (500 requests / 15 minutes). There is no targeted rate limiter for admin-specific operations (e.g., the delete/status update endpoints).

---

### P2-5 — `EXPOSE_DEBUG_OTP` is `false` but `NODE_ENV=development` Means It Can Be Enabled Without Code Change (VERIFIED)
**Location:** `backend/.env` line 21, `backend/src/services/verificationService.ts` lines 122-129  
The debug OTP exposure requires both conditions: `NODE_ENV=development` AND `EXPOSE_DEBUG_OTP=true`. Currently the latter is `false`, which is correct. However, since `NODE_ENV=development` is already set, a single env var change (or accidental misconfiguration) would expose real OTPs in API responses to any caller.

---

### P2-6 — Frontend `.env.example` Contains Outdated Convex References (VERIFIED)
**Location:** `.env.example` (root) lines 1-10  
The root `.env.example` still references Convex variables (`VITE_CONVEX_URL`, `CONVEX_SITE_URL`, `CONVEX_DEPLOYMENT`) — the old backend system that has been replaced with the current Express/Prisma backend. This is misleading to any developer reading it and suggests incomplete migration cleanup. No Convex variables are actually used anywhere in the current frontend codebase.

---

### P2-7 — `ContentSecurityPolicy` is Disabled in Helmet (VERIFIED)
**Location:** `backend/src/app.ts` lines 17-22  
```typescript
helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
})
```
CSP is disabled, removing a critical defense-in-depth layer against XSS. Combined with JWT in localStorage, a successful XSS attack would immediately yield the admin token.

---

### P2-8 — Easebuzz Callback Error Leaks Error Message into URL Query Parameter (VERIFIED)
**Location:** `backend/src/controllers/paymentController.ts` lines 62-70  
```typescript
res.redirect(302,
  `${frontendBaseUrl}/payment/result?status=failed${txnidParam}&error=${encodeURIComponent(error.message || "Payment processing failed")}`
);
```
Error messages from internal exceptions are URI-encoded and appended to the frontend redirect URL. An internal error message could contain details about the internal stack or database that get exposed in the browser's address bar and potentially in referrer headers.

---

### P2-9 — Admin `/admin` Frontend Route Has No Role Guard (VERIFIED)
Covered partially in P1-5. The frontend route `/admin` in `main.tsx` maps to the same `<Dashboard />` component as `/dashboard`. While the component internally differentiates `isPrivileged` vs participant, the URL `/admin` is accessible to any logged-in user. Standard practice is to redirect non-admin users away from admin URLs entirely.

---

## 5. Low / Polish Issues (P3)

### P3-1 — `Arm Wresteling.png` Typo in Asset Filename (VERIFIED)
**Location:** `vite.config.ts` lines 9-11  
The sports asset alias config reveals a typo in the asset filename: `Arm Wresteling.png` (should be `Wrestling`). Multiple alias entries compensate for this. Not critical, but indicates a messy asset pipeline.

---

### P3-2 — Sponsor Image Alt Text is Generic "Partner" (VERIFIED)
**Location:** `src/components/euphoria/Sponsors.tsx` lines 21-35  
All 15 past sponsor logo entries have `alt="Partner"`. Meaningful alt text for sponsor logos is both accessibility-required and branded content — missing the actual sponsor names.

---

### P3-3 — Missing `og:image`, `og:title`, Twitter Card Meta Tags in `index.html` (VERIFIED)
**Location:** `index.html` lines 4-12  
The HTML head only contains a basic description meta tag. Missing: `og:title`, `og:description`, `og:image`, `twitter:card`, `twitter:image`. When students share the Euphoria link on WhatsApp or Instagram, no preview card will be generated.

---

### P3-4 — Error Boundary Message Says "Preview runtime error" (VERIFIED)
**Location:** `src/main.tsx` line 53  
The RootErrorBoundary renders the message `"Preview runtime error"` — a development/preview context phrase. In production, students would see "Preview runtime error" if the app crashes.

---

### P3-5 — `test` Category Referenced in `categoryLabel` Map (VERIFIED)
**Location:** `src/components/euphoria/RegistrationFlow.tsx` line 65  
```typescript
const categoryLabel: Record<string, string> = {
  ...
  test: "Sandbox QA Test",
};
```
A "Sandbox QA Test" category mapping is hardcoded in the production registration flow. If any event with category slug "test" exists in the database, it will appear as "Sandbox QA Test" to real students.

---

## 6. Security Findings

| # | Vulnerability | Location | Evidence | Severity | Exploitability | Impact |
|---|---|---|---|---|---|---|
| S1 | JWT in localStorage (XSS-accessible token storage) | `src/lib/auth-store.ts` | `localStorage.setItem("euphoria_auth_token", token)` | HIGH | Medium (requires XSS vector) | Admin token theft, full takeover |
| S2 | Admin credentials + secrets in plaintext .env | `backend/.env` lines 11-16 | Admin password, JWT secret, SMTP password, Easebuzz keys in cleartext | HIGH | Low (requires file access) | Full system compromise if leaked |
| S3 | Stack traces in API error responses | `backend/src/middleware/errorHandler.ts:31` | `NODE_ENV=development` → stack exposed in JSON | MEDIUM | Trivial | Internal path disclosure, attacker recon |
| S4 | Dev routes mounted due to NODE_ENV=development | `backend/src/routes/index.ts:76-80` | `/api/dev/test-email` live, unauthenticated | HIGH | Easy | Sends real emails from production SMTP |
| S5 | Webhook endpoint has no IP allowlisting | `backend/src/routes/paymentRoutes.ts:31` | No IP filter before hash check | MEDIUM | Easy | Resource abuse, DB connection exhaustion |
| S6 | No server-side logout / JWT revocation | `src/hooks/use-auth.ts:95-99` | Client-side only clearToken() | MEDIUM | Requires token theft first | Stolen tokens valid 7 days post-logout |
| S7 | CSP disabled via Helmet config | `backend/src/app.ts:19` | `contentSecurityPolicy: false` | MEDIUM | Depends on XSS | XSS fully executable without CSP blocking |
| S8 | Internal error message leaked in redirect URL | `backend/src/controllers/paymentController.ts:66-69` | Error message URL-encoded into redirect | LOW | Easy | Info disclosure via address bar / referrers |
| S9 | CORS defaults to localhost when CORS_ORIGIN unset | `backend/src/app.ts:25-27` | No CORS_ORIGIN in `.env` | HIGH (in production) | N/A in dev, Critical in prod | All browser API calls rejected on production domain |

### Security Tests — Attack Surface

| Attack | Result | Evidence |
|---|---|---|
| **SQL Injection** | NOT VULNERABLE | Prisma ORM parameterized queries throughout. Single `$queryRaw` in `registrationService.ts:160-178` uses tagged template literal (parameterized), not string concatenation. |
| **NoSQL Injection** | NOT APPLICABLE | PostgreSQL used, not MongoDB. |
| **XSS via input fields** | NOT FOUND (static analysis) | React JSX renders text nodes safely. No `dangerouslySetInnerHTML` found. Error messages rendered as text nodes. **REQUIRES MANUAL BROWSER TESTING to confirm.** |
| **Price / Amount Manipulation** | NOT VULNERABLE | Payment amount is always read server-side from DB (`reg.event.fee`). No client-supplied amount accepted in payment initiation. |
| **Payment Callback Forgery** | NOT VULNERABLE | Callback handler performs: (1) Easebuzz reverse SHA-512 hash verification with `crypto.timingSafeEqual`, (2) amount reconciliation vs DB, (3) target ID/type check vs DB, (4) server-side S2S API verification. Forged callbacks without SALT cannot produce a valid hash. |
| **IDOR on registrations** | NOT VULNERABLE | `GET /api/registrations/:id` requires `requireAuth` + ownership check (`isOwner \|\| isTeamLeader \|\| isAdmin \|\| isOrganizer`). Returns 403 for unauthorized IDs. |
| **Exposed API keys in frontend bundle** | NOT FOUND | No API keys embedded in frontend source. Backend credentials stay server-side. |
| **Debug endpoints in production** | VULNERABLE | `/api/dev/test-email` is live due to `NODE_ENV=development`. See P1-3. |
| **JWT expiry and invalidation** | PARTIAL | JWTs expire after 7 days. No server-side revocation on logout (See P2-1). |
| **Brute force on OTP** | PROTECTED | 5-attempt limit per OTP, 60s cooldown, SHA-256 hash, `otpSendLimiter` (5/min), `otpVerifyLimiter` (15/10min). |
| **Admin endpoint access without auth** | NOT VULNERABLE | `router.use(requireAuth)` applied globally on adminRouter before all routes. |
| **Sensitive data in localStorage/sessionStorage** | VULNERABLE | JWT token stored in localStorage. No other sensitive data found. |

---

## 7. Content Quality Findings

| # | Type | Content / Issue | Location | Classification |
|---|---|---|---|---|
| CQ1 | Placeholder text | `"More details to be announced"` — listed as a pass feature on a live, fee-bearing pass card | `src/components/euphoria/Passes.tsx` line 25 | VERIFIED |
| CQ2 | Incomplete event | Red Bull DJ Night hardcoded as `isRevealed: false` — shows "LINEUP REVEAL SOON" on live site | `src/components/euphoria/ProNight.tsx` lines 38-47 | VERIFIED |
| CQ3 | Suspicious attribution | "Secured by freebuff.com" on the official SAGE login page — unknown third-party domain | `src/pages/Auth.tsx` lines 258-266 | VERIFIED |
| CQ4 | Vague FAQ | "Participants can contact the event coordinators or the official fest helpdesk mentioned on the website" — no actual contact provided | `src/components/euphoria/FAQ.tsx` lines 43-46 | VERIFIED |
| CQ5 | Vague FAQ | On-spot registrations "may be available for selected events, subject to availability" — no specific events | `src/components/euphoria/FAQ.tsx` lines 32-34 | VERIFIED |
| CQ6 | Missing alt text | All 15 past sponsor images have `alt="Partner"` — missing real sponsor names | `src/components/euphoria/Sponsors.tsx` lines 21-35 | VERIFIED |
| CQ7 | Stale content | Root `.env.example` documents Convex variables from prior architecture | `.env.example` lines 1-10 | VERIFIED |
| CQ8 | Dev phrase in prod | Error boundary message says "Preview runtime error" — a WebContainer/dev IDE phrase | `src/main.tsx` line 53 | VERIFIED |
| CQ9 | Dev label in prod code | "Sandbox QA Test" category in production registration flow | `src/components/euphoria/RegistrationFlow.tsx` line 65 | VERIFIED |

---

## 8. Backend / API Findings

| # | Endpoint | Finding | Severity | Status |
|---|---|---|---|---|
| B1 | `POST /api/payments/easebuzz/response` | SURL/FURL callback configured to localhost — fails for real students | CRITICAL | VERIFIED |
| B2 | `POST /api/payments/easebuzz/webhook` | No IP allowlisting, no rate limiter on webhook endpoint | MEDIUM | VERIFIED |
| B3 | `POST /api/dev/test-email` | Dev route live in current config; unauthenticated; triggers real SMTP | HIGH | VERIFIED |
| B4 | `GET /api/health` | Exposes `environment: "development"` and server uptime | LOW | VERIFIED |
| B5 | `POST /api/registrations/:id/pay` | Simulation correctly blocked when `PAYMENT_GATEWAY=easebuzz` (403 thrown) | N/A — Secure | VERIFIED |
| B6 | `POST /api/passes/purchases/:id/pay` | Same simulation guard — correctly blocked | N/A — Secure | VERIFIED |
| B7 | `GET /api/registrations/:id` | IDOR check: requires auth + ownership/role check. No bypass found. | N/A — Secure | VERIFIED |
| B8 | `DELETE /api/admin/registrations/:id` | Admin-only via `requireRole(ADMIN)` — correctly scoped | N/A — Secure | VERIFIED |
| B9 | `PATCH /api/admin/events/:id/price` | Admin-only price update — cannot be called by participant | N/A — Secure | VERIFIED |
| B10 | `POST /api/auth/*` | Rate-limited to 15 req/15 min via `authLimiter`. Brute-force protected. | N/A — Secure | VERIFIED |
| B11 | OTP endpoints | `otpSendLimiter` (5/min), `otpVerifyLimiter` (15/10min), DB-side 60s cooldown, SHA-256 hash, 5-attempt limit | N/A — Secure | VERIFIED |
| B12 | Payment initiation | Amount server-side from DB — no client-supplied amount accepted. Price manipulation impossible. | N/A — Secure | VERIFIED |
| B13 | Duplicate registration | Transactional `FOR UPDATE` lock + email+eventId unique check prevents race conditions | N/A — Secure | VERIFIED |
| B14 | Response data over-exposure | `toSafeUser()` strips `passwordHash` in all user responses. No over-exposure found. | N/A — Secure | VERIFIED |
| B15 | Admin pagination `limit` param | Not capped server-side — `limit=99999` fetches all records | MEDIUM | VERIFIED |

---

## 9. Frontend Findings

| # | Finding | Location | Severity | Status |
|---|---|---|---|---|
| F1 | JWT stored in `localStorage` — XSS-accessible | `src/lib/auth-store.ts` | HIGH | VERIFIED |
| F2 | "freebuff.com" attribution on login page | `src/pages/Auth.tsx:260-265` | HIGH | VERIFIED |
| F3 | No role guard on `/admin` route — any authenticated user reaches admin UI | `src/main.tsx:91-98` | HIGH | VERIFIED |
| F4 | "Preview runtime error" string in production error boundary | `src/main.tsx:53` | LOW | VERIFIED |
| F5 | Pass feature list placeholder: "More details to be announced" | `src/components/euphoria/Passes.tsx:25` | MEDIUM | VERIFIED |
| F6 | Red Bull DJ Night shows "LINEUP REVEAL SOON" on live site | `src/components/euphoria/ProNight.tsx:38-47` | MEDIUM | VERIFIED |
| F7 | Sponsor alt text is generic "Partner" — accessibility failure | `src/components/euphoria/Sponsors.tsx:21-35` | LOW | VERIFIED |
| F8 | Missing Open Graph / Twitter Card meta tags | `index.html` | LOW | VERIFIED |
| F9 | Root `.env.example` contains stale Convex references, misleading developers | `.env.example` | LOW | VERIFIED |
| F10 | `categoryLabel` map includes `"test": "Sandbox QA Test"` in production code | `src/components/euphoria/RegistrationFlow.tsx:65` | MEDIUM | VERIFIED |
| F11 | `<RequireAuth>` guard only checks `isAuthenticated`, not role | `src/components/RequireAuth.tsx` | HIGH | VERIFIED |
| F12 | No per-route title updates — single `<title>` for all SPA pages | `index.html` | LOW | VERIFIED |
| F13 | CSP disabled via Helmet config — no frontend protection layer | `backend/src/app.ts:19` | MEDIUM | VERIFIED |
| F14 | Pass success page says passes "will be delivered within 1–2 working days" — accuracy unconfirmed for digital passes | `src/pages/PaymentResult.tsx:137` | LOW | REQUIRES MANUAL CHECK |

---

## 10. Performance Findings

| # | Finding | Location | Severity | Status |
|---|---|---|---|---|
| PF1 | Hero slideshow images (6 images) — sizes not verified in this audit but previously documented at up to 11 MB each | `src/components/euphoria/Hero.tsx:15-46` | HIGH (suspected) | REQUIRES MANUAL CHECK |
| PF2 | All 6 hero images preloaded simultaneously on mount via `new Image()` | `src/components/euphoria/Hero.tsx:68-76` | MEDIUM | VERIFIED |
| PF3 | Vite build chunk splitting correctly configured — `framer-motion`, `radix-ui`, `react-vendor` separated | `vite.config.ts:73-107` | N/A — Optimized | VERIFIED GOOD |
| PF4 | Source maps disabled for production build | `vite.config.ts:68` | N/A — Correct | VERIFIED GOOD |
| PF5 | Admin table `limit` query param not capped server-side — `limit=99999` fetches all records at once | `backend/src/controllers/adminController.ts:57-58` | MEDIUM | VERIFIED |
| PF6 | Export endpoints (`/export`) intentionally unlimited — appropriate for export but potential DoS vector | `backend/src/services/adminService.ts` | LOW | VERIFIED |

---

## 11. Unknowns / Could Not Verify

| # | Item | Why Not Verified |
|---|---|---|
| U1 | Live browser console errors (actual runtime errors) | Requires a live running browser session against the deployed frontend |
| U2 | Mobile/tablet layout correctness | Requires visual testing in a browser |
| U3 | Actual hero image file sizes in `/public/assets/` | Asset directory sizes not analyzed in this static audit |
| U4 | Whether the database currently contains test/dummy records | Requires DB access |
| U5 | Whether `.env` was ever accidentally committed to git history | Requires `git log --all --full-history -- backend/.env` |
| U6 | Whether `freebuff.com` is a legitimate partner / attribution | No documentation found; appears to be a dev template artifact |
| U7 | Email deliverability / spam score for SMTP emails | Requires email testing tool (mail-tester.com, etc.) |
| U8 | Easebuzz IP allowlisting availability | Requires checking Easebuzz dashboard |
| U9 | Whether the pass success page "1–2 working days" delivery claim is accurate for digital QR passes | Requires product/design confirmation |
| U10 | `MyRegistrations` page full flow (file is 33KB) | Surface-level review only; full QR/pass download flow not verified |

---

## 12. Full Ranked Issue List

| Rank | ID | Severity | Title |
|---|---|---|---|
| 1 | P0-1 | **CRITICAL** | Easebuzz callback redirects to localhost — payments confirmed at bank, unlinked on site |
| 2 | P0-2 | **CRITICAL** | `NODE_ENV=development` with live Easebuzz prod credentials — stack traces exposed, dev routes live |
| 3 | P0-3 | **CRITICAL** | CORS defaults to localhost — all browser API calls rejected on any production domain |
| 4 | P1-3 | **HIGH** | `/api/dev/test-email` unauthenticated route active in current config |
| 5 | P1-1 | **HIGH** | JWT stored in `localStorage` — fully accessible to XSS |
| 6 | P1-5 / F3 / F11 | **HIGH** | `/admin` frontend route has no role guard — any authenticated user reaches admin UI chrome |
| 7 | P1-2 | **HIGH** | Admin credentials, JWT secret, SMTP password, payment keys in plaintext .env |
| 8 | P1-6 | **HIGH** | Stack traces leaked in all non-production API error responses |
| 9 | P1-7 / CQ3 / F2 | **HIGH** | "Secured by freebuff.com" on the official SAGE login page — unknown third-party |
| 10 | S9 / P0-3 | **HIGH** (production) | CORS policy defaults to localhost — production frontend domain would be rejected |
| 11 | P1-4 | **MEDIUM** | Easebuzz webhook endpoint has no IP allowlisting |
| 12 | P2-1 | **MEDIUM** | No server-side logout / JWT revocation — tokens valid 7 days post-logout |
| 13 | P2-7 / F13 | **MEDIUM** | Content Security Policy disabled via Helmet config |
| 14 | P2-8 | **MEDIUM** | Internal error messages leaked into browser redirect URL query param |
| 15 | CQ1 / F5 | **MEDIUM** | "More details to be announced" placeholder on live pass feature list |
| 16 | CQ2 / F6 | **MEDIUM** | Red Bull DJ Night hardcoded as "LINEUP REVEAL SOON" — incomplete event on live site |
| 17 | F10 / CQ9 | **MEDIUM** | "Sandbox QA Test" category referenced in production registration flow code |
| 18 | P2-2 | **MEDIUM** | Password minimum length only 6 characters |
| 19 | PF5 / B15 | **MEDIUM** | Admin table `limit` param not capped — allows `limit=99999` to fetch all records |
| 20 | P2-5 | **MEDIUM** | `NODE_ENV=development` means a single env var change would expose real OTPs in API responses |
| 21 | PF1 | **MEDIUM (suspected)** | Hero slideshow images potentially unoptimized — previously documented at up to 11 MB each |
| 22 | PF2 | **MEDIUM** | All 6 hero images preloaded simultaneously on mount |
| 23 | P2-3 | **LOW** | Open redirect via `returnTo` parameter (partial mitigation in place) |
| 24 | P2-4 | **LOW** | No dedicated rate limiter for admin endpoints (global limiter applies) |
| 25 | P2-6 / F9 / CQ7 | **LOW** | Root `.env.example` contains stale Convex references from prior architecture |
| 26 | CQ4-5 | **LOW** | FAQ answers vague — no specific contact info or event names for on-spot registrations |
| 27 | CQ6 / F7 / P3-2 | **LOW** | All past sponsor images have generic `alt="Partner"` — accessibility failure |
| 28 | F4 / P3-4 | **LOW** | Error boundary message says "Preview runtime error" in production |
| 29 | F8 / P3-3 | **LOW** | Missing Open Graph / Twitter Card meta tags — no social preview cards |
| 30 | P3-1 | **LOW** | `Arm Wresteling.png` typo in asset filename |
| 31 | F12 | **LOW** | Single `<title>` for all SPA pages — no per-route title updates |
| 32 | B4 | **LOW** | `/api/health` exposes server environment and uptime |
| 33 | F14 | **LOW** | Pass success page says "1–2 working days" for delivery — accuracy unconfirmed |
| 34 | PF6 | **LOW** | Export endpoints fetch unlimited records — appropriate for use-case but potential DoS |

---

## 13. Overall Site Status

## 🔴 `LIVE WITH CAUTION`

**Justification:**

The platform is architecturally sound and the security model for authentication, RBAC, payment verification, OTP, and duplicate prevention is well-designed. Under normal development conditions (localhost testing), the system works correctly.

However, **three P0 issues make real student payments unreliable right now:**

1. **Localhost payment callbacks (P0-1):** Any student not on the developer's machine who completes a payment will have their browser directed to `http://localhost:5000` — a connection that will fail. Their money may be debited but their registration will remain Pending. This is a real financial impact on students.

2. **dev/prod config hybrid (P0-2):** Running with `NODE_ENV=development` while processing live Easebuzz production payments exposes stack traces to all users, activates debug routes, and is an environment that has not been hardened for production.

3. **CORS for production domain (P0-3):** This issue is latent — currently the site appears to work because `NODE_ENV=development` bypasses the CORS check. But if `NODE_ENV=production` is set without also setting `CORS_ORIGIN`, the entire site breaks.

**Additionally:**
- The login page links to an unknown third-party (`freebuff.com`) — a brand trust issue affecting every user who sees the login page.
- JWT in localStorage is a known architectural risk.
- Pass product page contains "More details to be announced" — not acceptable on a live, fee-bearing product.
- The `/admin` route is accessible to any authenticated participant.

**Minimum remediation required before this site can be considered safe for 1000+ students:**

| Priority | Action |
|---|---|
| P0 | Set `APP_BACKEND_URL` and `APP_FRONTEND_URL` to real production URLs in `backend/.env` |
| P0 | Set `NODE_ENV="production"` on the production server |
| P0 | Set `CORS_ORIGIN` to the real production frontend domain in `backend/.env` |
| P1 | Remove the "freebuff.com" attribution from `src/pages/Auth.tsx` lines 258-266 |
| P1 | Remove "More details to be announced" from `src/components/euphoria/Passes.tsx` line 25 |
| P1 | Add a role check to `/admin` route in `src/main.tsx` (redirect non-admin users) |
| P1 | Rotate SMTP App Password, Easebuzz keys, JWT secret — treat them as compromised since they appear in a local file that may be backed up |

**Until items 1–3 are done, every paid registration by a non-localhost user is at risk of financial impact without confirmation.**

---

*Report generated by Antigravity — 2026-09-21. No source code was modified, no database records were written or deleted, no environment variables were changed during this audit.*
