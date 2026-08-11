-- Allow congress trades to store BioGuideID without requiring a members row.
-- Runtime warehouse writes were silently failing FK checks for novel bio ids.
ALTER TABLE "congress_trades" DROP CONSTRAINT IF EXISTS "congress_trades_bioguide_id_fkey";
