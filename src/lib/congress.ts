const CONGRESS_API_BASE = 'https://api.congress.gov/v3'

type FetchParams = Record<string, string | number | boolean | undefined>

/**
 * Centralized Congress.gov fetch helper
 * REQUIRED:
 * - api_key query param
 * - User-Agent header
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
      // REQUIRED by Congress.gov (especially in production / Vercel)
      'User-Agent': 'PolTracker/1.0 (contact: dev@poltracker.app)',
      'Accept': 'application/json'
    },
    // cache on server (safe for public gov data)
    next: { revalidate: 3600 }
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

/**
 * Fetch all current members of Congress
 * (filtered client-side to Senate)
 */
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

/**
 * Fetch a single member by Bioguide ID
 */
export async function fetchMember(bioguideId: string): Promise<any> {
  return congressFetch<any>(`/member/${encodeURIComponent(bioguideId)}`)
}

/**
 * Fetch all current members by state
 * Returns both senators and representatives
 */
export async function fetchMembersByState(stateCode: string): Promise<any[]> {
  const all: any[] = []
  let offset = 0
  const limit = 250

  for (let i = 0; i < 10; i++) {
    const data = await congressFetch<CongressMemberListResponse>('/member', {
      currentMember: true,
      state: stateCode,
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

/* =========================
   LEGISLATION
========================= */

/**
 * Fetch sponsored legislation for a member
 */
export async function fetchSponsoredLegislation(
  bioguideId: string,
  limit = 20
): Promise<any> {
  return congressFetch<any>(
    `/member/${encodeURIComponent(bioguideId)}/sponsored-legislation`,
    {
      limit,
      offset: 0
    }
  )
}

/**
 * Fetch cosponsored legislation for a member
 */
export async function fetchCosponsoredLegislation(
  bioguideId: string,
  limit = 20
): Promise<any> {
  return congressFetch<any>(
    `/member/${encodeURIComponent(bioguideId)}/cosponsored-legislation`,
    {
      limit,
      offset: 0
    }
  )
}

/**
 * Fetch a single bill by congress, type, and number
 */
export async function fetchBill(
  congress: string,
  type: string,
  number: string
): Promise<any> {
  return congressFetch<any>(`/bill/${congress}/${type}/${number}`)
}
