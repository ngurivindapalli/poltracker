export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSenatorInvestments } from '@/lib/data/investmentsProvider'

export async function GET(
  _req: Request,
  { params }: { params: { bioguideId: string } }
) {
  try {
    const bioguideId = params.bioguideId
    const investments = await getSenatorInvestments(bioguideId)

    return NextResponse.json({
      investments,
      bioguideId
    })
  } catch (err: any) {
    console.error('Error fetching investments:', err)
    return NextResponse.json({ 
      investments: [],
      bioguideId: params.bioguideId,
      error: err?.message ?? 'Failed to fetch investments'
    }, { status: 500 })
  }
}
