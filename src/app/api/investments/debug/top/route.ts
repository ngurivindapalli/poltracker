import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function GET() {
  const filePath = path.join(process.cwd(), "public", "data", "senateTrades.json");
  const all = JSON.parse(fs.readFileSync(filePath, "utf8")) as any[];

  const counts = new Map<string, number>();
  for (const t of all) {
    const s = (t.senator || "").trim();
    if (!s) continue;
    counts.set(s, (counts.get(s) || 0) + 1);
  }

  return Response.json(
    Array.from(counts.entries())
      .map(([senator, count]) => ({ senator, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50)
  );
}
