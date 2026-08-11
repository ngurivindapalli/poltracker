import { NextResponse } from "next/server";
import {
  getContractsByTicker,
  getQuiverSourceMeta,
} from "@/lib/profileFinancials";
import { readQuiverJson } from "@/lib/quiver/cache";
import type { NormalizedContract } from "@/lib/quiver/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ticker = url.searchParams.get("ticker");
  const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);
  const source = getQuiverSourceMeta();

  if (ticker) {
    const contracts = await getContractsByTicker(ticker, limit);
    return NextResponse.json({
      contracts,
      count: contracts.length,
      source: source.source,
      lastUpdated:
        source.meta?.datasets?.government_contracts?.lastUpdated ?? null,
    });
  }

  const all = readQuiverJson<NormalizedContract[]>("governmentContracts") ?? [];
  return NextResponse.json({
    contracts: all.slice(0, limit),
    count: Math.min(all.length, limit),
    total: all.length,
    source: source.source,
    lastUpdated:
      source.meta?.datasets?.government_contracts?.lastUpdated ?? null,
  });
}
