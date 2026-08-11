import { NextResponse } from "next/server";
import { getQuiverSourceMeta } from "@/lib/profileFinancials";
import { readQuiverJson } from "@/lib/quiver/cache";
import type { QuiverMeta, SyncResult } from "@/lib/quiver/types";

export const runtime = "nodejs";

export async function GET() {
  const source = getQuiverSourceMeta();
  const meta = readQuiverJson<QuiverMeta>("meta");
  const logs = readQuiverJson<SyncResult[]>("syncLog") ?? [];
  return NextResponse.json({
    source: source.source,
    datasets: meta?.datasets ?? {},
    recentSyncs: logs.slice(0, 20),
  });
}
