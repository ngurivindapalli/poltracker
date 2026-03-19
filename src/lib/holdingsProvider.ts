/**
 * Provides disclosed holdings for politicians.
 * Uses investments.json (annual disclosures) with fallback to trade-derived portfolio value.
 */

import fs from "fs";
import path from "path";
import { getEstimatedNetWorthSummary } from "@/lib/congressNetWorth";

export function getHoldingsForPolitician(bioguideId: string): Array<{ amount: string }> {
  // 1. Try investments.json (annual financial disclosure holdings)
  try {
    const filePath = path.join(process.cwd(), "public", "data", "investments.json");
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf8");
      const data = JSON.parse(raw) as Record<string, Record<string, any[]>>;
      const usHoldings = data.US?.[bioguideId] ?? [];
      if (usHoldings.length > 0) {
        return usHoldings.map((h: any) => {
          const range = h.estimated_value_range;
          if (range?.min != null && range?.max != null) {
            return {
              amount: `$${Number(range.min).toLocaleString()} - $${Number(range.max).toLocaleString()}`,
            };
          }
          return { amount: "" };
        }).filter((h) => h.amount);
      }
    }
  } catch {
    // Fall through to trade-derived fallback
  }

  // 2. Fallback: derive from disclosed trades (cumulative portfolio value)
  const summary = getEstimatedNetWorthSummary(bioguideId);
  if (summary.latestEstimate > 0) {
    return [{ amount: String(summary.latestEstimate) }];
  }

  return [];
}
