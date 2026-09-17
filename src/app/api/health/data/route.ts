export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { getDatasetFreshness } from '@/lib/sync/freshness'
import { getSenatorSummaries } from '@/lib/senators/summaries'
import { getRepresentativeSummaries } from '@/lib/representatives/summaries'

export async function GET() {
  const prisma = await getPrisma()
  let billCount = 0
  let nwCount = 0
  let newsCount = 0
  if (prisma?.memberBill) {
    try { billCount = await prisma.memberBill.count() } catch { /* */ }
  }
  if (prisma?.politicianNetWorth) {
    try { nwCount = await prisma.politicianNetWorth.count() } catch { /* */ }
  }
  if (prisma?.cachedNewsArticle) {
    try { newsCount = await prisma.cachedNewsArticle.count() } catch { /* */ }
  }

  const [legis, senators, reps, news] = await Promise.all([
    getDatasetFreshness('legislation'),
    getSenatorSummaries(),
    getRepresentativeSummaries(),
    getDatasetFreshness('news'),
  ])

  return NextResponse.json({
    database: Boolean(prisma),
    congressConfigured: Boolean(process.env.API_DATA_GOV_KEY),
    quiverConfigured: Boolean(process.env.QUIVER_API_KEY),
    newsConfigured: Boolean(process.env.NEWS_API_KEY),
    legislativeRecords: billCount,
    legislativeLastSync: legis?.lastSuccessfulSync ?? null,
    senators: senators.count,
    representatives: reps.count,
    financialRecords: nwCount,
    newsRecords: newsCount,
    newsLastSync: news?.lastSuccessfulSync ?? null,
    nodeVersion: process.version,
  })
}
