/**
 * Quiver file warehouse — used when Postgres is unavailable.
 * Prefers a successful full sync snapshot, not partial ad-hoc filters.
 */

import fs from "fs";
import path from "path";
import type { DatasetMeta, QuiverMeta, SyncResult } from "./types";

export const QUIVER_CACHE_DIR = path.join(process.cwd(), "data", "quiver");

export const QUIVER_CACHE_FILES = {
  congressTrades: "congress-trades.json",
  politicianNetWorth: "politician-net-worth.json",
  corporateDonors: "corporate-donors.json",
  governmentContracts: "government-contracts.json",
  corporateLobbying: "corporate-lobbying.json",
  offExchange: "off-exchange.json",
  trumpTrades: "trump-trades.json",
  meta: "meta.json",
  syncLog: "sync-log.json",
  unmatchedTrades: "unmatched-trades.json",
} as const;

export function ensureQuiverCacheDir() {
  fs.mkdirSync(QUIVER_CACHE_DIR, { recursive: true });
}

export function quiverCachePath(name: keyof typeof QUIVER_CACHE_FILES | string) {
  const file =
    name in QUIVER_CACHE_FILES
      ? QUIVER_CACHE_FILES[name as keyof typeof QUIVER_CACHE_FILES]
      : name;
  return path.join(QUIVER_CACHE_DIR, file);
}

export function readQuiverJson<T>(name: keyof typeof QUIVER_CACHE_FILES): T | null {
  try {
    const p = quiverCachePath(name);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  } catch (e) {
    console.warn(`[quiver-cache] read failed ${name}:`, (e as Error).message);
    return null;
  }
}

export function writeQuiverJson(
  name: keyof typeof QUIVER_CACHE_FILES,
  data: unknown,
  opts: { allowEmpty?: boolean } = {}
) {
  ensureQuiverCacheDir();
  if (
    !opts.allowEmpty &&
    ((Array.isArray(data) && data.length === 0) ||
      (data &&
        typeof data === "object" &&
        !Array.isArray(data) &&
        Object.keys(data as object).length === 0))
  ) {
    throw new Error(
      `Refusing to overwrite ${name} with empty data (protecting production cache)`
    );
  }

  const p = quiverCachePath(name);
  const tmp = `${p}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data));
  fs.renameSync(tmp, p);
}

export function updateMeta(dataset: string, info: DatasetMeta) {
  ensureQuiverCacheDir();
  const existing = readQuiverJson<QuiverMeta>("meta") ?? {
    source: "Quiver Quantitative",
    datasets: {},
  };
  existing.datasets[dataset] = info;
  writeQuiverJson("meta", existing, { allowEmpty: true });
}

export function appendSyncLog(result: SyncResult) {
  ensureQuiverCacheDir();
  const existing = readQuiverJson<SyncResult[]>("syncLog") ?? [];
  existing.unshift(result);
  writeQuiverJson("syncLog", existing.slice(0, 100), { allowEmpty: true });
}

export function getDatasetLastUpdated(dataset: string): string | null {
  const meta = readQuiverJson<QuiverMeta>("meta");
  return meta?.datasets?.[dataset]?.lastUpdated ?? null;
}

export function getDatasetMeta(dataset: string): DatasetMeta | null {
  const meta = readQuiverJson<QuiverMeta>("meta");
  return meta?.datasets?.[dataset] ?? null;
}

/** True when last trades sync finished with full history coverage. */
export function isCongressTradesSyncComplete(): boolean {
  const m = getDatasetMeta("congress_trades");
  if (!m) return false;
  if (m.status !== "success") return false;
  if ((m.recordCount || 0) < 50_000) return false;
  return true;
}
