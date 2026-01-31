const CONGRESS_API_BASE = 'https://api.congress.gov/v3'

async function congressFetch<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {}
): Promise<T> {
  // Read API key from environment variable
  const API_KEY = process.env.API_DATA_GOV_KEY
  
  // Throw error if API key is missing
  if (!API_KEY) {
    throw new Error('Missing API key. Set API_DATA_GOV_KEY environment variable.')
  }

  // Construct URL with base path
  const url = new URL(`${CONGRESS_API_BASE}${path}`)
  
  // Append API key as query parameter (REQUIRED by Congress.gov API)
  url.searchParams.set('api_key', API_KEY)
  url.searchParams.set('format', 'json')
  
  // Preserve any existing query params (limit, offset, etc)
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue
    url.searchParams.set(k, String(v))
  }

  // Make request to Congress.gov API
  const res = await fetch(url.toString(), {
    // cache on server for performance; change if you want "always live"
    next: { revalidate: 3600 }
  })

  // Check if response is OK
  if (!res.ok) {
    // Read response as text (never assume JSON on failed response)
    const text = await res.text().catch(() => '')
    
    // Log error for debugging
    console.error(`Congress API error ${res.status} for ${path}:`, text.substring(0, 500))
    
    // Throw error with status code
    throw new Error(`Congress API error ${res.status}: ${text.substring(0, 200)}`)
  }

  // Return JSON ONLY on successful responses
  return (await res.json()) as T
}

export type CongressMemberListResponse = {
  members?: Array<any>
  pagination?: { count?: number; next?: string }
}

export async function fetchAllCurrentMembers(): Promise<any[]> {
  const all: any[] = []
  let offset = 0
  const limit = 250

  // The members endpoint supports filters like currentMember. We'll fetch current members
  // in pages and then filter to chamber=Senate client-side.
  // (Limit is capped; if it changes, we'll still page safely.)
  //
  // Endpoint: /v3/member
  // Params used: currentMember=true, offset, limit
  //
  // If the API changes, you may need to adjust these params.
  for (let i = 0; i < 10; i++) {
    const data = await congressFetch<CongressMemberListResponse>('/member', {
      currentMember: true,
      offset,
      limit
    })
    const members = data.members ?? []
    all.push(...members)
    if (members.length < limit) break
    offset += limit
  }

  return all
}

export async function fetchMember(bioguideId: string): Promise<any> {
  // Official Congress.gov v3 endpoint: /member/{bioguideId}
  return congressFetch<any>(`/member/${encodeURIComponent(bioguideId)}`)
}

export async function fetchSponsoredLegislation(bioguideId: string, limit = 20): Promise<any> {
  // Official Congress.gov v3 endpoint: /member/{bioguideId}/sponsored-legislation
  // Note: The correct endpoint is /sponsored-legislation (NOT /sponsored-bills)
  return congressFetch<any>(`/member/${encodeURIComponent(bioguideId)}/sponsored-legislation`, {
    limit,
    offset: 0
  })
}

export async function fetchCosponsoredLegislation(bioguideId: string, limit = 20): Promise<any> {
  // Official Congress.gov v3 endpoint: /member/{bioguideId}/cosponsored-legislation
  // Note: The correct endpoint is /cosponsored-legislation (NOT /cosponsored-bills)
  return congressFetch<any>(`/member/${encodeURIComponent(bioguideId)}/cosponsored-legislation`, {
    limit,
    offset: 0
  })
}
