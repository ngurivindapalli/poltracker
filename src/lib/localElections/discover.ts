import * as cheerio from "cheerio";
import { countySlug } from "@/lib/localData/countySearch";
import { getCountiesForState } from "@/lib/localData/usCounties";
import { fetchOfficialText } from "./fetchOfficial";
import { classifyCalendarEvent, parseOfficialDate } from "./electionClassify";
import type { CalendarEventType } from "./types";
import type { LocalSourceInventoryEntry } from "./inventory";
import { PA_DOS_COUNTY_CONTACTS_URL } from "./inventory";
import type { AccessMethod, SourceInventoryStatus } from "./types";

const LOCAL_OFFICE_RE =
  /\b(municipal election|school (board|director|district)( election)?|township election|borough (council )?election|city council election|upcoming local election)\b/i;

const NAMED_LOCAL_CONTEST_RE =
  /\b(county (commissioner|executive|council|controller|treasurer|clerk|auditor|coroner|sheriff|row office)|row office|district attorney|prothonotary|register of wills|recorder of deeds|clerk of (orphans['’]? )?courts|jury commissioner)\b/i;

const MUNICIPAL_OR_SCHOOL_RE =
  /\b(city|borough|township|town|village|municipal|school board|school district|school director)\b/i;

const STATEWIDE_ONLY_RE =
  /\b(general election|primary election|last day to register|election day|mail-in|absentee|early voting)\b/i;

const MONTH_YEAR_RE =
  /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+20\d{2}\b/i;

const COUNTY_EVENT_KEEP = new Set([
  "VOTER_REGISTRATION_DEADLINE",
  "ABSENTEE_APPLICATION_DEADLINE",
  "MAIL_BALLOT_RETURN_DEADLINE",
  "EARLY_VOTING_BEGINS",
  "EARLY_VOTING_ENDS",
  "ELECTION_DAY",
  "CANDIDATE_FILING_DEADLINE",
  "RUNOFF_DATE",
  "CERTIFICATION_DATE",
]);

export function isStatewideOnlyLabel(label: string): boolean {
  const text = label.replace(/\s+/g, " ").trim();
  if (!text) return false;
  if (LOCAL_OFFICE_RE.test(text)) return false;
  return /^(20\d{2}\s+)?(general|primary)(\s+election)?$/i.test(text) || STATEWIDE_ONLY_RE.test(text);
}

export function isLocalSpecificLabel(label: string): boolean {
  return LOCAL_OFFICE_RE.test(label) || NAMED_LOCAL_CONTEST_RE.test(label);
}

export function isNamedLocalContest(label: string): boolean {
  return NAMED_LOCAL_CONTEST_RE.test(label);
}

export function isMunicipalOrSchoolContest(label: string): boolean {
  return MUNICIPAL_OR_SCHOOL_RE.test(label);
}

export function countyOfficeFromLabel(label: string): string | null {
  const match = label.match(NAMED_LOCAL_CONTEST_RE);
  if (!match) return null;
  return match[0].replace(/\s+/g, " ").trim().replace(/^\w/, (c) => c.toUpperCase());
}

export function findExplicitDate(text: string): Date | null {
  const match = text.match(MONTH_YEAR_RE);
  return match ? parseOfficialDate(match[0]) : null;
}

export function classifyFetchedSource(input: {
  statusCode: number;
  url: string;
  body: string;
}): { status: SourceInventoryStatus; accessMethod: AccessMethod; notes: string } {
  const url = input.url.toLowerCase();
  const body = input.body || "";
  const head = body.slice(0, 200);
  if (input.statusCode === 401 || input.statusCode === 403 || input.statusCode === 429) {
    return { status: "BLOCKED", accessMethod: "UNKNOWN", notes: `HTTP ${input.statusCode}` };
  }
  if (input.statusCode >= 400) {
    return {
      status: "UNAVAILABLE",
      accessMethod: "UNKNOWN",
      notes: `HTTP ${input.statusCode}`,
    };
  }
  if (
    /cloudflare|captcha|incapsula|access denied|bot detection/i.test(body) &&
    body.length < 8000 &&
    !LOCAL_OFFICE_RE.test(body)
  ) {
    return { status: "BLOCKED", accessMethod: "HTML", notes: "Bot protection or access wall detected." };
  }
  if (url.endsWith(".pdf") || head.startsWith("%PDF")) {
    if (/application|cancel|request|form|totals/i.test(url)) {
      return {
        status: "DISCOVERED",
        accessMethod: "PDF",
        notes: "Official PDF form or report, not a verified election calendar.",
      };
    }
    return {
      status: "PDF",
      accessMethod: "PDF",
      notes: "Official PDF. Controlled election-calendar parser not verified.",
    };
  }
  if (url.endsWith(".csv") || /^[\w,"]+,[\w,"]+/m.test(head)) {
    if (url.endsWith(".csv") || /text\/csv/i.test(head)) {
      return {
        status: "NEEDS_MANUAL_REVIEW",
        accessMethod: "CSV",
        notes: "CSV detected; election fields were not verified.",
      };
    }
  }
  try {
    const json = JSON.parse(body);
    if (json && typeof json === "object") {
      const text = JSON.stringify(json);
      if (extractDatedLocalRows(text, 2026).length || extractCountyCalendarRows(text, 2026).length) {
        return {
          status: "VERIFIED",
          accessMethod: "JSON",
          notes: "JSON response contains dated local-office or county-calendar fields.",
        };
      }
      return {
        status: "DISCOVERED",
        accessMethod: "JSON",
        notes: "JSON endpoint reached; no local-office election fields verified.",
      };
    }
  } catch {
    // HTML or other text
  }
  const localRows = extractDatedLocalRows(body, 2026);
  const calendarRows = extractCountyCalendarRows(body, 2026);
  if (localRows.length || calendarRows.length) {
    return {
      status: "VERIFIED",
      accessMethod: "HTML",
      notes: localRows.length
        ? "HTML page states a named local contest with an explicit date."
        : "HTML page states dated county-board calendar events. Statewide municipal/general labels were not treated as municipal races.",
    };
  }
  if (/election|voter|vote/i.test(body)) {
    return {
      status: "DISCOVERED",
      accessMethod: "HTML",
      notes: isLocalSpecificLabel(body)
        ? "Local-office language found without a verified dated calendar."
        : "County election office page found; no county/municipal/school election calendar verified.",
    };
  }
  return {
    status: "DISCOVERED",
    accessMethod: "HTML",
    notes: "Official website listed by the state directory; election calendar not verified.",
  };
}

export function parsePaDosCountyWebsites(
  html: string,
  countyNames: string[]
): Array<{ countyName: string; sourceUrl: string }> {
  const $ = cheerio.load(html);
  const bySlug = new Map(countyNames.map((name) => [countySlug(name), name]));
  const found = new Map<string, string>();
  $("a[href]").each((_, a) => {
    const href = ($(a).attr("href") || "").trim();
    const text = $(a).text().replace(/\s+/g, " ").trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
    if (!/website|elections|vote/i.test(text) && !/county/i.test(href)) return;
    let url = href;
    try {
      url = new URL(href, PA_DOS_COUNTY_CONTACTS_URL).toString();
    } catch {
      return;
    }
    if (!/^https?:/i.test(url)) return;
    if (/pa\.gov\/agencies\/vote/i.test(url)) return;
    const heading = $(a)
      .closest("section, article, div, li")
      .find("h2, h3, h4, strong")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim();
    const blob = `${text} ${heading} ${url}`;
    for (const name of countyNames) {
      const slug = countySlug(name);
      const short = name.replace(/\s+county$/i, "");
      if (
        new RegExp(`\\b${short.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(blob) ||
        url.toLowerCase().includes(short.toLowerCase().replace(/\s+/g, ""))
      ) {
        if (!found.has(slug)) found.set(slug, url);
      }
    }
  });
  return [...found.entries()].map(([slug, sourceUrl]) => ({
    countyName: bySlug.get(slug) || slug,
    sourceUrl,
  }));
}

export function inventoryEntryForCountyWebsite(input: {
  countyName: string;
  sourceUrl: string;
  status: SourceInventoryStatus;
  accessMethod: AccessMethod;
  notes?: string;
}): LocalSourceInventoryEntry {
  return {
    stateCode: "PA",
    jurisdiction: input.countyName,
    jurisdictionType: "COUNTY",
    countySlug: countySlug(input.countyName),
    sourceName: `${input.countyName} Board of Elections`,
    sourceUrl: input.sourceUrl,
    sourceType: "OFFICIAL",
    scope: "COUNTY",
    accessMethod: input.accessMethod,
    status: input.status,
    adapterRequired: input.status === "VERIFIED" || input.status === "PDF",
    notes: input.notes,
  };
}

export async function discoverPaCountyBoardSources(): Promise<LocalSourceInventoryEntry[]> {
  const countyNames = getCountiesForState("PA");
  const fetched = await fetchOfficialText(PA_DOS_COUNTY_CONTACTS_URL, { timeoutMs: 20000 });
  const rows: LocalSourceInventoryEntry[] = [];
  const seen = new Set<string>();
  if (fetched.ok === false) {
    for (const countyName of countyNames) {
      rows.push({
        stateCode: "PA",
        jurisdiction: countyName,
        jurisdictionType: "COUNTY",
        countySlug: countySlug(countyName),
        sourceName: `${countyName} Board of Elections`,
        sourceUrl: PA_DOS_COUNTY_CONTACTS_URL,
        sourceType: "OFFICIAL",
        scope: "COUNTY",
        accessMethod: "UNKNOWN",
        status: "UNAVAILABLE",
        adapterRequired: false,
        notes: `Could not fetch the official county-contact directory: ${fetched.error}`,
      });
    }
    return rows;
  }
  const websites = parsePaDosCountyWebsites(fetched.text, countyNames);
  const byName = new Map(websites.map((w) => [w.countyName, w.sourceUrl]));
  for (const countyName of countyNames) {
    const sourceUrl = byName.get(countyName);
    if (!sourceUrl) {
      rows.push({
        stateCode: "PA",
        jurisdiction: countyName,
        jurisdictionType: "COUNTY",
        countySlug: countySlug(countyName),
        sourceName: `${countyName} Board of Elections`,
        sourceUrl: PA_DOS_COUNTY_CONTACTS_URL,
        sourceType: "OFFICIAL",
        scope: "COUNTY",
        accessMethod: "UNKNOWN",
        status: "UNAVAILABLE",
        adapterRequired: false,
        notes:
          "Listed by the Pennsylvania Department of State as a county board of elections, but no official county website URL was extracted.",
      });
      continue;
    }
    seen.add(countyName);
    rows.push(
      inventoryEntryForCountyWebsite({
        countyName,
        sourceUrl,
        status: "DISCOVERED",
        accessMethod: "HTML",
        notes:
          "Official county website URL taken from the Pennsylvania Department of State county election officials directory. Election calendar not yet verified.",
      })
    );
  }
  return rows;
}

function eachDatedBlock(text: string, visit: (title: string) => void) {
  const $ = cheerio.load(text);
  $("table tr").each((_, tr) => {
    const title = $(tr)
      .find("th,td")
      .map((__, td) => $(td).text().replace(/\s+/g, " ").trim())
      .get()
      .filter(Boolean)
      .join(" | ");
    if (title) visit(title);
  });
  $("a, li, td, p, h1, h2, h3, h4").each((_, el) => {
    const title = $(el).text().replace(/\s+/g, " ").trim();
    if (title) visit(title);
  });
}

export function extractDatedLocalRows(text: string, _year: number): Array<{ title: string; date: Date }> {
  const rows: Array<{ title: string; date: Date }> = [];
  const seen = new Set<string>();
  eachDatedBlock(text, (title) => {
    if (!title || title.length > 280) return;
    if (!isNamedLocalContest(title)) return;
    if (isMunicipalOrSchoolContest(title)) return;
    if (/^(20\d{2}\s+)?(general|primary|municipal)(\s+election)?$/i.test(title.trim())) return;
    const date = findExplicitDate(title);
    if (!date) return;
    const key = `${date.toISOString().slice(0, 10)}|${title.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({ title, date });
  });
  return rows;
}

export function extractCountyCalendarRows(
  text: string,
  _year: number
): Array<{ title: string; date: Date; eventType: CalendarEventType | null }> {
  const rows: Array<{ title: string; date: Date; eventType: CalendarEventType | null }> = [];
  const seen = new Set<string>();
  eachDatedBlock(text, (title) => {
    if (!title || title.length > 280) return;
    const date = findExplicitDate(title);
    if (!date) return;
    const eventType = classifyCalendarEvent(title);
    if (!eventType || !COUNTY_EVENT_KEEP.has(eventType)) return;
    const key = `${date.toISOString().slice(0, 10)}|${eventType}|${title.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({ title, date, eventType });
  });
  return rows;
}

export { PA_DOS_COUNTY_CONTACTS_URL };
