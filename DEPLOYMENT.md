# SAGE Euphoria 2026 — Production Deployment & Database Guide

## 1. Production Deployment Sequence

When deploying the application to a staging or production server, execute the following commands in order.

> [!IMPORTANT]
> **DO NOT RUN `npm run seed` DURING PRODUCTION DEPLOYMENT.**
> Database seeding is strictly reserved for fresh local development and disposable testing environments.

### Step-by-Step Deployment Commands

```bash
# 1. Install production dependencies
npm install --production=false
npm --prefix backend install --production=false

# 2. Generate Prisma Client (artifacts)
npm --prefix backend run postinstall
# or: npx prisma generate (from backend/)

# 3. Apply pending database migrations safely
cd backend
npx prisma migrate deploy
cd ..

# 4. Build both frontend and backend
npm run build              # Builds Vite frontend into dist/
npm run build:backend      # Compiles backend TypeScript into backend/dist/

# 5. Start compiled backend
npm run start:backend      # Runs node dist/src/server.js (with NODE_ENV=production)
```

---

## 2. Why Database Seeding (`npm run seed`) Is Prohibited in Production

The database seed script (`backend/prisma/seed.ts`) is designed to bootstrap an empty, disposable development database with initial fixture data.

If executed against a live production database, the seed script will:
- **Overwrite dynamic event fees:** Any custom pricing set by administrators via the Admin Pricing tab would be reset to hardcoded seed values.
- **Overwrite dynamic festival pass pricing & status:** The festival pass price would be forced to ₹799 and status to `AVAILABLE`, discarding any promotional pricing or sold-out/paused states.
- **Overwrite administrative credentials:** The administrator's password hash would be regenerated or reset.
- **Overwrite event schedules & categories:** Custom scheduling adjustments or venue assignments would be overwritten.

### Built-in Production Runtime Guard

`backend/prisma/seed.ts` includes an active runtime guard:
- If `NODE_ENV=production` is detected, the script immediately aborts with an error before executing any database queries or connecting to the database.
- It exits with code `1` and prints an explanatory error message.
- It does **not** silently skip operations or report false success.

---

## 3. Managing Production Data Safely

In production, all ongoing data management must follow controlled processes:

1. **Database Schema Evolution:** Handled exclusively via version-controlled Prisma migrations:
   ```bash
   npx prisma migrate deploy
   ```
   This executes migration DDL (e.g. `CREATE TABLE`, `CREATE INDEX`, `ALTER TABLE ADD COLUMN`) and **never** deletes, truncates, or resets existing business data.

2. **Event & Pass Pricing:** Configured live by authorized administrators in the Admin Dashboard (`/admin` -> Pricing Tab).
3. **Announcements / Updates:** Authored and published dynamically via the Admin Updates Tab.
4. **Event Status & Schedules:** Managed via the Admin Events Tab.
5. **Initial Admin Provisioning:** If an initial admin account must be provisioned on a blank production database, it should be done via a controlled administrative provisioning script or direct secure SQL insert with a pre-hashed bcrypt password, not by running the full mock development seed.
