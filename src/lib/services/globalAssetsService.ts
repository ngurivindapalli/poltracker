import { modiAssets } from "@/lib/data/globalAssets/modi";
import { starmerAssets } from "@/lib/data/globalAssets/starmer";

export type LeaderAssetsType = "official" | "estimated" | "partial";

export type LeaderAssets = {
  name: string;
  country: string;
  currency: string;
  total: number | null;
  /** For UK etc.: disclosed interests sum, NOT full net worth */
  knownValue?: number | null;
  breakdown?: { label: string; value: number }[];
  type: LeaderAssetsType;
  source: string;
  lastUpdated?: string;
};

// Simple in-memory cache: 24 hours TTL
const cache = new Map<
  string,
  { data: LeaderAssets; expiresAt: number }
>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function getCached(key: string): LeaderAssets | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) return null;
  return entry.data;
}

function setCache(key: string, data: LeaderAssets) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

function safeFallback(
  name: string,
  country: string,
  source = "Data unavailable"
): LeaderAssets {
  return {
    name,
    country,
    currency: "USD",
    total: null,
    type: "partial",
    source,
  };
}

// --- USA (Trump): Forbes-style public net worth estimate ---
async function getUSAssets(): Promise<LeaderAssets> {
  try {
    const res = await fetch(
      "https://forbes400.onrender.com/api/forbes400?limit=500",
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(5000),
      }
    );
    if (res.ok) {
      const data = await res.json();
      const trump = Array.isArray(data)
        ? data.find(
            (p: { personName?: string; name?: string }) =>
              (p.personName ?? p.name ?? "").toLowerCase().includes("trump")
          )
        : null;
      const rawWorth = trump?.finalWorth ?? trump?.netWorth ?? trump?.worth;
      if (typeof rawWorth === "number" && rawWorth > 0) {
        // finalWorth is in millions
        const total = rawWorth * 1_000_000;
        return {
          name: "Donald Trump",
          country: "United States",
          currency: "USD",
          total,
          type: "estimated",
          source: "Forbes",
          lastUpdated: new Date().toISOString().slice(0, 10),
        };
      }
    }
  } catch {
    // Fall through
  }
  return {
    name: "Donald Trump",
    country: "United States",
    currency: "USD",
    total: 6_600_000_000,
    type: "estimated",
    source: "Forbes",
  };
}

// --- UK (Starmer): Known financial interests only (no full net worth) ---
async function getUKAssets(): Promise<LeaderAssets> {
  return {
    name: starmerAssets.name,
    country: starmerAssets.country,
    currency: starmerAssets.currency,
    total: null,
    knownValue: starmerAssets.totalKnown,
    breakdown: starmerAssets.breakdown,
    type: "partial",
    source: starmerAssets.meta.source,
    lastUpdated: undefined,
  };
}

// --- EU/Germany (Scholz): No full disclosure ---
async function getEUAssets(): Promise<LeaderAssets> {
  return {
    name: "Olaf Scholz",
    country: "Germany",
    currency: "EUR",
    total: null,
    type: "partial",
    source: "German disclosure system (no full net worth)",
  };
}

// --- France (Macron): Official declaration or estimate ---
async function getFranceAssets(): Promise<LeaderAssets> {
  try {
    const res = await fetch(
      "https://www.vie-publique.fr/fiches/38136-declaration-de-patrimoine-des-elus",
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const text = await res.text();
      const macronMatch = text.match(/macron|Macron/i);
      const numMatch = text.match(/(\d{1,3}(?:\s?\d{3})*)\s*(?:€|euros?)/i);
      if (macronMatch && numMatch) {
        const value = parseInt(numMatch[1].replace(/\s/g, ""), 10);
        if (value > 1000) {
          return {
            name: "Emmanuel Macron",
            country: "France",
            currency: "EUR",
            total: value,
            type: "official",
            source: "Official asset declaration",
            lastUpdated: new Date().toISOString().slice(0, 10),
          };
        }
      }
    }
  } catch {
    // Fall through
  }
  return {
    name: "Emmanuel Macron",
    country: "France",
    currency: "EUR",
    total: 1_200_000,
    type: "estimated",
    source: "Public reports",
  };
}

// --- Canada (Carney): Estimated net worth ---
async function getCanadaAssets(): Promise<LeaderAssets> {
  return {
    name: "Mark Carney",
    country: "Canada",
    currency: "CAD",
    total: 15_000_000,
    type: "estimated",
    source: "Bloomberg/Reuters",
  };
}

// --- India (Modi): Use existing modiAssets ---
async function getIndiaAssets(): Promise<LeaderAssets> {
  return {
    name: modiAssets.name,
    country: modiAssets.country,
    currency: "INR",
    total: modiAssets.assetsINR.total,
    breakdown: modiAssets.assetsBreakdown,
    type: "official",
    source: modiAssets.meta.source,
    lastUpdated: modiAssets.meta.date,
  };
}

// --- Router: slug -> fetcher ---
const ROUTES: Record<
  string,
  () => Promise<LeaderAssets>
> = {
  "donald-trump": getUSAssets,
  "keir-starmer": getUKAssets,
  "olaf-scholz": getEUAssets,
  "emmanuel-macron": getFranceAssets,
  "mark-carney": getCanadaAssets,
  "narendra-modi": getIndiaAssets,
};

export async function getLeaderAssets(
  leaderId: string
): Promise<LeaderAssets> {
  const cacheKey = `assets:${leaderId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const fetcher = ROUTES[leaderId];
  if (!fetcher) {
    const leader = {
      "donald-trump": { name: "Donald Trump", country: "United States" },
      "keir-starmer": { name: "Keir Starmer", country: "United Kingdom" },
      "olaf-scholz": { name: "Olaf Scholz", country: "Germany" },
      "emmanuel-macron": { name: "Emmanuel Macron", country: "France" },
      "mark-carney": { name: "Mark Carney", country: "Canada" },
      "narendra-modi": { name: "Narendra Modi", country: "India" },
    }[leaderId];
    const fallback = safeFallback(
      leader?.name ?? leaderId,
      leader?.country ?? "Unknown"
    );
    return fallback;
  }

  try {
    const result = await fetcher();
    setCache(cacheKey, result);
    return result;
  } catch {
    const leader = {
      "donald-trump": { name: "Donald Trump", country: "United States" },
      "keir-starmer": { name: "Keir Starmer", country: "United Kingdom" },
      "olaf-scholz": { name: "Olaf Scholz", country: "Germany" },
      "emmanuel-macron": { name: "Emmanuel Macron", country: "France" },
      "mark-carney": { name: "Mark Carney", country: "Canada" },
      "narendra-modi": { name: "Narendra Modi", country: "India" },
    }[leaderId];
    const fallback = safeFallback(
      leader?.name ?? leaderId,
      leader?.country ?? "Unknown"
    );
    return fallback;
  }
}
