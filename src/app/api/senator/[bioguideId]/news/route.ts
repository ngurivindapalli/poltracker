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

// Future upgrade: Credibility weights for sorting
// Higher weight = more credible (Reuters, AP are most trusted)
const SOURCE_WEIGHTS: Record<string, number> = {
  reuters: 1.0,
  'associated-press': 0.95,
  'bbc-news': 0.9,
  cnn: 0.85,
  'fox-news': 0.85,
  'nbc-news': 0.85,
  'abc-news': 0.8,
  'cbs-news': 0.8,
  'the-new-york-times': 0.9,
  'the-washington-post': 0.9,
  'the-wall-street-journal': 0.9,
  politico: 0.8,
  axios: 0.75,
  bloomberg: 0.85,
  'usa-today': 0.75,
  'al-jazeera-english': 0.8,
  'the-guardian-uk': 0.85
}

// Primary sources (Reuters, AP) - highest credibility
const PRIMARY_SOURCES = ['reuters', 'associated-press']

// In-memory cache: Map<bioguideId, { timestamp: number; articles: any[] }>
const cache = new Map<string, { timestamp: number; articles: any[] }>()
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

/**
 * Normalize title for deduplication
 * - Convert to lowercase
 * - Remove punctuation
 * - Trim whitespace
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

/**
 * Check if URL should be filtered out (opinion pieces, blogs)
 */
function shouldFilterUrl(url: string): boolean {
  if (!url) return true
  const lowerUrl = url.toLowerCase()
  return lowerUrl.includes('opinion') || lowerUrl.includes('/blog')
}

/**
 * Get source ID from NewsAPI source object
 */
function getSourceId(source: any): string {
  if (typeof source === 'string') return source.toLowerCase()
  return (source?.id ?? source?.name ?? '').toLowerCase().replace(/\s+/g, '-')
}

/**
 * Check if source is in the major news allowlist
 */
function isMajorSource(source: any): boolean {
  const sourceId = getSourceId(source)
  return MAJOR_NEWS_SOURCES.includes(sourceId)
}

/**
 * Get credibility weight for a source (for future sorting)
 */
function getSourceWeight(source: any): number {
  const sourceId = getSourceId(source)
  return SOURCE_WEIGHTS[sourceId] ?? 0.5 // Default weight for unknown sources
}

/**
 * Check if source is a primary source (Reuters, AP)
 */
function isPrimarySource(source: any): boolean {
  const sourceId = getSourceId(source)
  return PRIMARY_SOURCES.includes(sourceId)
}

/**
 * Deduplicate articles by normalized title
 */
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

/**
 * Filter and process articles
 */
function processArticles(rawArticles: any[]): any[] {
  return rawArticles
    .filter((article) => {
      // Filter by major sources only
      if (!isMajorSource(article.source)) return false
      
      // Filter out opinion pieces and blogs
      if (shouldFilterUrl(article.url)) return false
      
      // Must have a title
      if (!article.title || !article.title.trim()) return false
      
      return true
    })
    .map((article) => ({
      title: article.title || '',
      description: article.description || '',
      url: article.url || '',
      source: article.source?.name || article.source || '',
      publishedAt: article.publishedAt || '',
      // Future upgrade: Add credibility metadata (not exposed in UI yet)
      _metadata: {
        sourceId: getSourceId(article.source),
        weight: getSourceWeight(article.source),
        isPrimary: isPrimarySource(article.source)
      }
    }))
    .sort((a, b) => {
      // Sort by credibility weight (highest first)
      // Future: This can be enhanced with date + weight combination
      const weightA = a._metadata.weight
      const weightB = b._metadata.weight
      if (weightB !== weightA) return weightB - weightA
      
      // Secondary sort by date (newest first)
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
    
    console.log('News route hit:', bioguideId)
    
    // Runtime check for NewsAPI key
    if (!process.env.NEWS_API_KEY) {
      console.error('NEWS_API_KEY missing')
      throw new Error('NEWS_API_KEY missing')
    }
    
    console.log('NewsAPI key exists:', !!process.env.NEWS_API_KEY)
    
    // Future upgrade: Support coverage type toggle
    // ?coverage=major | all
    const url = new URL(req.url)
    const coverage = url.searchParams.get('coverage') || 'major' // Default to 'major'
    
    // Check cache first (cache key includes coverage type for different results)
    const cacheKey = `${bioguideId}:${coverage}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      // Apply sorting to cached results if needed
      let cachedArticles = [...cached.articles]
      const sortParam = url.searchParams.get('sort') || 'credibility'
      
      if (sortParam === 'date') {
        cachedArticles.sort((a, b) => {
          const dateA = new Date(a.publishedAt).getTime()
          const dateB = new Date(b.publishedAt).getTime()
          return dateB - dateA
        })
      } else if (sortParam === 'credibility') {
        cachedArticles.sort((a, b) => {
          const weightA = a._metadata?.weight ?? 0.5
          const weightB = b._metadata?.weight ?? 0.5
          if (weightB !== weightA) return weightB - weightA
          const dateA = new Date(a.publishedAt).getTime()
          const dateB = new Date(b.publishedAt).getTime()
          return dateB - dateA
        })
      }
      
      return NextResponse.json({
        sourceType: coverage,
        articles: cachedArticles
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

    // API key already checked at the top, but get it for use
    const apiKey = process.env.NEWS_API_KEY!

    // Build NewsAPI query
    const query = encodeURIComponent(`"${fullName}"`)
    
    // Future upgrade: Support 'all' coverage type
    const sourcesParam = coverage === 'all' 
      ? '' // No sources filter = all sources
      : `&sources=${MAJOR_NEWS_SOURCES.join(',')}`
    
    const newsApiUrl = `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=20&apiKey=${apiKey}${sourcesParam}`

    console.log('Calling NewsAPI:', { query, coverage, sourcesParam: sourcesParam ? 'filtered' : 'all' })

    const response = await fetch(newsApiUrl, {
      headers: {
        'User-Agent': 'PolTracker/1.0'
      }
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error(`NewsAPI error: ${response.status} ${response.statusText}`, errorText.slice(0, 200))
      return NextResponse.json({ 
        sourceType: coverage,
        articles: [] 
      })
    }

    const data = await response.json()
    const rawArticles = data.articles || []
    
    console.log('NewsAPI returned articles:', rawArticles.length)

    // Process articles based on coverage type
    let processedArticles: any[]
    
    // Get sort parameter early
    const sortParam = url.searchParams.get('sort') || 'credibility'
    
    if (coverage === 'all') {
      // For 'all' coverage, filter out opinion/blog but don't restrict to major sources
      processedArticles = rawArticles
        .filter((article: any) => {
          // Filter out opinion pieces and blogs
          if (shouldFilterUrl(article.url)) return false
          // Must have a title
          if (!article.title || !article.title.trim()) return false
          return true
        })
        .map((article: any) => ({
          title: article.title || '',
          description: article.description || '',
          url: article.url || '',
          source: article.source?.name || article.source || '',
          publishedAt: article.publishedAt || '',
          _metadata: {
            sourceId: getSourceId(article.source),
            weight: getSourceWeight(article.source),
            isPrimary: isPrimarySource(article.source)
          }
        }))
      
      // For 'all' coverage, preserve NewsAPI order (by publishedAt) unless sorting is requested
      // NewsAPI already returns sorted by publishedAt, so we keep that order for 'none'
    } else {
      // For 'major' coverage, use existing processArticles function (already sorts by credibility)
      processedArticles = processArticles(rawArticles)
    }
    
    // Deduplicate by normalized title
    processedArticles = deduplicateArticles(processedArticles)
    
    // Apply sorting based on parameter (only if not 'none' or if coverage is 'all')
    if (sortParam === 'date') {
      processedArticles.sort((a, b) => {
        const dateA = new Date(a.publishedAt).getTime()
        const dateB = new Date(b.publishedAt).getTime()
        return dateB - dateA // Newest first
      })
    } else if (sortParam === 'credibility') {
      // Sort by credibility weight (for 'all' coverage, or to re-sort 'major' coverage)
      processedArticles.sort((a, b) => {
        const weightA = a._metadata.weight
        const weightB = b._metadata.weight
        if (weightB !== weightA) return weightB - weightA
        const dateA = new Date(a.publishedAt).getTime()
        const dateB = new Date(b.publishedAt).getTime()
        return dateB - dateA
      })
    }
    // 'none' - keep original order (NewsAPI's publishedAt order for 'all', or processArticles order for 'major')
    
    // Limit to top 10 after processing
    processedArticles = processedArticles.slice(0, 10)
    
    // Keep metadata for client-side sorting (will be used by frontend)
    const finalArticles = processedArticles.map((article) => ({
      title: article.title,
      description: article.description,
      url: article.url,
      source: article.source,
      publishedAt: article.publishedAt,
      _metadata: article._metadata
    }))

    // Cache the results (key includes coverage type)
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
    // In error case, default to 'major' since we can't determine coverage from error
    return NextResponse.json({ 
      sourceType: 'major',
      articles: [] 
    })
  }
}
