-- Idempotent upsert keys for local elections and events.
-- Does not alter Congress/Quiver tables.

ALTER TABLE "local_elections" ADD COLUMN "source_key" TEXT;
CREATE UNIQUE INDEX "local_elections_source_key_key" ON "local_elections"("source_key");

ALTER TABLE "local_events" ADD COLUMN "source_key" TEXT;
CREATE UNIQUE INDEX "local_events_source_key_key" ON "local_events"("source_key");
