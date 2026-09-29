import type { CalendarEventType, ElectionCategory, ElectionSubtype } from "./types";

const MONTHS: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sept: 9,
  sep: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

export function parseOfficialDate(value: string | null | undefined, yearHint?: number): Date | null {
  if (!value) return null;
  const text = value.replace(/\./g, "").replace(/,/g, " ").replace(/\s+/g, " ").trim();
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const d = new Date(`${iso[1]}-${iso[2]}-${iso[3]}T12:00:00.000Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const long = text.match(
    /^(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)?\s*([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(\d{4})/i
  );
  if (long) {
    return ymd(Number(long[3]), MONTHS[long[1].toLowerCase()], Number(long[2]));
  }
  const shortYear = text.match(/^([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(\d{4})/i);
  if (shortYear) {
    return ymd(Number(shortYear[3]), MONTHS[shortYear[1].toLowerCase()], Number(shortYear[2]));
  }
  const monthDay = text.match(/^([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?$/i);
  if (monthDay && yearHint) {
    return ymd(yearHint, MONTHS[monthDay[1].toLowerCase()], Number(monthDay[2]));
  }
  return null;
}

function ymd(year: number, month: number | undefined, day: number): Date | null {
  if (!month || !year || !day) return null;
  const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function allowsCountyLevelIngest(category: ElectionCategory | null): boolean {
  return (
    category === "COUNTY" ||
    category === "JUDICIAL" ||
    category === "SPECIAL" ||
    category === "BALLOT_MEASURE"
  );
}

export function classifyElectionSubtype(label: string | null | undefined): ElectionSubtype | null {
  const text = (label || "").toLowerCase();
  if (!text) return null;
  if (/\brunoff\b/.test(text)) return "RUNOFF";
  if (/\bprimary\b/.test(text)) return "PRIMARY";
  if (/\bgeneral\b/.test(text)) return "GENERAL";
  if (/\bspecial\b/.test(text)) return "SPECIAL";
  return null;
}

export function classifyElectionCategory(label: string | null | undefined): ElectionCategory | null {
  const text = (label || "").toLowerCase();
  if (!text) return null;
  if (/\bfederal\b|\bcongress\b|\bu\.?s\.?\s+house\b|\bu\.?s\.?\s+senate\b/.test(text)) return "FEDERAL";
  if (/\bschool\b|\bisd\b|\bunified school\b/.test(text)) return "SCHOOL";
  if (/\bjudicial\b|\bjudge\b|\bcourt\b/.test(text)) return "JUDICIAL";
  if (/\bballot measure\b|\bproposition\b|\breferendum\b/.test(text)) return "BALLOT_MEASURE";
  if (/\bmunicipal\b|\bcity council\b|\bmayor\b|\bborough council\b/.test(text)) return "MUNICIPAL";
  if (/\btownship\b/.test(text)) return "TOWNSHIP";
  if (/\btown\b|\btown meeting\b/.test(text)) return "TOWN";
  if (/\bcounty\b|\bparish\b|\bborough president\b/.test(text)) return "COUNTY";
  if (/\bstate\b|\bgovernor\b/.test(text)) return "STATE";
  if (/\bspecial\b/.test(text)) return "SPECIAL";
  return null;
}

export function classifyCalendarEvent(label: string | null | undefined): CalendarEventType | null {
  const text = (label || "").toLowerCase();
  if (!text) return null;
  if (/candidate/.test(text) && /file|filing|place on/.test(text)) {
    return "CANDIDATE_FILING_DEADLINE";
  }
  if (/register|registration/.test(text) && /last day|deadline|close|before/.test(text)) {
    return "VOTER_REGISTRATION_DEADLINE";
  }
  if (/early voting/.test(text) && /begin|first|starts|start/.test(text)) return "EARLY_VOTING_BEGINS";
  if (/early voting/.test(text) && /end|last|concludes/.test(text)) return "EARLY_VOTING_ENDS";
  if (/early voting period/.test(text)) return "EARLY_VOTING_BEGINS";
  if (/(mail-in|mail in|absentee|vote-by-mail|vote by mail|ballot by mail)/.test(text) && /apply|application|request/.test(text)) {
    return "ABSENTEE_APPLICATION_DEADLINE";
  }
  if (/(mail-in|mail in|absentee|vote-by-mail|ballot by mail)/.test(text) && /receive|return|received/.test(text)) {
    return "MAIL_BALLOT_RETURN_DEADLINE";
  }
  if (/nominat|filing|file for|candidate/.test(text) && /last day|deadline|first day/.test(text)) {
    return "CANDIDATE_FILING_DEADLINE";
  }
  if (/primary election|general election|election day|uniform election date/.test(text)) {
    return "ELECTION_DAY";
  }
  if (/runoff/.test(text)) return "RUNOFF_DATE";
  if (/certif/.test(text)) return "CERTIFICATION_DATE";
  if (/canvass/.test(text)) return "CANVASS_DATE";
  return "OTHER";
}

export function isElectionDayLabel(label: string): boolean {
  return /^(primary election|general election|general\/special election day|election day|uniform election date)/i.test(
    label.trim()
  );
}
