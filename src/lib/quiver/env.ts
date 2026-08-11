/**
 * Parse positive integer env with fallback.
 * Logs when an override is active so truncated test caps are visible.
 */
export function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || String(raw).trim() === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    console.warn(`[quiver] Ignoring invalid ${name}=${raw}; using ${fallback}`);
    return fallback;
  }
  const v = Math.floor(n);
  if (v !== fallback) {
    console.log(`[quiver] ${name}=${v} (default ${fallback})`);
  }
  return v;
}
