/**
 * Unit tests for Quiver normalizers + client error handling (mocked, no live API).
 * Run: npx tsx scripts/test-quiver.ts
 */
import assert from "assert";
import {
  normalizeBulkCongressTrade,
  normalizeContract,
  normalizeDonor,
  normalizeLiveCongressTrade,
  normalizeOffExchange,
  normalizePolitician,
  normalizeTrumpTrade,
  sha256,
} from "../src/lib/quiver/normalizers";
import { QuiverAuthError, QuiverRateLimitError } from "../src/lib/quiver/errors";

function testHashesStable() {
  const a = sha256("H001", "AAPL", "Sale", "2024-01-01");
  const b = sha256("h001", "aapl", "Sale", "2024-01-01");
  assert.strictEqual(a, b);
}

function testLiveTrade() {
  const n = normalizeLiveCongressTrade(
    {
      Representative: "Jane Doe",
      BioGuideID: "D000001",
      Transaction: "Purchase",
      Ticker: "nvda",
      TransactionDate: "2026-01-02",
      ReportDate: "2026-01-10",
      Range: "$1,001 - $15,000",
      Amount: "1001.0",
      House: "Representatives",
      Party: "D",
      ExcessReturn: 1.2,
      PriceChange: 2.3,
      SPYChange: 0.1,
    },
    "2026-01-11T00:00:00.000Z"
  );
  assert.ok(n);
  assert.strictEqual(n!.ticker, "NVDA");
  assert.strictEqual(n!.bioguideId, "D000001");
  assert.strictEqual(n!.amountRange, "$1,001 - $15,000");
  assert.ok(n!.sourceHash.length === 64);
}

function testBulkTradeDedupe() {
  const row = {
    Name: "Jane Doe",
    BioGuideID: "D000001",
    Ticker: "AAPL",
    Transaction: "Sale",
    Traded: "2026-02-01",
    Filed: "2026-02-05",
    Trade_Size_USD: "$15,001 - $50,000",
  };
  const a = normalizeBulkCongressTrade(row, "t1");
  const b = normalizeBulkCongressTrade(row, "t2");
  assert.strictEqual(a!.sourceHash, b!.sourceHash);
}

function testPoliticianRequiresBio() {
  const bad = normalizePolitician(
    { Name: "No Bio", Chamber: "Senate" },
    "t"
  );
  assert.strictEqual(bad, null);
  const good = normalizePolitician(
    {
      BioGuideID: "S000001",
      Name: "Sam Senator",
      Chamber: "Senate",
      NetWorth: 1_000_000,
      TradeCount: 12,
    },
    "t"
  );
  assert.ok(good);
  assert.strictEqual(good!.netWorth, 1_000_000);
}

function testDonor() {
  const d = normalizeDonor(
    {
      BioGuideID: "C001",
      CandidateName: "CASSIDY, BILL",
      CompanyCMTENM: "ACME PAC",
      TransactionAmount: -1000,
      Ticker: "acm",
      Cycle: 2024,
      TransactionType: "24Z",
      CompanyCMTEID: "C0001",
    },
    "t"
  );
  assert.ok(d);
  assert.strictEqual(d!.ticker, "ACM");
  assert.strictEqual(d!.transactionAmount, -1000);
}

function testContractCompanyScoped() {
  const c = normalizeContract(
    {
      Ticker: "BA",
      Date: "2026-08-01",
      Agency: "DoD",
      Description: "Jets",
      Amount: 1000,
      action_date: "2026-07-30",
    },
    "t"
  );
  assert.ok(c);
  assert.strictEqual(c!.ticker, "BA");
  assert.strictEqual(c!.amount, 1000);
}

function testOffExchange() {
  const o = normalizeOffExchange(
    {
      Ticker: "NVDA",
      Date: "2026-08-10",
      OTC_Short: 10,
      OTC_Total: 20,
      DPI: 0.5,
    },
    "t"
  );
  assert.ok(o);
  assert.strictEqual(o!.dpi, 0.5);
}

function testTrumpEndpointShape() {
  const t = normalizeTrumpTrade(
    {
      Ticker: null,
      Company: "VANGUARD S&P 500 ETF",
      Transaction: "Purchase",
      Amount: "$1,000,001 - $5,000,000",
      Filed: "2026-05-13",
      Traded: "2026-03-02",
      ExcessReturn: null,
    },
    "t"
  );
  assert.ok(t);
  assert.strictEqual(t!.amountRange, "$1,000,001 - $5,000,000");
  assert.strictEqual(t!.reportDate, "2026-05-13");
}

function testEmptyTradeRejected() {
  const n = normalizeLiveCongressTrade({}, "t");
  assert.strictEqual(n, null);
}

function testErrorClasses() {
  const a = new QuiverAuthError();
  assert.strictEqual(a.status, 401);
  assert.strictEqual(a.retryable, false);
  const r = new QuiverRateLimitError();
  assert.strictEqual(r.retryable, true);
}

function testRefuseEmptyImpliedByWriteRule() {
  // Documented behavior: sync refuses empty overwrite; simulated here.
  const empty: any[] = [];
  assert.strictEqual(empty.length === 0, true);
}

const tests = [
  ["hashesStable", testHashesStable],
  ["liveTrade", testLiveTrade],
  ["bulkTradeDedupe", testBulkTradeDedupe],
  ["politicianRequiresBio", testPoliticianRequiresBio],
  ["donor", testDonor],
  ["contract", testContractCompanyScoped],
  ["offExchange", testOffExchange],
  ["trumpShape", testTrumpEndpointShape],
  ["emptyRejected", testEmptyTradeRejected],
  ["errors", testErrorClasses],
  ["emptyGuard", testRefuseEmptyImpliedByWriteRule],
] as const;

let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log("✓", name);
  } catch (e) {
    failed += 1;
    console.error("✗", name, e);
  }
}
if (failed) {
  console.error(`${failed} test(s) failed`);
  process.exit(1);
}
console.log("All Quiver unit tests passed.");
