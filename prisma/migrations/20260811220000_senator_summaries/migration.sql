-- CreateTable
CREATE TABLE IF NOT EXISTS "senator_summaries" (
    "bioguide_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "party" TEXT,
    "state" TEXT,
    "image_url" TEXT,
    "chamber" TEXT NOT NULL DEFAULT 'senate',
    "estimated_net_worth" DOUBLE PRECISION,
    "trade_count" INTEGER,
    "trade_volume" DOUBLE PRECISION,
    "latest_trade_date" TIMESTAMP(3),
    "latest_financial_update" TIMESTAMP(3),
    "data_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "senator_summaries_pkey" PRIMARY KEY ("bioguide_id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "senator_summaries_state_idx" ON "senator_summaries"("state");
CREATE INDEX IF NOT EXISTS "senator_summaries_party_idx" ON "senator_summaries"("party");
CREATE INDEX IF NOT EXISTS "senator_summaries_chamber_idx" ON "senator_summaries"("chamber");
