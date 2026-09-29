import type { AdapterId, LocalElectionSource } from "./types";
import { PA_COUNTY_BOARD_SOURCES } from "./inventories/paCountyBoards";
import type { LocalSourceInventoryEntry } from "./inventory";

export const CALENDAR_PRIORITY_STATES = [
  "MA",
  "CA",
  "NY",
  "TX",
  "FL",
  "PA",
  "IL",
  "OH",
  "GA",
  "MI",
] as const;

function calendarSource(
  stateCode: string,
  sourceName: string,
  sourceUrl: string,
  options: {
    enabled: boolean;
    countySlug?: string;
    scope?: LocalElectionSource["scope"];
    notes?: string;
    parser?: string;
  }
): LocalElectionSource {
  return {
    stateCode,
    countySlug: options.countySlug,
    scope: options.scope || "STATE",
    sourceName,
    sourceUrl,
    sourceType: "OFFICIAL",
    enabled: options.enabled,
    adapter: "official-calendar" as AdapterId,
    notes: options.notes,
    parser: options.parser,
    calendarLayer: options.scope === "CITY" || options.scope === "TOWN" || options.scope === "TOWNSHIP"
      ? "municipal"
      : options.scope === "SCHOOL_DISTRICT"
        ? "school"
        : options.scope === "COUNTY"
          ? "county"
          : "statewide",
  };
}

/**
 * Official local-calendar sources for the priority states.
 * Enabled sources have a structured official HTML calendar that the adapter can parse.
 * Disabled sources were identified but could not be verified as machine-readable.
 */
export const LOCAL_CALENDAR_SOURCES: LocalElectionSource[] = [
  calendarSource(
    "PA",
    "Pennsylvania Department of State",
    "https://www.pa.gov/agencies/vote/elections/upcoming-elections",
    {
      enabled: true,
      parser: "pa-dos-table",
      notes: "Statewide 2026 election calendar table published by the Department of State.",
    }
  ),
  calendarSource(
    "TX",
    "Texas Secretary of State",
    "https://www.sos.state.tx.us/elections/voter/important-election-dates.shtml",
    {
      enabled: true,
      parser: "tx-sos-dates",
      notes: "Official important election dates, including uniform local election dates.",
    }
  ),
  calendarSource(
    "FL",
    "Florida Division of Elections",
    "https://dos.fl.gov/elections/for-voters/election-dates",
    {
      enabled: true,
      parser: "fl-dos-dates",
      notes: "Key 2026 registration, vote-by-mail, early voting, and election-day dates. County/municipal dates remain in a separate Local Elections Database that was not ingested.",
    }
  ),
  calendarSource(
    "CA",
    "California Secretary of State",
    "https://www.sos.ca.gov/elections/upcoming-elections/general-election-november-3-2026",
    {
      enabled: true,
      parser: "ca-sos-general",
      notes: "Key dates stated on the official November 3, 2026 general election page. Full PDF calendars were not parsed.",
    }
  ),
  calendarSource(
    "NY",
    "New York City Board of Elections",
    "https://www.vote.nyc/elections",
    {
      enabled: true,
      parser: "nyc-boe",
      scope: "CITY",
      notes: "Official NYC 2026 general election and early voting calendar. Applies only to the five NYC county equivalents.",
    }
  ),
  calendarSource(
    "MI",
    "Michigan Department of State",
    "https://www.michigan.gov/sos/elections",
    {
      enabled: false,
      parser: "mi-sos-dates",
      notes: "Official important dates exist on the SOS elections page, but automated retrieval returned HTTP 403. Manual source work required.",
    }
  ),
  calendarSource(
    "NY",
    "New York State Board of Elections",
    "https://elections.ny.gov/political-calendars",
    {
      enabled: false,
      parser: "unconfigured",
      notes: "Official political calendars are published as PDFs. Statewide HTML calendar was not machine-readable (bot protection). Manual source work required.",
    }
  ),
  calendarSource(
    "MA",
    "Massachusetts Secretary of the Commonwealth",
    "https://www.sec.state.ma.us/divisions/elections/elections-and-voting.htm",
    {
      enabled: false,
      parser: "unconfigured",
      notes: "Official elections page could not be fetched as structured calendar HTML. Massachusetts local elections are largely town-administered. Manual source work required.",
    }
  ),
  calendarSource(
    "IL",
    "Illinois State Board of Elections",
    "https://www.elections.il.gov/",
    {
      enabled: false,
      parser: "unconfigured",
      notes: "Official 2026 calendar is a PDF. HTML endpoints returned 403 during discovery. Manual source work required.",
    }
  ),
  calendarSource(
    "OH",
    "Ohio Secretary of State",
    "https://www.ohiosos.gov/elections/voting-schedule-text-only",
    {
      enabled: false,
      parser: "unconfigured",
      notes: "Official text-only voting schedule exists but the host blocked automated retrieval. Manual source work required.",
    }
  ),
  calendarSource(
    "GA",
    "Georgia Secretary of State",
    "https://sos.ga.gov/page/election-calendar-and-events",
    {
      enabled: false,
      parser: "unconfigured",
      notes: "Official calendar is a PDF summary. HTML calendar page returned 403 during discovery. Manual source work required.",
    }
  ),
];

export function enabledCalendarSources(options?: {
  states?: string[];
  force?: boolean;
  level?: "federal" | "state" | "county";
}): LocalElectionSource[] {
  const wanted = (options?.states || []).map((s) => s.toUpperCase());
  const fromInventory = PA_COUNTY_BOARD_SOURCES.filter(
    (s) => s.status === "VERIFIED" && s.accessMethod === "HTML"
  ).map(inventoryToCalendarSource);
  return [...LOCAL_CALENDAR_SOURCES, ...fromInventory].filter((s) => {
    if (wanted.length && !wanted.includes(s.stateCode)) return false;
    if (!s.enabled && !options?.force) return false;
    if (options?.level === "federal") return false;
    if (options?.level === "state") {
      return (s.calendarLayer || "statewide") === "statewide";
    }
    if (options?.level === "county") {
      return s.calendarLayer === "county" || Boolean(s.countySlug);
    }
    return true;
  });
}

function inventoryToCalendarSource(entry: LocalSourceInventoryEntry): LocalElectionSource {
  return {
    stateCode: entry.stateCode,
    countySlug: entry.countySlug,
    scope: entry.scope,
    sourceName: entry.sourceName,
    sourceUrl: entry.sourceUrl,
    sourceType: "OFFICIAL",
    enabled: true,
    adapter: "official-calendar",
    parser: "pa-county-html",
    notes: entry.notes,
    calendarLayer: "county",
  };
}

export function unconfiguredCalendarSources(): LocalElectionSource[] {
  return LOCAL_CALENDAR_SOURCES.filter((s) => !s.enabled);
}
