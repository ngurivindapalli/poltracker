export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'
import { fetchMember } from '@/lib/congress'

// Major news sources allowlist
const MAJOR_NEWS_SOURCES = [
  'reuters',
  'associated-press',
  'bbc-news',
  'cnn',
  'fox-news',
  'nbc-news',
  'abc-news',
  'cbs-news',
  'the-new-york-times',
  'the-washington-post',
  'the-wall-street-journal',
  'politico',
  'axios',
  'bloomberg',
  'usa-today',
  'al-jazeera-english',
  'the-guardian-uk'
]

// In-memory cache: Map<bioguideId, { timestamp: number; articles: any[] }>
const cache = new Map<string, { timestamp: number; articles: any[] }>()
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function shouldFilterUrl(url: string): boolean {
  if (!url) return true
  const lowerUrl = url.toLowerCase()
  return lowerUrl.includes('opinion') || lowerUrl.includes('/blog')
}

function getSourceId(source: any): string {
  if (typeof source === 'string') return source.toLowerCase()
  return (source?.id ?? source?.name ?? '').toLowerCase().replace(/\s+/g, '-')
}

function isMajorSource(source: any): boolean {
  const sourceId = getSourceId(source)
  return MAJOR_NEWS_SOURCES.includes(sourceId)
}

function deduplicateArticles(articles: any[]): any[] {
  const seen = new Set<string>()
  const unique: any[] = []

  for (const article of articles) {
    const normalizedTitle = normalizeTitle(article.title || '')
    if (normalizedTitle && !seen.has(normalizedTitle)) {
      seen.add(normalizedTitle)
      unique.push(article)
    }
  }

  return unique
}

function processArticles(rawArticles: any[]): any[] {
  return rawArticles
    .filter((article) => {
      if (!isMajorSource(article.source)) return false
      if (shouldFilterUrl(article.url)) return false
      if (!article.title || !article.title.trim()) return false
      return true
    })
    .map((article) => ({
      title: article.title || '',
      description: article.description || '',
      url: article.url || '',
      source: article.source?.name || article.source || '',
      publishedAt: article.publishedAt || '',
    }))
    .sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime()
      const dateB = new Date(b.publishedAt).getTime()
      return dateB - dateA
    })
}

export async function GET(
  req: Request,
  { params }: { params: { bioguideId: string } }
) {
  try {
    const bioguideId = params.bioguideId
    
    // Runtime check for NewsAPI key
    if (!process.env.NEWS_API_KEY) {
      return NextResponse.json(
        { error: "NEWS_API_KEY missing", sourceType: 'major', articles: [] },
        { status: 500 }
      )
    }
    
    const url = new URL(req.url)
    const coverage = url.searchParams.get('coverage') || 'major'
    
    // Check cache first
    const cacheKey = `${bioguideId}:${coverage}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({
        sourceType: coverage,
        articles: cached.articles
      })
    }
    
    // Fetch senator data to get their full name
    const senatorData = await fetchMember(bioguideId)
    const member = senatorData?.member ?? senatorData
    
    const fullName = member?.directOrderName ?? member?.name ?? member?.fullName
    
    if (!fullName) {
      return NextResponse.json({ 
        sourceType: coverage,
        articles: [] 
      })
    }

    // Fetch family data to include in news query
    let familyNames: string[] = []
    try {
      const { getServerUrl } = await import('@/lib/serverUrl')
      const base = getServerUrl()
      const familyRes = await fetch(`${base}/api/member/${bioguideId}/family?country=US`, {
        cache: 'no-store'
      })
      if (familyRes.ok) {
        const familyData = await familyRes.json()
        familyNames = (familyData.family || []).map((f: any) => f.name).filter(Boolean)
      }
    } catch (err) {
      console.error('Error fetching family data for news query:', err)
    }

    const apiKey = process.env.NEWS_API_KEY!
    const allNames = [fullName, ...familyNames].filter(Boolean)
    const queryParts = allNames.map(name => `"${name}"`)
    const query = encodeURIComponent(queryParts.join(' OR '))
    
    const sourcesParam = coverage === 'all' 
      ? '' 
      : `&sources=${MAJOR_NEWS_SOURCES.join(',')}`
    
    const newsApiUrl = `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=20&apiKey=${apiKey}${sourcesParam}`

    const response = await fetch(newsApiUrl, {
      headers: {
        'User-Agent': 'PolTracker/1.0'
      }
    })

    if (!response.ok) {
      return NextResponse.json({ 
        sourceType: coverage,
        articles: [] 
      })
    }

    const data = await response.json()
    const rawArticles = data.articles || []
    
    let processedArticles: any[]
    
    if (coverage === 'all') {
      processedArticles = rawArticles
        .filter((article: any) => {
          if (shouldFilterUrl(article.url)) return false
          if (!article.title || !article.title.trim()) return false
          return true
        })
        .map((article: any) => ({
          title: article.title || '',
          description: article.description || '',
          url: article.url || '',
          source: article.source?.name || article.source || '',
          publishedAt: article.publishedAt || '',
        }))
    } else {
      processedArticles = processArticles(rawArticles)
    }
    
    processedArticles = deduplicateArticles(processedArticles)
    processedArticles = processedArticles.slice(0, 10)
    
    const finalArticles = processedArticles.map((article) => ({
      title: article.title,
      description: article.description,
      url: article.url,
      source: article.source,
      publishedAt: article.publishedAt,
    }))

    // Cache the results
    cache.set(cacheKey, {
      timestamp: Date.now(),
      articles: finalArticles
    })

    return NextResponse.json({
      sourceType: coverage,
      articles: finalArticles
    })
  } catch (err: any) {
    console.error('Error fetching news:', err)
    return NextResponse.json(
      { error: "server_error", sourceType: 'major', articles: [] },
      { status: 500 }
    )
  }
}
