import fs from "fs";
import path from "path";

export const runtime = "nodejs";

function norm(s: string) {
  return (s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function lastNameOf(full: string) {
  const parts = norm(full).split(" ");
  return parts[parts.length - 1] || "";
}

export async function GET(
  req: Request,
  { params }: { params: { name: string } }
) {
  try {
    const name = decodeURIComponent(params.name || "");
    const nameNorm = norm(name);
    const last = lastNameOf(name);

    console.log("Searching investments for:", name);

    const filePath = path.join(process.cwd(), "public", "data", "senateTrades.json");
    if (!fs.existsSync(filePath)) {
      return Response.json({ trades: [], count: 0 });
    }
    const raw = fs.readFileSync(filePath, "utf8");
    const all = JSON.parse(raw) as any[];

    // Match strategy:
    // 1) senator full name contains requested name
    // 2) senator contains requested last name
    // 3) office begins with "Last, First" style match (if present)
    // 4) bioguideId exact match when ?bioguide= is provided
    const url = new URL(req.url);
    const bioguide = (url.searchParams.get("bioguide") || "").toUpperCase();

    const trades = all.filter((t) => {
      if (bioguide && (t.bioguideId || "").toUpperCase() === bioguide) return true;

      const senator = norm(t.senator || "");
      const office = norm(t.office || "");

      if (nameNorm && senator.includes(nameNorm)) return true;
      if (last && senator.includes(last)) return true;

      // office example: "banks, james e. (senator)"
      if (last && office.startsWith(last + ",")) return true;

      return false;
    });

    // Sort newest first if ISO dates
    trades.sort((a, b) => (b.transactionDate || "").localeCompare(a.transactionDate || ""));

    console.log(`Found ${trades.length} trades for ${name}`);

    return Response.json({ trades, count: trades.length });
  } catch (e) {
    console.error("Investments API error:", e);
    return Response.json({ trades: [], count: 0 });
  }
}
