import type {
  AccessMethod,
  JurisdictionType,
  SourceInventoryStatus,
  SourceScope,
} from "./types";

export const PA_DOS_COUNTY_CONTACTS_URL =
  "https://www.pa.gov/agencies/vote/contact-us/contact-your-election-officials";

export type LocalSourceInventoryEntry = {
  stateCode: string;
  jurisdiction: string;
  jurisdictionType: JurisdictionType;
  countySlug?: string;
  sourceName: string;
  sourceUrl: string;
  sourceType: "OFFICIAL";
  scope: SourceScope;
  accessMethod: AccessMethod;
  status: SourceInventoryStatus;
  adapterRequired: boolean;
  parser?: string;
  notes?: string;
  lastProbed?: string | null;
};

export function summarizeInventory(rows: LocalSourceInventoryEntry[]): {
  discovered: number;
  verified: number;
  blocked: number;
  pdf: number;
  unavailable: number;
  needsManualReview: number;
  county: number;
  municipal: number;
  school: number;
} {
  const count = (status: SourceInventoryStatus) =>
    rows.filter((r) => r.status === status).length;
  return {
    discovered: count("DISCOVERED"),
    verified: count("VERIFIED"),
    blocked: count("BLOCKED"),
    pdf: count("PDF"),
    unavailable: count("UNAVAILABLE"),
    needsManualReview: count("NEEDS_MANUAL_REVIEW"),
    county: rows.filter((r) => r.scope === "COUNTY").length,
    municipal: rows.filter(
      (r) => r.scope === "CITY" || r.scope === "TOWN" || r.scope === "TOWNSHIP"
    ).length,
    school: rows.filter((r) => r.scope === "SCHOOL_DISTRICT").length,
  };
}

export function formatInventoryReport(
  title: string,
  rows: LocalSourceInventoryEntry[],
  extras?: {
    countyEquivalents?: number;
    countyElections?: number;
    municipalElections?: number;
    schoolElections?: number;
  }
): string {
  const summary = summarizeInventory(rows);
  const lines = [
    title,
    "=".repeat(title.length),
    "",
    extras?.countyEquivalents != null
      ? `${extras.countyEquivalents} county equivalents`
      : "",
    `County official sources: ${summary.county}`,
    `Municipal official sources: ${summary.municipal}`,
    `School official sources: ${summary.school}`,
    extras?.countyElections != null ? `County elections: ${extras.countyElections}` : "",
    extras?.municipalElections != null
      ? `Municipal elections: ${extras.municipalElections}`
      : "",
    extras?.schoolElections != null ? `School elections: ${extras.schoolElections}` : "",
    `Verified: ${summary.verified}`,
    `Discovered: ${summary.discovered}`,
    `Blocked: ${summary.blocked}`,
    `PDF/manual: ${summary.pdf + summary.needsManualReview}`,
    `No official source found: ${summary.unavailable}`,
    "",
    "state\tjurisdiction\tjurisdictionType\tsourceName\tsourceUrl\taccessMethod\tstatus\tadapterRequired",
  ].filter((line, i, all) => line !== "" || all[i - 1] !== "");
  for (const row of rows) {
    lines.push(
      [
        row.stateCode,
        row.jurisdiction,
        row.jurisdictionType,
        row.sourceName,
        row.sourceUrl,
        row.accessMethod,
        row.status,
        row.adapterRequired ? "yes" : "no",
      ].join("\t")
    );
  }
  return lines.join("\n");
}
