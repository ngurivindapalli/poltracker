import { NextResponse } from 'next/server'
import { getBaseUrl } from '@/lib/getBaseUrl'

export const runtime = 'nodejs'

export async function GET() {
  console.log('API investments loaded')
  
  try {
    const baseUrl = getBaseUrl()
    const res = await fetch(`${baseUrl}/data/investments.json`, {
      cache: 'no-store'
    })
    
    if (!res.ok) {
      console.error('Failed to fetch investments.json:', res.status)
      return NextResponse.json({ investments: [] })
    }
    
    const data = await res.json()
    
    // Flatten all investments from all countries and members
    const allInvestments: any[] = []
    
    for (const country of Object.keys(data)) {
      const countryData = data[country]
      for (const memberId of Object.keys(countryData)) {
        const memberInvestments = countryData[memberId] || []
        for (const inv of memberInvestments) {
          allInvestments.push({
            ...inv,
            memberId,
            country
          })
        }
      }
    }
    
    console.log('Loaded Investments:', allInvestments.length)
    return NextResponse.json({ investments: allInvestments })
  } catch (err: any) {
    console.error('Failed loading investments dataset:', err?.message ?? String(err))
    return NextResponse.json({ investments: [] })
  }
}
