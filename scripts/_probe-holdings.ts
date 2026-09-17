/**
 * Inspect congress holdings sample + extra Hobbyist path guesses.
 * Never prints the API key.
 */
import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

const key = process.env.QUIVER_API_KEY || "";
const base = (process.env.QUIVER_BASE_URL || "https://api.quiverquant.com/beta").replace(
  /\/$/,
  ""
);

async function get(path: string) {
  const res = await fetch(`${base}${path}`, {
    headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
  });
  const text = await res.text();
  let json: unknown = text;
  try {
    json = JSON.parse(text);
  } catch {
    /* raw */
  }
  return { status: res.status, json };
}

async function main() {
  const holdings = await get("/live/congressholdings");
  console.log("holdings status", holdings.status);
  const rows = Array.isArray(holdings.json) ? holdings.json : [];
  console.log("count", rows.length);
  console.log("sample", JSON.stringify(rows.slice(0, 3), null, 2));
  const types = new Set(rows.map((r: { Type?: string }) => r.Type));
  console.log("types", [...types]);
  const politicians = rows
    .map((r: { Politician?: string }) => r.Politician)
    .filter(Boolean);
  console.log("unique politicians", new Set(politicians).size);

  const extra = [
    "/live/politicianexposure",
    "/bulk/politicianexposure",
    "/live/political-exposure",
    "/live/exposure",
    "/live/congressbillsummaries",
    "/live/bills",
    "/live/govcontracts",
    "/historical/govcontractsall/LMT",
    "/historical/lobbying/LMT",
    "/historical/corporatedonors/LMT",
    "/historical/offexchange/NVDA",
  ];
  for (const p of extra) {
    const r = await get(p);
    const n = Array.isArray(r.json)
      ? r.json.length
      : r.json && typeof r.json === "object"
        ? Object.keys(r.json as object).slice(0, 8).join(",")
        : String(r.json).slice(0, 80);
    console.log(JSON.stringify({ path: p, status: r.status, n }));
  }
}

main();
