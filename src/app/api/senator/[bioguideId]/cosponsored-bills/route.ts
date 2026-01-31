import { NextResponse } from 'next/server'
import { fetchCosponsoredLegislation } from '@/lib/congress'
import { getPublicBillUrl } from '@/lib/bills'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

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
    return NextResponse.json(
      { error: 'API_DATA_GOV_KEY environment variable is not set' },
      { status: 500 }
    )
  }

  try {
    const data = await fetchCosponsoredLegislation(params.bioguideId, 20)
    const bills = (data?.cosponsoredLegislation?.bills ?? data?.bills ?? data?.cosponsoredLegislation ?? []).map(
      simplify
    )
    return NextResponse.json({ bills })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
