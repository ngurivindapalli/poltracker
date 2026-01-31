const CONGRESS_API_BASE = 'https://api.congress.gov/v3'

type FetchParams = Record<string, string | number | boolean | undefined>

/**
 * Centralized Congress.gov fetch helper
 *
 * Congress.gov requirements:
 * - HTTPS ONLY
 * - api_key as QUERY PARAM ONLY
 * - NO X-API-Key header
 * - NO forced caching
 */
async function congressFetch<T>(
  path: string,
  params: FetchParams = {}
): Promise<T> {
  const API_KEY = process.env.API_DATA_GOV_KEY

  if (!API_KEY) {
    throw new Error('Missing API_DATA_GOV_KEY environment variable')
  }

  const url = new URL(`${CONGRESS_API_BASE}${path}`)
  url.searchParams.set('api_key', API_KEY)

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value))
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'PolTracker/1.0 (contact: dev@poltracker.app)',
      'Accept': 'application/json'
    },
    // IMPORTANT: Congress.gov breaks with cached/server revalidation
    cache: 'no-store'
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error(
      `Congress.gov API error ${res.status} for ${path}:`,
      text.slice(0, 500)
    )
    throw new Error(`Congress.gov API error ${res.status}`)
  }

  return (await res.json()) as T
}

/* =========================
   TYPES
========================= */

export type CongressMemberListResponse = {
  members?: any[]
  pagination?: {
    count?: number
    next?: string
  }
}

/* =========================
   MEMBERS
========================= */

export async function fetchAllCurrentMembers(): Promise<any[]> {
  const all: any[] = []
  let offset = 0
  const limit = 250

  for (let i = 0; i < 10; i++) {
    const data = await congressFetch<CongressMemberListResponse>('/member', {
      currentMember: true,
      limit,
      offset
    })

    const members = data.members ?? []
    all.push(...members)

    if (members.length < limit) break
    offset += limit
  }

  return all
}

export async function fetchMember(bioguideId: string): Promise<any> {
  return congressFetch<any>(`/member/${encodeURIComponent(bioguideId)}`)
}

/* =========================
   LEGISLATION
========================= */

export async function fetchSponsoredLegislation(
  bioguideId: string,
  limit = 20
): Promise<any> {
  return congressFetch<any>(
    `/member/${encodeURIComponent(bioguideId)}/sponsored-legislation`,
    { limit }
  )
}

export async function fetchCosponsoredLegislation(
  bioguideId: string,
  limit = 20
): Promise<any> {
  return congressFetch<any>(
    `/member/${encodeURIComponent(bioguideId)}/cosponsored-legislation`,
    { limit }
  )
}
