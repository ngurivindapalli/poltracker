import * as cheerio from "cheerio";
import type {
  AdapterResult,
  CalendarEventType,
  LocalElectionSource,
  NormalizedElection,
  NormalizedEvent,
} from "../types";
import { electionSourceKey, electionStatus } from "../normalize";
import { fetchOfficialText } from "../fetchOfficial";
import {
  classifyCalendarEvent,
  classifyElectionCategory,
  classifyElectionSubtype,
  isElectionDayLabel,
  parseOfficialDate,
  allowsCountyLevelIngest,
} from "../electionClassify";
import { countyOfficeFromLabel, extractCountyCalendarRows, extractDatedLocalRows } from "../discover";
import { jurisdictionTypeFromOfficialName, NYC_COUNTY_SLUGS } from "../jurisdiction";

export type CalendarRow = {
  title: string;
  date: Date;
  endDate?: Date | null;
  eventType: CalendarEventType | null;
  description?: string | null;
};

function yearFromText(_text: string, fallback: number): number {
  return fallback;
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h\d|tr)>/gi, "\n")
    .replace(/<\/td>/gi, " | ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}

export function parsePaDosTable(text: string, year: number): CalendarRow[] {
  const y = yearFromText(text, year);
  const rows: CalendarRow[] = [];
  const seen = new Set<string>();
  if (/<table/i.test(text)) {
    const $ = cheerio.load(text);
    $("table tr").each((_, tr) => {
      const cells = $(tr)
        .find("th,td")
        .map((__, td) => $(td).text().replace(/\s+/g, " ").trim())
        .get();
      if (cells.length < 2) return;
      if (/^date$/i.test(cells[0])) return;
      const date = parseOfficialDate(cells[0], y);
      const title = cells[1];
      if (!date || !title) return;
      pushRow(rows, seen, title, date);
    });
    if (rows.length) return rows;
  }
  const lineRe = /\|\s*([A-Za-z]+\.?\s+\d{1,2})\s*\|\s*([^|\n]+)\|/g;
  let match: RegExpExecArray | null;
  while ((match = lineRe.exec(text))) {
    const date = parseOfficialDate(match[1], y);
    const title = match[2].replace(/\s+/g, " ").trim();
    if (!date || !title || /subject to change/i.test(title)) continue;
    pushRow(rows, seen, title, date);
  }
  return rows;
}

export function parseTxSosDates(text: string, year: number): CalendarRow[] {
  const y = yearFromText(text, year);
  const rows: CalendarRow[] = [];
  const seen = new Set<string>();
  if (/<table/i.test(text)) {
    const $ = cheerio.load(text);
    $("table").each((_, table) => {
      const header = $(table).find("tr").first().text().replace(/\s+/g, " ").trim();
      const headerDate = header.match(
        /((?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), [A-Za-z]+ \d{1,2}, 20\d{2})/
      );
      if (headerDate && /election/i.test(header)) {
        const date = parseOfficialDate(headerDate[1], y);
        const title = header.replace(headerDate[1], "").replace(/^[-–| ]+/, "").trim() || header;
        if (date) pushRow(rows, seen, title, date);
      }
      $(table)
        .find("tr")
        .each((__, tr) => {
          const cells = $(tr)
            .find("th,td")
            .map((___, td) => $(td).text().replace(/\s+/g, " ").trim())
            .get()
            .filter(Boolean);
          if (cells.length < 2) return;
          const label = cells[0];
          const date = parseOfficialDate(cells[1], y) || parseOfficialDate(cells[cells.length - 1], y);
          if (!date || !label) return;
          if (/candidate/i.test(label)) return;
          if (
            !/register to vote|early voting|ballot by mail|apply for ballot|receive ballot/i.test(
              label
            )
          ) {
            return;
          }
          pushRow(rows, seen, label, date);
        });
    });
    if (rows.length) return rows;
  }
  const lines = stripTags(text).split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const header = line.match(
      /^(Tuesday|Saturday), ([A-Za-z]+ \d{1,2}, 20\d{2}) [-–] (.+)$/i
    );
    if (header) {
      const date = parseOfficialDate(`${header[1]}, ${header[2]}`, y);
      if (date) pushRow(rows, seen, header[3].trim(), date);
      continue;
    }
    if (!/Last Day to Register|Early Voting|Apply for Ballot|Receive Ballot by Mail/i.test(line)) {
      continue;
    }
    if (/candidate/i.test(line)) continue;
    const next = lines[i + 1] || "";
    const dateMatch = `${line} ${next}`.match(
      /((?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), [A-Za-z]+ \d{1,2}, 20\d{2}|[A-Za-z]+ \d{1,2}, 20\d{2})/
    );
    if (!dateMatch) continue;
    const date = parseOfficialDate(dateMatch[1], y);
    if (!date) continue;
    pushRow(rows, seen, line.replace(/\|/g, " ").replace(/\s+/g, " ").trim(), date);
  }
  return rows;
}

export function parseFlDosDates(text: string, year: number): CalendarRow[] {
  const y = yearFromText(text, year);
  const rows: CalendarRow[] = [];
  const seen = new Set<string>();
  const plain = stripTags(text);
  const bullets = plain.match(
    /(?:Deadline to register to vote[^\n]*|Deadline to request that ballot be mailed:[^\n]*|Early voting period[^\n]*|Election Day:[^\n]*)/gi
  ) || [];
  for (const bullet of bullets) {
    const range = bullet.match(
      /([A-Za-z]+ \d{1,2}(?:,)?(?: 20\d{2})?)\s*[–-]\s*([A-Za-z]+ \d{1,2}, 20\d{2}|[A-Za-z]+ \d{1,2})/
    );
    const single = bullet.match(/([A-Za-z]+ \d{1,2}, 20\d{2})/);
    const title = bullet.replace(/\s+/g, " ").trim();
    if (range) {
      const start = parseOfficialDate(range[1].includes("20") ? range[1] : `${range[1]}, ${y}`, y);
      const end = parseOfficialDate(range[2].includes("20") ? range[2] : `${range[2]}, ${y}`, y);
      if (start) pushRow(rows, seen, title, start, end);
      continue;
    }
    if (single) {
      const date = parseOfficialDate(single[1], y);
      if (date) pushRow(rows, seen, title, date);
    }
  }
  return rows;
}

export function parseCaSosGeneral(text: string, year: number): CalendarRow[] {
  const y = yearFromText(text, year);
  const rows: CalendarRow[] = [];
  const seen = new Set<string>();
  const specs: Array<{ re: RegExp; title: string }> = [
    {
      re: /last day to register to vote online[^.]{0,80}?is ([A-Za-z]+ \d{1,2})/i,
      title: "Last day to register to vote online for the November 3, 2026, General Election",
    },
    {
      re: /begin mailing ballots by ([A-Za-z]+ \d{1,2})/i,
      title: "County elections officials will begin mailing ballots",
    },
    {
      re: /first vote centers open for early in-person voting[^.]{0,80}?on ([A-Za-z]+ \d{1,2})/i,
      title: "First vote centers open for early in-person voting in Voter’s Choice Act counties",
    },
    {
      re: /([A-Za-z]+ \d{1,2}) is the last day to vote in-person/i,
      title: "Last day to vote in-person or return a ballot",
    },
  ];
  for (const spec of specs) {
    const match = text.match(spec.re);
    if (!match) continue;
    const date = parseOfficialDate(`${match[1]}, ${y}`, y);
    if (date) pushRow(rows, seen, spec.title, date);
  }
  return rows;
}

export function parseNycBoe(text: string, year: number): CalendarRow[] {
  const y = yearFromText(text, year);
  const rows: CalendarRow[] = [];
  const seen = new Set<string>();
  const electionDay = text.match(/Election Day is [A-Za-z]+, ([A-Za-z]+ \d{1,2}, 20\d{2})/i);
  if (electionDay) {
    const date = parseOfficialDate(electionDay[1], y);
    if (date) pushRow(rows, seen, "Election Day", date);
  }
  const early = text.match(
    /Early Voting Period is ([A-Za-z]+ \d{1,2}, 20\d{2})\s*[–-]\s*([A-Za-z]+ \d{1,2}, 20\d{2})/i
  );
  if (early) {
    const start = parseOfficialDate(early[1], y);
    const end = parseOfficialDate(early[2], y);
    if (start) pushRow(rows, seen, "Early Voting Period", start, end);
    if (end) pushRow(rows, seen, "Early voting ends", end);
  }
  return rows;
}

export function parseMiSosDates(text: string, year: number): CalendarRow[] {
  const y = yearFromText(text, year);
  const rows: CalendarRow[] = [];
  const seen = new Set<string>();
  const specs: Array<{ re: RegExp; title: string }> = [
    { re: /The next election is November Election\s*[-–]\s*\*?\*?([A-Za-z]+\.? \d{1,2}, 20\d{2})/i, title: "November Election" },
    { re: /MOVE deadline\s*\*?\*?([A-Za-z]+\.? \d{1,2}, 20\d{2})/i, title: "MOVE deadline" },
    { re: /AV ballots available for voters\s*\*?\*?([A-Za-z]+\.? \d{1,2}, 20\d{2})/i, title: "AV ballots available for voters" },
    {
      re: /early voting period:\s*\*?\*?([A-Za-z]+\.? \d{1,2})-([A-Za-z]+\.? \d{1,2}, 20\d{2})/i,
      title: "Constitutionally-mandated early voting period",
    },
    {
      re: /Last day to register to vote by mail or online\s*\*?\*?([A-Za-z]+\.? \d{1,2}, 20\d{2})/i,
      title: "Last day to register to vote by mail or online",
    },
  ];
  const plain = stripTags(text);
  for (const spec of specs) {
    const match = plain.match(spec.re) || text.match(spec.re);
    if (!match) continue;
    if (match[2]) {
      const start = parseOfficialDate(`${match[1]}, ${y}`, y);
      const end = parseOfficialDate(match[2], y);
      if (start) pushRow(rows, seen, spec.title, start, end);
      continue;
    }
    const date = parseOfficialDate(match[1], y);
    if (date) pushRow(rows, seen, spec.title, date);
  }
  return rows;
}

function isKeepableCalendarRow(row: CalendarRow): boolean {
  const keep: CalendarEventType[] = [
    "VOTER_REGISTRATION_DEADLINE",
    "ABSENTEE_APPLICATION_DEADLINE",
    "MAIL_BALLOT_RETURN_DEADLINE",
    "EARLY_VOTING_BEGINS",
    "EARLY_VOTING_ENDS",
    "ELECTION_DAY",
  ];
  return Boolean(row.eventType && keep.includes(row.eventType));
}

function pushRow(
  rows: CalendarRow[],
  seen: Set<string>,
  title: string,
  date: Date,
  endDate?: Date | null
) {
  const key = `${date.toISOString().slice(0, 10)}|${title.toLowerCase()}`;
  if (seen.has(key)) return;
  seen.add(key);
  rows.push({
    title,
    date,
    endDate: endDate || null,
    eventType: classifyCalendarEvent(title),
    description: title,
  });
}

export function parseOfficialCalendar(
  parser: string | undefined,
  text: string,
  year: number
): CalendarRow[] {
  switch (parser) {
    case "pa-dos-table":
      return parsePaDosTable(text, year);
    case "tx-sos-dates":
      return parseTxSosDates(text, year);
    case "fl-dos-dates":
      return parseFlDosDates(text, year);
    case "ca-sos-general":
      return parseCaSosGeneral(text, year);
    case "nyc-boe":
      return parseNycBoe(text, year);
    case "mi-sos-dates":
      return parseMiSosDates(text, year);
    case "pa-county-html":
      return extractCountyCalendarRows(text, year).map((row) => ({
        title: row.title,
        date: row.date,
        eventType: row.eventType,
        description: row.title,
      }));
    default:
      return [];
  }
}

export function calendarRowsToEvents(
  source: LocalElectionSource,
  countySlugs: string[],
  rows: CalendarRow[],
  verified: Date
): NormalizedEvent[] {
  const slugs = source.countySlug
    ? [source.countySlug]
    : source.parser === "nyc-boe"
      ? countySlugs.filter((slug) => NYC_COUNTY_SLUGS.includes(slug))
      : countySlugs;
  const events: NormalizedEvent[] = [];
  for (const row of rows) {
    if (source.parser !== "pa-county-html" && !isKeepableCalendarRow(row)) continue;
    for (const slug of slugs) {
      events.push({
        sourceKey: electionSourceKey([
          "calendar",
          source.parser || "official",
          source.stateCode,
          slug,
          row.date.toISOString().slice(0, 10),
          row.title,
        ]),
        state: source.stateCode,
        countySlug: slug,
        title: row.title,
        eventType: row.eventType,
        date: row.date,
        endDate: row.endDate || null,
        description: row.description || null,
        sourceName: source.sourceName,
        sourceUrl: source.sourceUrl,
        lastVerified: verified,
      });
    }
  }
  return events;
}

export async function fetchOfficialCalendar(
  source: LocalElectionSource,
  countySlugs: string[],
  year: number
): Promise<AdapterResult> {
  const fetched = await fetchOfficialText(source.sourceUrl, { timeoutMs: 20000 });
  if (fetched.ok === false) {
    return {
      adapter: "official-calendar",
      stateCode: source.stateCode,
      counties: [],
      elections: [],
      events: [],
      emptyByDesign: false,
      missingFields: 0,
      error: fetched.error,
    };
  }
  const rows = parseOfficialCalendar(source.parser, fetched.text, year);
  const verified = new Date();
  const events = calendarRowsToEvents(source, countySlugs, rows, verified);
  const elections: NormalizedElection[] = [];
  if (source.parser === "pa-county-html" && source.countySlug) {
    for (const row of extractDatedLocalRows(fetched.text, year)) {
      const category = classifyElectionCategory(row.title);
      if (!allowsCountyLevelIngest(category)) continue;
      elections.push({
        sourceKey: electionSourceKey([
          "local",
          source.parser,
          source.stateCode,
          source.countySlug,
          row.date.toISOString().slice(0, 10),
          row.title,
        ]),
        state: source.stateCode,
        countySlug: source.countySlug,
        electionName: row.title,
        electionType: row.title,
        electionCategory: category,
        subtype: classifyElectionSubtype(row.title),
        electionDate: row.date,
        office: countyOfficeFromLabel(row.title),
        description: row.title,
        jurisdictionName: source.sourceName.replace(/ Board of Elections$/i, ""),
        jurisdictionType:
          jurisdictionTypeFromOfficialName(row.title) !== "OTHER"
            ? jurisdictionTypeFromOfficialName(row.title)
            : "COUNTY",
        sourceName: source.sourceName,
        sourceUrl: source.sourceUrl,
        lastVerified: verified,
        status: electionStatus(row.date),
        recordKind: "CONTEST",
        district: null,
        chamber: null,
        externalId: null,
      });
    }
  }
  return {
    adapter: "official-calendar",
    stateCode: source.stateCode,
    counties: [],
    elections,
    events,
    emptyByDesign: rows.length === 0 && elections.length === 0,
    missingFields: 0,
  };
}

export { isElectionDayLabel };
