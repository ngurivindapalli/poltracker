/**
 * Ingest FEC itemized individual contributions (Schedule A) for members.
 *
 * TODO: implement as a follow-up — this is intentionally separate from
 * scripts/ingest-fec.ts because /schedules/schedule_a/ is high call volume
 * (pagination per candidate × cycle) and needs its own rate-limit / resume
 * strategy on a free data.gov key.
 *
 * Docs:  https://api.open.fec.gov/developers/
 * Key:   https://api.data.gov/signup/  → FEC_API_KEY in .env
 * Endpoint sketch:
 *   GET https://api.open.fec.gov/v1/schedules/schedule_a/
 *     ?api_key=...
 *     &candidate_id={fecCandidateId}
 *     &two_year_transaction_period={cycle}
 *     &is_individual=true
 *     &per_page=100
 *     &sort=-contribution_receipt_date
 *
 * Persist into FecDonor: bioguideId, cycle, contributorName, employer,
 * amount, contributedAt. Upsert strategy TBD (no natural unique key yet —
 * consider hashing contributor+date+amount or storing FEC transaction_id).
 */
import "dotenv/config";

async function main() {
  console.log(
    "ingest-fec-donors.ts is a stub. Run scripts/ingest-fec.ts for cycle totals first."
  );
  console.log(
    "Schedule A donor ingestion is deferred until the totals pipeline is confirmed."
  );
}

main();
