-- Quiver financial schema (additive; preserves legacy tables for rollback)

-- Companies
CREATE TABLE IF NOT EXISTS "companies" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "companies_ticker_key" ON "companies"("ticker");

-- Congress trades (Quiver SoT)
CREATE TABLE IF NOT EXISTS "congress_trades" (
    "id" TEXT NOT NULL,
    "source_hash" TEXT NOT NULL,
    "bioguide_id" TEXT,
    "politician_name" TEXT NOT NULL,
    "chamber" TEXT,
    "party" TEXT,
    "ticker" TEXT,
    "company_id" TEXT,
    "company_name" TEXT,
    "transaction" TEXT NOT NULL,
    "transaction_date" TIMESTAMP(3),
    "report_date" TIMESTAMP(3),
    "amount" TEXT,
    "amount_range" TEXT,
    "ticker_type" TEXT,
    "excess_return" DOUBLE PRECISION,
    "price_change" DOUBLE PRECISION,
    "spy_change" DOUBLE PRECISION,
    "description" TEXT,
    "owner" TEXT,
    "district" TEXT,
    "state" TEXT,
    "source" TEXT NOT NULL DEFAULT 'quiver',
    "fetched_at" TIMESTAMP(3) NOT NULL,
    "raw_json" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "congress_trades_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "congress_trades_source_hash_key" ON "congress_trades"("source_hash");
CREATE INDEX IF NOT EXISTS "congress_trades_bioguide_id_idx" ON "congress_trades"("bioguide_id");
CREATE INDEX IF NOT EXISTS "congress_trades_ticker_idx" ON "congress_trades"("ticker");
CREATE INDEX IF NOT EXISTS "congress_trades_transaction_date_idx" ON "congress_trades"("transaction_date");
CREATE INDEX IF NOT EXISTS "congress_trades_report_date_idx" ON "congress_trades"("report_date");

DO $$ BEGIN
  ALTER TABLE "congress_trades" ADD CONSTRAINT "congress_trades_bioguide_id_fkey"
    FOREIGN KEY ("bioguide_id") REFERENCES "members"("bioguide_id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "congress_trades" ADD CONSTRAINT "congress_trades_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Politician net worth
CREATE TABLE IF NOT EXISTS "politician_net_worth" (
    "id" TEXT NOT NULL,
    "bioguide_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "party" TEXT,
    "chamber" TEXT,
    "state" TEXT,
    "image_url" TEXT,
    "trade_count" INTEGER,
    "trade_volume" DOUBLE PRECISION,
    "net_worth" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'quiver',
    "fetched_at" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "politician_net_worth_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "politician_net_worth_bioguide_id_key" ON "politician_net_worth"("bioguide_id");
CREATE INDEX IF NOT EXISTS "politician_net_worth_bioguide_id_idx" ON "politician_net_worth"("bioguide_id");
CREATE INDEX IF NOT EXISTS "politician_net_worth_chamber_idx" ON "politician_net_worth"("chamber");

DO $$ BEGIN
  ALTER TABLE "politician_net_worth" ADD CONSTRAINT "politician_net_worth_bioguide_id_fkey"
    FOREIGN KEY ("bioguide_id") REFERENCES "members"("bioguide_id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Corporate donors
CREATE TABLE IF NOT EXISTS "corporate_donors" (
    "id" TEXT NOT NULL,
    "source_hash" TEXT NOT NULL,
    "bioguide_id" TEXT,
    "candidate_name" TEXT NOT NULL,
    "company_committee_name" TEXT,
    "transaction_date" TIMESTAMP(3),
    "transaction_amount" DOUBLE PRECISION,
    "ticker" TEXT,
    "committee_name" TEXT,
    "cycle" INTEGER,
    "transaction_type" TEXT,
    "company_committee_id" TEXT,
    "source" TEXT NOT NULL DEFAULT 'quiver',
    "fetched_at" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "corporate_donors_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "corporate_donors_source_hash_key" ON "corporate_donors"("source_hash");
CREATE INDEX IF NOT EXISTS "corporate_donors_bioguide_id_idx" ON "corporate_donors"("bioguide_id");
CREATE INDEX IF NOT EXISTS "corporate_donors_ticker_idx" ON "corporate_donors"("ticker");
CREATE INDEX IF NOT EXISTS "corporate_donors_cycle_idx" ON "corporate_donors"("cycle");

DO $$ BEGIN
  ALTER TABLE "corporate_donors" ADD CONSTRAINT "corporate_donors_bioguide_id_fkey"
    FOREIGN KEY ("bioguide_id") REFERENCES "members"("bioguide_id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Extend government_contracts for Quiver
ALTER TABLE "government_contracts" ADD COLUMN IF NOT EXISTS "source_hash" TEXT;
ALTER TABLE "government_contracts" ADD COLUMN IF NOT EXISTS "company_id" TEXT;
ALTER TABLE "government_contracts" ADD COLUMN IF NOT EXISTS "action_date" TIMESTAMP(3);
ALTER TABLE "government_contracts" ADD COLUMN IF NOT EXISTS "fetched_at" TIMESTAMP(3);
ALTER TABLE "government_contracts" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "government_contracts" ALTER COLUMN "vendor" DROP NOT NULL;
ALTER TABLE "government_contracts" ALTER COLUMN "fingerprint" DROP NOT NULL;

-- Backfill source_hash from fingerprint for legacy rows
UPDATE "government_contracts"
SET "source_hash" = COALESCE("source_hash", "fingerprint", "id")
WHERE "source_hash" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "government_contracts_source_hash_key" ON "government_contracts"("source_hash");
CREATE INDEX IF NOT EXISTS "government_contracts_action_date_idx" ON "government_contracts"("action_date");

DO $$ BEGIN
  ALTER TABLE "government_contracts" ADD CONSTRAINT "government_contracts_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Corporate lobbying
CREATE TABLE IF NOT EXISTS "corporate_lobbying" (
    "id" TEXT NOT NULL,
    "source_hash" TEXT NOT NULL,
    "ticker" TEXT,
    "company_id" TEXT,
    "date" TIMESTAMP(3),
    "amount" DOUBLE PRECISION,
    "client" TEXT,
    "issue" TEXT,
    "specific_issue" TEXT,
    "registrant" TEXT,
    "source" TEXT NOT NULL DEFAULT 'quiver',
    "fetched_at" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "corporate_lobbying_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "corporate_lobbying_source_hash_key" ON "corporate_lobbying"("source_hash");
CREATE INDEX IF NOT EXISTS "corporate_lobbying_ticker_idx" ON "corporate_lobbying"("ticker");
CREATE INDEX IF NOT EXISTS "corporate_lobbying_date_idx" ON "corporate_lobbying"("date");

DO $$ BEGIN
  ALTER TABLE "corporate_lobbying" ADD CONSTRAINT "corporate_lobbying_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Off-exchange
CREATE TABLE IF NOT EXISTS "off_exchange_trades" (
    "id" TEXT NOT NULL,
    "source_hash" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "company_id" TEXT,
    "date" TIMESTAMP(3),
    "otc_short" DOUBLE PRECISION,
    "otc_total" DOUBLE PRECISION,
    "dpi" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'quiver',
    "fetched_at" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "off_exchange_trades_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "off_exchange_trades_source_hash_key" ON "off_exchange_trades"("source_hash");
CREATE INDEX IF NOT EXISTS "off_exchange_trades_ticker_idx" ON "off_exchange_trades"("ticker");
CREATE INDEX IF NOT EXISTS "off_exchange_trades_date_idx" ON "off_exchange_trades"("date");

DO $$ BEGIN
  ALTER TABLE "off_exchange_trades" ADD CONSTRAINT "off_exchange_trades_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Trump trades
CREATE TABLE IF NOT EXISTS "trump_trades" (
    "id" TEXT NOT NULL,
    "source_hash" TEXT NOT NULL,
    "ticker" TEXT,
    "company" TEXT,
    "transaction" TEXT,
    "transaction_date" TIMESTAMP(3),
    "report_date" TIMESTAMP(3),
    "amount" TEXT,
    "amount_range" TEXT,
    "excess_return" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'quiver',
    "fetched_at" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "trump_trades_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "trump_trades_source_hash_key" ON "trump_trades"("source_hash");
CREATE INDEX IF NOT EXISTS "trump_trades_ticker_idx" ON "trump_trades"("ticker");
CREATE INDEX IF NOT EXISTS "trump_trades_transaction_date_idx" ON "trump_trades"("transaction_date");

-- Data sync log
DO $$ BEGIN
  CREATE TYPE "DataSyncStatus" AS ENUM ('running', 'success', 'failed', 'partial');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "data_sync_logs" (
    "id" TEXT NOT NULL,
    "dataset" TEXT NOT NULL,
    "status" "DataSyncStatus" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "records_fetched" INTEGER NOT NULL DEFAULT 0,
    "records_inserted" INTEGER NOT NULL DEFAULT 0,
    "records_updated" INTEGER NOT NULL DEFAULT 0,
    "records_skipped" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "meta" TEXT,
    CONSTRAINT "data_sync_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "data_sync_logs_dataset_idx" ON "data_sync_logs"("dataset");
CREATE INDEX IF NOT EXISTS "data_sync_logs_started_at_idx" ON "data_sync_logs"("started_at");
