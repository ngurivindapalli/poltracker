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

    // Read investments data
    const dataPath = path.join(process.cwd(), 'data', 'investments.json')
    let investmentsData: any = {}

    try {
      const fileContent = fs.readFileSync(dataPath, 'utf-8')
      investmentsData = JSON.parse(fileContent)
    } catch (fileError) {
      console.error('Error reading investments file:', fileError)
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
