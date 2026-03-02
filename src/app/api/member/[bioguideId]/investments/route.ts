export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getBaseUrl } from '@/lib/getBaseUrl'

export async function GET(
  req: Request,
  { params }: { params: { bioguideId: string } }
) {
  try {
    const bioguideId = params.bioguideId
    const url = new URL(req.url)
    const country = url.searchParams.get('country') || 'US'

    // Fetch investments data from public directory
    const baseUrl = getBaseUrl()
    let investmentsData: any = {}

    try {
      const res = await fetch(`${baseUrl}/data/investments.json`, {
        cache: 'no-store'
      })
      if (res.ok) {
        investmentsData = await res.json()
        console.log('Loaded Investments data')
      } else {
        console.error('Failed loading investments dataset')
      }
    } catch (fetchError) {
      console.error('Error fetching investments file:', fetchError)
    }

    const countryData = investmentsData[country] || {}
    const investments = countryData[bioguideId] || []

    return NextResponse.json({
      investments,
      memberId: bioguideId,
      country
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
