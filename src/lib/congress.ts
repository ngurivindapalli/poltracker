import { senatorImageUrl } from '@/lib/images'

const CONGRESS_API_BASE = 'https://api.congress.gov/v3'

type FetchParams = Record<string, string | number | boolean | undefined>

type CongressFetchOptions = {
  /** Seconds. Set false to bypass the Next.js Data Cache (required for Vercel + abort). */
  revalidate?: number | false
  timeoutMs?: number
}

export class CongressApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'CongressApiError'
    this.status = status
  }
}

/**
 * Centralized Congress.gov fetch helper
 * REQUIRED:
 * - api_key query param
 * - format=json
 * - User-Agent header
 */
async function congressFetch<T>(
  path: string,
  params: FetchParams = {},
  options: CongressFetchOptions = {}
): Promise<T> {
  const API_KEY = process.env.API_DATA_GOV_KEY

  if (!API_KEY) {
    throw new CongressApiError(500, 'Congress.gov API is not configured')
  }

  const url = new URL(`${CONGRESS_API_BASE}${path}`)
  url.searchParams.set('api_key', API_KEY)
  if (!url.searchParams.has('format')) {
    url.searchParams.set('format', 'json')
  }

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value))
    }
  }

  const timeoutMs = options.timeoutMs ?? 10000
  // Abort + next.revalidate together can hang indefinitely on Vercel Data Cache.
  const bypassCache = options.revalidate === false
  const fetchInit: RequestInit & { next?: { revalidate: number } } = {
    headers: {
      'User-Agent': 'Politeia/1.0 (https://politeia.co)',
      Accept: 'application/json',
    },
  }
  if (bypassCache) {
    fetchInit.cache = 'no-store'
    fetchInit.signal = AbortSignal.timeout(timeoutMs)
  } else {
    fetchInit.next = {
      revalidate: typeof options.revalidate === "number" ? options.revalidate : 3600,
    }
  }

  let res: Response
  try {
    res = await fetch(url.toString(), fetchInit)
  } catch (err) {
    const aborted =
      err instanceof Error &&
      (err.name === 'AbortError' ||
        err.name === 'TimeoutError' ||
        err.message.includes('abort') ||
        err.message.includes('timeout'))
    throw new CongressApiError(
      aborted ? 504 : 503,
      aborted ? 'Congress.gov API timeout' : 'Congress.gov API network error'
    )
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error(
      `Congress.gov API error ${res.status} for ${path}:`,
      text.slice(0, 200)
    )
    throw new CongressApiError(res.status, `Congress.gov API error ${res.status}`)
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
  limit = 20,
  options: CongressFetchOptions = { revalidate: false, timeoutMs: 12000 }
): Promise<any> {
  return congressFetch<any>(
    `/member/${encodeURIComponent(bioguideId)}/sponsored-legislation`,
    {
      limit,
      offset: 0
    },
    options
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
    },
    { revalidate: false, timeoutMs: 12000 }
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

/**
 * Recent bills sorted by latest action (Congress.gov default / updateDate desc).
 */
export async function fetchRecentBills(limit = 10): Promise<any> {
  return congressFetch<any>(
    '/bill',
    {
      limit,
      offset: 0,
      sort: 'updateDate desc',
    },
    { revalidate: 60, timeoutMs: 8000 }
  )
}

export type MemberProfilePayload = {
  member: any
  profile: {
    bioguideId: string
    name: string
    party: string | null
    state: string | null
    imageUrl: string
  }
}

/**
 * Normalized member profile for API routes and server pages.
 * Returns null on missing key, 404, or any Congress.gov failure.
 */
export async function getMemberProfile(
  bioguideId: string
): Promise<MemberProfilePayload | null> {
  if (!process.env.API_DATA_GOV_KEY) return null

  try {
    const data = await fetchMember(bioguideId)
    const member = data?.member ?? data
    if (!member) return null

    const name = member?.directOrderName ?? member?.name ?? member?.fullName
    let party =
      member?.partyName ?? member?.party ?? data?.partyName ?? data?.party

    if (!party) {
      const terms = (member?.terms?.item ??
        member?.terms ??
        data?.terms?.item ??
        data?.terms ??
        []) as any[]
      const currentTerm = terms.find((t: any) => {
        const endYear = t?.endYear ?? t?.endDate
        return !endYear
      })
      if (currentTerm) {
        party = currentTerm?.partyName ?? currentTerm?.party ?? party
      }
      if (!party && terms.length > 0) {
        const mostRecentTerm = terms[terms.length - 1]
        party = mostRecentTerm?.partyName ?? mostRecentTerm?.party ?? party
      }
    }

    const state = member?.state ?? data?.state

    return {
      member,
      profile: {
        bioguideId,
        name,
        party: party || null,
        state: state || null,
        imageUrl: senatorImageUrl(bioguideId, '450x550'),
      },
    }
  } catch {
    return null
  }
}
