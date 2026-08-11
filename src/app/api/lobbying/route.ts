import { NextResponse } from "next/server";
import { getQuiverSourceMeta } from "@/lib/profileFinancials";
import { readQuiverJson } from "@/lib/quiver/cache";
import type { NormalizedLobbying } from "@/lib/quiver/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ticker = (url.searchParams.get("ticker") || "").toUpperCase();
  const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);
  const all = readQuiverJson<NormalizedLobbying[]>("corporateLobbying") ?? [];
  const rows = ticker
    ? all.filter((r) => (r.ticker || "").toUpperCase() === ticker)
    : all;
  const source = getQuiverSourceMeta();
  return NextResponse.json({
    lobbying: rows.slice(0, limit),
    count: Math.min(rows.length, limit),
    source: source.source,
    lastUpdated: source.meta?.datasets?.corporate_lobbying?.lastUpdated ?? null,
  });
}
