import type { Ideology } from "./ideology"
import { invertIdeology } from "./ideology"

/**
 * Curated news domains by ideology
 * Note: Using domains only (not full URLs)
 */
export const NEWS_DOMAINS: Record<Ideology, string[]> = {
  left: [
    "theguardian.com",
    "vox.com",
    "motherjones.com",
    "msnbc.com",
    "slate.com"
  ],
  right: [
    "foxnews.com",
    "nationalreview.com",
    "washingtonexaminer.com",
    "dailysignal.com",
    "washingtonpost.com" // Note: includes opinion pieces
  ],
  center: [
    "apnews.com",
    "reuters.com",
    "bbc.com",
    "axios.com",
    "npr.org"
  ]
}

/**
 * Get news domains for a given mode based on base ideology
 */
export function domainsForMode(
  base: Ideology,
  mode: "aligned" | "balanced" | "opposing"
): string[] {
  if (mode === "aligned") {
    return NEWS_DOMAINS[base]
  }

  if (mode === "opposing") {
    return NEWS_DOMAINS[invertIdeology(base)]
  }

  // balanced: union of all three, capped to ~15 domains
  const allDomains = [
    ...NEWS_DOMAINS.left,
    ...NEWS_DOMAINS.center,
    ...NEWS_DOMAINS.right
  ]

  // Remove duplicates and cap
  const unique = Array.from(new Set(allDomains))
  return unique.slice(0, 15)
}

// ── NewsAPI source catalog (v2 source ids) ───────────────────────────────────

export type NewsApiSourceDef = {
  id: string
  name: string
  category: string
}

/** Major outlets commonly returned by NewsAPI `sources` parameter */
export const NEWS_API_SOURCES: NewsApiSourceDef[] = [
  // Balanced / General
  { id: "associated-press", name: "Associated Press", category: "Balanced / General" },
  { id: "reuters", name: "Reuters", category: "Balanced / General" },
  { id: "bbc-news", name: "BBC News", category: "Balanced / General" },
  { id: "npr", name: "NPR", category: "Balanced / General" },
  { id: "axios", name: "Axios", category: "Balanced / General" },
  { id: "the-hill", name: "The Hill", category: "Balanced / General" },
  // Left / Center-left
  { id: "cnn", name: "CNN", category: "Left / Center-left" },
  { id: "msnbc", name: "MSNBC", category: "Left / Center-left" },
  { id: "the-new-york-times", name: "The New York Times", category: "Left / Center-left" },
  { id: "the-washington-post", name: "The Washington Post", category: "Left / Center-left" },
  { id: "politico", name: "Politico", category: "Left / Center-left" },
  // Right / Center-right
  { id: "fox-news", name: "Fox News", category: "Right / Center-right" },
  { id: "new-york-post", name: "New York Post", category: "Right / Center-right" },
  { id: "the-washington-times", name: "The Washington Times", category: "Right / Center-right" },
  { id: "national-review", name: "National Review", category: "Right / Center-right" },
  { id: "the-wall-street-journal", name: "The Wall Street Journal", category: "Right / Center-right" },
  // Business / Economy
  { id: "bloomberg", name: "Bloomberg", category: "Business / Economy" },
  { id: "cnbc", name: "CNBC", category: "Business / Economy" },
  { id: "business-insider", name: "Business Insider", category: "Business / Economy" },
  { id: "financial-times", name: "Financial Times", category: "Business / Economy" }
]

export const ALL_NEWS_SOURCE_IDS = NEWS_API_SOURCES.map((s) => s.id)

export const DEFAULT_NEWS_SOURCE_IDS: string[] = [
  "associated-press",
  "reuters",
  "bbc-news",
  "npr",
  "axios",
  "the-hill"
]

const SOURCE_BY_ID = new Map<string, NewsApiSourceDef>(
  NEWS_API_SOURCES.map((s) => [s.id, s])
)

/** Display name (lowercased) and common aliases → canonical id */
const NAME_TO_ID = (() => {
  const m = new Map<string, string>()
  for (const s of NEWS_API_SOURCES) {
    m.set(s.name.toLowerCase().replace(/\s+/g, " ").trim(), s.id)
    m.set(s.id, s.id)
  }
  // Common variants from NewsAPI
  m.set("associated press", "associated-press")
  m.set("the new york times", "the-new-york-times")
  m.set("washington post", "the-washington-post")
  m.set("wall street journal", "the-wall-street-journal")
  m.set("financial times", "financial-times")
  m.set("new york post", "new-york-post")
  m.set("washington times", "the-washington-times")
  return m
})()

export function getNewsSourceById(id: string): NewsApiSourceDef | undefined {
  return SOURCE_BY_ID.get(id.toLowerCase())
}

export function normalizeNewsSourcesParam(
  input: string | string[] | null | undefined
): string[] {
  if (input == null) return []
  const raw = Array.isArray(input) ? input.join(",") : String(input)
  return raw
    .split(/[,]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * Validated list: only ids in ALL_NEWS_SOURCE_IDS, de-duped, preserves order.
 */
export function validateNewsSourceIds(ids: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of ids) {
    const k = id.toLowerCase()
    if (!ALL_NEWS_SOURCE_IDS.includes(k) || seen.has(k)) continue
    seen.add(k)
    out.push(k)
  }
  return out
}

/**
 * From `sources` query: validate; if empty after validation → defaults.
 */
export function resolveRequestedNewsSourceIds(raw: string | null | undefined): string[] {
  const normalized = validateNewsSourceIds(normalizeNewsSourcesParam(raw ?? ""))
  if (normalized.length === 0) {
    return [...DEFAULT_NEWS_SOURCE_IDS]
  }
  return normalized
}

/** `sources` param absent → null (caller uses defaults). Present (even empty) → resolved list. */
export function resolveNewsSourcesQuery(
  searchParams: URLSearchParams,
  key = "sources"
): { paramPresent: boolean; ids: string[] } {
  if (!searchParams.has(key)) {
    return { paramPresent: false, ids: [...DEFAULT_NEWS_SOURCE_IDS] }
  }
  const raw = searchParams.get(key) ?? ""
  const ids = validateNewsSourceIds(normalizeNewsSourcesParam(raw))
  return {
    paramPresent: true,
    ids: ids.length > 0 ? ids : [...DEFAULT_NEWS_SOURCE_IDS]
  }
}

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

/**
 * Map a NewsAPI article.source to canonical id when possible.
 */
export function getArticleSourceKey(source: { id?: string | null; name?: string | null } | null | undefined): string {
  if (!source) return ""
  const rawId = (source.id || "").trim().toLowerCase()
  if (rawId && ALL_NEWS_SOURCE_IDS.includes(rawId)) return rawId
  const name = (source.name || "").trim()
  if (!name) return rawId
  const byLookup = NAME_TO_ID.get(name.toLowerCase())
  if (byLookup) return byLookup
  const slug = slugifyName(name)
  if (ALL_NEWS_SOURCE_IDS.includes(slug)) return slug
  return rawId || slugifyName(name)
}

export function articleMatchesSourceAllowList(
  article: { source?: { id?: string | null; name?: string | null } | string | null },
  allowedIds: string[]
): boolean {
  if (!allowedIds.length) return true
  const set = new Set(allowedIds.map((x) => x.toLowerCase()))
  const src = article.source
  if (typeof src === "string") {
    const key = getArticleSourceKey({ name: src })
    return !key || set.has(key)
  }
  const key = getArticleSourceKey(src ?? undefined)
  return !key || set.has(key)
}

/**
 * Defensive filter after API response (NewsAPI may still return extras).
 */
export function filterArticlesBySourceIds<T extends { source?: unknown }>(
  articles: T[],
  allowedIds: string[]
): T[] {
  if (!allowedIds.length) return articles
  const set = new Set(allowedIds.map((x) => x.toLowerCase()))
  return articles.filter((a) => {
    const src = a.source as { id?: string; name?: string } | string | undefined
    if (typeof src === "string") {
      const key = getArticleSourceKey({ name: src })
      return key && set.has(key)
    }
    const key = getArticleSourceKey(src)
    return key && set.has(key)
  })
}

export function buildNewsApiSourcesQueryParam(ids: string[]): string {
  const v = validateNewsSourceIds(ids)
  return v.join(",")
}

/** Compare two id lists (order-independent). */
export function newsSourceIdsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const sa = [...a].map((x) => x.toLowerCase()).sort().join("|")
  const sb = [...b].map((x) => x.toLowerCase()).sort().join("|")
  return sa === sb
}

export function isDefaultNewsSourceSelection(ids: string[]): boolean {
  if (ids.length === 0) return true
  return newsSourceIdsEqual(ids, DEFAULT_NEWS_SOURCE_IDS)
}
