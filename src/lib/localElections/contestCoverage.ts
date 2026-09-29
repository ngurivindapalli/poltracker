import { getPrisma } from "@/lib/db";
import { COMPILED_SOURCE_NAME, FEC_SOURCE_NAME } from "./types";
import { PA_COUNTY_BOARD_SOURCES } from "./inventories/paCountyBoards";
import { summarizeInventory } from "./inventory";
import { contestCoverageLabel } from "./validateContests";
import { STATE_CONTEST_STATES } from "./adapters/stateContests";

export type ContestCoverageSnapshot = {
  federalElections: number;
  federalContests: number;
  federalCandidates: number;
  presidentialContests: number;
  senateContests: number;
  houseContests: number;
  federalSpecials: number;
  federalContestCoverage: "VERIFIED" | "PARTIAL" | "NOT_IMPLEMENTED";
  stateElections: number;
  stateContests: number;
  stateExecutive: number;
  stateLegislative: number;
  stateJudicial: number;
  ballotMeasures: number;
  stateSpecials: number;
  stateCandidates: number;
  verifiedContestStates: string[];
  contestsByState: Record<string, number>;
  stateContestCoverage: Record<string, "VERIFIED" | "PARTIAL" | "NOT_IMPLEMENTED">;
  paCountySources: number;
  paVerifiedSources: number;
  paCountyElections: number;
  paCountyContests: number;
  paCountyEvents: number;
  countyContestCoverage: "PARTIAL" | "NOT_IMPLEMENTED" | "VERIFIED";
  officialElections: number;
  compiledElections: number;
  events: number;
};

function officeBlob(row: { office?: string | null; electionName?: string | null; chamber?: string | null }) {
  return `${row.office || ""} ${row.electionName || ""} ${row.chamber || ""}`;
}

export async function loadContestCoverageSnapshot(): Promise<ContestCoverageSnapshot> {
  const empty: ContestCoverageSnapshot = {
    federalElections: 0,
    federalContests: 0,
    federalCandidates: 0,
    presidentialContests: 0,
    senateContests: 0,
    houseContests: 0,
    federalSpecials: 0,
    federalContestCoverage: "NOT_IMPLEMENTED",
    stateElections: 0,
    stateContests: 0,
    stateExecutive: 0,
    stateLegislative: 0,
    stateJudicial: 0,
    ballotMeasures: 0,
    stateSpecials: 0,
    stateCandidates: 0,
    verifiedContestStates: [],
    contestsByState: { PA: 0, TX: 0, FL: 0, CA: 0 },
    stateContestCoverage: {
      PA: "NOT_IMPLEMENTED",
      TX: "NOT_IMPLEMENTED",
      FL: "NOT_IMPLEMENTED",
      CA: "NOT_IMPLEMENTED",
    },
    paCountySources: PA_COUNTY_BOARD_SOURCES.length,
    paVerifiedSources: summarizeInventory(PA_COUNTY_BOARD_SOURCES).verified,
    paCountyElections: 0,
    paCountyContests: 0,
    paCountyEvents: 0,
    countyContestCoverage: "NOT_IMPLEMENTED",
    officialElections: 0,
    compiledElections: 0,
    events: 0,
  };
  const prisma = await getPrisma();
  if (!prisma?.localElection) return empty;
  try {
    const elections: any[] = await prisma.localElection.findMany();
    const events: any[] = prisma.localEvent ? await prisma.localEvent.findMany() : [];
    const candidates: any[] = prisma.localCandidate ? await prisma.localCandidate.findMany() : [];
    const official = elections.filter((e) => e.sourceName && e.sourceName !== COMPILED_SOURCE_NAME);
    const compiled = elections.filter((e) => e.sourceName === COMPILED_SOURCE_NAME);
    const contests = official.filter((e) => e.recordKind === "CONTEST" || e.recordKind === "MEASURE");
    const federalContests = contests.filter(
      (e) => e.sourceName === FEC_SOURCE_NAME || e.electionCategory === "FEDERAL"
    );
    const stateContests = contests.filter(
      (e) => e.sourceName !== FEC_SOURCE_NAME && e.electionCategory !== "FEDERAL" && e.electionCategory !== "COUNTY"
    );
    const countyContests = contests.filter((e) => e.electionCategory === "COUNTY" && e.state === "PA");
    const federalElections = official.filter(
      (e) => e.sourceName === FEC_SOURCE_NAME && (e.recordKind || "ELECTION") === "ELECTION"
    ).length;
    const stateElections = official.filter(
      (e) =>
        e.sourceName !== FEC_SOURCE_NAME &&
        e.electionCategory === "STATE" &&
        (e.recordKind || "ELECTION") === "ELECTION"
    ).length;
    const legislative = stateContests.filter((e) =>
      /senate|house of representatives|state assembly|house of delegates|general assembly/i.test(officeBlob(e))
    );
    const executive = stateContests.filter(
      (e) =>
        e.electionCategory !== "BALLOT_MEASURE" &&
        e.electionCategory !== "JUDICIAL" &&
        e.electionCategory !== "SPECIAL" &&
        !/senate|house of representatives|state assembly|house of delegates|general assembly|proposition/i.test(
          officeBlob(e)
        )
    );
    const byState: Record<string, number> = { PA: 0, TX: 0, FL: 0, CA: 0 };
    for (const contest of stateContests) {
      if (contest.state && contest.state in byState) byState[contest.state] += 1;
    }
    const stateContestCoverage: ContestCoverageSnapshot["stateContestCoverage"] = {
      PA: contestCoverageLabel({ implemented: true, contestCount: byState.PA, verifiedSource: true }),
      TX: contestCoverageLabel({ implemented: true, contestCount: byState.TX, verifiedSource: true }),
      FL: contestCoverageLabel({ implemented: true, contestCount: byState.FL, verifiedSource: true }),
      CA: contestCoverageLabel({ implemented: true, contestCount: byState.CA, verifiedSource: true }),
    };
    const verifiedContestStates = STATE_CONTEST_STATES.filter((s) => byState[s] > 0);
    const inventory = summarizeInventory(PA_COUNTY_BOARD_SOURCES);
    return {
      federalElections,
      federalContests: federalContests.length,
      federalCandidates: candidates.filter((c) => c.sourceName === FEC_SOURCE_NAME).length,
      presidentialContests: federalContests.filter((e) => /president/i.test(officeBlob(e))).length,
      senateContests: federalContests.filter((e) => /u\.?s\.?\s+senate/i.test(officeBlob(e))).length,
      houseContests: federalContests.filter((e) => /u\.?s\.?\s+house/i.test(officeBlob(e))).length,
      federalSpecials: federalContests.filter((e) => e.subtype === "SPECIAL").length,
      federalContestCoverage: contestCoverageLabel({
        implemented: true,
        contestCount: federalContests.length,
        verifiedSource: true,
      }),
      stateElections,
      stateContests: stateContests.length,
      stateExecutive: executive.length,
      stateLegislative: legislative.length,
      stateJudicial: stateContests.filter((e) => e.electionCategory === "JUDICIAL").length,
      ballotMeasures: contests.filter((e) => e.electionCategory === "BALLOT_MEASURE" || e.recordKind === "MEASURE")
        .length,
      stateSpecials: stateContests.filter((e) => e.subtype === "SPECIAL" || e.electionCategory === "SPECIAL").length,
      stateCandidates: candidates.filter((c) => c.sourceName && c.sourceName !== FEC_SOURCE_NAME).length,
      verifiedContestStates,
      contestsByState: byState,
      stateContestCoverage,
      paCountySources: PA_COUNTY_BOARD_SOURCES.length,
      paVerifiedSources: inventory.verified,
      paCountyElections: official.filter(
        (e) => e.state === "PA" && e.electionCategory === "COUNTY" && (e.recordKind || "ELECTION") === "ELECTION"
      ).length,
      paCountyContests: countyContests.length,
      paCountyEvents: events.filter((e) =>
        PA_COUNTY_BOARD_SOURCES.some((s) => s.sourceName === e.sourceName)
      ).length,
      countyContestCoverage: countyContests.length ? "PARTIAL" : "PARTIAL",
      officialElections: official.length,
      compiledElections: compiled.length,
      events: events.length,
    };
  } catch {
    return empty;
  }
}

export function formatContestCoverageReport(snapshot: ContestCoverageSnapshot): string {
  const otherStates = "NOT IMPLEMENTED";
  return [
    "CONTEST COVERAGE",
    "================",
    "",
    "FEDERAL",
    "-------",
    `Election dates: ${snapshot.federalElections}`,
    `Federal elections: ${snapshot.federalElections}`,
    `Federal contests: ${snapshot.federalContests}`,
    `Federal candidates: ${snapshot.federalCandidates}`,
    `Presidential contests: ${snapshot.presidentialContests}`,
    `Senate contests: ${snapshot.senateContests}`,
    `House contests: ${snapshot.houseContests}`,
    `Special elections: ${snapshot.federalSpecials}`,
    `Federal contest coverage: ${snapshot.federalContestCoverage}`,
    "",
    "STATE",
    "-----",
    `Verified contest states: ${snapshot.verifiedContestStates.join(", ") || "none"}`,
    `Pennsylvania: ${snapshot.contestsByState.PA} contests (${snapshot.stateContestCoverage.PA})`,
    `Texas: ${snapshot.contestsByState.TX} contests (${snapshot.stateContestCoverage.TX})`,
    `Florida: ${snapshot.contestsByState.FL} contests (${snapshot.stateContestCoverage.FL})`,
    `California: ${snapshot.contestsByState.CA} contests (${snapshot.stateContestCoverage.CA})`,
    `State elections: ${snapshot.stateElections}`,
    `State contests: ${snapshot.stateContests}`,
    `State executive contests: ${snapshot.stateExecutive}`,
    `State legislative contests: ${snapshot.stateLegislative}`,
    `State judicial contests: ${snapshot.stateJudicial}`,
    `Ballot measures: ${snapshot.ballotMeasures}`,
    `State special elections: ${snapshot.stateSpecials}`,
    `State candidates: ${snapshot.stateCandidates}`,
    `PA: ${snapshot.stateContestCoverage.PA}`,
    `TX: ${snapshot.stateContestCoverage.TX}`,
    `FL: ${snapshot.stateContestCoverage.FL}`,
    `CA: ${snapshot.stateContestCoverage.CA}`,
    `Other states: ${otherStates}`,
    "",
    "COUNTY",
    "------",
    `PA county sources: ${snapshot.paCountySources}`,
    `PA verified sources: ${snapshot.paVerifiedSources}`,
    `PA county elections: ${snapshot.paCountyElections}`,
    `PA county contests: ${snapshot.paCountyContests}`,
    `PA county events: ${snapshot.paCountyEvents}`,
    "County contest coverage: PA: PARTIAL",
    "",
    "FULL coverage (unchanged): Census county-equivalent directory + at least one official FEC date.",
    "Contest coverage is reported separately and is not used to define FULL.",
  ].join("\n");
}
