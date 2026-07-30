-- CreateEnum
CREATE TYPE "Chamber" AS ENUM ('senate', 'house');

-- CreateTable
CREATE TABLE "members" (
    "bioguide_id" TEXT NOT NULL,
    "fec_candidate_id" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "chamber" "Chamber" NOT NULL,
    "party" TEXT,
    "state" TEXT NOT NULL,
    "district" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("bioguide_id")
);

-- CreateTable
CREATE TABLE "ptr_filings" (
    "id" TEXT NOT NULL,
    "bioguide_id" TEXT NOT NULL,
    "chamber" "Chamber" NOT NULL,
    "filing_date" TIMESTAMP(3) NOT NULL,
    "source_url" TEXT NOT NULL,
    "raw_file_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ptr_filings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ptr_transactions" (
    "id" TEXT NOT NULL,
    "filing_id" TEXT NOT NULL,
    "ticker" TEXT,
    "asset_desc" TEXT NOT NULL,
    "tx_type" TEXT NOT NULL,
    "amount_low" INTEGER,
    "amount_high" INTEGER,
    "tx_date" TIMESTAMP(3) NOT NULL,
    "owner" TEXT,

    CONSTRAINT "ptr_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annual_disclosures" (
    "id" TEXT NOT NULL,
    "bioguide_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "filing_type" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "raw_file_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "annual_disclosures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_lines" (
    "id" TEXT NOT NULL,
    "disclosure_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "value_low" INTEGER,
    "value_high" INTEGER,
    "income_type" TEXT,

    CONSTRAINT "asset_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fec_totals" (
    "id" TEXT NOT NULL,
    "bioguide_id" TEXT NOT NULL,
    "cycle" INTEGER NOT NULL,
    "receipts" BIGINT,
    "disbursements" BIGINT,
    "cash_on_hand" BIGINT,

    CONSTRAINT "fec_totals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fec_donors" (
    "id" TEXT NOT NULL,
    "bioguide_id" TEXT NOT NULL,
    "cycle" INTEGER NOT NULL,
    "contributor_name" TEXT NOT NULL,
    "employer" TEXT,
    "amount" INTEGER NOT NULL,
    "contributed_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fec_donors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ptr_filings_bioguide_id_idx" ON "ptr_filings"("bioguide_id");

-- CreateIndex
CREATE INDEX "ptr_transactions_filing_id_idx" ON "ptr_transactions"("filing_id");

-- CreateIndex
CREATE INDEX "annual_disclosures_bioguide_id_year_idx" ON "annual_disclosures"("bioguide_id", "year");

-- CreateIndex
CREATE INDEX "asset_lines_disclosure_id_idx" ON "asset_lines"("disclosure_id");

-- CreateIndex
CREATE UNIQUE INDEX "fec_totals_bioguide_id_cycle_key" ON "fec_totals"("bioguide_id", "cycle");

-- CreateIndex
CREATE INDEX "fec_donors_bioguide_id_cycle_idx" ON "fec_donors"("bioguide_id", "cycle");

-- AddForeignKey
ALTER TABLE "ptr_filings" ADD CONSTRAINT "ptr_filings_bioguide_id_fkey" FOREIGN KEY ("bioguide_id") REFERENCES "members"("bioguide_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ptr_transactions" ADD CONSTRAINT "ptr_transactions_filing_id_fkey" FOREIGN KEY ("filing_id") REFERENCES "ptr_filings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annual_disclosures" ADD CONSTRAINT "annual_disclosures_bioguide_id_fkey" FOREIGN KEY ("bioguide_id") REFERENCES "members"("bioguide_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_lines" ADD CONSTRAINT "asset_lines_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "annual_disclosures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fec_totals" ADD CONSTRAINT "fec_totals_bioguide_id_fkey" FOREIGN KEY ("bioguide_id") REFERENCES "members"("bioguide_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fec_donors" ADD CONSTRAINT "fec_donors_bioguide_id_fkey" FOREIGN KEY ("bioguide_id") REFERENCES "members"("bioguide_id") ON DELETE RESTRICT ON UPDATE CASCADE;
