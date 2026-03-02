export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const query = url.searchParams.get('q')

    if (!query) {
      return NextResponse.json({ articles: [] })
    }

    const apiKey = process.env.NEWS_API_KEY

    if (!apiKey) {
      return NextResponse.json({ articles: [] })
    }

    const newsApiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`

    const response = await fetch(newsApiUrl, {
      headers: {
        'User-Agent': 'PolTracker/1.0'
      }
    })

    if (!response.ok) {
      return NextResponse.json({ articles: [] })
    }

    const data = await response.json()

    return NextResponse.json({
      articles: data.articles || []
    })
  } catch (err: any) {
    console.error('Error fetching news:', err)
    return NextResponse.json({ articles: [] })
  }
}
