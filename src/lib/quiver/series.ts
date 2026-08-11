import type { TradeRow } from "@/lib/profileFinancials";
import { buySellSide as side } from "@/lib/quiver/normalizers";

// Midpoints ONLY for chart series visualization — never stored as exact amounts.
const RANGE_MID: Record<string, number> = {
  "$1,001 - $15,000": 8000,
  "$15,001 - $50,000": 32500,
  "$50,001 - $100,000": 75000,
  "$100,001 - $250,000": 175000,
  "$250,001 - $500,000": 375000,
  "$500,001 - $1,000,000": 750000,
  "$1,000,001 - $5,000,000": 3000000,
  "$5,000,001 - $25,000,000": 15000000,
  "$25,000,001 - $50,000,000": 37500000,
  "$50,000,001+": 50000000,
};

function midFromLabel(label: string | null | undefined): number {
  if (!label) return 0;
  const t = label.trim();
  if (RANGE_MID[t]) return RANGE_MID[t];
  const nums = t.replace(/[$,]/g, "").match(/[\d.]+/g);
  if (!nums?.length) return 0;
  if (nums.length === 1) return Number(nums[0]) || 0;
  return ((Number(nums[0]) || 0) + (Number(nums[1]) || 0)) / 2;
}

export function buySellSide(tx: string | null | undefined) {
  return side(tx);
}

/** Visualization-only series from disclosed trade ranges (midpoint heuristic). */
export function estimateSeriesFromTrades(
  trades: TradeRow[]
): Array<{ date: string; value: number }> {
  const sorted = [...trades]
    .filter((t) => t.tradeDate)
    .sort((a, b) => String(a.tradeDate).localeCompare(String(b.tradeDate)));

  let pos = 0;
  const series: Array<{ date: string; value: number }> = [];
  for (const t of sorted) {
    const mid = midFromLabel(t.amountLabel);
    const dir = side(t.txType);
    if (dir === "buy") pos += mid;
    else if (dir === "sell") pos = Math.max(0, pos - mid);
    series.push({ date: t.tradeDate!, value: Math.round(pos) });
  }
  return series;
}
