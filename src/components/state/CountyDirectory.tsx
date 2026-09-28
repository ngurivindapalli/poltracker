"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  normalizeCountyQuery,
  type CountyDirectoryRow,
} from "@/lib/localData/countySearch";

export function CountyDirectory({
  stateCode,
  stateName,
  counties,
  hasAnyRecords,
  showHeading = true,
  coverage,
  authorityName,
  authorityUrl,
}: {
  stateCode: string;
  stateName: string;
  counties: CountyDirectoryRow[];
  hasAnyRecords: boolean;
  showHeading?: boolean;
  coverage?: "FULL" | "PARTIAL" | "NONE";
  authorityName?: string | null;
  authorityUrl?: string | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const filtered = useMemo(() => {
    const q = normalizeCountyQuery(query);
    if (!q) return counties;
    return counties.filter((c) => normalizeCountyQuery(c.name).includes(q));
  }, [counties, query]);

  const safeActive = Math.min(active, Math.max(filtered.length - 1, 0));

  return (
    <div>
      {showHeading ? (
        <>
          <h2 className="text-xl font-semibold tracking-tight">Local Elections & Government</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Find local elections, events, and government information across {stateName}.
          </p>
        </>
      ) : null}

      {!hasAnyRecords ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Local election data is not currently available for this state. The county
          list below is geographic only.
        </p>
      ) : coverage === "PARTIAL" ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Local election coverage for {stateName} is partial. Statewide dates come
          from official sources where available; some county records remain from the
          compiled dataset.
        </p>
      ) : null}
      {authorityName ? (
        <p className="mt-3 text-xs text-muted-foreground">
          State election authority:{" "}
          {authorityUrl ? (
            <a
              href={authorityUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline-offset-4 hover:underline"
            >
              {authorityName}
            </a>
          ) : (
            authorityName
          )}
        </p>
      ) : null}

      <label className="mt-5 block text-sm font-medium" htmlFor="county-search">
        Search counties
      </label>
      <input
        id="county-search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, filtered.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && filtered[safeActive]) {
            e.preventDefault();
            router.push(`/state/${stateCode}/local/${filtered[safeActive].slug}`);
          }
        }}
        placeholder="Search counties..."
        className="mt-2 h-11 w-full max-w-xl rounded-md border border-border bg-background px-3 text-sm"
      />
      <p className="mt-3 text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "county" : "counties"}
      </p>

      <ul className="mt-3 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
        {filtered.map((county, index) => (
          <li key={county.slug}>
            <Link
              href={`/state/${stateCode}/local/${county.slug}`}
              className={`flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted ${
                index === safeActive ? "bg-muted/60" : ""
              }`}
            >
              <span>
                <span className="block text-sm font-medium">{county.name}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {county.upcomingElections} upcoming{" "}
                  {county.upcomingElections === 1 ? "election" : "elections"} ·{" "}
                  {county.localEvents} local{" "}
                  {county.localEvents === 1 ? "event" : "events"}
                  {county.lastUpdated
                    ? ` · Last updated ${new Date(county.lastUpdated).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`
                    : county.sourceName
                      ? ` · ${county.sourceName}`
                      : " · No verified local records"}
                </span>
              </span>
              <span className="text-muted-foreground" aria-hidden>
                &gt;
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
