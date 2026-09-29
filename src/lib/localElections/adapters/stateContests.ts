import * as cheerio from "cheerio";
import type { ElectionCategory, NormalizedCandidate, NormalizedElection, RecordKind } from "../types";
import { electionSourceKey, electionStatus, parseIsoDate } from "../normalize";
import { classifyElectionSubtype } from "../electionClassify";
import { fetchOfficialText } from "../fetchOfficial";
import { STATE_CODE_TO_NAME } from "@/lib/localData/usCounties";

export const STATE_CONTEST_STATES = ["PA", "TX", "FL", "CA"] as const;

export type StateContestSource = {
  stateCode: string;
  sourceName: string;
  sourceUrl: string;
  parser: "pa-offices-2026" | "tx-offices-2026" | "tx-specials-2026" | "fl-canlist" | "ca-offices-2026" | "ca-measures-2026";
};

export const STATE_CONTEST_SOURCES: StateContestSource[] = [
  {
    stateCode: "PA",
    sourceName: "Pennsylvania Department of State",
    sourceUrl: "https://www.pa.gov/agencies/dos/programs/voting-and-elections/campaign-finance/reporting-dates",
    parser: "pa-offices-2026",
  },
  {
    stateCode: "TX",
    sourceName: "Texas Secretary of State",
    sourceUrl: "https://www.sos.state.tx.us/elections/candidates/guide/2026/offices2026.shtml",
    parser: "tx-offices-2026",
  },
  {
    stateCode: "TX",
    sourceName: "Texas Secretary of State",
    sourceUrl: "https://www.sos.state.tx.us/elections/laws/2026-november-general-election.shtml",
    parser: "tx-specials-2026",
  },
  {
    stateCode: "FL",
    sourceName: "Florida Division of Elections",
    sourceUrl: "https://dos.elections.myflorida.com/candidates/CanList.asp?elecid=20261103-GEN",
    parser: "fl-canlist",
  },
  {
    stateCode: "CA",
    sourceName: "California Secretary of State",
    sourceUrl:
      "https://www.sos.ca.gov/administration/news-releases-and-advisories/2026-news-releases-and-advisories/california-secretary-state-shirley-n-weber-phd-certifies-candidate-list-june-2-2026-primary-election",
    parser: "ca-offices-2026",
  },
  {
    stateCode: "CA",
    sourceName: "California Secretary of State",
    sourceUrl: "https://www.sos.ca.gov/elections/ballot-measures/qualified-ballot-measures",
    parser: "ca-measures-2026",
  },
];

const TX_SKIP_OFFICE =
  /^(all 38 united states representatives|united states senator|county judges|county courts at law|district clerks|county clerks|county treasurer|county surveyors|county commissioners|justices of the peace|family district judges|various district judges|various court of appeals justices|county civil court|probate court)/i;

const FL_KEEP_OFFICE = new Set([
  "governor",
  "lieutenant governor",
  "attorney general",
  "chief financial officer",
  "commissioner of agriculture",
  "state senator",
  "state representative",
  "supreme court justice",
]);

function contestRecord(input: {
  state: string;
  sourceKey: string;
  electionName: string;
  office: string;
  date: Date | null;
  electionType: string | null;
  category: ElectionCategory;
  subtype?: NormalizedElection["subtype"];
  district?: string | null;
  chamber?: string | null;
  sourceName: string;
  sourceUrl: string;
  verified: Date;
  description?: string | null;
  recordKind?: RecordKind;
}): NormalizedElection {
  return {
    sourceKey: input.sourceKey,
    state: input.state,
    countySlug: null,
    electionName: input.electionName,
    electionType: input.electionType,
    electionCategory: input.category,
    subtype: input.subtype || classifyElectionSubtype(input.electionType) || "GENERAL",
    electionDate: input.date,
    office: input.office,
    description: input.description || null,
    jurisdictionName: STATE_CODE_TO_NAME[input.state] || input.state,
    jurisdictionType: null,
    sourceName: input.sourceName,
    sourceUrl: input.sourceUrl,
    lastVerified: input.verified,
    status: electionStatus(input.date, input.verified),
    recordKind: input.recordKind || "CONTEST",
    district: input.district || null,
    chamber: input.chamber || null,
    externalId: input.sourceKey,
  };
}

export function parsePaOffices2026(
  text: string,
  year: number,
  sourceUrl: string,
  sourceName: string,
  verified: Date
): NormalizedElection[] {
  const general = parseIsoDate(`${year}-11-03`);
  const blockMatch = text.match(
    /In 2026, offices appearing on the ballot include:([\s\S]{0,800}?)(?:###|Annual Reports|Special Elections|$)/i
  );
  const block = blockMatch?.[1] || "";
  const names = [...block.matchAll(/\b(GOVERNOR|LIEUTENANT GOVERNOR|SENATOR IN THE GENERAL ASSEMBLY|REPRESENTATIVE IN THE GENERAL ASSEMBLY)\b/g)].map(
    (m) => m[1]
  );
  const unique = [...new Set(names)];
  return unique.map((raw) => {
    const office =
      raw === "GOVERNOR"
        ? "Governor"
        : raw === "LIEUTENANT GOVERNOR"
          ? "Lieutenant Governor"
          : raw === "SENATOR IN THE GENERAL ASSEMBLY"
            ? "Senator in the General Assembly"
            : "Representative in the General Assembly";
    const chamber =
      raw === "SENATOR IN THE GENERAL ASSEMBLY"
        ? "Pennsylvania Senate"
        : raw === "REPRESENTATIVE IN THE GENERAL ASSEMBLY"
          ? "Pennsylvania House of Representatives"
          : null;
    const category: ElectionCategory = chamber ? "STATE" : "STATE";
    return contestRecord({
      state: "PA",
      sourceKey: electionSourceKey(["state", "contest", "PA", year, office]),
      electionName: office,
      office,
      date: general,
      electionType: `${year} General Election`,
      category,
      chamber,
      sourceName,
      sourceUrl,
      verified,
    });
  });
}

export function parseTxOffices2026(
  text: string,
  year: number,
  sourceUrl: string,
  sourceName: string,
  verified: Date
): NormalizedElection[] {
  const general = parseIsoDate(`${year}-11-03`);
  const contests: NormalizedElection[] = [];
  const seen = new Set<string>();
  const push = (office: string, options?: { district?: string; chamber?: string; category?: ElectionCategory; judicial?: boolean }) => {
    const key = electionSourceKey(["state", "contest", "TX", year, office, options?.district || ""]);
    if (seen.has(key)) return;
    seen.add(key);
    contests.push(
      contestRecord({
        state: "TX",
        sourceKey: key,
        electionName: options?.district ? `${office} — District ${options.district}` : office,
        office,
        date: general,
        electionType: `${year} General Election`,
        category: options?.judicial ? "JUDICIAL" : options?.category || "STATE",
        district: options?.district || null,
        chamber: options?.chamber || null,
        sourceName,
        sourceUrl,
        verified,
      })
    );
  };

  const statewide = [
    "Governor",
    "Lieutenant Governor",
    "Attorney General",
    "Comptroller of Public Accounts",
    "Commissioner of General Land Office",
    "Commissioner of Agriculture",
    "Railroad Commissioner",
  ];
  for (const office of statewide) {
    if (new RegExp(`\\b${office}\\b`, "i").test(text)) push(office);
  }
  if (/Supreme Court/i.test(text)) {
    const block = text.match(/Supreme Court([\s\S]+?)Court of Criminal Appeals/i)?.[1] || "";
    const places = [...block.matchAll(/Place\s+(\d+)/gi)].map((m) => m[1]);
    for (const place of [...new Set(places)]) {
      push("Texas Supreme Court", { district: place, judicial: true, chamber: "Texas Supreme Court" });
    }
  }
  if (/Court of Criminal Appeals/i.test(text)) {
    const block = text.match(/Court of Criminal Appeals([\s\S]{0,400})/)?.[1] || "";
    const places = [...block.matchAll(/Place\s+(\d+)/gi)].map((m) => m[1]);
    for (const place of [...new Set(places)]) {
      push("Texas Court of Criminal Appeals", {
        district: place,
        judicial: true,
        chamber: "Texas Court of Criminal Appeals",
      });
    }
  }
  const senate = [...text.matchAll(/District\s+(\d+)/gi)];
  const senateBlock = text.match(/16 State Senators([\s\S]+?)All 150 State Representatives/i)?.[1] || "";
  const senateDistricts = [...senateBlock.matchAll(/District\s+(\d+)/gi)].map((m) => m[1]);
  for (const district of [...new Set(senateDistricts)]) {
    push("Texas Senate", { district, chamber: "Texas Senate" });
  }
  if (/All 150 State Representatives/i.test(text)) {
    push("Texas House of Representatives", { chamber: "Texas House of Representatives" });
  }
  const sboeBlock = text.match(/State Board of Education([\s\S]+?)16 State Senators/i)?.[1] || "";
  const sboeDistricts = [...sboeBlock.matchAll(/District\s+(\d+)/gi)].map((m) => m[1]);
  for (const district of [...new Set(sboeDistricts)]) {
    push("State Board of Education", { district, chamber: "State Board of Education" });
  }
  void senate;
  void TX_SKIP_OFFICE;
  return contests;
}

export function parseTxSpecials2026(
  text: string,
  year: number,
  sourceUrl: string,
  sourceName: string,
  verified: Date
): NormalizedElection[] {
  const general = parseIsoDate(`${year}-11-03`);
  const contests: NormalizedElection[] = [];
  const senate = text.match(/Special Election for Senate District\s+(\d+)/i);
  if (senate) {
    contests.push(
      contestRecord({
        state: "TX",
        sourceKey: electionSourceKey(["state", "contest", "TX", year, "special", "senate", senate[1]]),
        electionName: `Texas Senate — District ${senate[1]} (special)`,
        office: "Texas Senate",
        date: general,
        electionType: `${year} November Special Election`,
        category: "SPECIAL",
        subtype: "SPECIAL",
        district: senate[1],
        chamber: "Texas Senate",
        sourceName,
        sourceUrl,
        verified,
      })
    );
  }
  const house = text.match(/Special Election for House District\s+(\d+)/i);
  if (house) {
    contests.push(
      contestRecord({
        state: "TX",
        sourceKey: electionSourceKey(["state", "contest", "TX", year, "special", "house", house[1]]),
        electionName: `Texas House of Representatives — District ${house[1]} (special)`,
        office: "Texas House of Representatives",
        date: general,
        electionType: `${year} November Special Election`,
        category: "SPECIAL",
        subtype: "SPECIAL",
        district: house[1],
        chamber: "Texas House of Representatives",
        sourceName,
        sourceUrl,
        verified,
      })
    );
  }
  return contests;
}

function parseFlParty(raw: string): { name: string; party: string | null; incumbent: string | null } {
  const incumbent = /\*Incumbent/i.test(raw) ? "Incumbent" : null;
  const partyMatch = raw.match(/\(([A-Z]{2,4})\)/);
  const name = raw
    .replace(/\s*\*[Ii]ncumbent/, "")
    .replace(/\s*\([A-Z]{2,4}\).*$/, "")
    .replace(/\s+\/\s+.*$/, "")
    .replace(/\s+/g, " ")
    .trim();
  return { name, party: partyMatch?.[1] || null, incumbent };
}

export function parseFlCandidateListing(
  html: string,
  year: number,
  sourceUrl: string,
  sourceName: string,
  verified: Date
): { contests: NormalizedElection[]; candidates: NormalizedCandidate[] } {
  const general = parseIsoDate(`${year}-11-03`);
  const contests: NormalizedElection[] = [];
  const candidates: NormalizedCandidate[] = [];
  const seenContest = new Set<string>();
  const $ = cheerio.load(html);

  const visit = (officeRaw: string, district: string | null, candidateCell: string, status: string | null) => {
    const office = officeRaw.replace(/\s+/g, " ").trim();
    if (!FL_KEEP_OFFICE.has(office.toLowerCase())) return;
    const parsed = parseFlParty(candidateCell);
    if (!parsed.name) return;
    if (/^(candidate|status|district|circuit|-{2,})$/i.test(parsed.name)) return;
    const chamber =
      office.toLowerCase() === "state senator"
        ? "Florida Senate"
        : office.toLowerCase() === "state representative"
          ? "Florida House of Representatives"
          : null;
    const contestKey = electionSourceKey(["state", "contest", "FL", year, office, district || ""]);
    if (!seenContest.has(contestKey)) {
      seenContest.add(contestKey);
      contests.push(
        contestRecord({
          state: "FL",
          sourceKey: contestKey,
          electionName: district ? `${office} — District ${district}` : office,
          office,
          date: general,
          electionType: `${year} General Election`,
          category: office.toLowerCase().includes("supreme") ? "JUDICIAL" : "STATE",
          district,
          chamber,
          sourceName,
          sourceUrl,
          verified,
        })
      );
    }
    const candKey = electionSourceKey(["state", "candidate", "FL", contestKey, parsed.name, parsed.party || ""]);
    candidates.push({
      sourceKey: candKey,
      electionSourceKey: contestKey,
      candidateName: parsed.name,
      candidateId: null,
      office,
      state: "FL",
      district,
      party: parsed.party,
      electionYears: String(year),
      candidateStatus: status,
      incumbent: parsed.incumbent,
      sourceName,
      sourceUrl,
      lastVerified: verified,
    });
  };

  const headingOf = (value: string) => {
    const text = value.replace(/\s+/g, " ").trim();
    if (FL_KEEP_OFFICE.has(text.toLowerCase())) return text;
    return "";
  };

  let currentOffice = "";
  $("h1, h2, h3, h4, b, strong, caption, font, td, th, p, table").each((_, el) => {
    const tag = ((el as { tagName?: string }).tagName || "").toLowerCase();
    if (tag !== "table") {
      const heading = headingOf($(el).text());
      if (heading) currentOffice = heading;
      return;
    }
    const caption = headingOf($(el).find("caption").first().text());
    if (caption) currentOffice = caption;
    const headers = $(el)
      .find("tr")
      .first()
      .find("th,td")
      .map((__, td) => $(td).text().replace(/\s+/g, " ").trim().toLowerCase())
      .get();
    const districtIdx = headers.findIndex((h) => h === "district" || h === "circuit");
    const candidateIdx = headers.findIndex((h) => h.includes("candidate"));
    const statusIdx = headers.findIndex((h) => h.includes("status"));
    let lastDistrict: string | null = null;
    $(el)
      .find("tr")
      .slice(1)
      .each((__, tr) => {
        const cells = $(tr)
          .find("td")
          .map((___, td) => $(td).text().replace(/\s+/g, " ").trim())
          .get();
        if (!cells.length) return;
        if (districtIdx >= 0 && cells[districtIdx]) lastDistrict = cells[districtIdx];
        const candidateCell = candidateIdx >= 0 ? cells[candidateIdx] : cells[districtIdx >= 0 ? 1 : 0];
        const status = statusIdx >= 0 ? cells[statusIdx] || null : null;
        visit(currentOffice, lastDistrict, candidateCell, status);
      });
  });

  if (!contests.length) {
    let office = "";
    let district: string | null = null;
    const plain = html.replace(/<[^>]+>/g, "\n");
    for (const line of plain.split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean)) {
      const heading = headingOf(line);
      if (heading || /^United States /.test(line)) {
        office = heading || line;
        district = null;
        continue;
      }
      const row = line.match(/^\|\s*([^|]*?)\s*\|\s*([^|]+?)\s*\|\s*([^|]*)\|/);
      if (!row) continue;
      if (row[1] && /^\d+$/.test(row[1].trim())) district = row[1].trim();
      const candidateCell = row[1] && /^\d+$/.test(row[1].trim()) ? row[2] : row[1];
      const status = row[1] && /^\d+$/.test(row[1].trim()) ? row[3] : row[2];
      if (office) visit(office, district, candidateCell, status.trim() || null);
    }
  }

  return { contests, candidates };
}

export function parseCaOffices2026(
  text: string,
  year: number,
  sourceUrl: string,
  sourceName: string,
  verified: Date
): NormalizedElection[] {
  const general = parseIsoDate(`${year}-11-03`);
  const named = [
    "Governor",
    "Lieutenant Governor",
    "Secretary of State",
    "Controller",
    "Treasurer",
    "Attorney General",
    "Insurance Commissioner",
    "Superintendent of Public Instruction",
  ];
  const contests: NormalizedElection[] = [];
  for (const office of named) {
    if (!new RegExp(`\\b${office}\\b`, "i").test(text)) continue;
    contests.push(
      contestRecord({
        state: "CA",
        sourceKey: electionSourceKey(["state", "contest", "CA", year, office]),
        electionName: office,
        office,
        date: general,
        electionType: `${year} General Election`,
        category: "STATE",
        sourceName,
        sourceUrl,
        verified,
      })
    );
  }
  if (/Board of Equalization/i.test(text)) {
    contests.push(
      contestRecord({
        state: "CA",
        sourceKey: electionSourceKey(["state", "contest", "CA", year, "Board of Equalization"]),
        electionName: "Board of Equalization",
        office: "Board of Equalization",
        date: general,
        electionType: `${year} General Election`,
        category: "STATE",
        chamber: "Board of Equalization",
        sourceName,
        sourceUrl,
        verified,
      })
    );
  }
  if (/State Assembly/i.test(text)) {
    contests.push(
      contestRecord({
        state: "CA",
        sourceKey: electionSourceKey(["state", "contest", "CA", year, "California State Assembly"]),
        electionName: "California State Assembly",
        office: "California State Assembly",
        date: general,
        electionType: `${year} General Election`,
        category: "STATE",
        chamber: "California State Assembly",
        sourceName,
        sourceUrl,
        verified,
      })
    );
  }
  if (/State Senate/i.test(text)) {
    contests.push(
      contestRecord({
        state: "CA",
        sourceKey: electionSourceKey(["state", "contest", "CA", year, "California State Senate"]),
        electionName: "California State Senate",
        office: "California State Senate",
        date: general,
        electionType: `${year} General Election`,
        category: "STATE",
        chamber: "California State Senate",
        sourceName,
        sourceUrl,
        verified,
      })
    );
  }
  return contests;
}

export function parseCaMeasures2026(
  text: string,
  year: number,
  sourceUrl: string,
  sourceName: string,
  verified: Date
): NormalizedElection[] {
  const general = parseIsoDate(`${year}-11-03`);
  const plain = text
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
  const start = plain.search(/November 3, 2026, Statewide Ballot Measures/i);
  const end = plain.search(/November 7, 2028/i);
  const slice = start >= 0 ? plain.slice(start, end > start ? end : undefined) : plain;
  const contests: NormalizedElection[] = [];
  const seen = new Set<string>();
  const re = /Proposition\s+(\d+)\s+([^.]{8,180})/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(slice))) {
    const id = match[1];
    const title = match[2].replace(/\s+/g, " ").trim();
    if (/Authorizes Bonds|Increases|Provides|Repeals|Changes|Creates|Prohibits|Imposes|Limits|Requires|Modifies/i.test(title) === false && title.length < 8) {
      continue;
    }
    const key = electionSourceKey(["state", "measure", "CA", year, id]);
    if (seen.has(key)) continue;
    seen.add(key);
    contests.push(
      contestRecord({
        state: "CA",
        sourceKey: key,
        electionName: `Proposition ${id}`,
        office: `Proposition ${id}`,
        date: general,
        electionType: `${year} General Election`,
        category: "BALLOT_MEASURE",
        sourceName,
        sourceUrl,
        verified,
        description: title,
        recordKind: "MEASURE",
      })
    );
  }
  return contests;
}

export function parseStateContestSource(
  source: StateContestSource,
  text: string,
  year: number,
  verified: Date
): { contests: NormalizedElection[]; candidates: NormalizedCandidate[] } {
  switch (source.parser) {
    case "pa-offices-2026":
      return { contests: parsePaOffices2026(text, year, source.sourceUrl, source.sourceName, verified), candidates: [] };
    case "tx-offices-2026":
      return { contests: parseTxOffices2026(text, year, source.sourceUrl, source.sourceName, verified), candidates: [] };
    case "tx-specials-2026":
      return { contests: parseTxSpecials2026(text, year, source.sourceUrl, source.sourceName, verified), candidates: [] };
    case "fl-canlist":
      return parseFlCandidateListing(text, year, source.sourceUrl, source.sourceName, verified);
    case "ca-offices-2026":
      return { contests: parseCaOffices2026(text, year, source.sourceUrl, source.sourceName, verified), candidates: [] };
    case "ca-measures-2026":
      return { contests: parseCaMeasures2026(text, year, source.sourceUrl, source.sourceName, verified), candidates: [] };
    default:
      return { contests: [], candidates: [] };
  }
}

export async function fetchStateContests(options: {
  states?: string[];
  year: number;
}): Promise<{
  contests: NormalizedElection[];
  candidates: NormalizedCandidate[];
  missingFields: number;
  failures: string[];
  emptySources: string[];
}> {
  const wanted = (options.states || STATE_CONTEST_STATES).map((s) => s.toUpperCase());
  const sources = STATE_CONTEST_SOURCES.filter((s) => wanted.includes(s.stateCode));
  const contests: NormalizedElection[] = [];
  const candidates: NormalizedCandidate[] = [];
  const failures: string[] = [];
  const emptySources: string[] = [];
  const seen = new Set<string>();
  for (const source of sources) {
    const fetched = await fetchOfficialText(source.sourceUrl, { timeoutMs: 25000 });
    if (fetched.ok === false) {
      failures.push(`${source.stateCode} ${source.parser}: ${fetched.error}`);
      continue;
    }
    const verified = new Date();
    const parsed = parseStateContestSource(source, fetched.text, options.year, verified);
    if (!parsed.contests.length) {
      emptySources.push(`${source.stateCode} ${source.parser}`);
      continue;
    }
    for (const contest of parsed.contests) {
      if (seen.has(contest.sourceKey)) continue;
      seen.add(contest.sourceKey);
      contests.push(contest);
    }
    for (const candidate of parsed.candidates) candidates.push(candidate);
  }
  return { contests, candidates, missingFields: 0, failures, emptySources };
}
