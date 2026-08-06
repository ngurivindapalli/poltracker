-- Extend ptr_transactions for full congressional trading dataset
ALTER TABLE "ptr_transactions" ADD COLUMN IF NOT EXISTS "asset_type" TEXT;
ALTER TABLE "ptr_transactions" ADD COLUMN IF NOT EXISTS "buy_sell" TEXT;
ALTER TABLE "ptr_transactions" ADD COLUMN IF NOT EXISTS "comment" TEXT;
ALTER TABLE "ptr_transactions" ADD COLUMN IF NOT EXISTS "source" TEXT;
ALTER TABLE "ptr_transactions" ADD COLUMN IF NOT EXISTS "fingerprint" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "ptr_transactions_fingerprint_key" ON "ptr_transactions"("fingerprint");
CREATE INDEX IF NOT EXISTS "ptr_transactions_ticker_idx" ON "ptr_transactions"("ticker");
CREATE INDEX IF NOT EXISTS "ptr_transactions_tx_date_idx" ON "ptr_transactions"("tx_date");

-- Government contracts (ticker-linked awards)
CREATE TABLE IF NOT EXISTS "government_contracts" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "agency" TEXT,
    "award_date" TIMESTAMP(3),
    "description" TEXT,
    "amount" DOUBLE PRECISION,
    "status" TEXT,
    "source" TEXT NOT NULL DEFAULT 'contracts-recent',
    "fingerprint" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "government_contracts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "government_contracts_fingerprint_key" ON "government_contracts"("fingerprint");
CREATE INDEX IF NOT EXISTS "government_contracts_ticker_idx" ON "government_contracts"("ticker");
CREATE INDEX IF NOT EXISTS "government_contracts_award_date_idx" ON "government_contracts"("award_date");
CREATE INDEX IF NOT EXISTS "government_contracts_agency_idx" ON "government_contracts"("agency");

-- Per-member portfolio summaries
CREATE TABLE IF NOT EXISTS "portfolio_snapshots" (
    "id" TEXT NOT NULL,
    "bioguide_id" TEXT NOT NULL,
    "estimated_portfolio_usd" DOUBLE PRECISION,
    "trade_count" INTEGER NOT NULL DEFAULT 0,
    "first_trade_date" TIMESTAMP(3),
    "last_trade_date" TIMESTAMP(3),
    "top_holdings_json" TEXT,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolio_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "portfolio_snapshots_bioguide_id_key" ON "portfolio_snapshots"("bioguide_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'portfolio_snapshots_bioguide_id_fkey'
  ) THEN
    ALTER TABLE "portfolio_snapshots"
      ADD CONSTRAINT "portfolio_snapshots_bioguide_id_fkey"
      FOREIGN KEY ("bioguide_id") REFERENCES "members"("bioguide_id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
