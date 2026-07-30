/**
 * House STOCK Act PTR / financial disclosure ingestion — STUB
 *
 * TODO: implement as a follow-up once DB + FEC pipeline are confirmed end-to-end.
 *
 * Portal (Public Financial Disclosure):
 *   https://disclosures-clerk.house.gov/PublicDisclosure/FinancialDisclosure
 *
 * Related House clerk disclosure surfaces (for follow-up scoping):
 *   https://disclosures-clerk.house.gov/
 *
 * Why this is deferred:
 * - House clerk filings are primarily PDFs (and some XML for newer electronic
 *   filers) that need dedicated parsers for PtrFiling / PtrTransaction and
 *   AnnualDisclosure / AssetLine.
 * - Member matching should use bioguideId after resolving clerk name/state/
 *   district against the members table — fuzzy name matching will be needed.
 * - Store downloaded artifacts via rawFileRef; keep sourceUrl as the clerk URL.
 *
 * Sketch (do not implement here yet):
 * 1. Enumerate PTR / FD search results from the House clerk portal
 * 2. For chamber=house members, download filings and create PtrFiling /
 *    AnnualDisclosure rows as appropriate
 * 3. Parse PDF/XML line items → PtrTransaction or AssetLine
 * 4. Idempotent upsert keyed by sourceUrl (or clerk document id when available)
 */
import "dotenv/config";

async function main() {
  console.log("ingest-house-ptr.ts is a stub.");
  console.log(
    "Portal: https://disclosures-clerk.house.gov/PublicDisclosure/FinancialDisclosure"
  );
  console.log(
    "Full scraper (PDF/XML parse + member match) is deferred to a follow-up task."
  );
}

main();
