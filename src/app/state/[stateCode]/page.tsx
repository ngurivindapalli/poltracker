import Link from 'next/link'
import { getBaseUrl } from '@/lib/getBaseUrl'
import BillSection from '@/components/BillSection'
import NewsSection from '@/components/NewsSection'

async function getJson(path: string) {
  try {
    const baseUrl = getBaseUrl()
    const res = await fetch(`${baseUrl}${path}`, {
      cache: 'no-store'
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export default async function StatePage({ params }: { params: { stateCode: string } }) {
  const { stateCode } = params
  const baseUrl = getBaseUrl()

  const stateData = await getJson(`/api/state/${stateCode.toUpperCase()}`)

  if (!stateData || stateData.error) {
    return (
      <div className="page-transition space-y-6">
        <div>
          <Link
            href="/"
            className="text-sm text-muted hover:text-primary underline transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <div className="text-lg font-semibold text-red-800">
            {stateData?.error || 'Unable to load state data right now.'}
          </div>
          <div className="mt-2 text-sm text-red-700">Please try again later.</div>
        </div>
      </div>
    )
  }

  const { stateName, members, news, bills } = stateData
  const senators = members.filter((m: any) => 
    (m.chamber || '').toLowerCase().includes('senate')
  )
  const representatives = members.filter((m: any) => 
    (m.chamber || '').toLowerCase().includes('house')
  )

  return (
    <div className="page-transition space-y-8">
      <div>
        <Link
          href="/"
          className="text-sm text-muted hover:text-primary underline transition-colors"
        >
          ← Back to Home
        </Link>
      </div>

      <div className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight text-primary">
          {stateName}
        </h1>
        <div className="text-sm text-muted">
          {senators.length} Senator{senators.length !== 1 ? 's' : ''} • {representatives.length} Representative{representatives.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Members List */}
      {members.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-primary">Members of Congress</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member: any) => (
              <div
                key={member.bioguideId}
                className="rounded-xl border border-border bg-white p-4"
              >
                <div className="text-base font-semibold text-primary">{member.name}</div>
                <div className="mt-1 text-sm text-muted">
                  {member.party || '—'} • {member.chamber || '—'}
                </div>
                {member.bioguideId && (
                  <div className="mt-2">
                    <Link
                      href={`/senator/${member.bioguideId}`}
                      className="text-xs text-accent hover:text-primary underline transition-colors"
                    >
                      View profile →
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* News Section */}
      {news && news.length > 0 ? (
        <NewsSection
          bioguideId={stateCode}
          initialArticles={news}
          initialSourceType="major"
          isStatePage={true}
        />
      ) : (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-primary">Recent News</h2>
          <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted">
            No recent news found for {stateName}.
          </div>
        </section>
      )}

      {/* Bills Section */}
      {bills?.sponsored && bills.sponsored.length > 0 && (
        <BillSection title="Sponsored Legislation" bills={bills.sponsored} showToggle={false} />
      )}

      {bills?.cosponsored && bills.cosponsored.length > 0 && (
        <BillSection title="Cosponsored Legislation" bills={bills.cosponsored} showToggle={false} />
      )}

      {(!bills?.sponsored?.length && !bills?.cosponsored?.length) && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-primary">Legislation</h2>
          <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted">
            No recent legislation data available for {stateName}.
          </div>
        </section>
      )}
    </div>
  )
}
