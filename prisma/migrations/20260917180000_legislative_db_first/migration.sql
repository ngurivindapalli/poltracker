-- Database-first legislation, representative summaries, news cache, freshness.

CREATE TABLE "representative_summaries" (
    "bioguide_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "party" TEXT,
    "state" TEXT,
    "district" TEXT,
    "image_url" TEXT,
    "chamber" TEXT NOT NULL DEFAULT 'house',
    "estimated_net_worth" DOUBLE PRECISION,
    "trade_count" INTEGER,
    "trade_volume" DOUBLE PRECISION,
    "latest_trade_date" TIMESTAMP(3),
    "latest_financial_update" TIMESTAMP(3),
    "data_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "representative_summaries_pkey" PRIMARY KEY ("bioguide_id")
);

CREATE INDEX "representative_summaries_state_idx" ON "representative_summaries"("state");
CREATE INDEX "representative_summaries_party_idx" ON "representative_summaries"("party");
CREATE INDEX "representative_summaries_chamber_idx" ON "representative_summaries"("chamber");

CREATE TABLE "member_bills" (
    "id" TEXT NOT NULL,
    "bioguide_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "congress" INTEGER NOT NULL DEFAULT 0,
    "bill_type" TEXT NOT NULL,
    "bill_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "latest_action" TEXT,
    "congress_url" TEXT,
    "fetched_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_bills_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "member_bills_bioguide_id_role_congress_bill_type_bill_number_key" ON "member_bills"("bioguide_id", "role", "congress", "bill_type", "bill_number");
CREATE INDEX "member_bills_bioguide_id_role_idx" ON "member_bills"("bioguide_id", "role");
CREATE INDEX "member_bills_congress_idx" ON "member_bills"("congress");
CREATE INDEX "member_bills_fetched_at_idx" ON "member_bills"("fetched_at");

CREATE TABLE "recent_legislation_cache" (
    "id" TEXT NOT NULL DEFAULT 'latest',
    "bills_json" TEXT NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recent_legislation_cache_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cached_news_articles" (
    "id" TEXT NOT NULL,
    "bioguide_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "source" TEXT,
    "description" TEXT,
    "published_at" TIMESTAMP(3),
    "image_url" TEXT,
    "fetched_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cached_news_articles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cached_news_articles_bioguide_id_url_key" ON "cached_news_articles"("bioguide_id", "url");
CREATE INDEX "cached_news_articles_bioguide_id_published_at_idx" ON "cached_news_articles"("bioguide_id", "published_at");

CREATE TABLE "dataset_freshness" (
    "dataset" TEXT NOT NULL,
    "status" "DataSyncStatus" NOT NULL,
    "last_successful_sync" TIMESTAMP(3),
    "last_attempt_at" TIMESTAMP(3) NOT NULL,
    "record_count" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,

    CONSTRAINT "dataset_freshness_pkey" PRIMARY KEY ("dataset")
);
