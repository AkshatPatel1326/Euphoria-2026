-- CreateIndex
CREATE UNIQUE INDEX "unique_active_registration_per_event"
ON "Registration" ("eventId", LOWER("email"))
WHERE status IN ('CONFIRMED', 'PENDING');
