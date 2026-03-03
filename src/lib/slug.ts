/**
 * Convert a name to a URL-safe slug.
 * Must match the Python version in scripts/build_portfolio_timeseries.py
 */
export function toSlug(name: string): string {
  if (!name) return "unknown";
  
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
