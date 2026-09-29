-- Official county/municipal calendar fields.
-- Does not alter Congress/Quiver tables or change Census/FEC unique keys.

ALTER TABLE "local_elections" ADD COLUMN "election_category" TEXT;
ALTER TABLE "local_elections" ADD COLUMN "subtype" TEXT;
ALTER TABLE "local_elections" ADD COLUMN "jurisdiction_name" TEXT;
ALTER TABLE "local_elections" ADD COLUMN "jurisdiction_type" TEXT;
CREATE INDEX "local_elections_election_date_idx" ON "local_elections"("election_date");

ALTER TABLE "local_events" ADD COLUMN "event_type" TEXT;
ALTER TABLE "local_events" ADD COLUMN "end_date" TIMESTAMP(3);
