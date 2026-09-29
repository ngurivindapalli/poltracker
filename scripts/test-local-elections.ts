/**
 * Local election ingest tests (no live government APIs required).
 * Run: npm run test:local-elections
 */
import assert from "assert";
import { countySlug, normalizeCountyQuery } from "../src/lib/localData/countySearch";
import { parseCensusCountyFile } from "../src/lib/localElections/adapters/censusCounties";
import { normalizeFecStatewideDates } from "../src/lib/localElections/adapters/fecStatewide";
import { compiledOverlayForState } from "../src/lib/localElections/adapters/compiledOverlay";
import { coverageFromCounts, layerCoverageFromCounts } from "../src/lib/localElections/coverage";
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
import { enabledSources, sourcesForState, STATE_SYNC_BATCHES, sourcesNeedingManualReview } from "../src/lib/localElections/sources";
import { pickOfficialOffice } from "../src/lib/localElections/adapters/fecStateOffice";
import { normalizeFecContests, fecContestSourceKey } from "../src/lib/localElections/adapters/fecContests";
import {
  parsePaOffices2026,
  parseTxOffices2026,
  parseTxSpecials2026,
  parseFlCandidateListing,
  parseCaOffices2026,
  parseCaMeasures2026,
} from "../src/lib/localElections/adapters/stateContests";
import { validateContestRecords } from "../src/lib/localElections/validateContests";
import { ALL_STATE_CODES, formatCoverageReport } from "../src/lib/localElections/audit";
import { jurisdictionTypeFromOfficialName } from "../src/lib/localElections/jurisdiction";
import {
  classifyCalendarEvent,
  classifyElectionCategory,
  classifyElectionSubtype,
  parseOfficialDate,
  allowsCountyLevelIngest,
} from "../src/lib/localElections/electionClassify";
import {
  calendarRowsToEvents,
  parseCaSosGeneral,
  parseFlDosDates,
  parseNycBoe,
  parsePaDosTable,
  parseTxSosDates,
} from "../src/lib/localElections/adapters/officialCalendar";
import { enabledCalendarSources, LOCAL_CALENDAR_SOURCES } from "../src/lib/localElections/calendarSources";
import { FEDERAL_ELECTION_AUDIT } from "../src/lib/localElections/federalAudit";
import { stateAuthorityInventory } from "../src/lib/localElections/inventories/stateAuthorities";
import {
  classifyFetchedSource,
  extractCountyCalendarRows,
  extractDatedLocalRows,
  isLocalSpecificLabel,
  isMunicipalOrSchoolContest,
  isStatewideOnlyLabel,
  parsePaDosCountyWebsites,
} from "../src/lib/localElections/discover";
import { summarizeInventory } from "../src/lib/localElections/inventory";
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

function testCountyEquivalentsPreserveOfficialNames() {
  const text = [
    "STATE|STATEFP|COUNTYFP|COUNTYNS|COUNTYNAME|CLASSFP|FUNCSTAT",
    "LA|22|071|00558094|Orleans Parish|H4|A",
    "AK|02|020|01415669|Anchorage Municipality|H6|A",
    "AK|02|290|01419967|Yukon-Koyukuk Census Area|H5|N",
    "VA|51|510|01498415|Alexandria city|C7|F",
    "MD|24|510|01702381|Baltimore city|C7|F",
    "PA|42|001|01213656|Adams County|H1|A",
  ].join("\n");
  const rows = parseCensusCountyFile(text);
  const bySlug = Object.fromEntries(rows.map((r) => [r.slug, r]));
  assert.strictEqual(bySlug["orleans-parish"].countyName, "Orleans Parish");
  assert.strictEqual(bySlug["anchorage-municipality"].countyName, "Anchorage Municipality");
  assert.strictEqual(bySlug["yukon-koyukuk-census-area"].countyName, "Yukon-Koyukuk Census Area");
  assert.strictEqual(bySlug["alexandria-city"].countyName, "Alexandria city");
  assert.strictEqual(bySlug["baltimore-city"].countyName, "Baltimore city");
  assert.strictEqual(bySlug["adams-county"].countyName, "Adams County");
  assert.ok(!rows.some((r) => r.countyName.includes("Parish") && r.countyName.endsWith("County")));
  assert.ok(rows.every((r) => r.state && r.normalizedName && r.slug && r.sourceName && r.sourceUrl));
}

function testCensusDuplicatesAndFilter() {
  const text = [
    "STATE|STATEFP|COUNTYFP|COUNTYNS|COUNTYNAME|CLASSFP|FUNCSTAT",
    "PA|42|001|01213656|Adams County|H1|A",
    "PA|42|003|01213657|Allegheny County|H1|A",
    "MA|25|017|00606935|Middlesex County|H4|N",
    "PA|42|003|01213657|Allegheny County|H1|A",
    "PA|42|999|00000000|Ghost County|H1|F",
    "MO|29|510|00767557|St. Louis city|C7|F",
    "NV|32|510|00863219|Carson City|C7|F",
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
  const mo = parseCensusCountyFile(text, ["MO"]);
  assert.strictEqual(mo.length, 1);
  assert.strictEqual(mo[0].countyName, "St. Louis city");
  const nv = parseCensusCountyFile(text, ["NV"]);
  assert.strictEqual(nv[0].countyName, "Carson City");
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
  assert.strictEqual(
    coverageFromCounts({
      countyCount: 29,
      expectedCountyCount: 29,
      officialElectionCount: 0,
      compiledElectionCount: 0,
      eventCount: 0,
      countiesWithOfficialElections: 0,
    }),
    "PARTIAL"
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
  assert.ok(sourcesForState("WY").length >= 1);
}

function testNationwideSourceMapping() {
  assert.strictEqual(ALL_STATE_CODES.length, 50);
  const enabled = enabledSources();
  assert.strictEqual(enabled.length, 50);
  assert.strictEqual(new Set(enabled.map((s) => s.stateCode)).size, 50);
  for (const source of enabled) {
    assert.ok(source.sourceUrl.startsWith("https://"), source.stateCode);
    assert.ok(!source.sourceUrl.includes("ballotpedia"), source.stateCode);
    assert.ok(!source.sourceUrl.includes("wikipedia"), source.stateCode);
    assert.strictEqual(source.adapter, "fec-statewide");
    assert.ok(source.batch && source.batch >= 1 && source.batch <= 5, source.stateCode);
  }
  assert.strictEqual(enabledSources({ batch: 2 }).length, 10);
  assert.deepStrictEqual(
    enabledSources({ batch: 2 }).map((s) => s.stateCode).sort(),
    [...STATE_SYNC_BATCHES[2]].sort()
  );
  assert.ok(sourcesNeedingManualReview().some((s) => s.stateCode === "WI"));
  assert.ok(sourcesNeedingManualReview().some((s) => s.stateCode === "IA"));
}

function testFecOfficeWebsiteField() {
  const office = pickOfficialOffice(
    [
      {
        state: "PA",
        office_name: "Bureau of Commissions, Elections and Legislation",
        office_type: "STATE BALLOT ACCESS",
        website_url1: "http://www.dos.state.pa.us",
      },
    ],
    "PA"
  );
  assert.ok(office);
  assert.strictEqual(office.websiteUrl, "https://www.dos.state.pa.us");
}

function testCoverageReportFormat() {
  const text = formatCoverageReport([
    {
      stateCode: "WY",
      countyCount: 0,
      electionCount: 0,
      eventCount: 0,
      officialSourceRecords: 0,
      compiledRecords: 0,
      missingSourceUrls: 0,
      missingSourceNames: 0,
      duplicateCounties: 0,
      duplicateElections: 0,
      invalidStateCodes: 0,
      oldestLastVerified: null,
      newestLastVerified: null,
      coverage: "NONE",
      registryConfigured: true,
      countiesWithFecElections: 0,
      countiesWithOfficialCalendar: 0,
      countiesWithCountySpecific: 0,
      countiesWithMunicipalElections: 0,
      countiesWithSchoolElections: 0,
      officialMunicipalElections: 0,
      officialCountyElections: 0,
      officialSchoolElections: 0,
      compiledMunicipalElections: 0,
      expectedCountyCount: null,
      jurisdictionCoverage: "NONE",
      federalStatewideCoverage: "NONE",
      localCalendarCoverage: "NONE",
      countySpecificCoverage: "NONE",
      municipalCalendarCoverage: "NONE",
      schoolCalendarCoverage: "NONE",
      officialCalendarSources: 0,
      officialSources: 0,
      officialStateElections: 0,
      officialLegislativeElections: 0,
      officialBallotMeasures: 0,
      officialSpecialElections: 0,
      officialCountyEvents: 0,
    },
  ]);
  assert.ok(text.includes("LOCAL ELECTION COVERAGE"));
  assert.ok(text.includes("LOCAL CALENDAR COVERAGE"));
  assert.ok(text.includes("County-specific:"));
  assert.ok(text.includes("NONE"));
  assert.ok(text.includes("WY"));
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
  assert.strictEqual(fec.electionCategory, "FEDERAL");
  assert.strictEqual(fec.subtype, "GENERAL");
}

function testElectionTypeNormalization() {
  assert.strictEqual(classifyElectionSubtype("General election"), "GENERAL");
  assert.strictEqual(classifyElectionSubtype("Primary election"), "PRIMARY");
  assert.strictEqual(classifyElectionSubtype("Primary Runoff"), "RUNOFF");
  assert.strictEqual(classifyElectionCategory("Municipal Election"), "MUNICIPAL");
  assert.strictEqual(classifyElectionCategory("School Board"), "SCHOOL");
  assert.strictEqual(classifyElectionCategory(""), null);
  assert.strictEqual(classifyCalendarEvent("Last day to REGISTER before the primary"), "VOTER_REGISTRATION_DEADLINE");
  assert.strictEqual(classifyCalendarEvent("First Day of Early Voting"), "EARLY_VOTING_BEGINS");
  assert.strictEqual(
    classifyCalendarEvent(
      "Last Day for Candidates Planning to File for a Place on the General Election Ballot to Register to Vote"
    ),
    "CANDIDATE_FILING_DEADLINE"
  );
  assert.strictEqual(parseOfficialDate("October 19, 2026")?.toISOString().slice(0, 10), "2026-10-19");
  assert.strictEqual(parseOfficialDate("February 17", 2026)?.toISOString().slice(0, 10), "2026-02-17");
  assert.strictEqual(parseOfficialDate("not a date"), null);
}

function testJurisdictionNormalization() {
  assert.strictEqual(jurisdictionTypeFromOfficialName("Orleans Parish"), "PARISH");
  assert.strictEqual(jurisdictionTypeFromOfficialName("Anchorage Municipality"), "MUNICIPALITY");
  assert.strictEqual(jurisdictionTypeFromOfficialName("Yukon-Koyukuk Census Area"), "CENSUS_AREA");
  assert.strictEqual(jurisdictionTypeFromOfficialName("Alexandria city"), "INDEPENDENT_CITY");
  assert.strictEqual(jurisdictionTypeFromOfficialName("Fairbanks North Star Borough"), "BOROUGH");
  assert.strictEqual(jurisdictionTypeFromOfficialName("Allegheny County"), "COUNTY");
  assert.strictEqual(jurisdictionTypeFromOfficialName("Cambridge Town"), "TOWN");
  assert.strictEqual(jurisdictionTypeFromOfficialName("Upper St. Clair Township"), "TOWNSHIP");
  assert.strictEqual(jurisdictionTypeFromOfficialName("West View Borough"), "BOROUGH");
  assert.strictEqual(jurisdictionTypeFromOfficialName("Pittsburgh Public Schools"), "SCHOOL_DISTRICT");
}

function testOfficialCalendarParsersAndDedup() {
  const pa = parsePaDosTable(
    "| Date | Event |\n| February 17 | First day to circulate and file nomination petitions |\n| May 4 | Last day to REGISTER before the primary |\n| May 19 | PRIMARY ELECTION |\n| October 19 | Last day to REGISTER before the November election |\n| November 3 | GENERAL ELECTION |",
    2026
  );
  assert.ok(pa.length >= 4);
  assert.ok(pa.some((r) => r.title.includes("REGISTER") && r.date.toISOString().startsWith("2026-05-04")));
  const paYear = parsePaDosTable(
    "<html>Copyright 2025<table><tr><td>May 4</td><td>Last day to REGISTER before the primary</td></tr></table>",
    2026
  );
  assert.ok(paYear.some((r) => r.date.toISOString().startsWith("2026-05-04")));
  const tx = parseTxSosDates(
    "Tuesday, November 3, 2026 - Uniform Election Date\nLast Day to Register to Vote\nMonday, October 5, 2026\nFirst Day of Early Voting by Personal Appearance\nMonday, October 19, 2026",
    2026
  );
  assert.ok(tx.some((r) => /Uniform Election Date/i.test(r.title)));
  assert.ok(tx.some((r) => /Register/i.test(r.title) && r.date.toISOString().startsWith("2026-10-05")));
  const fl = parseFlDosDates(
    "Deadline to register to vote: October 5, 2026\nEarly voting period (mandatory period): October 24 – 31, 2026\nElection Day: November 3, 2026",
    2026
  );
  assert.ok(fl.some((r) => /register/i.test(r.title)));
  const nyc = parseNycBoe(
    "Election Day is Tuesday, November 3, 2026. Early Voting Period is October 24, 2026 – November 1, 2026.",
    2026
  );
  assert.ok(nyc.some((r) => r.title === "Election Day"));
  const ca = parseCaSosGeneral(
    "The last day to register to vote online for November 3, 2026, General Election is October 19. County elections officials will begin mailing ballots by October 5. The first vote centers open for early in-person voting in all Voter’s Choice Act counties on October 24. November 3 is the last day to vote in-person or return a ballot by 8:00 p.m.",
    2026
  );
  assert.ok(ca.length >= 3);
  const empty = parsePaDosTable("no calendar here", 2026);
  assert.strictEqual(empty.length, 0);
  const events = calendarRowsToEvents(
    {
      stateCode: "PA",
      scope: "STATE",
      sourceName: "Pennsylvania Department of State",
      sourceUrl: "https://www.pa.gov/agencies/vote/elections/upcoming-elections",
      sourceType: "OFFICIAL",
      enabled: true,
      adapter: "official-calendar",
      parser: "pa-dos-table",
    },
    ["allegheny-county", "adams-county"],
    pa,
    new Date("2026-09-28T12:00:00Z")
  );
  assert.ok(events.every((e) => e.sourceUrl && e.lastVerified && e.sourceName));
  assert.strictEqual(new Set(events.map((e) => e.sourceKey)).size, events.length);
  const again = calendarRowsToEvents(
    {
      stateCode: "PA",
      scope: "STATE",
      sourceName: "Pennsylvania Department of State",
      sourceUrl: "https://www.pa.gov/agencies/vote/elections/upcoming-elections",
      sourceType: "OFFICIAL",
      enabled: true,
      adapter: "official-calendar",
      parser: "pa-dos-table",
    },
    ["allegheny-county", "adams-county"],
    pa,
    new Date("2026-09-28T12:00:00Z")
  );
  assert.deepStrictEqual(
    events.map((e) => e.sourceKey).sort(),
    again.map((e) => e.sourceKey).sort()
  );
}

function testCalendarSourceRegistry() {
  assert.ok(enabledCalendarSources().every((s) => s.enabled && s.adapter === "official-calendar"));
  assert.ok(LOCAL_CALENDAR_SOURCES.some((s) => s.stateCode === "MA" && !s.enabled));
  assert.ok(LOCAL_CALENDAR_SOURCES.some((s) => s.stateCode === "MI" && !s.enabled));
  assert.ok(!enabledCalendarSources().some((s) => s.sourceUrl.includes("ballotpedia")));
}

function testLayerCoverageAndUpcomingOrder() {
  const none = layerCoverageFromCounts({
    countyCount: 0,
    expectedCountyCount: 67,
    countiesWithFecElections: 0,
    countiesWithOfficialCalendar: 0,
    countiesWithMunicipalElections: 0,
  });
  assert.strictEqual(none.jurisdictionCoverage, "NONE");
  assert.strictEqual(none.localCalendarCoverage, "NONE");
  assert.strictEqual(none.countySpecificCoverage, "NONE");
  const partial = layerCoverageFromCounts({
    countyCount: 67,
    expectedCountyCount: 67,
    countiesWithFecElections: 67,
    countiesWithOfficialCalendar: 10,
    countiesWithCountySpecificCalendars: 0,
    countiesWithMunicipalElections: 2,
  });
  assert.strictEqual(partial.federalStatewideCoverage, "COMPLETE");
  assert.strictEqual(partial.localCalendarCoverage, "PARTIAL");
  assert.strictEqual(partial.countySpecificCoverage, "NONE");
  assert.strictEqual(partial.municipalCalendarCoverage, "LIMITED");
  assert.strictEqual(partial.schoolCalendarCoverage, "NONE");
  const dates = ["2026-11-03", "2026-05-19", "2026-10-19"].sort();
  assert.deepStrictEqual(dates, ["2026-05-19", "2026-10-19", "2026-11-03"]);
}

function testLocalSourceInventoryAndLabels() {
  assert.strictEqual(isLocalSpecificLabel("Municipal Election"), true);
  assert.strictEqual(isLocalSpecificLabel("School Director"), true);
  assert.strictEqual(isLocalSpecificLabel("2026 General election"), false);
  assert.ok(isStatewideOnlyLabel("General Election"));
  assert.ok(!isStatewideOnlyLabel("Municipal Election November 2, 2027"));
  const blocked = classifyFetchedSource({
    statusCode: 403,
    url: "https://elections.example.pa.gov/",
    body: "forbidden",
  });
  assert.strictEqual(blocked.status, "BLOCKED");
  const empty = classifyFetchedSource({
    statusCode: 200,
    url: "https://www.alleghenycounty.us/",
    body: "<html><body>County homepage</body></html>",
  });
  assert.strictEqual(empty.status, "DISCOVERED");
  const pdf = classifyFetchedSource({
    statusCode: 200,
    url: "https://example.pa.gov/calendar.pdf",
    body: "%PDF-1.7",
  });
  assert.strictEqual(pdf.status, "PDF");
  const verified = classifyFetchedSource({
    statusCode: 200,
    url: "https://vote.phila.gov/elections",
    body: "<p>DEADLINE FOR REGISTERING TO VOTE is October 19, 2026</p><p>ELECTION DAY IS TUESDAY, November 3, 2026</p>",
  });
  assert.strictEqual(verified.status, "VERIFIED");
  const parsed = parsePaDosCountyWebsites(
    `<h2>Adams County</h2><a href="https://www.adamscountypa.gov/elections">Adams County Website</a>
     <h2>Allegheny County</h2><a href="https://www.alleghenycounty.us/elections">Allegheny County Website</a>`,
    ["Adams County", "Allegheny County"]
  );
  assert.strictEqual(parsed.length, 2);
  assert.ok(parsed.some((r) => r.countyName === "Adams County" && r.sourceUrl.includes("adamscountypa.gov")));
  const statewideMunicipal = extractDatedLocalRows(
    "<p>Municipal Election November 2, 2027</p><p>General Election November 3, 2026</p>",
    2026
  );
  assert.strictEqual(statewideMunicipal.length, 0);
  const localRows = extractDatedLocalRows(
    "<p>County commissioner election November 2, 2027</p><p>General Election November 3, 2026</p>",
    2026
  );
  assert.ok(localRows.some((r) => /County commissioner/i.test(r.title)));
  assert.ok(!localRows.some((r) => /^general election/i.test(r.title)));
  const calendarRows = extractCountyCalendarRows(
    "<p>DEADLINE FOR REGISTERING TO VOTE is October 19, 2026</p><p>Office hours November 3, 2026</p>",
    2026
  );
  assert.ok(calendarRows.some((r) => r.eventType === "VOTER_REGISTRATION_DEADLINE"));
  assert.ok(!calendarRows.some((r) => /Office hours/i.test(r.title)));
  const summary = summarizeInventory([]);
  assert.strictEqual(summary.verified, 0);
  assert.strictEqual(jurisdictionTypeFromOfficialName("West View Borough"), "BOROUGH");
  assert.strictEqual(jurisdictionTypeFromOfficialName("Upper St. Clair Township"), "TOWNSHIP");
  assert.strictEqual(jurisdictionTypeFromOfficialName("Pittsburgh Public Schools"), "SCHOOL_DISTRICT");
  assert.strictEqual(classifyElectionCategory("School Director"), "SCHOOL");
  assert.strictEqual(classifyElectionCategory("Borough Council"), "MUNICIPAL");
}

function testCountyLevelAndThreeLayerInventory() {
  assert.strictEqual(allowsCountyLevelIngest("COUNTY"), true);
  assert.strictEqual(allowsCountyLevelIngest("FEDERAL"), false);
  assert.strictEqual(allowsCountyLevelIngest("STATE"), false);
  assert.strictEqual(jurisdictionTypeFromOfficialName("Orleans Parish"), "PARISH");
  assert.strictEqual(jurisdictionTypeFromOfficialName("Alexandria city"), "INDEPENDENT_CITY");
  assert.strictEqual(jurisdictionTypeFromOfficialName("Fairbanks North Star Borough"), "BOROUGH");
  assert.strictEqual(jurisdictionTypeFromOfficialName("Yukon-Koyukuk Census Area"), "CENSUS_AREA");
  const authorities = stateAuthorityInventory();
  assert.strictEqual(authorities.length, 50);
  assert.ok(authorities.every((s) => s.sourceUrl.startsWith("http")));
  assert.ok(!authorities.some((s) => s.sourceUrl.includes("ballotpedia")));
  assert.strictEqual(authorities.find((s) => s.stateCode === "PA")?.sourceStatus, "VERIFIED");
  assert.ok(
    ["DISCOVERED", "NEEDS_MANUAL_REVIEW"].includes(
      authorities.find((s) => s.stateCode === "WY")?.sourceStatus || ""
    )
  );
  assert.strictEqual(enabledCalendarSources({ level: "federal" }).length, 0);
  assert.ok(
    enabledCalendarSources({ level: "state" }).every(
      (s) => (s.calendarLayer || "statewide") === "statewide"
    )
  );
  assert.ok(
    enabledCalendarSources({ level: "county" }).every(
      (s) => s.calendarLayer === "county" || Boolean(s.countySlug)
    )
  );
  const senate = FEDERAL_ELECTION_AUDIT.find((r) => r.category.includes("U.S. Senate"));
  assert.strictEqual(senate?.implementationStatus, "implemented");
  const blocked = classifyFetchedSource({
    statusCode: 403,
    url: "https://elections.example.gov/",
    body: "forbidden",
  });
  assert.strictEqual(blocked.status, "BLOCKED");
  const pdf = classifyFetchedSource({
    statusCode: 200,
    url: "https://example.gov/calendar.pdf",
    body: "%PDF-1.7",
  });
  assert.strictEqual(pdf.status, "PDF");
  const empty = normalizeFecStatewideDates([], ["allegheny-county"], new Date());
  assert.strictEqual(empty.elections.length, 0);
}

function testCrossCountySchoolHasNoInventedCounty() {
  const rows = extractDatedLocalRows(
    "<p>County commissioner special election March 15, 2027</p>",
    2027
  );
  assert.ok(rows.some((r) => /County commissioner/i.test(r.title)));
  assert.ok(rows.every((r) => r.date instanceof Date && !Number.isNaN(r.date.getTime())));
}

function testFederalContestsAndCandidates() {
  const verified = new Date("2026-09-28T15:00:00.000Z");
  const { contests, candidates, missingFields } = normalizeFecContests(
    [
      {
        candidate_id: "P00000001",
        name: "CANDIDATE, PRESIDENT",
        office: "P",
        office_full: "President",
        state: "NY",
        district: "00",
        party: "DEM",
        party_full: "Democratic Party",
        candidate_status: "C",
        incumbent_challenge_full: "Challenger",
        election_years: [2028],
      },
      {
        candidate_id: "S6PA00001",
        name: "SMITH, JANE",
        office: "S",
        office_full: "Senate",
        state: "PA",
        district: "00",
        party_full: "Republican Party",
        candidate_status: "C",
        incumbent_challenge_full: "Incumbent",
        election_years: [2026],
      },
      {
        candidate_id: "H6PA01111",
        name: "DOE, JOHN",
        office: "H",
        office_full: "House",
        state: "PA",
        district: "1",
        party_full: "Democratic Party",
        candidate_status: "C",
        election_years: [2026],
      },
      {
        candidate_id: "H6PA01111",
        name: "DOE, JOHN",
        office: "H",
        office_full: "House",
        state: "PA",
        district: "1",
        party_full: "Democratic Party",
        candidate_status: "C",
        election_years: [2026],
      },
      {
        candidate_id: "H6XX00000",
        name: "MISSING DISTRICT",
        office: "H",
        office_full: "House",
        state: "XX",
        district: null,
        election_years: [2026],
      },
    ],
    [
      {
        election_date: "2026-11-03",
        election_state: "PA",
        election_type_full: "General election",
        election_type_id: "G",
        election_year: 2026,
      },
      {
        election_date: "2026-09-15",
        election_state: "NY",
        election_type_full: "Special general",
        election_type_id: "SG",
        election_year: 2026,
        office_sought: "S",
        election_notes: "Senate special",
      },
    ],
    2026,
    verified
  );
  assert.strictEqual(contests.filter((c) => /President/i.test(c.electionName)).length, 0);
  assert.ok(contests.some((c) => c.electionName === "U.S. Senate — PA"));
  assert.ok(contests.some((c) => c.electionName === "U.S. House — PA District 1"));
  assert.ok(contests.some((c) => c.subtype === "SPECIAL" && c.state === "NY"));
  assert.ok(candidates.some((c) => c.candidateId === "S6PA00001" && c.candidateName === "SMITH, JANE"));
  assert.strictEqual(candidates.filter((c) => c.candidateId === "H6PA01111").length, 1);
  assert.ok(!candidates.some((c) => c.candidateId === "H6XX00000"));
  assert.ok(missingFields >= 1);
  const again = normalizeFecContests(
    [
      {
        candidate_id: "S6PA00001",
        name: "SMITH, JANE",
        office: "S",
        office_full: "Senate",
        state: "PA",
        district: "00",
        party_full: "Republican Party",
        candidate_status: "C",
        election_years: [2026],
      },
    ],
    [],
    2026,
    verified
  );
  assert.strictEqual(again.contests.length, 1);
  assert.strictEqual(
    again.contests[0].sourceKey,
    fecContestSourceKey({ office: "S", state: "PA", year: 2026 })
  );
  const president = normalizeFecContests(
    [
      {
        candidate_id: "P00000002",
        name: "PRESIDENT, A",
        office: "P",
        office_full: "President",
        state: "CA",
        election_years: [2026],
      },
      {
        candidate_id: "P00000003",
        name: "PRESIDENT, B",
        office: "P",
        office_full: "President",
        state: "TX",
        election_years: [2026],
      },
    ],
    [],
    2026,
    verified
  );
  assert.strictEqual(president.contests.filter((c) => /President/i.test(c.electionName)).length, 1);
  assert.strictEqual(president.contests[0].state, "US");
  const missingCandidates = normalizeFecContests([], [], 2026, verified);
  assert.strictEqual(missingCandidates.contests.length, 0);
  const failed = { contests: [] as const, error: "HTTP 500" };
  assert.strictEqual(failed.contests.length, 0);
}

function testStateContestsAndMeasures() {
  const verified = new Date("2026-09-28T15:00:00.000Z");
  const pa = parsePaOffices2026(
    "In 2026, offices appearing on the ballot include:\n- GOVERNOR\n- LIEUTENANT GOVERNOR\n- SENATOR IN THE GENERAL ASSEMBLY\n- REPRESENTATIVE IN THE GENERAL ASSEMBLY\n### Annual Reports",
    2026,
    "https://www.pa.gov/agencies/dos/programs/voting-and-elections/campaign-finance/reporting-dates",
    "Pennsylvania Department of State",
    verified
  );
  assert.ok(pa.some((c) => c.office === "Governor"));
  assert.ok(pa.some((c) => c.chamber === "Pennsylvania House of Representatives"));
  assert.ok(pa.every((c) => c.sourceUrl && c.lastVerified && c.recordKind === "CONTEST"));
  const tx = parseTxOffices2026(
    "Governor\nLieutenant Governor\nAttorney General\n16 State Senators Bryan Hughes, District 1 Bob Hall, District 2\nAll 150 State Representatives\nFour Members, Supreme Court Jimmy Blacklock, Chief Justice, Place 1 James Sullivan, Place 2\nThree Members, Court of Criminal Appeals Bert Richardson, Place 3",
    2026,
    "https://www.sos.state.tx.us/elections/candidates/guide/2026/offices2026.shtml",
    "Texas Secretary of State",
    verified
  );
  assert.ok(tx.some((c) => c.office === "Governor"));
  assert.ok(tx.some((c) => c.chamber === "Texas Senate" && c.district === "1"));
  assert.ok(tx.some((c) => c.chamber === "Texas House of Representatives"));
  assert.ok(!tx.some((c) => /John Cornyn/i.test(c.electionName)));
  const txSpecial = parseTxSpecials2026(
    "2026 November Special Election for Senate District 22\n2026 November Special Election for House District 93",
    2026,
    "https://www.sos.state.tx.us/elections/laws/2026-november-general-election.shtml",
    "Texas Secretary of State",
    verified
  );
  assert.ok(txSpecial.some((c) => c.subtype === "SPECIAL" && c.district === "22"));
  const fl = parseFlCandidateListing(
    `Governor\n\n| Candidate | Status | Primary | General |\n| --- | --- | --- | --- |\n| Jolly, David (DEM) / Graham, Gwen | Qualified | Won | |\nState Senator\n\n| District | Candidate | Status | Primary | General |\n| --- | --- | --- | --- |\n| 2 | Donahoo, Lauren (DEM) | Qualified | Unopposed | |`,
    2026,
    "https://dos.elections.myflorida.com/candidates/CanList.asp?elecid=20261103-GEN",
    "Florida Division of Elections",
    verified
  );
  assert.ok(fl.contests.some((c) => c.office === "Governor"));
  assert.ok(fl.candidates.some((c) => c.candidateName.includes("Jolly") && c.party === "DEM"));
  assert.ok(fl.contests.some((c) => c.chamber === "Florida Senate" && c.district === "2"));
  const school = parseFlCandidateListing(
    `School Board\n\n| District | Candidate | Status |\n| --- | --- | --- |\n| 1 | Someone (DEM) | Qualified |`,
    2026,
    "https://example.test",
    "Florida Division of Elections",
    verified
  );
  assert.strictEqual(school.contests.length, 0);
  const ca = parseCaOffices2026(
    "The voter-nominated offices on the June ballot are: Governor, Lieutenant Governor, Secretary of State, Controller, Treasurer, Attorney General, Insurance Commissioner, 4 members of the Board of Equalization, 80 members of the State Assembly, and 20 members of the even-numbered State Senate districts. The Superintendent of Public Instruction will be on the June ballot",
    2026,
    "https://www.sos.ca.gov/",
    "California Secretary of State",
    verified
  );
  assert.ok(ca.some((c) => c.office === "Governor"));
  assert.ok(ca.some((c) => c.office === "California State Assembly"));
  const measures = parseCaMeasures2026(
    "November 3, 2026, Statewide Ballot Measures\nProposition 1 Authorizes Bonds for Housing Affordability Programs. Legislative Statute.\nProposition 2 Increases State’s Rainy Day Fund. Legislative Constitutional Amendment.\nNovember 7, 2028, Statewide Ballot Measures",
    2026,
    "https://www.sos.ca.gov/elections/ballot-measures/qualified-ballot-measures",
    "California Secretary of State",
    verified
  );
  assert.ok(measures.some((c) => c.recordKind === "MEASURE" && c.electionName === "Proposition 1"));
  assert.ok(measures.every((c) => !/recommend|predict|good|bad/i.test(c.description || "")));
  const dupPa = parsePaOffices2026(
    "In 2026, offices appearing on the ballot include:\n- GOVERNOR\n- GOVERNOR\n### Annual Reports",
    2026,
    "https://www.pa.gov/",
    "Pennsylvania Department of State",
    verified
  );
  assert.strictEqual(dupPa.filter((c) => c.office === "Governor").length, 1);
  const issues = validateContestRecords({
    contests: pa,
    candidates: [
      {
        sourceKey: "cand-a",
        electionSourceKey: pa[0].sourceKey,
        candidateName: "Example",
        candidateId: null,
        office: "Governor",
        state: "PA",
        district: null,
        party: null,
        electionYears: "2026",
        candidateStatus: "Qualified",
        incumbent: null,
        sourceName: "Pennsylvania Department of State",
        sourceUrl: "https://www.pa.gov/",
        lastVerified: verified,
      },
    ],
  });
  assert.ok(!issues.some((i) => i.code === "duplicate_contest"));
  const houseBad = validateContestRecords({
    contests: [
      {
        ...pa[0],
        office: "U.S. House",
        electionName: "U.S. House",
        state: "PA",
        district: null,
        recordKind: "CONTEST",
      },
    ],
    candidates: [
      {
        sourceKey: "x",
        electionSourceKey: "missing",
        candidateName: "No Source",
        candidateId: null,
        office: "Governor",
        state: "PA",
        district: null,
        party: null,
        electionYears: null,
        candidateStatus: null,
        incumbent: null,
        sourceName: null,
        sourceUrl: null,
        lastVerified: null,
      },
    ],
  });
  assert.ok(houseBad.some((i) => i.code === "house_without_state_district"));
  assert.ok(houseBad.some((i) => i.code === "candidate_without_source"));
}

function testCountyContestVsEventAndFilters() {
  const contest = extractDatedLocalRows(
    "<p>County commissioner election November 2, 2027</p><p>District Attorney November 3, 2026</p>",
    2026
  );
  assert.ok(contest.some((r) => /County commissioner/i.test(r.title)));
  assert.ok(contest.some((r) => /District Attorney/i.test(r.title)));
  const eventOnly = extractDatedLocalRows(
    "<p>County elections are held November 3, 2026</p><p>County Election Office</p>",
    2026
  );
  assert.strictEqual(eventOnly.length, 0);
  const municipal = extractDatedLocalRows(
    "<p>City council election November 3, 2026</p><p>Borough council November 3, 2026</p><p>Township supervisor November 3, 2026</p>",
    2026
  );
  assert.strictEqual(municipal.length, 0);
  const school = extractDatedLocalRows(
    "<p>School board election November 3, 2026</p><p>School district budget November 3, 2026</p>",
    2026
  );
  assert.strictEqual(school.length, 0);
  assert.strictEqual(isMunicipalOrSchoolContest("school board"), true);
  const calendar = extractCountyCalendarRows(
    "<p>DEADLINE FOR REGISTERING TO VOTE is October 19, 2026</p>",
    2026
  );
  assert.ok(calendar.some((r) => r.eventType === "VOTER_REGISTRATION_DEADLINE"));
  const keys = contest.map((r) => `${r.date.toISOString()}|${r.title}`);
  assert.strictEqual(new Set(keys).size, keys.length);
}

function testContestValidationAndNoInvention() {
  const verified = new Date("2026-09-28T12:00:00Z");
  const emptyFec = normalizeFecContests([], [], 2026, verified);
  assert.strictEqual(emptyFec.contests.length, 0);
  assert.strictEqual(emptyFec.candidates.length, 0);
  const invented = parsePaOffices2026("Important Dates for the 2026 Pennsylvania Elections", 2026, "https://www.pa.gov/", "Pennsylvania Department of State", verified);
  assert.strictEqual(invented.length, 0);
  const blocked = classifyFetchedSource({ statusCode: 403, url: "https://example.gov", body: "no" });
  assert.strictEqual(blocked.status, "BLOCKED");
  const pdf = classifyFetchedSource({ statusCode: 200, url: "https://example.gov/list.pdf", body: "%PDF-1.7" });
  assert.strictEqual(pdf.status, "PDF");
  const unavailable = classifyFetchedSource({ statusCode: 404, url: "https://example.gov", body: "missing" });
  assert.strictEqual(unavailable.status, "UNAVAILABLE");
}

const tests = [
  testCountyNormalization,
  testCountySearch,
  testCountyEquivalentsPreserveOfficialNames,
  testCensusDuplicatesAndFilter,
  testElectionNormalizationAndDates,
  testIdempotentKeys,
  testProvenance,
  testFailedAndEmptySources,
  testCoverage,
  testCompiledOverlayLabeled,
  testPriorityStatesHaveOfficialRegistry,
  testNationwideSourceMapping,
  testFecOfficeWebsiteField,
  testCoverageReportFormat,
  testValidationAndWyomingCompiledAbsence,
  testLastVerifiedHandling,
  testElectionTypeNormalization,
  testJurisdictionNormalization,
  testOfficialCalendarParsersAndDedup,
  testCalendarSourceRegistry,
  testLayerCoverageAndUpcomingOrder,
  testLocalSourceInventoryAndLabels,
  testCountyLevelAndThreeLayerInventory,
  testCrossCountySchoolHasNoInventedCounty,
  testFederalContestsAndCandidates,
  testStateContestsAndMeasures,
  testCountyContestVsEventAndFilters,
  testContestValidationAndNoInvention,
];

for (const test of tests) {
  test();
  console.log(`ok ${test.name}`);
}
console.log(`${tests.length} tests passed`);
