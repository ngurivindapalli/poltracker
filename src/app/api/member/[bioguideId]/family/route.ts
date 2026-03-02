export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

// Mock family data - in production, this would come from a database or API
const MOCK_FAMILY_DATA: Record<string, Record<string, any[]>> = {
  US: {
    A000360: [
      {
        name: 'Jane Smith',
        relation: 'spouse',
        occupation: 'Attorney',
        organization: 'Smith & Associates',
        government_role: undefined
      },
      {
        name: 'John Smith Jr.',
        relation: 'child',
        occupation: 'Student',
        organization: undefined,
        government_role: undefined
      }
    ],
    B000575: [
      {
        name: 'Mary Johnson',
        relation: 'spouse',
        occupation: 'Physician',
        organization: 'City Hospital',
        government_role: undefined
      }
    ]
  },
  DE: {
    '1': [
      {
        name: 'Joachim Sauer',
        relation: 'spouse',
        occupation: 'Professor',
        organization: 'Humboldt University',
        government_role: undefined
      }
    ],
    '2': [
      {
        name: 'Britta Ernst',
        relation: 'spouse',
        occupation: 'Politician',
        organization: undefined,
        government_role: 'Minister of Education, Schleswig-Holstein'
      }
    ]
  }
}

export async function GET(
  req: Request,
  { params }: { params: { bioguideId: string } }
) {
  try {
    const bioguideId = params.bioguideId
    const url = new URL(req.url)
    const country = url.searchParams.get('country') || 'US'

    const countryData = MOCK_FAMILY_DATA[country] || {}
    const family = countryData[bioguideId] || []

    return NextResponse.json({
      family,
      memberId: bioguideId,
      country
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
