export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

// This is a placeholder - in production, integrate with NewsAPI
// and include family member names in queries
export async function GET(
  req: Request,
  { params }: { params: { bioguideId: string } }
) {
  try {
    const bioguideId = params.bioguideId
    const url = new URL(req.url)
    const country = url.searchParams.get('country') || 'US'

    // Placeholder - would fetch family data and include in news query
    // For now, return empty array
    const articles: any[] = []

    return NextResponse.json({
      articles,
      memberId: bioguideId,
      country
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
