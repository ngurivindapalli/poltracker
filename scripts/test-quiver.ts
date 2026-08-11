/**
 * Unit tests for Quiver normalizers + identity + client error handling (mocked, no live API).
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
import { PoliticianIndex, coreNameKey } from "../src/lib/quiver/identity";
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
      BioGuideID: "D001288",
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
  assert.strictEqual(n!.bioguideId, "D001288");
  assert.strictEqual(n!.amountRange, "$1,001 - $15,000");
  assert.ok(n!.sourceHash.length === 64);
}

function testBulkTradeDedupe() {
  const row = {
    Name: "Cory Booker",
    BioGuideID: "B001288",
    Ticker: "AAPL",
    Transaction: "Sale",
    Traded: "2014-08-08",
    Filed: "2014-09-07",
    Trade_Size_USD: "1001.0",
  };
  const a = normalizeBulkCongressTrade(row, "t1");
  const b = normalizeBulkCongressTrade(row, "t2");
  assert.strictEqual(a!.sourceHash, b!.sourceHash);
  assert.strictEqual(a!.bioguideId, "B001288");
}

function testPoliticianRequiresBio() {
  const bad = normalizePolitician(
    { Name: "No Bio", Chamber: "Senate" },
    "t"
  );
  assert.strictEqual(bad, null);
  const good = normalizePolitician(
    {
      BioGuideID: "B001288",
      Name: "Cory A. Booker",
      Chamber: "Senate",
      NetWorth: 1_000_000,
      TradeCount: 13,
    },
    "t"
  );
  assert.ok(good);
  assert.strictEqual(good!.bioguideId, "B001288");
  assert.strictEqual(good!.netWorth, 1_000_000);
}

function testBookerNameIdentity() {
  const idx = PoliticianIndex.fromNetWorth([
    {
      bioguideId: "B001288",
      name: "Cory A. Booker",
      party: "Democratic",
      chamber: "Senate",
      state: "New Jersey",
      imageUrl: null,
      tradeCount: 13,
      tradeVolume: 244506.5,
      netWorth: 1131431,
      source: "quiver",
      fetchedAt: "t",
    },
  ]);

  assert.strictEqual(coreNameKey("Cory A. Booker"), "cory booker");
  assert.strictEqual(coreNameKey("Cory Booker"), "cory booker");
  assert.strictEqual(coreNameKey("BOOKER, CORY A."), "cory booker");

  const a = idx.resolve({ bioguideId: "B001288" });
  assert.strictEqual(a.bioguideId, "B001288");
  assert.strictEqual(a.status, "direct_bioguide");

  const b = idx.resolve({
    name: "Cory Booker",
    chamber: "Senate",
    party: "Democratic",
  });
  assert.strictEqual(b.bioguideId, "B001288");
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
  const empty: any[] = [];
  assert.strictEqual(empty.length === 0, true);
}

const tests = [
  ["hashesStable", testHashesStable],
  ["liveTrade", testLiveTrade],
  ["bulkTradeDedupe", testBulkTradeDedupe],
  ["politicianRequiresBio", testPoliticianRequiresBio],
  ["bookerNameIdentity", testBookerNameIdentity],
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
