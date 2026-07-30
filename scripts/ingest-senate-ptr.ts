/**
 * Senate STOCK Act PTR (Periodic Transaction Report) ingestion — STUB
 *
 * TODO: implement as a follow-up once DB + FEC pipeline are confirmed end-to-end.
 *
 * Portal (search / disclosure index):
 *   https://efdsearch.senate.gov/search/
 *
 * Why this is deferred:
 * - Senate efdsearch requires session/cookie handling (CSRF + authenticated search
 *   session) before listing or downloading filings.
 * - Filings are typically PDFs that need parsing into PtrFiling / PtrTransaction
 *   rows (ticker, assetDesc, txType, amount bands, txDate, owner).
 * - Rate limiting and polite crawling rules must be respected; store raw PDFs
 *   under rawFileRef when downloaded.
 *
 * Sketch (do not implement here yet):
 * 1. Establish a search session against efdsearch.senate.gov
 * 2. Query PTR filings for each Member with chamber=senate (match by name/state)
 * 3. Download filing PDFs, set PtrFiling.sourceUrl + rawFileRef
 * 4. Parse transactions → PtrTransaction linked to the filing
 * 5. Upsert by (bioguideId, sourceUrl) or filing identifier once known
 */
import "dotenv/config";

async function main() {
  console.log("ingest-senate-ptr.ts is a stub.");
  console.log("Portal: https://efdsearch.senate.gov/search/");
  console.log(
    "Full scraper (session/cookies + PDF parse) is deferred to a follow-up task."
  );
}

main();
