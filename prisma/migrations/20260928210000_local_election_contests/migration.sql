-- Contest-level fields and candidates. Existing election/event rows are preserved.
-- county_id becomes optional so national/state contests are not fan-out copies.

ALTER TABLE "local_elections" ALTER COLUMN "county_id" DROP NOT NULL;
ALTER TABLE "local_elections" ADD COLUMN IF NOT EXISTS "record_kind" TEXT;
ALTER TABLE "local_elections" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "local_elections" ADD COLUMN IF NOT EXISTS "district" TEXT;
ALTER TABLE "local_elections" ADD COLUMN IF NOT EXISTS "chamber" TEXT;
ALTER TABLE "local_elections" ADD COLUMN IF NOT EXISTS "external_id" TEXT;

UPDATE "local_elections"
SET "record_kind" = 'ELECTION'
WHERE "record_kind" IS NULL;

UPDATE "local_elections" e
SET "state" = c."state"
FROM "local_counties" c
WHERE e."county_id" = c."id"
  AND e."state" IS NULL;

CREATE INDEX IF NOT EXISTS "local_elections_state_election_date_idx"
  ON "local_elections"("state", "election_date");
CREATE INDEX IF NOT EXISTS "local_elections_record_kind_idx"
  ON "local_elections"("record_kind");

CREATE TABLE IF NOT EXISTS "local_candidates" (
    "id" TEXT NOT NULL,
    "election_id" TEXT NOT NULL,
    "candidate_name" TEXT NOT NULL,
    "candidate_id" TEXT,
    "office" TEXT,
    "state" TEXT,
    "district" TEXT,
    "party" TEXT,
    "election_years" TEXT,
    "candidate_status" TEXT,
    "incumbent" TEXT,
    "source_url" TEXT,
    "source_name" TEXT,
    "last_verified" TIMESTAMP(3),
    "source_key" TEXT,
    CONSTRAINT "local_candidates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "local_candidates_source_key_key" ON "local_candidates"("source_key");
CREATE INDEX IF NOT EXISTS "local_candidates_election_id_idx" ON "local_candidates"("election_id");
CREATE INDEX IF NOT EXISTS "local_candidates_candidate_id_idx" ON "local_candidates"("candidate_id");

ALTER TABLE "local_candidates"
  DROP CONSTRAINT IF EXISTS "local_candidates_election_id_fkey";
ALTER TABLE "local_candidates"
  ADD CONSTRAINT "local_candidates_election_id_fkey"
  FOREIGN KEY ("election_id") REFERENCES "local_elections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
