import { STATE_CODE_TO_NAME } from "@/lib/localData/usCounties";
import { LOCAL_CALENDAR_SOURCES } from "../calendarSources";
import { LOCAL_ELECTION_SOURCES } from "../sources";
import type { AccessMethod, SourceInventoryStatus } from "../types";

export type StateCategory =
  | "federal"
  | "statewide-calendar"
  | "state-legislative"
  | "ballot-measure"
  | "county";

export type StateAuthorityEntry = {
  stateCode: string;
  state: string;
  authorityName: string;
  sourceUrl: string;
  sourceType: AccessMethod;
  sourceStatus: SourceInventoryStatus;
  lastVerified: null;
  notes: string;
  supportedCategories: StateCategory[];
};

function statewideCalendarFor(stateCode: string) {
  return LOCAL_CALENDAR_SOURCES.filter(
    (s) => s.stateCode === stateCode && (s.calendarLayer || "statewide") === "statewide"
  );
}

function calendarInventoryStatus(stateCode: string): {
  status: SourceInventoryStatus;
  accessMethod: AccessMethod;
  notes: string;
} | null {
  const rows = statewideCalendarFor(stateCode);
  if (!rows.length) return null;
  const enabled = rows.find((s) => s.enabled);
  if (enabled) {
    return {
      status: "VERIFIED",
      accessMethod: "HTML",
      notes: enabled.notes || "Official statewide HTML calendar parser is enabled.",
    };
  }
  const disabled = rows[0];
  const notes = (disabled.notes || "").toLowerCase();
  if (notes.includes("403") || notes.includes("blocked") || notes.includes("bot protection")) {
    return {
      status: notes.includes("pdf") ? "PDF" : "BLOCKED",
      accessMethod: notes.includes("pdf") ? "PDF" : "HTML",
      notes: disabled.notes || "Official calendar could not be retrieved.",
    };
  }
  if (notes.includes("pdf")) {
    return {
      status: "PDF",
      accessMethod: "PDF",
      notes: disabled.notes || "Official calendar is PDF and was not parsed.",
    };
  }
  return {
    status: "NEEDS_MANUAL_REVIEW",
    accessMethod: "HTML",
    notes: disabled.notes || "Official calendar identified but not verified as machine-readable.",
  };
}

export function stateAuthorityInventory(): StateAuthorityEntry[] {
  return LOCAL_ELECTION_SOURCES.filter((s) => s.adapter === "fec-statewide").map((source) => {
    const calendar = calendarInventoryStatus(source.stateCode);
    const categories: StateCategory[] = ["federal"];
    if (calendar?.status === "VERIFIED") categories.push("statewide-calendar");
    return {
      stateCode: source.stateCode,
      state: STATE_CODE_TO_NAME[source.stateCode] || source.stateCode,
      authorityName: source.sourceName,
      sourceUrl: calendar?.status === "VERIFIED"
        ? statewideCalendarFor(source.stateCode).find((s) => s.enabled)?.sourceUrl || source.sourceUrl
        : source.sourceUrl,
      sourceType: calendar?.accessMethod || "HTML",
      sourceStatus: calendar?.status || (source.notes?.toLowerCase().includes("manual") ? "NEEDS_MANUAL_REVIEW" : "DISCOVERED"),
      lastVerified: null,
      notes: calendar?.notes || source.notes || "Official state election authority listed in the FEC state-election-office directory. Statewide calendar not verified.",
      supportedCategories: categories,
    };
  });
}

export function summarizeStateAuthorities(rows = stateAuthorityInventory()) {
  const count = (status: SourceInventoryStatus) =>
    rows.filter((r) => r.sourceStatus === status).length;
  return {
    states: rows.length,
    verified: count("VERIFIED"),
    discovered: count("DISCOVERED"),
    blocked: count("BLOCKED"),
    pdf: count("PDF"),
    unavailable: count("UNAVAILABLE"),
    needsManualReview: count("NEEDS_MANUAL_REVIEW"),
    statewideCalendar: rows.filter((r) => r.supportedCategories.includes("statewide-calendar"))
      .length,
  };
}
