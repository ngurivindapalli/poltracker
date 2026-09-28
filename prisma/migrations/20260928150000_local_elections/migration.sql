CREATE TABLE "local_counties" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "county_name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "source_url" TEXT,
    "source_name" TEXT,
    "last_verified" TIMESTAMP(3),
    CONSTRAINT "local_counties_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "local_counties_state_slug_key" ON "local_counties"("state", "slug");
CREATE INDEX "local_counties_state_idx" ON "local_counties"("state");
CREATE INDEX "local_counties_normalized_name_idx" ON "local_counties"("normalized_name");

CREATE TABLE "local_elections" (
    "id" TEXT NOT NULL,
    "county_id" TEXT NOT NULL,
    "election_name" TEXT NOT NULL,
    "election_type" TEXT,
    "election_date" TIMESTAMP(3),
    "office" TEXT,
    "description" TEXT,
    "source_url" TEXT,
    "source_name" TEXT,
    "last_verified" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    CONSTRAINT "local_elections_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "local_elections_county_id_election_date_idx" ON "local_elections"("county_id", "election_date");
ALTER TABLE "local_elections" ADD CONSTRAINT "local_elections_county_id_fkey" FOREIGN KEY ("county_id") REFERENCES "local_counties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "local_events" (
    "id" TEXT NOT NULL,
    "county_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "description" TEXT,
    "source_url" TEXT,
    "source_name" TEXT,
    "last_verified" TIMESTAMP(3),
    CONSTRAINT "local_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "local_events_county_id_date_idx" ON "local_events"("county_id", "date");
ALTER TABLE "local_events" ADD CONSTRAINT "local_events_county_id_fkey" FOREIGN KEY ("county_id") REFERENCES "local_counties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
