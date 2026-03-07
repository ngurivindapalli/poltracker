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
