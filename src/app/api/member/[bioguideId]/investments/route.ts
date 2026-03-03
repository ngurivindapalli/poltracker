export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  req: Request,
  { params }: { params: { bioguideId: string } }
) {
  try {
    const bioguideId = params.bioguideId
    const url = new URL(req.url)
    const country = url.searchParams.get('country') || 'US'

    // Read investments data from public directory
    let investmentsData: any = {}

    try {
      const filePath = path.join(process.cwd(), 'public', 'data', 'investments.json')
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8')
        investmentsData = JSON.parse(raw)
        console.log('Loaded Investments data')
      } else {
        console.log('investments.json not found')
      }
    } catch (readError) {
      console.error('Error reading investments file:', readError)
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
