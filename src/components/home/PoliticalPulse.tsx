import Link from "next/link";
import type { SenatorSummaryRow } from "@/lib/senators/types";
import { formatUsdCompact } from "@/lib/format";

export function PoliticalPulse({ senators }: { senators: SenatorSummaryRow[] }) {
  const withTrades = [...senators]
    .filter((s) => (s.tradeCount || 0) > 0)
    .sort((a, b) => (b.tradeCount || 0) - (a.tradeCount || 0))
    .slice(0, 4);

  const withWorth = [...senators]
    .filter((s) => s.estimatedNetWorth != null)
    .sort((a, b) => (b.estimatedNetWorth || 0) - (a.estimatedNetWorth || 0))
    .slice(0, 4);

  const recent = [...senators]
    .filter((s) => s.latestTradeDate)
    .sort((a, b) =>
      String(b.latestTradeDate).localeCompare(String(a.latestTradeDate))
    )
    .slice(0, 4);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <PulseCol
        title="Most disclosed trades"
        items={withTrades.map((s) => ({
          href: `/senator/${s.bioguideId}`,
          title: s.name,
          meta: `${s.tradeCount} trades · ${s.state || ""}`,
        }))}
        empty="No trade counts in the synchronized dataset."
      />
      <PulseCol
        title="Highest estimated net worth"
        items={withWorth.map((s) => ({
          href: `/senator/${s.bioguideId}`,
          title: s.name,
          meta: `${formatUsdCompact(s.estimatedNetWorth)} · estimate`,
        }))}
        empty="Net worth estimates are not available yet."
      />
      <PulseCol
        title="Most recent disclosed trade"
        items={recent.map((s) => ({
          href: `/senator/${s.bioguideId}`,
          title: s.name,
          meta: s.latestTradeDate || "",
        }))}
        empty="No recent trade dates in the synchronized dataset."
      />
    </div>
  );
}

function PulseCol({
  title,
  items,
  empty,
}: {
  title: string;
  items: { href: string; title: string; meta: string }[];
  empty: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-subtle">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex flex-col py-2.5 hover:text-foreground"
              >
                <span className="text-sm font-medium text-foreground">
                  {item.title}
                </span>
                <span className="text-xs text-muted-foreground">{item.meta}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
