import type { AdapterId, LocalElectionSource } from "./types";

/**
 * Static official-source registry.
 * Dates are ingested from machine-readable government APIs (Census, FEC).
 * SOS URLs are voter-facing official calendars, not scraped for dates.
 */
export const LOCAL_ELECTION_SOURCES: LocalElectionSource[] = [
  {
    stateCode: "PA",
    scope: "STATE",
    sourceName: "Pennsylvania Department of State",
    sourceUrl: "https://www.vote.pa.gov/About-Elections/Pages/Upcoming-Elections.aspx",
    sourceType: "OFFICIAL",
    enabled: true,
    adapter: "fec-statewide",
    notes: "Statewide/federal dates from FEC election-dates. Counties from Census Bureau.",
  },
  {
    stateCode: "MA",
    scope: "STATE",
    sourceName: "Massachusetts Secretary of the Commonwealth",
    sourceUrl: "https://www.sec.state.ma.us/divisions/elections/elections-and-voting.htm",
    sourceType: "OFFICIAL",
    enabled: true,
    adapter: "fec-statewide",
  },
  {
    stateCode: "CA",
    scope: "STATE",
    sourceName: "California Secretary of State",
    sourceUrl: "https://www.sos.ca.gov/elections",
    sourceType: "OFFICIAL",
    enabled: true,
    adapter: "fec-statewide",
  },
  {
    stateCode: "NY",
    scope: "STATE",
    sourceName: "New York State Board of Elections",
    sourceUrl: "https://www.elections.ny.gov/",
    sourceType: "OFFICIAL",
    enabled: true,
    adapter: "fec-statewide",
  },
  {
    stateCode: "TX",
    scope: "STATE",
    sourceName: "Texas Secretary of State",
    sourceUrl: "https://www.sos.texas.gov/elections/voter/important-election-dates.shtml",
    sourceType: "OFFICIAL",
    enabled: true,
    adapter: "fec-statewide",
  },
  {
    stateCode: "FL",
    scope: "STATE",
    sourceName: "Florida Division of Elections",
    sourceUrl: "https://dos.fl.gov/elections/",
    sourceType: "OFFICIAL",
    enabled: true,
    adapter: "fec-statewide",
  },
  {
    stateCode: "IL",
    scope: "STATE",
    sourceName: "Illinois State Board of Elections",
    sourceUrl: "https://www.elections.il.gov/",
    sourceType: "OFFICIAL",
    enabled: true,
    adapter: "fec-statewide",
  },
  {
    stateCode: "OH",
    scope: "STATE",
    sourceName: "Ohio Secretary of State",
    sourceUrl: "https://www.ohiosos.gov/elections/",
    sourceType: "OFFICIAL",
    enabled: true,
    adapter: "fec-statewide",
  },
  {
    stateCode: "GA",
    scope: "STATE",
    sourceName: "Georgia Secretary of State",
    sourceUrl: "https://sos.ga.gov/elections",
    sourceType: "OFFICIAL",
    enabled: true,
    adapter: "fec-statewide",
  },
  {
    stateCode: "MI",
    scope: "STATE",
    sourceName: "Michigan Department of State",
    sourceUrl: "https://www.michigan.gov/sos/elections",
    sourceType: "OFFICIAL",
    enabled: true,
    adapter: "fec-statewide",
  },
];

export function enabledSources(options?: {
  states?: string[];
  force?: boolean;
}): LocalElectionSource[] {
  const wanted = (options?.states || []).map((s) => s.toUpperCase());
  return LOCAL_ELECTION_SOURCES.filter((s) => {
    if (wanted.length && !wanted.includes(s.stateCode)) return false;
    if (!s.enabled && !options?.force) return false;
    return true;
  });
}

export function sourcesForState(stateCode: string): LocalElectionSource[] {
  const code = stateCode.toUpperCase();
  return LOCAL_ELECTION_SOURCES.filter((s) => s.stateCode === code);
}

export function electionAuthorityForState(stateCode: string): LocalElectionSource | null {
  return (
    sourcesForState(stateCode).find((s) => s.adapter === "fec-statewide") ||
    sourcesForState(stateCode)[0] ||
    null
  );
}

export function adaptersForState(stateCode: string): AdapterId[] {
  const code = stateCode.toUpperCase();
  const adapters = new Set<AdapterId>(["census-counties"]);
  for (const source of sourcesForState(code)) {
    if (source.enabled) adapters.add(source.adapter);
  }
  if (enabledSources().some((s) => s.stateCode === code)) {
    adapters.add("compiled-overlay");
  }
  return [...adapters];
}
