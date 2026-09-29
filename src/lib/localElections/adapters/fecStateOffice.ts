import { FEC_API_BASE } from "../types";
import { fecApiKey } from "../fecAuth";
import { fetchOfficialJson } from "../fetchOfficial";

export type FecStateOffice = {
  state: string;
  officeName: string;
  websiteUrl: string | null;
};

type FecOfficeRow = {
  office_name?: string | null;
  office_type?: string | null;
  state?: string | null;
  website_url?: string | null;
  website_url1?: string | null;
  website_url2?: string | null;
};

type FecOfficePage = {
  pagination?: { pages?: number };
  results?: FecOfficeRow[];
};

function officeWebsite(row: FecOfficeRow): string | null {
  return normalizeWebsite(row.website_url1 || row.website_url2 || row.website_url);
}

function normalizeWebsite(url: string | null | undefined): string | null {
  const value = (url || "").trim();
  if (!value) return null;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const parsed = new URL(withScheme);
    if (parsed.protocol === "http:") parsed.protocol = "https:";
    return parsed.toString().replace(/\/$/, "") || parsed.origin;
  } catch {
    return null;
  }
}

export function pickOfficialOffice(rows: FecOfficeRow[], stateCode: string): FecStateOffice | null {
  const code = stateCode.toUpperCase();
  const matching = rows.filter((row) => (row.state || "").toUpperCase() === code);
  const ballotAccess = matching.find(
    (row) => (row.office_type || "").toUpperCase().includes("BALLOT") && officeWebsite(row)
  );
  const withSite = matching.find((row) => officeWebsite(row));
  const chosen = ballotAccess || withSite || matching[0];
  if (!chosen) return null;
  return {
    state: code,
    officeName: (chosen.office_name || "").trim() || `State election office (${code})`,
    websiteUrl: officeWebsite(chosen),
  };
}

export async function fetchFecStateOffice(stateCode: string): Promise<{
  office: FecStateOffice | null;
  error?: string;
}> {
  const code = stateCode.toUpperCase();
  const apiKey = fecApiKey();
  if (!apiKey) return { office: null, error: "FEC_API_KEY is not set" };

  const url = new URL(`${FEC_API_BASE}/state-election-office/`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("state", code);
  url.searchParams.set("per_page", "20");
  const fetched = await fetchOfficialJson<FecOfficePage>(url.toString());
  if (fetched.ok === false) return { office: null, error: fetched.error };
  return { office: pickOfficialOffice(fetched.data.results || [], code) };
}
