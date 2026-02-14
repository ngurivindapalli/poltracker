import Image from 'next/image'
import { getBaseUrl } from '@/lib/getBaseUrl'
import BillSection from '@/components/BillSection'
import NewsSection from '@/components/NewsSection'

async function getJson(path: string) {
  try {
    const res = await fetch(path, { cache: 'no-store' })
    
    // Read response as text first to check if it's HTML
    const text = await res.text()
    
    // Check if response is HTML (API route returned error page)
    if (text.trim().startsWith('<!') || text.trim().startsWith('<!doctype') || text.trim().startsWith('<!DOCTYPE')) {
      console.error(`API route returned HTML instead of JSON for ${path}. Status: ${res.status}`)
      return null
    }
    
    // Check if response is OK
    if (!res.ok) {
      // Try to parse as JSON to get error message
      try {
        const json = JSON.parse(text)
        console.error(`API error ${res.status} for ${path}:`, json?.error ?? 'Request failed')
      } catch {
        console.error(`API error ${res.status} for ${path}: Non-JSON error response`)
      }
      return null
    }
    
    // Safely parse JSON
    try {
      const json = JSON.parse(text)
      return json
    } catch (parseError) {
      console.error(`Failed to parse JSON response from ${path}:`, parseError)
      return null
    }
  } catch (error) {
    console.error(`Failed to fetch ${path}:`, error)
    return null
  }
}

export default async function SenatorPage({ params }: { params: { bioguideId: string } }) {
  const { bioguideId } = params
  const baseUrl = getBaseUrl()

  // Fetch all data independently with error handling
  const [senator, sponsored, cosponsored, news] = await Promise.all([
    getJson(`${baseUrl}/api/senator/${bioguideId}`),
    getJson(`${baseUrl}/api/senator/${bioguideId}/sponsored-bills`).catch(() => null),
    getJson(`${baseUrl}/api/senator/${bioguideId}/cosponsored-bills`).catch(() => null),
    getJson(`${baseUrl}/api/senator/${bioguideId}/news`).catch(() => null)
  ])

  // If senator profile failed to load, show full-page error (page cannot render)
  if (!senator || !senator.profile) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <div className="text-lg font-semibold text-red-800">Unable to load senator data right now.</div>
          <div className="mt-2 text-sm text-red-700">Please try again later.</div>
        </div>
      </div>
    )
  }

  const profile = senator.profile
  const sponsoredBills = sponsored?.bills ?? []
  const cosponsoredBills = cosponsored?.bills ?? []
  const newsArticles = news?.articles ?? []
  const sponsoredFailed = sponsored === null
  const cosponsoredFailed = cosponsored === null
  const newsFailed = news === null

  return (
    <div className="page-transition space-y-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="relative h-[220px] w-[180px] shrink-0 overflow-hidden rounded-xl border border-border bg-background">
          <Image src={profile.imageUrl} alt={profile.name} fill sizes="180px" className="object-cover" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-3xl font-semibold tracking-tight text-primary">{profile.name}</div>
          <div className="mt-2 text-sm text-muted">
            {profile.party ?? '—'} • {profile.state ?? '—'} • Bioguide: <span className="font-mono">{profile.bioguideId}</span>
          </div>

          <div className="mt-6 grid gap-3 rounded-xl border border-border bg-background p-5 text-sm">
            <div className="text-xs font-semibold text-primary uppercase tracking-wide">Profile snapshot</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-xs text-muted mb-1">Party</div>
                <div className="font-medium text-primary">{profile.party || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-muted mb-1">State</div>
                <div className="font-medium text-primary">{profile.state || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-muted mb-1">Official site</div>
                <div className="truncate text-muted">{senator.member?.officialWebsiteUrl ? <a href={senator.member.officialWebsiteUrl} target="_blank" className="text-accent hover:text-accent/80 no-underline transition-colors">{senator.member.officialWebsiteUrl}</a> : '—'}</div>
              </div>
              <div>
                <div className="text-xs text-muted mb-1">Contact</div>
                <div className="truncate text-muted">{senator.member?.addressInformation?.phoneNumber ?? senator.member?.phoneNumber ?? '—'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {sponsoredFailed ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-primary">Sponsored legislation (recent)</h2>
            <div className="text-xs text-muted">Top 20</div>
          </div>
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            Unable to load sponsored bills.
          </div>
        </section>
      ) : (
        <BillSection title="Sponsored legislation (recent)" bills={sponsoredBills} />
      )}

      {cosponsoredFailed ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-primary">Cosponsored legislation (recent)</h2>
            <div className="text-xs text-muted">Top 20</div>
          </div>
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            Unable to load cosponsored bills.
          </div>
        </section>
      ) : (
        <BillSection title="Cosponsored legislation (recent)" bills={cosponsoredBills} />
      )}

      {newsFailed ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-primary">Recent News</h2>
          </div>
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            Unable to load recent news.
          </div>
        </section>
      ) : (
        <NewsSection
          bioguideId={bioguideId}
          initialArticles={newsArticles}
          initialSourceType={news?.sourceType || 'major'}
        />
      )}
    </div>
  )
}
