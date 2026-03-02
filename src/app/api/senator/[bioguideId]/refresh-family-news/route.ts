export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { fetchFamilyMembersNews } from '@/lib/news/familyNewsProvider'
import { getSenatorFamily } from '@/lib/data/wikidataProvider'
import { fetchMember } from '@/lib/congress'

// In-memory cache for family news (in production, use Redis or database)
const familyNewsCache = new Map<string, {
  data: any[]
  timestamp: number
  newArticlesCount: number
}>()

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

export async function GET(
  _req: Request,
  { params }: { params: { bioguideId: string } }
) {
  try {
    const bioguideId = params.bioguideId

    // Get senator data to get name
    const senatorData = await fetchMember(bioguideId)
    const member = senatorData?.member ?? senatorData
    const fullName = member?.directOrderName ?? member?.name ?? member?.fullName ?? ''

    if (!fullName) {
      return NextResponse.json({
        familyMembers: [],
        bioguideId,
        newArticlesCount: 0
      })
    }

    // Fetch family data
    const family = await getSenatorFamily(fullName)

    if (family.length === 0) {
      return NextResponse.json({
        familyMembers: [],
        bioguideId,
        newArticlesCount: 0
      })
    }

    // Check cache
    const cacheKey = `${bioguideId}-family-news`
    const cached = familyNewsCache.get(cacheKey)
    const now = Date.now()

    // Fetch fresh news for all family members
    const familyMembersWithNews = await fetchFamilyMembersNews(family)

    // Calculate new articles count (compare with cached data)
    let newArticlesCount = 0
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      // Compare article counts
      const cachedArticleCount = cached.data.reduce((sum, m) => sum + (m.news?.length || 0), 0)
      const newArticleCount = familyMembersWithNews.reduce((sum, m) => sum + (m.news?.length || 0), 0)
      newArticlesCount = Math.max(0, newArticleCount - cachedArticleCount)
    } else {
      // First time or cache expired - count all as potentially new
      newArticlesCount = familyMembersWithNews.reduce((sum, m) => sum + (m.news?.length || 0), 0)
    }

    // Update cache
    familyNewsCache.set(cacheKey, {
      data: familyMembersWithNews,
      timestamp: now,
      newArticlesCount
    })

    return NextResponse.json({
      familyMembers: familyMembersWithNews,
      bioguideId,
      newArticlesCount,
      refreshedAt: new Date().toISOString()
    })
  } catch (err: any) {
    console.error('Error refreshing family news:', err)
    return NextResponse.json({
      familyMembers: [],
      bioguideId: params.bioguideId,
      newArticlesCount: 0,
      error: err?.message ?? 'Failed to refresh family news'
    }, { status: 500 })
  }
}
