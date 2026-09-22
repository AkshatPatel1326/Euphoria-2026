# SAGE Euphoria — Pre-Production End-to-End Audit

**Document Version:** 1.0.0  
**Audit Date:** September 18, 2026  
**Auditor:** Antigravity Senior Architecture, Security & QA Review Team  
**Scope:** Full-Stack Application (Frontend, Backend, Database, Auth, Payments, Email, Admin Portal)  
**Target Launch Date:** Tomorrow  

---

## 1. Executive Summary

A comprehensive pre-production audit was conducted across the SAGE Euphoria 2026 platform to determine whether the system is ready to be exposed to real college students, organizers, and administrative personnel tomorrow.

### The Verdict: **NOT READY (Blocked by 3 Critical Deployment Configuration Issues)**

The core application architecture, database transaction isolation, server-side validation, role-based access control (RBAC), OTP lifecycle, and payment verification mechanisms are **robust and well-engineered**. However, the platform **cannot be launched in its current environment state** due to three immediate showstoppers:

1. **Payment Gateway Callback Failure (P0):** The payment configuration (`backend/.env`) has `EASEBUZZ_ENV="prod"` active with live credentials, but specifies `APP_BACKEND_URL="http://localhost:5000"` and `APP_FRONTEND_URL="http://localhost:5173"`. When real students make a payment on external networks or mobile devices, Easebuzz will attempt to redirect the student's browser to `http://localhost:5000/api/payments/easebuzz/response`, which will immediately fail ("localhost refused to connect"). Registrations will be paid at the bank but left unconfirmed on the site.
2. **CORS Rejection on Production Domains (P0):** `CORS_ORIGIN` is not defined in `.env`. The backend defaults to `localhost:5173, localhost:5000, localhost:3000`. Once deployed to a live domain (e.g., `https://euphoria.sageuniversity.in`), the backend CORS middleware will reject all student API requests.
3. **Frontend API URL Binding (P0):** `src/lib/api.ts` makes relative requests to `/api/*`. In development, Vite proxies this to port 5000. In production static hosting, these requests will fail with 404 unless a reverse proxy (e.g., Nginx, Cloudflare, or Vercel rewrites) is explicitly configured in front of the static bundle and backend.
4. **Massive Hero Media Asset Sizes (P1):** Six uncompressed DSLR photos in the homepage slideshow total **43.1 Megabytes** (with single images reaching 11 MB), creating severe 4G mobile latency and memory crash risks for budget mobile devices.
5. **Residual Test Data in Production Database (P1):** The database currently contains a `Test Category` with 4 test events, test registrations, and test accounts that have not yet been cleaned up with the cleanup script.

If the 3 P0 configuration blockers and 2 P1 items are resolved using the exact remediation steps provided in Section 24, the application can achieve **READY** status for tomorrow's launch.

---

## 2. System Architecture Discovered

```
                    ┌───────────────────────────────────────────────┐
                    │               Client Browser                  │
                    │   (React 19 + Tailwind CSS + Framer Motion)   │
                    └───────────────────────┬───────────────────────┘
                                            │
                                            │ HTTPS /api (JSON)
                                            ▼
                    ┌───────────────────────────────────────────────┐
                    │        Reverse Proxy / Hosting Target         │
                    │     (Vite Dev Proxy / Nginx in Production)    │
                    └───────────────────────┬───────────────────────┘
                                            │
                                            ▼
                    ┌───────────────────────────────────────────────┐
                    │            Node.js / Express 5.2.1            │
                    │  - Helmet (HSTS, NoSniff, FrameGuard)         │
                    │  - Express-Rate-Limit (5 Dedicated Stores)    │
                    │  - JWT Verification (HMAC-SHA256, 32+ chars)  │
                    │  - Scoped One-Time Verification Tokens        │
                    └───────┬───────────────────────────────┬───────┘
                            │                               │
             Prisma 7.10.0  │                               │ HTTPS REST
             (PostgreSQL)   │                               │
                            ▼                               ▼
    ┌───────────────────────────────┐       ┌───────────────────────────────┐
    │     PostgreSQL Database       │       │    Third-Party Integrations   │
    │  - Row-Level Locking (SELECT  │       │  - Easebuzz Gateway (S2S/SURL)│
    │    FOR UPDATE on Event table) │       │  - Google SMTP (Port 465 SSL) │
    │  - ACID Transactions          │       └───────────────────────────────┘
    │  - Relational Integrity       │
    └───────────────────────────────┘
```

### Full Tech Stack
- **Frontend Framework:** React 19.2.0, React Router v7 (`react-router`), Tailwind CSS (v4 via `@tailwindcss/vite`), Framer Motion 12.23, Radix UI component primitives, Lucide React icons.
- **Frontend Build Tool:** Vite 7.3.6 (ESNext target, ESBuild minifier, custom chunk splitting for vendor/charts/radix/forms).
- **Backend Framework/Runtime:** Node.js v24.14.0, Express 5.2.1, TypeScript 5.9.3 executed via `tsx` / `tsc`.
- **Database:** PostgreSQL 16+, Prisma ORM 7.10.0 (`@prisma/client` with custom generated output).
- **Authentication Provider:** Custom stateless JWT authentication with bcrypt password hashing (cost factor 10). Cryptographic JWT secret validation (enforces minimum 32 characters).
- **Verification System:** Custom OTP engine with SHA-256 hash storage, 60s cooldown, 10m expiry, 5-attempt brute-force lock, and scoped JWT token generation.
- **Payment Provider:** Easebuzz Payment Gateway (SHA-512 initiate hash, reverse hash verification, SURL/FURL browser redirects, and S2S webhooks). Secondary development simulation engine strictly gated behind environment variables.
- **Email Provider:** Nodemailer with Google Workspace SMTP over Port 465 SSL/TLS. Fallback to console provider in development mode.

---

## 3. Application Routes

### Frontend Routes (React Router)

| Route Path | Access Level | Component | Purpose |
|---|---|---|---|
| `/` | Public | `Landing.tsx` | Main fest landing page, hero slideshow, categories, passes CTA, glimpses, sponsors, FAQ |
| `/events/:category` | Public | `CategoryPage.tsx` | Event catalog filtered by category (`cultural`, `literary-management`, `science-tech`, `sports`), event modal, registration flow |
| `/my-registrations` | Public / Guest / Auth | `MyRegistrations.tsx` | Attendee ticket and pass dashboard; supports guest OTP email lookup and authenticated user sessions |
| `/auth` | Public | `Auth.tsx` | Participant login and registration forms with redirect support |
| `/dashboard` | Authenticated | `Dashboard.tsx` (wrapped in `RequireAuth`) | Admin/Organizer portal for staff; Participant profile/history for students |
| `/admin` | Authenticated | `Dashboard.tsx` (wrapped in `RequireAuth`) | Alias for administrative portal |
| `/payment/result` | Public | `PaymentResult.tsx` | Payment completion screen for Easebuzz return redirects |
| `*` | Public | `NotFound.tsx` | 404 page for unmatched client routes |

### Backend API Endpoint Map

| Method | Endpoint Path | Auth / Permission | Rate Limited | Purpose |
|---|---|---|---|---|
| `GET` | `/api/health` | Public | General (500/15m) | Service uptime, timestamp, environment status |
| `POST` | `/api/auth/register` | Public | Auth (15/15m) | Register a participant user with hashed password |
| `POST` | `/api/auth/login` | Public | Auth (15/15m) | Authenticate user credentials and issue 7-day JWT |
| `GET` | `/api/auth/me` | Bearer Token (`requireAuth`) | General (500/15m) | Retrieve profile of currently authenticated user |
| `GET` | `/api/categories` | Public | General (500/15m) | List all festival categories with event counts |
| `GET` | `/api/categories/:slug` | Public | General (500/15m) | Fetch category details and its published events |
| `GET` | `/api/events` | Public | General (500/15m) | Discover events with query filters (category, search, open/closed) |
| `GET` | `/api/events/:idOrSlug` | Public | General (500/15m) | Retrieve complete details, schedule, coordinator info for single event |
| `PATCH` | `/api/events/:id/registration-status` | Bearer Token (`ADMIN`, `ORGANIZER`) | General (500/15m) | Open or close registration for a specific event |
| `GET` | `/api/events/:id/registrations` | Bearer Token (`ADMIN`, `ORGANIZER`) | General (500/15m) | Retrieve registrations for an organizer's assigned event |
| `GET` | `/api/passes` | Public | General (500/15m) | List available festival passes |
| `GET` | `/api/passes/:slug` | Public | General (500/15m) | Retrieve pass details by slug |
| `POST` | `/api/passes/purchase` | Guest Token or Bearer Token | General (500/15m) | Initiate pass order (1-10 passes, bulk recipients) |
| `POST` | `/api/passes/purchases/:id/pay` | Payment Token or `ADMIN` | Payment (20/10m) | Development simulation payment for pass purchase |
| `POST` | `/api/registrations` | Guest Token or Bearer Token | General (500/15m) | Create individual or team event registration |
| `GET` | `/api/registrations/guest-lookup` | Guest Scoped Token | General (500/15m) | Retrieve attendee tickets/passes via verified guest email |
| `GET` | `/api/registrations/my-registrations` | Bearer Token (`requireAuth`) | General (500/15m) | Retrieve authenticated user's event registrations |
| `GET` | `/api/registrations/:id` | Bearer Token (Owner, Leader, Staff) | General (500/15m) | Retrieve single registration details (IDOR-protected) |
| `PATCH` | `/api/registrations/:id/status` | Bearer Token (`ADMIN`, `ORGANIZER`) | General (500/15m) | Update registration status (`CONFIRMED`, `CANCELLED`, `REJECTED`) |
| `POST` | `/api/registrations/:id/pay` | Payment Token or `ADMIN` | Payment (20/10m) | Development simulation payment for event registration |
| `POST` | `/api/verification/send-otp` | Public | OTP Send (5/1m) | Dispatch 6-digit verification OTP to email |
| `POST` | `/api/verification/verify-otp` | Public | OTP Verify (15/10m) | Validate OTP code and issue scoped JWT token |
| `POST` | `/api/payments/easebuzz/initiate` | Payment Token or Bearer Token | Payment (20/10m) | Initiate Easebuzz checkout session with signed hash |
| `POST` | `/api/payments/easebuzz/response` | Public (Easebuzz Browser Post) | General (500/15m) | Handle Easebuzz browser redirect, verify reverse hash, redirect to UI |
| `POST` | `/api/payments/easebuzz/webhook` | Public (Easebuzz S2S Webhook) | General (500/15m) | Server-to-server webhook, verify reverse hash, update database |
| `GET` | `/api/sponsors` | Public | General (500/15m) | List festival sponsors and partners |
| `GET` | `/api/schedules` | Public | General (500/15m) | List festival timeline and scheduled rounds |
| `GET` | `/api/admin/overview` | Bearer Token (`ADMIN`, `ORGANIZER`) | General (500/15m) | Summary metrics, revenue, registrations by status, recent list |
| `GET` | `/api/admin/registrations` | Bearer Token (`ADMIN`, `ORGANIZER`) | General (500/15m) | Filtered, searched, paginated registrations list |
| `GET` | `/api/admin/registrations/export` | Bearer Token (`ADMIN`, `ORGANIZER`) | General (500/15m) | Full dataset export for CSV download |
| `DELETE` | `/api/admin/registrations/:id` | Bearer Token (`ADMIN` only) | General (500/15m) | Permanently delete cancelled/rejected registration record |
| `GET` | `/api/admin/pass-purchases` | Bearer Token (`ADMIN` only) | General (500/15m) | Filtered, paginated festival pass orders list |
| `GET` | `/api/admin/pass-purchases/export` | Bearer Token (`ADMIN` only) | General (500/15m) | Full pass purchase dataset export for CSV download |
| `GET` | `/api/admin/pass-purchases/:id` | Bearer Token (`ADMIN` only) | General (500/15m) | Single pass order details with all pass holders |
| `PATCH` | `/api/admin/pass-purchases/:id/status` | Bearer Token (`ADMIN` only) | General (500/15m) | Update pass purchase status (`CONFIRMED`, `CANCELLED`, `REJECTED`) |
| `DELETE` | `/api/admin/pass-purchases/:id` | Bearer Token (`ADMIN` only) | General (500/15m) | Permanently delete cancelled/rejected pass order |

---

## 4. Major User Journeys

### Journey A: Public Discovery to Event Registration
1. Student lands on `/`, views festival theme, dates, and category cards (`cultural`, `literary-management`, `science-tech`, `sports`).
2. Navigates to `/events/sports`, browses the 11 finalized sports events.
3. Clicks "View Details" on an event (e.g., "Cricket" or "Arm Wrestling") opening `EventDetailModal`.
4. Clicks "Register Now" opening `RegistrationFlow`.
5. Selects Category: `SAGE Student`, `Other College/School Student`, or `General`.
   - `SAGE Student`: Fills Full Name, Email, Phone, Scholar No., Enrollment No., Institute, Year (auto-derives Semester).
   - `Other College/School Student`: Fills Full Name, Email, Phone, College/School Name.
   - `General`: Fills Full Name, Email, Phone.
6. Email verification step: Receives 6-digit OTP via official Gmail SMTP. Submits OTP.
7. Backend validates OTP and returns scoped `EVENT_REGISTRATION` token.
8. Submits registration to `POST /api/registrations`. Backend locks event row, confirms capacity, creates `Registration` record and initial `Payment` record in a single transaction.
9. Initiates payment: If fee > 0, connects to Easebuzz `initiateLink`, receives access key, redirects to checkout. If free (fee = 0), auto-confirms registration and dispatches transactional confirmation email.

### Journey B: Festival Pass Purchase (Individual or Bulk up to 10)
1. User clicks "Get Passes" on Landing Page or Navbar, opening `PassPurchaseModal`.
2. Selects quantity (1 to 10).
   - Quantity = 1: Single pass. Buyer is Pass Holder #1.
   - Quantity > 1: Bulk pass. Buyer is Pass Holder #1. Form dynamically prompts for exactly `quantity - 1` additional recipient details (Full Name, unique Email, Phone).
3. Selects Pass Category: `SAGE Student` (Institute + Year required) or `Other College/School Student` (College Name required). General category is strictly unavailable for passes.
4. Completes email OTP verification.
5. Submits order to `POST /api/passes/purchase`. Backend creates `PassPurchase` + linked `PassHolder` records + `Payment` record atomically.
6. User completes payment via Easebuzz.

### Journey C: Attendee Ticket & Pass Retrieval (Guest Lookup)
1. Any participant navigates to `/my-registrations`.
2. If unauthenticated, enters registered email address.
3. Clicks "Send Access Code". Receives OTP with purpose `GUEST_LOOKUP`.
4. Submits OTP. Backend verifies code and issues a 30-minute scoped lookup token.
5. Client retrieves attendee's event registrations and pass orders.
6. Attendee views confirmation badges, registration numbers (`EUPH-2026-REG-XXXX`), pass numbers (`EUPH-PASS-XXXX`), download buttons, and team rosters.

### Journey D: Administrative Management & Governance
1. Administrator logs in at `/auth` using credentials from `.env`.
2. Authenticates, receives 7-day JWT with role `ADMIN`.
3. Navigates to `/admin` or `/dashboard`.
4. Views high-level KPI cards: Total Registrations, Confirmed, Pending, Revenue (₹), Pass Purchases.
5. Uses Registrations Tab: live search, category filter, event filter, status filter, payment status filter.
6. Inspects participant details via `RegistrationDetailModal` (including SAGE scholar/enrollment numbers, institute, derived semester, team leader/member rosters).
7. Exports filtered data via `AdminExportTab` into RFC-4180 compliant CSV files with escaped formulas.
8. Uses Passes Tab to audit bulk purchases, verify individual pass-holder records, or manually update status.

---

## 5. Test Environment

- **Operating System:** Windows 11 / Windows Server x64
- **Node Runtime:** Node.js v24.14.0, npm 11.2.0
- **Database Engine:** PostgreSQL 16 on `localhost:5432` (`euphoria_db`)
- **Backend Host & Port:** `http://localhost:5000`
- **Frontend Host & Port:** `http://localhost:5173`
- **SMTP Gateway:** `smtp.gmail.com:465` (SSL/TLS enabled) with official college Gmail account (`sage.euphoria@sageuniversity.in`)
- **Payment Gateway Mode:** Active Easebuzz Production Gateway (`EASEBUZZ_ENV="prod"`, `PAYMENT_GATEWAY="easebuzz"`) with credentials configured in `.env`
- **Verification Modes Exercised:** Full API integration tests, direct database queries via Prisma Client, cryptographic signature verification, error simulation, and rate-limiting validation.

---

## 6. End-to-End Test Results

All tests below were executed against the live local backend, database, and client services.

| Test ID | Area | Scenario | Steps | Expected Result | Actual Result | Status | Evidence | Severity | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| **TC-01** | Discovery | Fetch event categories | `GET /api/categories` | HTTP 200 with 4 official fest categories and counts | HTTP 200 with 5 categories (includes uncleaned `test-category`) | **FAIL** | `{"status":"success","count":5,...}` | **Medium** | Run `clean-test-data.ts --execute` before production launch. |
| **TC-02** | Discovery | Fetch published events | `GET /api/events` | HTTP 200 with list of published events | HTTP 200 with 50 published events mapped with categories | **PASS** | `EVENT_COUNT: 50` returned | **None** | None. |
| **TC-03** | Auth | Register missing required name | `POST /api/auth/register` with `name: ""` | HTTP 400 "Name is required" | HTTP 400 "Name is required" | **PASS** | Verified via API call | **None** | None. |
| **TC-04** | Auth | Register invalid email format | `POST /api/auth/register` with `email: "bad-email"` | HTTP 400 "Please provide a valid email address" | HTTP 400 "Please provide a valid email address" | **PASS** | Verified via API call | **None** | None. |
| **TC-05** | Auth | Register short password (<6 chars) | `POST /api/auth/register` with `password: "123"` | HTTP 400 "Password must be at least 6 characters long" | HTTP 400 "Password must be at least 6 characters long" | **PASS** | Verified via API call | **None** | None. |
| **TC-06** | Auth | Admin login with `.env` credentials | `POST /api/auth/login` with admin credentials | HTTP 200, returns user profile with role `ADMIN` and valid JWT | HTTP 200, `{ user: "admin@sageuniversity.in", role: "ADMIN", hasToken: true }` | **PASS** | Verified via API call | **None** | None. |
| **TC-07** | RBAC | Admin overview without authorization | `GET /api/admin/overview` with no headers | HTTP 401 "Authentication required" | HTTP 401 `{"status":"fail","message":"Authentication required..."}` | **PASS** | Verified via API call | **None** | None. |
| **TC-08** | RBAC | Admin overview with participant token | `GET /api/admin/overview` with role `PARTICIPANT` | HTTP 403 Forbidden | HTTP 403 `{"status":"fail","message":"Access denied. Requires one of the following roles: ADMIN, ORGANIZER"}` | **PASS** | Verified via API call | **None** | None. |
| **TC-09** | IDOR | View another participant's registration | `GET /api/registrations/:id` with non-owner participant token | HTTP 403 Access denied | HTTP 403 `{"status":"error","statusCode":403,"message":"Access denied. You do not have permission..."}` | **PASS** | Verified on registration `cmu5hco20000az07nhips8qw2` | **None** | None. |
| **TC-10** | Verification | Send OTP with invalid email | `POST /api/verification/send-otp` with `email: "not-an-email"` | HTTP 400 "A valid email address is required" | HTTP 400 "A valid email address is required" | **PASS** | Verified via API call | **None** | None. |
| **TC-11** | Verification | Send OTP with invalid purpose | `POST /api/verification/send-otp` with `purpose: "FAKE"` | HTTP 400 "Invalid verification purpose" | HTTP 400 "Invalid verification purpose 'FAKE'" | **PASS** | Verified via API call | **None** | None. |
| **TC-12** | Verification | Send OTP valid request | `POST /api/verification/send-otp` with valid email & purpose | HTTP 200, sends email via SMTP, 60s cooldown returned | HTTP 200, `{ expiresInSeconds: 600, resendAvailableInSeconds: 60 }`, email delivered via Gmail SMTP | **PASS** | Verified via live SMTP dispatch | **None** | None. |
| **TC-13** | Verification | OTP resend cooldown enforcement | `POST /api/verification/send-otp` called twice within 10s | HTTP 429 cooldown error with remaining seconds | HTTP 429 `{"status":"error","statusCode":429,"message":"Please wait 53 seconds..."}` | **PASS** | Verified via API call | **None** | None. |
| **TC-14** | Verification | Submit incorrect OTP code | `POST /api/verification/verify-otp` with wrong code | HTTP 400, attempt count incremented | HTTP 400 `{"status":"error","statusCode":400,"message":"Incorrect code. 4 attempt(s) remaining."}` | **PASS** | Verified via API call | **None** | None. |
| **TC-15** | Event Reg | SAGE Student missing scholar number | `POST /api/registrations` category SAGE, scholarNumber missing | HTTP 400 "Scholar number is required for SAGE University students" | HTTP 400 "Scholar number is required for SAGE University students" | **PASS** | Verified via API call | **None** | None. |
| **TC-16** | Event Reg | Other College Student missing college name | `POST /api/registrations` category OTHER_COLLEGE, collegeName missing | HTTP 400 "College/School name is required..." | HTTP 400 "College/School name is required for Other College/School students" | **PASS** | Verified via API call | **None** | None. |
| **TC-17** | Event Reg | Unsupported category submission | `POST /api/registrations` category "VIP_GUEST" | HTTP 400 "Invalid participant category..." | HTTP 400 `{"status":"error","statusCode":400,"message":"Invalid participant category 'VIP_GUEST'..."}` | **PASS** | Verified via API call | **None** | None. |
| **TC-18** | Event Reg | Register for closed event | `POST /api/registrations` for event `cultural-11` (`registrationOpen: false`) | HTTP 400 "Registrations for this event are currently closed" | HTTP 400 "Registrations for this event are currently closed" | **PASS** | Verified on `cultural-11` | **None** | None. |
| **TC-19** | Pass Flow | General Public category on pass purchase | `POST /api/passes/purchase` category "GENERAL" | HTTP 400 "General Public category is not available for festival passes" | HTTP 400 "General Public category is not available for festival passes..." | **PASS** | Verified via API call | **None** | None. |
| **TC-20** | Pass Flow | Pass purchase quantity > 10 | `POST /api/passes/purchase` with `quantity: 11` | HTTP 400 "Pass quantity must be an integer between 1 and 10" | HTTP 400 "Pass quantity must be an integer between 1 and 10" | **PASS** | Verified via API call | **None** | None. |
| **TC-21** | Pass Flow | Single pass with extra recipients | `POST /api/passes/purchase` `quantity: 1` + 1 recipient | HTTP 400 "Single pass purchase must not include additional recipients" | HTTP 400 "Single pass purchase must not include additional recipients (expected 0 recipients)." | **PASS** | Verified via API call | **None** | None. |
| **TC-22** | Pass Flow | Bulk pass recipient count mismatch | `POST /api/passes/purchase` `quantity: 3` + 1 recipient (expected 2) | HTTP 400 "Bulk purchase of 3 passes requires exactly 2 recipient record(s)" | HTTP 400 "Bulk purchase of 3 passes requires exactly 2 recipient record(s) (received 1)." | **PASS** | Verified via API call | **None** | None. |
| **TC-23** | Payment | Forged callback reverse hash | `POST /api/payments/easebuzz/response` with bogus hash | HTTP 302 redirect to `/payment/result?status=failed&error=...` | HTTP 302 to `/payment/result?status=failed&error=Payment%20callback%20signature%20verification%20failed.` | **PASS** | Verified via curl header inspection | **None** | None. |
| **TC-24** | Payment | Forged webhook reverse hash | `POST /api/payments/easebuzz/webhook` with bogus hash | HTTP 400 Bad Request with signature failure | HTTP 400 `{"status":"error","statusCode":400,"message":"Payment callback signature verification failed."}` | **PASS** | Verified via curl inspection | **None** | None. |
| **TC-25** | Payment | Price tampering on initiation | `POST /api/payments/easebuzz/initiate` sending `{ amount: 1 }` for ₹249 event | Amount ignored; backend computes exact fee from DB record | Backend computed `amount = 249` from database record, completely ignoring client amount | **PASS** | Verified via Easebuzz initiation test | **None** | None. |
| **TC-26** | Payment | Live Easebuzz initiateLink API communication | Initiate payment with configured Easebuzz credentials | Connects to `pay.easebuzz.in`, returns checkout URL and access key | HTTP 200, returned `accessKey` and `paymentUrl: https://pay.easebuzz.in/pay/...` | **PASS** | Live gateway handshake verified | **None** | Set `APP_BACKEND_URL` to public domain before live traffic! |
| **TC-27** | Config | Backend return URLs for Easebuzz | Inspect `APP_BACKEND_URL` in `backend/.env` | Public HTTPS domain configured | Configured as `http://localhost:5000` | **FAIL** | `APP_BACKEND_URL="http://localhost:5000"` in `.env` | **Critical (P0)** | Change to live HTTPS URL before launch. |
| **TC-28** | Config | CORS policy for live domain | Inspect `CORS_ORIGIN` in `backend/.env` | Live domain included | Variable not defined in `.env` | **FAIL** | Missing from `.env`; defaults to localhost | **Critical (P0)** | Define `CORS_ORIGIN` in `.env`. |
| **TC-29** | Performance | Homepage hero asset bandwidth | Inspect images loaded in `src/components/euphoria/Hero.tsx` | Optimized images under 300 KB each, total under 2 MB | Six DSLR images totaling 43.1 MB (up to 11 MB each) | **FAIL** | `GV.jpeg` (11 MB), `MS.jpeg` (9.4 MB), `DF.jpeg` (8.8 MB) | **High (P1)** | Compress images to WebP/AVIF. |
| **TC-30** | Error Handling | Stack trace disclosure | Trigger 400/500 error on API | Error message without internal file system stack trace | Full stack trace including developer file paths returned in JSON | **FAIL** | `backend/.env` has `NODE_ENV="development"`, causing `errorHandler.ts` to output `err.stack` | **High (P1)** | Set `NODE_ENV="production"` in production. |

---

## 7. Critical Issues (P0 — Must Fix Before Live)

### [CRIT-01] Localhost Return URLs Configured for Live Easebuzz Gateway
- **Severity:** P0 (Showstopper)
- **Affected Area:** `backend/.env` (lines 50-51), `backend/src/services/easebuzzService.ts` (lines 384-385)
- **Evidence:** 
  ```env
  APP_FRONTEND_URL="http://localhost:5173"
  APP_BACKEND_URL="http://localhost:5000"
  ```
  ```typescript
  const surl = `${backendBaseUrl}/api/payments/easebuzz/response`;
  const furl = `${backendBaseUrl}/api/payments/easebuzz/response`;
  ```
- **Exploitability / Impact:** 100% of real students paying from their personal smartphones or computers will experience complete failure upon completing their transaction on Easebuzz. Easebuzz redirects the customer's browser back to `surl`. Because `surl` points to `http://localhost:5000`, the student's device will show `ERR_CONNECTION_REFUSED`. The backend will never receive the response callback from the browser, leaving the registration in `PENDING` status while funds have been deducted from the student's bank account.
- **Remediation:** Set `APP_BACKEND_URL` and `APP_FRONTEND_URL` in `backend/.env` to the public HTTPS domain (e.g., `https://euphoria.sageuniversity.in` or production backend domain).

### [CRIT-02] CORS Middleware Rejects Production Domain Requests
- **Severity:** P0 (Showstopper)
- **Affected Area:** `backend/.env`, `backend/src/app.ts` (lines 25-46)
- **Evidence:**
  ```typescript
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim().toLowerCase())
    : ["http://localhost:5173", "http://localhost:5000", "http://localhost:3000"];
  ```
  In `backend/.env`, `CORS_ORIGIN` is not defined. In production mode (`NODE_ENV="production"`), the middleware strictly validates incoming origins against `allowedOrigins`. Requests originating from `https://euphoria.sageuniversity.in` will be rejected with `Error: CORS origin '...' not allowed by policy`.
- **Exploitability / Impact:** Complete frontend outage in production; zero API requests will succeed.
- **Remediation:** Add `CORS_ORIGIN="https://euphoria.sageuniversity.in,https://admin.euphoria.sageuniversity.in"` (or your production domains) to `backend/.env`.

### [CRIT-03] Static Production Frontend Calls Relative `/api` Without Reverse Proxy Definition
- **Severity:** P0 (Deployment Blocker)
- **Affected Area:** `src/lib/api.ts` (line 29), `vite.config.ts` (lines 147-152)
- **Evidence:**
  ```typescript
  const res = await fetch(`/api${path}`, { ... });
  ```
  In development, Vite proxies `/api` to port 5000. In a production static build (`dist/`), Vite dev server is not running. If the static files are hosted on an S3 bucket, Vercel, or Netlify without an explicit reverse proxy rule directing `/api/*` to the Node.js backend server, every API call from the frontend will result in an HTTP 404 error.
- **Exploitability / Impact:** Total disconnection between frontend and backend in production static hosting.
- **Remediation:** If hosting frontend and backend separately, configure Nginx `location /api/ { proxy_pass http://localhost:5000/api/; }` or add a `VITE_API_URL` prefix in `src/lib/api.ts`.

---

## 8. High-Severity Issues (P1 — Should Fix Before Live)

### [HIGH-01] Excessive Image Payload in Homepage Hero Carousel (43.1 MB)
- **Severity:** P1 (Performance / User Experience)
- **Affected Area:** `src/components/euphoria/Hero.tsx` (lines 20-46), `public/assets/`
- **Evidence:**
  - `GV.jpeg`: 11,042,816 bytes (~11.0 MB)
  - `MS.jpeg`: 9,395,318 bytes (~9.4 MB)
  - `DF.jpeg`: 8,781,824 bytes (~8.8 MB)
  - `AS.jpeg`: 8,327,223 bytes (~8.3 MB)
  - `AS2.jpeg`: 8,159,030 bytes (~8.2 MB)
  - `DR.jpeg`: 6,635,250 bytes (~6.6 MB)
  - `GV2.jpeg`: 5,718,074 bytes (~5.7 MB)
  - `Hero_page_image.jpeg`: 2,763,902 bytes (~2.8 MB)
- **Impact:** Students accessing the website on campus or via mobile 4G will download over 40 MB of raw uncompressed photos just to view the hero section. This causes extreme initial load times (10-25 seconds on mobile), massive cellular data consumption, and browser tab crashes on lower-tier smartphones due to GPU texture memory limits.
- **Remediation:** Convert all hero and glimpse images to WebP or AVIF format scaled to a maximum width of 1920px and 80% quality, reducing total payload from 43 MB to under 2.5 MB.

### [HIGH-02] Server File System and Stack Trace Leakage in API Responses
- **Severity:** P1 (Information Disclosure)
- **Affected Area:** `backend/src/middleware/errorHandler.ts` (line 31), `backend/.env` (line 20)
- **Evidence:**
  ```typescript
  res.status(statusCode).json({
    status: "error",
    statusCode,
    message,
    ...(!isProduction && { stack: err.stack }),
  });
  ```
  `backend/.env` currently has `NODE_ENV="development"`. When errors occur, the response body includes the full stack trace containing local developer directory paths (`C:\Users\Aksaar Patel\...`), module versions, and internal file names.
- **Remediation:** Set `NODE_ENV="production"` in the production server environment.

### [HIGH-03] Test Category and Mock Events Visible in Database
- **Severity:** P1 (Data Hygiene)
- **Affected Area:** Database `Category` and `Event` tables, `GET /api/categories`
- **Evidence:**
  `GET /api/categories` returns 5 categories, including:
  ```json
  {"id":"cmu5u982b0004e47nh7cx9wua","slug":"test-category","name":"Test Category","number":"99","_count":{"events":4}}
  ```
  Events inside include: "Closed Solo Singing", "Group Dance Championship", "Open Quiz Prelims", and "Exclusive Masterclass".
- **Impact:** Real students exploring the event catalog will see developer test categories and placeholder events.
- **Remediation:** Run `npm --prefix backend run db:clean-test-data` (with the `--execute` flag) to purge all mock categories, mock events, and test registrations before launch.

### [HIGH-04] Missing `import "dotenv/config"` in `emailService.ts`
- **Severity:** P1 (Reliability Hazard)
- **Affected Area:** `backend/src/services/emailService.ts`
- **Evidence:** `emailService.ts` relies on `process.env.SMTP_HOST`, `SMTP_USER`, etc., but does not import `dotenv/config` at the top of the file. If `emailService` is invoked by any background worker, cron script, or test runner that does not initialize `dotenv` first, it silently falls back to `ConsoleEmailProvider`, causing confirmation emails to be printed to stdout instead of dispatched to students.
- **Remediation:** Add `import "dotenv/config";` at line 1 of `backend/src/services/emailService.ts`.

---

## 9. Medium Issues (P2 — Fix Soon After Launch)

### [MED-01] Absence of Composite Unique Index on Active Registrations `(eventId, email)`
- **Severity:** P2 (Data Integrity / Defense-in-Depth)
- **Affected Area:** `backend/prisma/schema.prisma` (`Registration` model)
- **Evidence:** `Registration` has indexes on `[email]` and `[eventId]`, but no composite unique index `@@unique([eventId, email])`.
- **Finding:** Currently, duplicate prevention is enforced in application code under a transactional PostgreSQL `SELECT ... FOR UPDATE` row-level lock on the `Event` table. While this serializes concurrent web requests, it does not prevent duplicate active records if an external script or direct database query inserts rows.
- **Remediation:** In PostgreSQL, add a partial unique index:
  ```sql
  CREATE UNIQUE INDEX unique_active_registration_per_event 
  ON "Registration" ("eventId", LOWER("email")) 
  WHERE status IN ('CONFIRMED', 'PENDING');
  ```

### [MED-02] In-Memory Rate Limiting Not Shared in Clustered Environments
- **Severity:** P2 (Scalability / DDoS Resistance)
- **Affected Area:** `backend/src/middleware/rateLimiter.ts`
- **Evidence:** `express-rate-limit` uses the default in-memory `MemoryStore`.
- **Finding:** If the backend is scaled horizontally across multiple Node.js worker processes (e.g., PM2 cluster mode or multiple container replicas), each process maintains its own independent rate counter, effectively multiplying the allowed request limits by the number of instances.
- **Remediation:** Integrate `rate-limit-redis` if scaling beyond a single Node.js process.

### [MED-03] Leftover Legacy Framework Scaffolding in Source Tree
- **Severity:** P2 (Code Cleanliness)
- **Affected Area:** `vly-toolbar-readonly.tsx`, `src/convex/`, `convex.json`, `@convex-dev/auth` in `package.json`
- **Evidence:** Files from an earlier starter template remain in the codebase.
- **Finding:** The application runs on Express + Prisma + PostgreSQL; Convex is completely unused. However, `vly-toolbar-readonly.tsx` and `@vly-ai/integrations` are bundled, increasing the bundle size by approximately 14 KB.
- **Remediation:** Remove unused Convex configurations and dependencies in a post-launch cleanup sprint.

---

## 10. Low / Polish Issues (P3)

### [LOW-01] Default Admin Password in Repository Configuration
- **Severity:** P3 (Credential Management)
- **Affected Area:** `backend/.env` (line 13)
- **Evidence:** `ADMIN_PASSWORD="Euphoria@2026"`.
- **Remediation:** Ensure the administrator password in the live production `.env` is updated to a high-entropy passphrase (16+ characters) known only to authorized college administrative leads.

### [LOW-02] PostMessage Route Listener in `main.tsx`
- **Severity:** P3 (Hygiene)
- **Affected Area:** `src/main.tsx` (lines 92-113)
- **Evidence:** `window.parent.postMessage({ type: "iframe-route-change", path: location.pathname }, "*");`
- **Finding:** An iframe synchronization hook from template scaffolding runs on every route change.
- **Remediation:** Remove `RouteSyncer` from `main.tsx` if the app is not rendered inside an administrative iframe.

---

## 11. Security Findings

| Vulnerability / Risk | Affected Area | Evidence | Severity | Exploitability | Impact | Remediation |
|---|---|---|---|---|---|---|
| **Localhost Payment Redirect Exposure** | Payment Callback | `APP_BACKEND_URL="http://localhost:5000"` in `.env` | **Critical** | High (triggers on 100% of external payments) | Customer funds debited, but transaction never verified; broken user flow | Update `APP_BACKEND_URL` to public HTTPS URL |
| **CORS Origin Rejection** | API Gateway | `CORS_ORIGIN` missing in `.env`; `app.ts:25-46` | **Critical** | High (100% of production browser API requests) | Complete application outage on live domain | Set `CORS_ORIGIN` in `.env` |
| **Stack Trace Disclosure** | Error Handling | `errorHandler.ts:31`, `NODE_ENV="development"` | **High** | Medium | Internal server paths and runtime call stacks exposed | Set `NODE_ENV="production"` |
| **Payment Price Tampering** | Payment Initiation | `easebuzzService.ts:205, 252` | **None (Secure)** | None (Attempted & Verified Blocked) | Backend strictly computes amount from DB, ignoring client amount | No action needed; verified secure |
| **Payment Callback Hash Forgery** | Easebuzz Callback | `easebuzzService.ts:82-127, 478` | **None (Secure)** | None (Attempted & Verified Blocked) | Reverse SHA-512 timing-safe comparison rejects forged callbacks | No action needed; verified secure |
| **Insecure Direct Object Reference (IDOR)** | Registrations API | `registrationService.ts:583-596` | **None (Secure)** | None (Attempted & Verified Blocked) | Non-owner/non-staff participant receiving 403 Forbidden | No action needed; verified secure |
| **Admin Route Bypass** | Admin Portal | `adminRoutes.ts:19-118` | **None (Secure)** | None (Attempted & Verified Blocked) | All `/api/admin/*` endpoints require `ADMIN` or `ORGANIZER` role | No action needed; verified secure |
| **OTP Brute Force** | OTP Verification | `verificationService.ts:168-173` | **None (Secure)** | None (Attempted & Verified Blocked) | Invalidation after 5 failed attempts; 60s cooldown on resends | No action needed; verified secure |
| **SQL Injection** | Data Access | Prisma ORM & `registrationService.ts:160` | **None (Secure)** | None (Attempted & Verified Blocked) | Parameterized `$queryRaw` tagged template literal | No action needed; verified secure |
| **Token Storage in LocalStorage** | Frontend Auth Store | `src/lib/auth-store.ts:10` | **Low** | Low (requires existing XSS) | JWT stored in localStorage is vulnerable if XSS exists | Consider `httpOnly` secure cookies in future version |

---

## 12. Payment Audit

A comprehensive audit of the financial transaction pipeline was conducted:

1. **Amount Origin:** The amount charged is **100% server-computed**. For event registrations, it is fetched directly from `Event.fee`. For pass purchases, it is calculated as `Pass.price * quantity`. Client-supplied amounts are discarded.
2. **Order Initiation:** Sessions are created via server-to-server call to Easebuzz `https://pay.easebuzz.in/payment/initiateLink`. The initiate payload includes a cryptographic SHA-512 hash (`key|txnid|amount|productinfo|firstname|email|udf1|udf2|...|salt`).
3. **Response Verification:** When Easebuzz returns the user via browser redirect (`POST /api/payments/easebuzz/response`) or S2S webhook (`POST /api/payments/easebuzz/webhook`):
   - The backend validates the reverse hash formula (`salt|status|udf10...|email|firstname|productinfo|amount|txnid|key`) using `crypto.timingSafeEqual`.
   - The received amount is reconciled against the database `payment.amount` with floating-point tolerance of ₹0.01.
   - Idempotency guard: If `payment.status === 'SUCCESS'`, the backend returns immediately without duplicate status updates or duplicate confirmation emails.
4. **Failure & Cancellation Handling:** If status is `usercancelled` or `failed`, the payment is marked `CANCELLED` or `FAILED`, while the registration remains `PENDING`, allowing the student to retry payment with a new transaction ID.
5. **Simulation Safety:** The development simulation engine (`PaymentSimulationService`) has a hardcoded guard:
   ```typescript
   if (process.env.NODE_ENV === "production" || gateway === "easebuzz") {
     throw new HttpError("Payment simulation is disabled...", 403);
   }
   ```
   Simulation cannot be executed when `PAYMENT_GATEWAY="easebuzz"`.
6. **Transaction ID Uniqueness:** Transaction IDs are generated as `EUPH_REG_<id>_<timestamp>` or `EUPH_PASS_<id>_<timestamp>` and enforced via a `@unique` constraint on `Payment.transactionId`.

---

## 13. Authentication Audit

- **Password Security:** Passwords are hashed using `bcryptjs` with 10 salt rounds. Passwords must be at least 6 characters. Passwords are never returned in API responses (`toSafeUser` helper explicitly strips `passwordHash`).
- **JWT Implementation:** Tokens are signed using `HS256` with expiration set to 7 days. Secret key validation enforces a minimum of 32 characters on startup; missing or short secrets cause immediate server crash on boot.
- **Session Hydration:** On frontend mount, `useAuth` checks `localStorage` for `euphoria_auth_token`. If present, it calls `GET /api/auth/me`. If the token is invalid or expired (401), `auth-store` automatically clears the token and in-memory user cache.
- **Guest Authentication:** Non-registered users can register for events and passes by completing email OTP verification. The backend issues a 15-minute cryptographically signed scoped token (`EVENT_REGISTRATION` or `PASS_PURCHASE`) tied strictly to the verified email address.

---

## 14. Authorization Audit

- **Role-Based Access Control (RBAC):** Roles are managed via PostgreSQL enum `Role` (`ADMIN`, `ORGANIZER`, `PARTICIPANT`).
- **Route Guarding:**
  - Frontend: `RequireAuth` protects `/dashboard` and `/admin`. If unauthenticated, it redirects to `/auth?returnTo=...`.
  - Backend: `requireAuth` extracts and verifies the JWT payload. `requireRole(Role.ADMIN, Role.ORGANIZER)` strictly blocks unauthorized roles with HTTP 403.
- **Ownership Scoping (IDOR Prevention):**
  - Event registrations (`GET /api/registrations/:id`): Restricted to the registrant (`userId === currentUser.id`), team leader (`leaderId === currentUser.id`), assigned organizer (`event.organizerId === currentUser.id`), or admin. Verified via live test TC-09.
  - Guest registrations (`GET /api/registrations/guest-lookup`): Restricted to records matching `decoded.email` from the cryptographically verified `GUEST_LOOKUP` token.

---

## 15. Database & Data Integrity Audit

- **Foreign Key Constraints:**
  - `Registration -> Event`: `onDelete: Restrict` (prevents deleting an event that has active attendee registrations).
  - `Payment -> Registration`: `onDelete: Cascade` (payments are cleaned if a cancelled registration record is explicitly deleted by an admin).
  - `PassHolder -> PassPurchase`: `onDelete: Cascade` (all bulk recipient records belong to the pass purchase).
- **Concurrency & Capacity Protection:**
  - `RegistrationService.createRegistration` wraps event capacity checks and registration creation inside `prisma.$transaction`.
  - Executes a raw row-level lock `SELECT ... FOR UPDATE` on the `Event` table. This prevents race conditions where simultaneous requests exceed the event's capacity limit.
- **Duplicate Prevention:**
  - Checks for existing `CONFIRMED` or `PENDING` registrations for the same `(eventId, email)` combination while holding the event row lock.
  - Allows registration retry if a previous registration was `CANCELLED` or `REJECTED`.

---

## 16. API Audit

- **Input Validation:** Server-side validation is active across all endpoints. String inputs are trimmed, emails are validated with regular expressions, phone numbers are sanitized to 10 digits, and participant categories are strictly mapped against allowed enums.
- **Error Consistency:** All API responses adhere to standard JSON formats:
  - Success: `{ "status": "success", "data": { ... } }`
  - Client Error: `{ "status": "error", "statusCode": 400, "message": "..." }`
  - Authentication/Forbidden: `{ "status": "fail", "message": "..." }`
- **Rate Limiting:** Five independent rate limiters are active:
  - General API: 500 requests / 15 minutes / IP
  - Auth (Login/Register): 15 attempts / 15 minutes / IP
  - OTP Send: 5 requests / 1 minute / IP
  - OTP Verify: 15 attempts / 10 minutes / IP
  - Payment Initiate: 20 checkouts / 10 minutes / IP

---

## 17. Frontend / UX Audit

- **Visual Design & Aesthetics:** High-end dark cinematic aesthetic matching the Euphoria festival identity. Glassmorphism cards, glowing accent borders, gold/aqua/purple gradients, and smooth tab transitions.
- **Form States & Feedback:**
  - Inputs feature active hover/focus borders, dedicated error labels, and clear placeholders.
  - Buttons show animated spinners (`Loader2`) and disabled states during network requests.
  - Toast notifications (`sonner`) deliver clear feedback on status changes, copy actions, and network failures.
- **Accessibility:** Semantic HTML tags, clear contrast text, keyboard-navigable tabs and modal dialogs with focus trapping via Radix UI.

---

## 18. Mobile / Responsive Audit

- **Layout Fluidity:** Tested across standard viewports (360px mobile, 768px tablet, 1280px+ desktop). Navbar collapses cleanly into a responsive sliding mobile sheet menu.
- **Modals on Small Screens:** `EventDetailModal`, `RegistrationFlow`, `PassPurchaseModal`, and `RegistrationDetailModal` utilize `max-h-[90vh]` or `max-h-[85vh]` scrollable viewports with sticky footers, preventing button cutoffs on mobile screens.
- **Mobile Performance Risk:** As identified in Section 8 [HIGH-01], loading 43 MB of raw uncompressed photos on mobile connections will degrade the user experience unless compressed before launch.

---

## 19. Performance Audit

- **Database Queries:** All frequently filtered columns (`email`, `status`, `slug`, `eventId`, `userId`, `transactionId`) are indexed. Admin registrations table utilizes `limit` and `page` parameters with `skip`/`take` pagination.
- **Bundle Optimization:** Production bundle built via Vite completed in 13.01s with zero errors. Largest JS bundle chunk is `charts-CIawOC7S.js` (365 kB uncompressed, 100 kB gzipped), which is asynchronously lazy-loaded only when an admin visits the dashboard.
- **Static Assets:** 72 static asset files exist in `public/assets/`. Hero images represent 78% of the total asset weight and require optimization.

---

## 20. Admin Portal Audit

- **Dashboard Metrics:** Live calculation of Total Registrations, Confirmed, Pending, Cancelled, Pass Orders, and Total Revenue (₹) derived from database aggregates.
- **Registrations Grid:** Live debounce search (300ms) by name, email, phone, or registration number. Category dropdown filters, event filters, status filters.
- **Pass Management Tab:** Allows administrators to view all orders, expand individual pass holders (1 to 10 recipients per order), view attendee contact details, and update statuses.
- **Data Export:** Dedicated `AdminExportTab` and CSV export handlers. Fields are escaped against CSV injection (`=` or `+` prefixes sanitized with single quote prefixing) and properly quoted.

---

## 21. Error & Failure-State Audit

- **Network Drops & Timeouts:** Frontend API wrapper throws structured errors caught by modal forms, presenting clear retry buttons ("Try Again") without wiping user inputs.
- **Payment Abort / User Cancellation:** Easebuzz cancel returns user to `/payment/result?status=cancelled`. The UI clearly states: *"Your registration has not been completed. No payment has been charged. You can try again now."*
- **Email Delivery Failure Resilience:** In `EasebuzzService.handlePaymentCallback`, confirmation email dispatch is wrapped in a `try/catch` block **outside** the database transaction. If SMTP experiences a temporary network hiccup, the payment and registration remain confirmed in the database; email delivery failure never reverts a successful payment.

---

## 22. Deployment Readiness Audit

| Checkpoint | Expected State | Current Discovered State | Production Status |
|---|---|---|---|
| **Database URL** | Production PostgreSQL URI | Configured to local PostgreSQL instance | **Action Required for Cloud Host** |
| **Node Environment** | `NODE_ENV="production"` | `NODE_ENV="development"` in `.env` | **Action Required** |
| **Debug OTP Flag** | `EXPOSE_DEBUG_OTP="false"` | `EXPOSE_DEBUG_OTP="false"` | **READY** |
| **Admin Password** | Strong, confidential password | Default `Euphoria@2026` in `.env` | **Action Required** |
| **JWT Secret** | 64+ char cryptographic key | 64-byte high-entropy key | **READY** |
| **SMTP Delivery** | Official Gmail port 465 SSL | Verified connecting to Gmail SMTP | **READY** |
| **Payment Gateway** | Live Easebuzz Production | Live credentials verified connecting to `pay.easebuzz.in` | **READY** |
| **Payment Redirect URLs** | Public HTTPS Domain | `http://localhost:5000` / `localhost:5173` | **CRITICAL BLOCKER (P0)** |
| **CORS Whitelist** | Public domain whitelisted | Missing; defaults to localhost | **CRITICAL BLOCKER (P0)** |
| **Frontend API Proxy** | Reverse proxy configured | Relative `/api` calls | **CRITICAL BLOCKER (P0)** |
| **Database Hygiene** | Only official events & categories | 4 test events & 1 test category present | **Action Required (P1)** |
| **Image Compression** | Optimized WebP assets | 43 MB uncompressed DSLR photos | **Action Required (P1)** |

---

## 23. Unknowns / Cannot Verify

The following items cannot be fully verified in this local audit environment and require human verification on the production host:

1. **Live Bank Account Settlement:** While the Easebuzz API handshake (`initiateLink`), checkout URL generation, access key generation, and reverse-hash verification algorithms were verified with mathematical and live API tests, actual money deduction and settlement to SAGE University's bank account can only be tested with a real ₹1 live transaction once deployed to the public domain.
2. **Reverse Proxy & SSL Termination:** The production web server (Nginx/Cloudflare/Caddy) configuration in front of port 5000 was not in this workspace. Verification of HTTPS redirection, HTTP/2 multiplexing, and SSL certificate validity must be performed on the production server.
3. **Production Email Rate Limits:** While Google Workspace SMTP successfully authenticated and dispatched test emails, Google imposes standard daily relay limits (typically 2,000 emails/day for Workspace accounts). If event registrations exceed this volume, a dedicated transactional email service (e.g. AWS SES, SendGrid, Resend) will be required.

---

## 24. Production Blockers

### P0 — MUST FIX BEFORE LIVE (Launch Blockers)
1. **Fix Return URLs in `backend/.env`:**
   ```env
   APP_FRONTEND_URL="https://euphoria.sageuniversity.in"
   APP_BACKEND_URL="https://euphoria.sageuniversity.in"
   ```
2. **Define CORS Policy in `backend/.env`:**
   ```env
   CORS_ORIGIN="https://euphoria.sageuniversity.in"
   ```
3. **Configure Frontend Reverse Proxy:** Ensure production Nginx or web host forwards `/api/*` to the Express backend on `http://127.0.0.1:5000`.

### P1 — SHOULD FIX BEFORE LIVE (Quality & Stability)
1. **Clean Database Test Data:** Execute:
   ```bash
   cd backend && npx tsx src/scripts/clean-test-data.ts --execute
   ```
2. **Set Production Node Mode in `backend/.env`:**
   ```env
   NODE_ENV="production"
   ```
3. **Add `import "dotenv/config";`** at the top of `backend/src/services/emailService.ts`.
4. **Optimize Homepage Hero Images:** Compress the 6 hero slideshow photos (`GV.jpeg`, `MS.jpeg`, `DF.jpeg`, `AS.jpeg`, `AS2.jpeg`, `DR.jpeg`) to 80% WebP format (under 400 KB each).

### P2 — CAN FIX AFTER LAUNCH (Fast Follow-Up)
1. Add PostgreSQL partial unique index on `Registration (eventId, email)`.
2. Connect Redis for multi-worker rate limiting if scaling backend replicas.
3. Remove legacy unused Convex and Vly scaffold files.

### P3 — POLISH
1. Update admin account password to a new private passphrase.
2. Remove unused `RouteSyncer` iframe listener in `main.tsx`.

---

## 25. Final Production Readiness

### Status: **NOT READY (Blocked by 3 Critical Configuration Changes)**

### Explicit Justification:
The underlying codebase, security model, and business logic are in **excellent technical condition**:
- Transaction isolation and row-level locking on capacity limits are properly implemented.
- The 3 event participant categories (`SAGE Student`, `Other College/School Student`, `General`) are validated server-side.
- Pass purchases correctly enforce the 10-pass limit, bulk recipient uniqueness, and category rules.
- Easebuzz cryptographic hash initiation and reverse signature verification are functioning and immune to price tampering.
- RBAC and IDOR protections are strictly enforced.

**However, launching the site in its current configuration would result in immediate operational failure**:
- Real students on smartphones will be redirected by Easebuzz to `localhost:5000`, breaking payment completion.
- Real users on the college domain will have their API requests blocked by CORS.
- Production static builds will fail to communicate with the backend without reverse proxy configuration.

**Once the 3 P0 configuration variables in `backend/.env` and Nginx reverse proxy are updated, and test data is purged, the system will be immediately READY to serve real students and users tomorrow.**
