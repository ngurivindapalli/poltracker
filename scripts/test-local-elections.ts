/**
 * Local election ingest tests (no live government APIs required).
 * Run: npm run test:local-elections
 */
import assert from "assert";
import { countySlug, normalizeCountyQuery } from "../src/lib/localData/countySearch";
import { parseCensusCountyFile } from "../src/lib/localElections/adapters/censusCounties";
import { normalizeFecStatewideDates } from "../src/lib/localElections/adapters/fecStatewide";
import { compiledOverlayForState } from "../src/lib/localElections/adapters/compiledOverlay";
import { coverageFromCounts } from "../src/lib/localElections/coverage";
import { validateStateRecords } from "../src/lib/localElections/validate";
import {
  electionSourceKey,
  electionStatus,
  isCompiledSource,
  isOfficialSource,
  parseIsoDate,
} from "../src/lib/localElections/normalize";
import { redactUrl } from "../src/lib/localElections/fetchOfficial";
import { COMPILED_SOURCE_NAME, FEC_SOURCE_NAME } from "../src/lib/localElections/types";
import { enabledSources, sourcesForState } from "../src/lib/localElections/sources";
import { getElectionsForCounty } from "../src/lib/localData/elections";
import { getCountiesForState } from "../src/lib/localData/usCounties";

function testCountyNormalization() {
  const samples = ["Adams", "adams county", "ADAMS COUNTY", "Adams  County"];
  const norms = samples.map(normalizeCountyQuery);
  assert.strictEqual(new Set(norms).size, 1);
  assert.strictEqual(countySlug("Allegheny County"), "allegheny-county");
  assert.strictEqual(countySlug("Miami-Dade County"), "miami-dade-county");
}

function testCountySearch() {
  const names = getCountiesForState("PA");
  const match = names.filter((n) =>
    normalizeCountyQuery(n).includes(normalizeCountyQuery("allegheny county"))
  );
  assert.strictEqual(match.length, 1);
  assert.strictEqual(names.length, 67);
  assert.strictEqual(new Set(names.map(countySlug)).size, names.length);
  const stripped = normalizeCountyQuery("county");
  assert.strictEqual(stripped, "");
}

function testCensusDuplicatesAndFilter() {
  const text = [
    "STATE|STATEFP|COUNTYFP|COUNTYNS|COUNTYNAME|CLASSFP|FUNCSTAT",
    "PA|42|001|01213656|Adams County|H1|A",
    "PA|42|003|01213657|Allegheny County|H1|A",
    "MA|25|017|00606935|Middlesex County|H4|N",
    "PA|42|003|01213657|Allegheny County|H1|A",
    "PA|42|999|00000000|Ghost County|H1|F",
    "WY|56|001|01605068|Albany County|H1|A",
  ].join("\n");
  const pa = parseCensusCountyFile(text, ["PA"]);
  assert.strictEqual(pa.length, 2);
  const ma = parseCensusCountyFile(text, ["MA"]);
  assert.strictEqual(ma.length, 1);
  assert.strictEqual(ma[0].slug, "middlesex-county");
  assert.strictEqual(new Set(pa.map((c) => c.slug)).size, 2);
  assert.ok(pa.every((c) => c.state === "PA"));
  assert.ok(pa.every((c) => c.sourceName === "U.S. Census Bureau"));
  assert.ok(pa.every((c) => c.sourceUrl && c.lastVerified));
}

function testElectionNormalizationAndDates() {
  const verified = new Date("2026-09-28T15:00:00.000Z");
  const { elections, missingFields } = normalizeFecStatewideDates(
    [
      {
        election_date: "2026-11-03",
        election_state: "PA",
        election_type_full: "General election",
        election_type_id: "G",
        election_year: 2026,
        office_sought: "H",
      },
      {
        election_date: "2026-11-03",
        election_state: "PA",
        election_type_full: "General election",
        election_type_id: "G",
        election_year: 2026,
        office_sought: "S",
      },
      {
        election_date: "not-a-date",
        election_state: "PA",
        election_type_full: "Primary election",
        election_type_id: "P",
      },
      {
        election_date: "2026-05-19",
        election_state: "PA",
        election_type_full: "Primary election",
        election_type_id: "P",
        election_year: 2026,
      },
    ],
    ["allegheny-county", "adams-county"],
    verified
  );
  assert.strictEqual(missingFields, 1);
  assert.strictEqual(elections.length, 4);
  assert.strictEqual(new Set(elections.map((e) => e.sourceKey)).size, 4);
  assert.ok(elections.every((e) => e.sourceName === FEC_SOURCE_NAME && e.sourceUrl));
  assert.ok(elections.every((e) => e.lastVerified));
  assert.ok(elections.every((e) => e.office === null));
  assert.strictEqual(parseIsoDate("2026-11-03")?.toISOString().slice(0, 10), "2026-11-03");
  assert.strictEqual(parseIsoDate("November 3"), null);
  assert.strictEqual(electionStatus(new Date("2020-01-01T12:00:00Z"), new Date("2026-09-28")), "completed");
}

function testIdempotentKeys() {
  const a = electionSourceKey(["fec", "PA", "2026-11-03", "G", "allegheny-county"]);
  const b = electionSourceKey(["FEC", "pa", "2026-11-03", "G", "Allegheny-County"]);
  assert.strictEqual(a, b);
}

function testProvenance() {
  assert.strictEqual(isCompiledSource(COMPILED_SOURCE_NAME), true);
  assert.strictEqual(isOfficialSource(COMPILED_SOURCE_NAME), false);
  assert.strictEqual(isOfficialSource(FEC_SOURCE_NAME), true);
  assert.strictEqual(isOfficialSource(null), false);
  const url = redactUrl("https://api.open.fec.gov/v1/election-dates/?api_key=secret-value&election_state=PA");
  assert.ok(!url.includes("secret-value"));
  assert.ok(url.includes("REDACTED"));
}

function testFailedAndEmptySources() {
  const verified = new Date();
  const empty = normalizeFecStatewideDates([], ["allegheny-county"], verified);
  assert.strictEqual(empty.elections.length, 0);
  assert.strictEqual(empty.missingFields, 0);
  const failedShape = { elections: [] as const, error: "HTTP 500" };
  assert.strictEqual(failedShape.elections.length, 0);
}

function testCoverage() {
  assert.strictEqual(
    coverageFromCounts({
      countyCount: 0,
      expectedCountyCount: null,
      officialElectionCount: 0,
      compiledElectionCount: 0,
      eventCount: 0,
      countiesWithOfficialElections: 0,
    }),
    "NONE"
  );
  assert.strictEqual(
    coverageFromCounts({
      countyCount: 67,
      expectedCountyCount: 67,
      officialElectionCount: 2,
      compiledElectionCount: 2,
      eventCount: 1,
      countiesWithOfficialElections: 2,
    }),
    "PARTIAL"
  );
  assert.strictEqual(
    coverageFromCounts({
      countyCount: 67,
      expectedCountyCount: 67,
      officialElectionCount: 134,
      compiledElectionCount: 2,
      eventCount: 1,
      countiesWithOfficialElections: 67,
    }),
    "FULL"
  );
}

function testCompiledOverlayLabeled() {
  const pa = compiledOverlayForState("PA");
  assert.ok(pa.elections.length >= 1);
  assert.ok(pa.elections.every((e) => e.sourceName === COMPILED_SOURCE_NAME));
  assert.ok(pa.elections.every((e) => e.sourceUrl === null));
  assert.ok(pa.elections.every((e) => e.lastVerified === null));
  const allegheny = compiledOverlayForState("PA", "allegheny");
  assert.ok(allegheny.elections.every((e) => e.countySlug === "allegheny-county"));
  const wy = compiledOverlayForState("WY");
  assert.strictEqual(wy.elections.length, 0);
  assert.strictEqual(wy.events.length, 0);
}

function testPriorityStatesHaveOfficialRegistry() {
  for (const code of ["PA", "MA", "CA", "NY", "TX", "FL", "IL", "OH", "GA", "MI"]) {
    const sources = sourcesForState(code);
    assert.ok(sources.length >= 1, code);
    assert.ok(sources[0].sourceUrl.startsWith("http"));
    assert.ok(!sources[0].sourceUrl.includes("ballotpedia"));
    assert.ok(!sources[0].sourceUrl.includes("wikipedia"));
  }
  assert.ok(enabledSources().every((s) => s.enabled));
  assert.strictEqual(sourcesForState("WY").length, 0);
}

function testValidationAndWyomingCompiledAbsence() {
  const v = validateStateRecords({
    stateCode: "PA",
    counties: [
      { slug: "adams-county", state: "PA" },
      { slug: "allegheny-county", state: "PA" },
    ],
    elections: [
      {
        sourceKey: "a",
        sourceName: FEC_SOURCE_NAME,
        sourceUrl: "https://www.fec.gov/",
        electionDate: new Date("2026-11-03"),
        countySlug: "adams-county",
      },
      {
        sourceKey: "a",
        sourceName: FEC_SOURCE_NAME,
        sourceUrl: "https://www.fec.gov/",
        electionDate: new Date("2026-11-03"),
        countySlug: "adams-county",
      },
    ],
    events: [],
    coverage: "PARTIAL",
  });
  assert.strictEqual(v.duplicateElections, 1);
  assert.strictEqual(v.missingSourceUrls, 0);
  assert.strictEqual(getElectionsForCounty("Wyoming", "Albany County").length, 0);
}

function testLastVerifiedHandling() {
  const official = compiledOverlayForState("PA").elections[0];
  assert.strictEqual(official.lastVerified, null);
  const fec = normalizeFecStatewideDates(
    [
      {
        election_date: "2026-11-03",
        election_state: "PA",
        election_type_full: "General election",
        election_type_id: "G",
        election_year: 2026,
      },
    ],
    ["allegheny-county"],
    new Date("2026-09-28T12:00:00Z")
  ).elections[0];
  assert.ok(fec.lastVerified);
}

const tests = [
  testCountyNormalization,
  testCountySearch,
  testCensusDuplicatesAndFilter,
  testElectionNormalizationAndDates,
  testIdempotentKeys,
  testProvenance,
  testFailedAndEmptySources,
  testCoverage,
  testCompiledOverlayLabeled,
  testPriorityStatesHaveOfficialRegistry,
  testValidationAndWyomingCompiledAbsence,
  testLastVerifiedHandling,
];

for (const test of tests) {
  test();
  console.log(`ok ${test.name}`);
}
console.log(`${tests.length} tests passed`);
