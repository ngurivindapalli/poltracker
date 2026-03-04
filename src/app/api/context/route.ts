import { NextResponse } from 'next/server'
import { getBaseUrl } from '@/lib/baseUrl'

export async function GET() {
  try {
    const base = getBaseUrl()
    // Fetch all data in parallel
    const [senatorsRes, germanyRes, ukNewsRes] = await Promise.all([
      fetch(`${base}/api/senators`, { cache: 'no-store' }).catch(() => null),
      fetch(`${base}/api/germany/members`, { cache: 'no-store' }).catch(() => null),
      fetch(`${base}/api/uk/news`, { cache: 'no-store' }).catch(() => null)
    ])

    const senators = senatorsRes?.ok ? await senatorsRes.json() : { senators: [] }
    const germany = germanyRes?.ok ? await germanyRes.json() : []
    const ukNews = ukNewsRes?.ok ? await ukNewsRes.json() : { articles: [] }

    // Get sample bills from a senator
    let bills: any[] = []
    if (senators.senators && senators.senators.length > 0) {
      try {
        const sampleSenator = senators.senators[0]
        const billsRes = await fetch(`${base}/api/senator/${sampleSenator.bioguideId}/sponsored-bills`, { cache: 'no-store' })
        if (billsRes.ok) {
          const billsData = await billsRes.json()
          bills = billsData.bills || []
        }
      } catch {}
    }

    return NextResponse.json({
      senators: senators.senators || [],
      bills: bills.slice(0, 20),
      germany: Array.isArray(germany) ? germany.slice(0, 20) : [],
      ukNews: ukNews.articles || []
    })
  } catch (error) {
    console.error('Error fetching context:', error)
    return NextResponse.json({
      senators: [],
      bills: [],
      germany: [],
      ukNews: []
    })
  }
}
