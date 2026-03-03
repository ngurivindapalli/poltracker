import fs from "fs";
import path from "path";

export const runtime = "nodejs";

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function midpoint(amount?: string) {
  if (!amount) return 0;
  const m = amount.match(/\$?([\d,]+)\s*-\s*\$?([\d,]+)/);
  if (!m) return 0;
  const a = Number(m[1].replace(/,/g, ""));
  const b = Number(m[2].replace(/,/g, ""));
  return Math.round((a + b) / 2);
}

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const filePath = path.join(process.cwd(), "public", "data", "senateTrades.json");
  const raw = fs.readFileSync(filePath, "utf8");
  const all = JSON.parse(raw);

  const rows = all.filter((t: any) =>
    slugify(t.senator) === params.slug
  );

  rows.sort((a: any, b: any) =>
    (a.transactionDate || "").localeCompare(b.transactionDate || "")
  );

  let cumulative = 0;
  const series: any[] = [];

  for (const t of rows) {
    const amt = midpoint(t.amount);
    if (!amt) continue;

    const isSale =
      (t.type || "").toLowerCase().includes("sale");

    cumulative += isSale ? -amt : amt;

    series.push({
      date: t.transactionDate,
      value: cumulative
    });
  }

  return Response.json(series);
}
