import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  console.log('API bills loaded')
  
  const API_KEY = process.env.API_DATA_GOV_KEY
  
  if (!API_KEY) {
    console.error('API_DATA_GOV_KEY not configured')
    return NextResponse.json({ bills: [] })
  }
  
  try {
    // Fetch recent bills from Congress.gov
    const url = `https://api.congress.gov/v3/bill?api_key=${API_KEY}&limit=50&sort=updateDate+desc`
    
    const res = await fetch(url, { cache: 'no-store' })
    
    if (!res.ok) {
      console.error('Congress API error:', res.status)
      return NextResponse.json({ bills: [] })
    }
    
    const data = await res.json()
    
    const bills = (data.bills || []).map((b: any) => ({
      number: b.number,
      type: b.type,
      title: b.title,
      congress: b.congress,
      originChamber: b.originChamber,
      latestAction: b.latestAction?.text || 'Introduced',
      updateDate: b.updateDate
    }))
    
    console.log('Loaded Bills:', bills.length)
    return NextResponse.json({ bills })
  } catch (err: any) {
    console.error('Failed loading bills dataset:', err?.message ?? String(err))
    return NextResponse.json({ bills: [] })
  }
}
