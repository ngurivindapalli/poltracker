export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { fetchUKNews } from '@/lib/uk/newsProvider'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const sort = url.searchParams.get('sort') || 'publishedAt'
    
    const articles = await fetchUKNews(sort)
    
    return NextResponse.json({ articles })
  } catch (err: any) {
    console.error('Error fetching UK news:', err)
    return NextResponse.json(
      { articles: [], error: err?.message ?? 'Failed to fetch UK news' },
      { status: 500 }
    )
  }
}
