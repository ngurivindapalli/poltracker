import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const key = process.env.QUIVER_API_KEY!;
const base = (process.env.QUIVER_BASE_URL || "https://api.quiverquant.com/beta").replace(
  /\/$/,
  ""
);

async function get(path: string, q: Record<string, string | number> = {}) {
  const u = new URL(base + path);
  for (const [k, v] of Object.entries(q)) u.searchParams.set(k, String(v));
  const res = await fetch(u, {
    headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
  });
  const data = await res.json();
  return { status: res.status, data };
}

function rows(data: unknown): any[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray((data as any).data)) {
    return (data as any).data;
  }
  return [];
}

async function main() {
  // politician record
  let found: any = null;
  for (let page = 1; page <= 40 && !found; page++) {
    const r = await get("/bulk/congress/politicians", { page, page_size: 500 });
    for (const row of rows(r.data)) {
      if (String(row.BioGuideID || "").toUpperCase() === "B001230") {
        found = row;
        break;
      }
      if (/baldwin/i.test(String(row.Name || ""))) {
        console.log("baldwin candidate", row);
      }
    }
  }
  console.log("politician B001230", found);

  // live trades
  const live = await get("/live/congresstrading");
  const liveB = rows(live.data).filter(
    (r) =>
      String(r.BioGuideID || "").toUpperCase() === "B001230" ||
      /baldwin/i.test(String(r.Representative || r.Name || ""))
  );
  console.log("live baldwin", liveB.length, liveB[0]);

  // scan full bulk for B001230 or Baldwin
  let page = 1;
  let hits = 0;
  let total = 0;
  const samples: any[] = [];
  while (page <= 80) {
    const r = await get("/bulk/congresstrading", { page, page_size: 5000 });
    const batch = rows(r.data);
    if (!batch.length) break;
    total += batch.length;
    for (const row of batch) {
      const bio = String(row.BioGuideID || "").toUpperCase();
      const name = String(row.Name || row.Representative || "");
      if (bio === "B001230" || /baldwin/i.test(name)) {
        hits += 1;
        if (samples.length < 5) samples.push(row);
      }
    }
    if (batch.length < 5000) break;
    page += 1;
    if (page % 5 === 0) console.log("scanned page", page, "total", total, "hits", hits);
  }
  console.log({ pages: page, total, hits, samples });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
