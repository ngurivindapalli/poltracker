import type { AdapterId, LocalElectionSource } from "./types";

export const STATE_SYNC_BATCHES: Record<number, string[]> = {
  1: ["PA", "MA", "CA", "NY", "TX", "FL", "IL", "OH", "GA", "MI"],
  2: ["AL", "AK", "AZ", "AR", "CO", "CT", "DE", "HI", "ID", "IN"],
  3: ["IA", "KS", "KY", "LA", "ME", "MD", "MN", "MS", "MO", "MT"],
  4: ["NE", "NV", "NH", "NJ", "NM", "NC", "ND", "OK", "OR", "RI"],
  5: ["SC", "SD", "TN", "UT", "VT", "VA", "WA", "WV", "WI", "WY"],
};

function officialStateSource(
  stateCode: string,
  sourceName: string,
  sourceUrl: string,
  batch: number,
  notes?: string
): LocalElectionSource {
  return {
    stateCode,
    scope: "STATE",
    sourceName,
    sourceUrl,
    sourceType: "OFFICIAL",
    enabled: true,
    adapter: "fec-statewide",
    batch,
    notes:
      notes ||
      "Statewide/federal dates from FEC election-dates. Counties from Census Bureau. Authority URL from FEC state-election-office.",
  };
}

/**
 * Static official-source registry.
 * Dates are ingested from machine-readable government APIs (Census, FEC).
 * Authority names/URLs come from the FEC state-election-office directory,
 * except Batch 1 voter-facing SOS pages already verified in production.
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
    batch: 1,
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
    batch: 1,
  },
  {
    stateCode: "CA",
    scope: "STATE",
    sourceName: "California Secretary of State",
    sourceUrl: "https://www.sos.ca.gov/elections",
    sourceType: "OFFICIAL",
    enabled: true,
    adapter: "fec-statewide",
    batch: 1,
  },
  {
    stateCode: "NY",
    scope: "STATE",
    sourceName: "New York State Board of Elections",
    sourceUrl: "https://www.elections.ny.gov/",
    sourceType: "OFFICIAL",
    enabled: true,
    adapter: "fec-statewide",
    batch: 1,
  },
  {
    stateCode: "TX",
    scope: "STATE",
    sourceName: "Texas Secretary of State",
    sourceUrl: "https://www.sos.texas.gov/elections/voter/important-election-dates.shtml",
    sourceType: "OFFICIAL",
    enabled: true,
    adapter: "fec-statewide",
    batch: 1,
  },
  {
    stateCode: "FL",
    scope: "STATE",
    sourceName: "Florida Division of Elections",
    sourceUrl: "https://dos.fl.gov/elections/",
    sourceType: "OFFICIAL",
    enabled: true,
    adapter: "fec-statewide",
    batch: 1,
  },
  {
    stateCode: "IL",
    scope: "STATE",
    sourceName: "Illinois State Board of Elections",
    sourceUrl: "https://www.elections.il.gov/",
    sourceType: "OFFICIAL",
    enabled: true,
    adapter: "fec-statewide",
    batch: 1,
  },
  {
    stateCode: "OH",
    scope: "STATE",
    sourceName: "Ohio Secretary of State",
    sourceUrl: "https://www.ohiosos.gov/elections/",
    sourceType: "OFFICIAL",
    enabled: true,
    adapter: "fec-statewide",
    batch: 1,
  },
  {
    stateCode: "GA",
    scope: "STATE",
    sourceName: "Georgia Secretary of State",
    sourceUrl: "https://sos.ga.gov/elections",
    sourceType: "OFFICIAL",
    enabled: true,
    adapter: "fec-statewide",
    batch: 1,
  },
  {
    stateCode: "MI",
    scope: "STATE",
    sourceName: "Michigan Department of State",
    sourceUrl: "https://www.michigan.gov/sos/elections",
    sourceType: "OFFICIAL",
    enabled: true,
    adapter: "fec-statewide",
    batch: 1,
  },
  officialStateSource("AL", "Elections Division, Office of the Secretary of State", "https://www.sos.alabama.gov", 2),
  officialStateSource("AK", "Division of Elections, Office of the Lieutenant Governor", "https://www.elections.alaska.gov", 2),
  officialStateSource("AZ", "Office of the Secretary of State", "https://www.azsos.gov", 2),
  officialStateSource("AR", "Elections Division, Office of the Secretary of State", "https://www.sos.arkansas.gov", 2),
  officialStateSource("CO", "Elections Division, Office of the Secretary of State", "https://www.sos.state.co.us", 2),
  officialStateSource("CT", "Legislation and Election Administration Division, Office of the Secretary of State", "https://www.sots.ct.gov", 2),
  officialStateSource("DE", "Office of the State Election Commissioner", "https://elections.delaware.gov", 2),
  officialStateSource("HI", "Office of Elections", "https://www.hawaii.gov/elections", 2),
  officialStateSource("ID", "Elections Division, Office of the Secretary of State", "https://www.sos.idaho.gov", 2),
  officialStateSource("IN", "Indiana Election Division, Office of the Secretary of State", "https://www.in.gov/sos/elections", 2),
  officialStateSource("IA", "Elections Division, Office of the Secretary of State", "https://sos.iowa.gov/elections", 3, "FEC state-election-office previously listed an ethics URL. This is the Iowa SOS elections page. Statewide calendar HTML was not verified. Manual source work required."),
  officialStateSource("KS", "Elections Division, Office of the Secretary of State", "https://www.sos.ks.gov", 3),
  officialStateSource("KY", "Office of the Secretary of State", "https://www.sos.ky.gov/elections", 3),
  officialStateSource("LA", "Elections Division, Office of the Secretary of State", "https://www.sos.louisiana.gov", 3),
  officialStateSource("ME", "Bureau of Corporations, Elections and Commissions, Office of the Secretary of State", "https://www.maine.gov/sos/cec/elec", 3),
  officialStateSource("MD", "State Board of Elections", "https://www.elections.maryland.gov", 3),
  officialStateSource("MN", "Election Division, Office of the Secretary of State", "https://www.sos.state.mn.us", 3),
  officialStateSource("MS", "Office of the Secretary of State", "https://www.sos.ms.gov", 3),
  officialStateSource("MO", "Elections Division, Office of the Secretary of State", "https://www.sos.mo.gov/elections", 3),
  officialStateSource("MT", "Elections Bureau, Office of the Secretary of State", "https://www.sos.mt.gov/Elections/index.asp", 3),
  officialStateSource("NE", "Elections Division, Office of the Secretary of State", "https://www.sos.ne.gov", 4),
  officialStateSource("NV", "Office of the Secretary of State", "https://www.nvsos.gov", 4),
  officialStateSource("NH", "Office of the Secretary of State", "https://www.sos.nh.gov", 4),
  officialStateSource("NJ", "Division of Elections, Office of the Secretary of State", "https://www.elections.nj.gov", 4),
  officialStateSource("NM", "Office of the Secretary of State", "https://www.sos.state.nm.us", 4),
  officialStateSource("NC", "State Board of Elections", "https://www.ncsbe.gov", 4),
  officialStateSource("ND", "Office of the Secretary of State", "https://www.sos.nd.gov", 4),
  officialStateSource("OK", "State Election Board", "https://www.elections.ok.gov", 4),
  officialStateSource("OR", "Elections Division, Office of the Secretary of State", "https://www.sos.oregon.gov", 4),
  officialStateSource("RI", "Elections Division, Office of the Secretary of State", "https://www.sos.ri.gov", 4),
  officialStateSource("SC", "State Election Commission", "https://www.scvotes.org", 5),
  officialStateSource("SD", "Office of the Secretary of State", "https://www.sdsos.gov", 5),
  officialStateSource("TN", "Elections Division, Office of the Secretary of State", "https://www.tn.gov/sos/election/index.htm", 5),
  officialStateSource("UT", "Elections Office of the Lieutenant Governor", "https://www.utah.gov/ltgovernor", 5),
  officialStateSource("VT", "Elections and Campaign Finance Division, Office of the Secretary of State", "https://www.sec.state.vt.us", 5),
  officialStateSource("VA", "Department of Elections", "https://www.elections.virginia.gov", 5),
  officialStateSource("WA", "Elections Division, Office of the Secretary of State", "https://www.sos.wa.gov/elections", 5),
  officialStateSource("WV", "Office of the Secretary of State", "https://www.wvsos.com", 5),
  officialStateSource(
    "WI",
    "Wisconsin Elections Commission",
    "https://elections.wi.gov",
    5,
    "FEC state-election-office still listed the former Government Accountability Board URL. This is the current Wisconsin Elections Commission site. Statewide calendar was not verified. Manual source work required."
  ),
  officialStateSource("WY", "Election Division, Office of the Secretary of State", "https://soswy.state.wy.us", 5),
];

export function statesForBatch(batch: number): string[] {
  return STATE_SYNC_BATCHES[batch] || [];
}

export function enabledSources(options?: {
  states?: string[];
  force?: boolean;
  batch?: number;
}): LocalElectionSource[] {
  const wanted = (options?.states || []).map((s) => s.toUpperCase());
  const batchStates = options?.batch ? new Set(statesForBatch(options.batch)) : null;
  return LOCAL_ELECTION_SOURCES.filter((s) => {
    if (wanted.length && !wanted.includes(s.stateCode)) return false;
    if (batchStates && !batchStates.has(s.stateCode)) return false;
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

export function sourcesNeedingManualReview(): LocalElectionSource[] {
  return LOCAL_ELECTION_SOURCES.filter((s) =>
    (s.notes || "").toLowerCase().includes("manual")
  );
}
