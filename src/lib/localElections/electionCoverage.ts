import { getPrisma } from "@/lib/db";
import { LOCAL_CALENDAR_SOURCES } from "./calendarSources";
import { PA_COUNTY_BOARD_SOURCES } from "./inventories/paCountyBoards";
import { stateAuthorityInventory } from "./inventories/stateAuthorities";
import { COMPILED_SOURCE_NAME, FEC_SOURCE_NAME } from "./types";
import type { LayerCoverage, SourceInventoryStatus } from "./types";

export type StateLevelCoverage = {
  stateCode: string;
  federal: { status: LayerCoverage; detail: string };
  statewide: { status: LayerCoverage; detail: string };
  legislature: { status: LayerCoverage; detail: string };
  ballotMeasures: { status: LayerCoverage; detail: string };
  county: { status: LayerCoverage; detail: string };
  authorityName: string | null;
  authorityUrl: string | null;
  authorityStatus: SourceInventoryStatus | null;
};

function layer(count: number, complete: boolean): LayerCoverage {
  if (!count) return "NONE";
  if (complete) return "COMPLETE";
  return "PARTIAL";
}

export async function getStateLevelCoverage(stateCode: string): Promise<StateLevelCoverage> {
  const code = stateCode.toUpperCase();
  const authority = stateAuthorityInventory().find((r) => r.stateCode === code) || null;
  const empty: StateLevelCoverage = {
    stateCode: code,
    federal: { status: "NONE", detail: "Official federal election dates are not currently available." },
    statewide: { status: "NONE", detail: "Official statewide calendar data is not currently available." },
    legislature: { status: "NONE", detail: "Official state legislative election data is not currently available." },
    ballotMeasures: { status: "NONE", detail: "Official statewide ballot-measure data is not currently available." },
    county: { status: "NONE", detail: "Official county election data is not currently available." },
    authorityName: authority?.authorityName || null,
    authorityUrl: authority?.sourceUrl || null,
    authorityStatus: authority?.sourceStatus || null,
  };
  const prisma = await getPrisma();
  if (!prisma?.localCounty) return empty;
  try {
    const counties = await prisma.localCounty.findMany({
      where: { state: code },
      include: { elections: true, events: true },
    });
    if (!counties.length) return empty;
    const statewideNames = new Set(
      LOCAL_CALENDAR_SOURCES.filter((s) => (s.calendarLayer || "statewide") === "statewide").map(
        (s) => s.sourceName
      )
    );
    const fecCount = counties.filter((c: any) =>
      (c.elections || []).some((e: any) => e.sourceName === FEC_SOURCE_NAME)
    ).length;
    const calendarCount = counties.filter((c: any) =>
      (c.events || []).some((e: any) => e.sourceName && statewideNames.has(e.sourceName))
    ).length;
    const statewideContests = prisma.localElection
      ? await prisma.localElection.findMany({
          where: {
            state: code,
            recordKind: { in: ["CONTEST", "MEASURE"] },
          },
          select: {
            electionName: true,
            office: true,
            chamber: true,
            electionCategory: true,
            recordKind: true,
            sourceName: true,
          },
        })
      : [];
    const legislative = statewideContests.filter(
      (e: any) =>
        e.electionCategory !== "FEDERAL" &&
        /senate|house of representatives|state assembly|house of delegates|general assembly/i.test(
          `${e.electionName || ""} ${e.office || ""} ${e.chamber || ""}`
        )
    ).length;
    const measures = statewideContests.filter(
      (e: any) =>
        (e.electionCategory === "BALLOT_MEASURE" || e.recordKind === "MEASURE") &&
        e.sourceName !== COMPILED_SOURCE_NAME
    ).length;
    const executive = statewideContests.filter(
      (e: any) => e.electionCategory === "STATE" && e.recordKind === "CONTEST"
    ).length;
    const countyBoard = PA_COUNTY_BOARD_SOURCES.filter((s) => s.stateCode === code);
    const verifiedCounty = countyBoard.filter((s) => s.status === "VERIFIED").length;
    const total = counties.length;
    return {
      stateCode: code,
      federal: {
        status: layer(fecCount, fecCount === total),
        detail: `${fecCount} / ${total} county equivalents have an official FEC federal election date.`,
      },
      statewide: {
        status: executive
          ? "PARTIAL"
          : layer(calendarCount, calendarCount === total),
        detail: executive
          ? `${executive} official statewide contest records.`
          : calendarCount > 0
            ? `${calendarCount} / ${total} county equivalents have an official statewide calendar event.`
            : "Official statewide calendar data is not currently available.",
      },
      legislature: {
        status: legislative ? "PARTIAL" : "NONE",
        detail: legislative
          ? `${legislative} official state legislative contest records.`
          : "Official state legislative election data is not currently available.",
      },
      ballotMeasures: {
        status: measures ? "LIMITED" : "NONE",
        detail: measures
          ? `${measures} official statewide ballot-measure records.`
          : "Official statewide ballot-measure data is not currently available.",
      },
      county: {
        status: layer(verifiedCounty, countyBoard.length > 0 && verifiedCounty === countyBoard.length),
        detail:
          countyBoard.length > 0
            ? `${verifiedCounty} / ${countyBoard.length} county boards have a verified official calendar. Missing data is not proof that no county election exists.`
            : "Official county election data is not currently available.",
      },
      authorityName: authority?.authorityName || null,
      authorityUrl: authority?.sourceUrl || null,
      authorityStatus: authority?.sourceStatus || null,
    };
  } catch {
    return empty;
  }
}

export function isOfficialCountySource(sourceName: string | null | undefined): boolean {
  if (!sourceName || sourceName === COMPILED_SOURCE_NAME || sourceName === FEC_SOURCE_NAME) {
    return false;
  }
  const statewide = new Set(
    LOCAL_CALENDAR_SOURCES.filter((s) => (s.calendarLayer || "statewide") === "statewide").map(
      (s) => s.sourceName
    )
  );
  return !statewide.has(sourceName);
}
