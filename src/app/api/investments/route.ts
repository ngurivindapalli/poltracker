import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

export async function GET() {
  console.log('API investments loaded')
  
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'investments.json')
    
    if (!fs.existsSync(filePath)) {
      console.log('investments.json not found')
      return NextResponse.json({ investments: [] })
    }
    
    const raw = fs.readFileSync(filePath, 'utf8')
    const data = JSON.parse(raw)
    
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
