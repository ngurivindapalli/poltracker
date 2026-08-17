export function formatUsdCompact(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `$${Math.round(n / 1000)}K`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatUsd(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function partyKind(
  party?: string | null
): "democrat" | "republican" | "independent" | "unknown" {
  const p = (party || "").toLowerCase();
  if (p.startsWith("d") || p.includes("democrat")) return "democrat";
  if (p.startsWith("r") || p.includes("republican")) return "republican";
  if (p.startsWith("i") || p.includes("independ")) return "independent";
  return "unknown";
}

export function partyLabel(party?: string | null): string {
  const kind = partyKind(party);
  if (kind === "democrat") return "Democrat";
  if (kind === "republican") return "Republican";
  if (kind === "independent") return "Independent";
  return party?.trim() || "—";
}

export function relativeTime(iso?: string | null): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const hours = Math.max(0, Math.round((Date.now() - t) / 3_600_000));
  if (hours < 1) return "Updated less than an hour ago";
  if (hours < 48) return `Updated ${hours} hours ago`;
  const days = Math.round(hours / 24);
  return `Updated ${days} day${days === 1 ? "" : "s"} ago`;
}
