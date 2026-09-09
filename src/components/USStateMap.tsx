"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { STATE_CODE_TO_NAME } from "@/lib/localData/usCounties";
import type { StatePartyControl } from "@/lib/states/partyControl";

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const FIPS_TO_STATE: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY",
};

const FILL: Record<string, string> = {
  democrat: "hsl(var(--party-d))",
  republican: "hsl(var(--party-r))",
  split: "hsl(var(--muted-foreground) / 0.45)",
  unknown: "hsl(var(--muted-foreground) / 0.22)",
};

export default function USStateMap({
  controlByState = {},
}: {
  controlByState?: Record<string, StatePartyControl>;
}) {
  const router = useRouter();
  const [hovered, setHovered] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const states = useMemo(
    () =>
      Object.entries(STATE_CODE_TO_NAME).sort((a, b) =>
        a[1].localeCompare(b[1])
      ),
    []
  );

  const filtered = query
    ? states.filter(
        ([code, name]) =>
          name.toLowerCase().includes(query.toLowerCase()) ||
          code.toLowerCase().includes(query.toLowerCase())
      )
    : states;

  const go = (code: string) => router.push(`/state/${code}`);
  const hoveredMeta = hovered ? controlByState[hovered] : null;
  const hoveredName = hovered
    ? hoveredMeta?.name || STATE_CODE_TO_NAME[hovered] || hovered
    : null;

  return (
    <div>
      <div className="relative">
        <div
          className="h-[240px] w-full overflow-hidden rounded-lg bg-muted/40 sm:h-[340px] md:h-[460px]"
          role="img"
          aria-label="Map of the United States. Select a state to explore."
        >
          <ComposableMap
            projection="geoAlbersUsa"
            style={{ width: "100%", height: "100%" }}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const fipsCode = geo.id ? String(geo.id).padStart(2, "0") : "";
                  const stateCode = fipsCode ? FIPS_TO_STATE[fipsCode] : undefined;
                  const control = stateCode
                    ? controlByState[stateCode]?.control || "unknown"
                    : "unknown";
                  const active = hovered === stateCode;
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => stateCode && setHovered(stateCode)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => stateCode && go(stateCode)}
                      fill={FILL[control] || FILL.unknown}
                      stroke="hsl(var(--background))"
                      strokeWidth={active ? 1.4 : 0.8}
                      style={{
                        default: {
                          outline: "none",
                          cursor: stateCode ? "pointer" : "default",
                          opacity: active ? 0.85 : 1,
                        },
                        hover: { outline: "none", cursor: "pointer", opacity: 0.85 },
                        pressed: { outline: "none" },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ComposableMap>
        </div>
        <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-border bg-card/95 px-3 py-2 text-sm shadow-subtle sm:left-4 sm:top-4">
          {hoveredName ? (
            <>
              <div className="font-medium text-foreground">{hoveredName}</div>
              <div className="text-xs text-muted-foreground">
                {hoveredMeta?.label || "Open state profile"}
              </div>
            </>
          ) : (
            <div className="text-muted-foreground">Select a state</div>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-party-d" /> Democratic
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-party-r" /> Republican
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-muted-foreground/45" /> Split
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-muted-foreground/30" /> Unavailable
          </span>
        </div>
      </div>

      <div className="mt-4">
        <label className="sr-only" htmlFor="state-filter">
          Find a state
        </label>
        <input
          id="state-filter"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a state…"
          className="mb-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none md:max-w-xs"
        />
        <ul className="grid max-h-48 grid-cols-2 gap-1 overflow-y-auto text-sm sm:grid-cols-3 md:max-h-none md:grid-cols-4 lg:grid-cols-6">
          {filtered.map(([code, name]) => (
            <li key={code}>
              <Link
                href={`/state/${code}`}
                className="block w-full rounded-md px-2 py-1.5 text-left text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
