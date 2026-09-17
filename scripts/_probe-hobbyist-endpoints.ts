/**
 * Probe Hobbyist REST paths. Prints status + field names only. Never prints the key.
 */
import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

const key = process.env.QUIVER_API_KEY || "";
const base = (process.env.QUIVER_BASE_URL || "https://api.quiverquant.com/beta").replace(
  /\/$/,
  ""
);

if (!key || key.includes("PASTE_YOUR")) {
  console.error("QUIVER_API_KEY missing");
  process.exit(1);
}

const paths = [
  "/live/congresstrading",
  "/bulk/congresstrading?page=1&page_size=1",
  "/bulk/congress/politicians?page=1&page_size=1",
  "/bulk/corporatedonors?page=1&page_size=1",
  "/live/govcontractsall",
  "/live/lobbying",
  "/live/offexchange",
  "/bulk/trumpstocktrades",
  "/live/politicalexposure",
  "/bulk/politicalexposure",
  "/historical/politicalexposure/NVDA",
  "/live/politicalexposure/NVDA",
  "/beta/live/politicalexposure",
  "/live/congresslegislation",
  "/bulk/congresslegislation",
  "/bulk/congress/legislation",
  "/live/congressbills",
  "/bulk/congressbills",
  "/live/congressholdings",
  "/bulk/congressholdings",
  "/historical/congressholdings/NVDA",
  "/live/congressstockholdings",
  "/bulk/congressstockholdings",
  "/historical/congresstrading/NVDA",
];

function fieldsOf(data: unknown): string {
  if (Array.isArray(data) && data[0] && typeof data[0] === "object") {
    return Object.keys(data[0] as object).join(", ");
  }
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.data) && o.data[0] && typeof o.data[0] === "object") {
      return `keys=${Object.keys(o).join("|")} item=${Object.keys(o.data[0] as object).join(", ")}`;
    }
    return Object.keys(o).join(", ");
  }
  return typeof data;
}

async function probe(path: string) {
  const url = path.startsWith("http")
    ? path
    : `${base}${path.startsWith("/") ? path : `/${path}`}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
    });
    const text = await res.text();
    let parsed: unknown = text.slice(0, 180);
    try {
      parsed = JSON.parse(text);
    } catch {
      /* keep snippet */
    }
    const n = Array.isArray(parsed)
      ? parsed.length
      : parsed && typeof parsed === "object" && Array.isArray((parsed as { data?: unknown }).data)
        ? (parsed as { data: unknown[] }).data.length
        : null;
    console.log(
      JSON.stringify({
        path,
        status: res.status,
        n,
        fields: typeof parsed === "object" ? fieldsOf(parsed) : String(parsed).slice(0, 120),
      })
    );
  } catch (e) {
    console.log(JSON.stringify({ path, error: (e as Error).message }));
  }
}

async function main() {
  for (const p of paths) {
    await probe(p);
  }
}

main();
