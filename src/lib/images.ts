export function senatorImageUrl(bioguideId: string, size: '225x275' | '450x550' | 'original' = '225x275') {
  // Predictable public-domain images by Bioguide ID
  // served via https://unitedstates.github.io/images/congress/[size]/[bioguide].jpg
  return `https://unitedstates.github.io/images/congress/${size}/${bioguideId}.jpg`
}

const UNRELIABLE_PHOTO_HOSTS = [
  "bioguide.congress.gov",
]

/**
 * Member photos for the browser. Never points at the BioGuide photo host,
 * which resets connections and produces console errors.
 */
export function safeMemberImageUrl(
  bioguideId: string,
  provided?: string | null,
  size: "225x275" | "450x550" | "original" = "225x275"
): string {
  const fallback = senatorImageUrl(bioguideId, size)
  if (!provided) return fallback
  try {
    const host = new URL(provided).hostname.toLowerCase()
    if (UNRELIABLE_PHOTO_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
      return fallback
    }
  } catch {
    return fallback
  }
  return provided
}

export const MEMBER_PHOTO_PLACEHOLDER = "/images/placeholder-avatar.svg"
