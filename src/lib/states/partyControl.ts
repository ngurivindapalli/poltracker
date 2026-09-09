import { STATE_CODE_TO_NAME } from "@/lib/localData/usCounties";
import { partyKind } from "@/lib/format";
import { readQuiverJson } from "@/lib/quiver/cache";
import type { SenatorSummaryRow } from "@/lib/senators/types";

export type StateControlKind = "democrat" | "republican" | "split" | "unknown";

export type StatePartyControl = {
  code: string;
  name: string;
  control: StateControlKind;
  label: string;
};

const NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_CODE_TO_NAME).map(([code, name]) => [
    name.toUpperCase(),
    code,
  ])
);

function toStateCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim().toUpperCase();
  if (value.length === 2 && STATE_CODE_TO_NAME[value]) return value;
  return NAME_TO_CODE[value] ?? null;
}

/**
 * Senate-delegation color from the synchronized senator warehouse.
 * Does not call Congress.gov or Quiver at request time.
 * Independents are not assigned to either party.
 */
export function getStatePartyControl(): Record<string, StatePartyControl> {
  const rows = readQuiverJson<SenatorSummaryRow[]>("senatorSummaries") ?? [];
  const counts: Record<string, { d: number; r: number }> = {};

  for (const row of rows) {
    const chamber = (row.chamber || "").toLowerCase();
    if (chamber && !chamber.includes("senate")) continue;
    const code = toStateCode(row.state);
    if (!code) continue;
    if (!counts[code]) counts[code] = { d: 0, r: 0 };
    const kind = partyKind(row.party);
    if (kind === "democrat") counts[code].d += 1;
    else if (kind === "republican") counts[code].r += 1;
  }

  const out: Record<string, StatePartyControl> = {};
  for (const [code, name] of Object.entries(STATE_CODE_TO_NAME)) {
    const tally = counts[code];
    let control: StateControlKind = "unknown";
    let label = "Senate control unavailable";
    if (tally) {
      if (tally.d > tally.r && tally.d > 0) {
        control = "democrat";
        label = "Democratic Senate delegation";
      } else if (tally.r > tally.d && tally.r > 0) {
        control = "republican";
        label = "Republican Senate delegation";
      } else if (tally.d > 0 && tally.r > 0 && tally.d === tally.r) {
        control = "split";
        label = "Split Senate delegation";
      }
    }
    out[code] = { code, name, control, label };
  }
  return out;
}
