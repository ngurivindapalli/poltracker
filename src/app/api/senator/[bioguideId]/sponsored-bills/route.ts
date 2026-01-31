export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'
import { fetchSponsoredLegislation } from '@/lib/congress'
import { getPublicBillUrl } from '@/lib/bills'

function simplify(b: any) {
  return {
    title: b?.title ?? b?.shortTitle ?? 'Untitled',
    congress: b?.congress,
    type: b?.type,
    number: b?.number,
    introducedDate: b?.introducedDate,
    latestAction: b?.latestAction?.text ?? b?.latestAction,
    url: getPublicBillUrl(b)
  }
}

export async function GET(
  _req: Request,
  { params }: { params: { bioguideId: string } }
) {
  // Check for API key before processing
  if (!process.env.API_DATA_GOV_KEY) {
    throw new Error('Missing API_DATA_GOV_KEY')
  }

  try {
    const data = await fetchSponsoredLegislation(params.bioguideId, 20)
    const bills = (data?.sponsoredLegislation?.bills ?? data?.bills ?? data?.sponsoredLegislation ?? []).map(simplify)
    return NextResponse.json({ bills })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
