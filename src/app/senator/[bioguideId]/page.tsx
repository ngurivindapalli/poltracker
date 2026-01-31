import Image from 'next/image'
import { getBaseUrl } from '@/lib/getBaseUrl'
import BillSection from '@/components/BillSection'

async function getJson(path: string) {
  try {
    const res = await fetch(path, { cache: 'no-store' })
    const json = await res.json()
    
    if (!res.ok) {
      console.error(`API error ${res.status} for ${path}:`, json?.error ?? 'Request failed')
      return null
    }
    
    return json
  } catch (error) {
    console.error(`Failed to fetch ${path}:`, error)
    return null
  }
}

export default async function SenatorPage({ params }: { params: { bioguideId: string } }) {
  const { bioguideId } = params
  const baseUrl = getBaseUrl()

  // Fetch all data with error handling
  const senator = await getJson(`${baseUrl}/api/senator/${bioguideId}`)
  const sponsored = await getJson(`${baseUrl}/api/senator/${bioguideId}/sponsored-bills`)
  const cosponsored = await getJson(`${baseUrl}/api/senator/${bioguideId}/cosponsored-bills`)

  // If senator data failed to load, show error message
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="relative h-[220px] w-[180px] shrink-0 overflow-hidden rounded-2xl border bg-zinc-100">
          <Image src={profile.imageUrl} alt={profile.name} fill sizes="180px" className="object-cover" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-3xl font-bold tracking-tight">{profile.name}</div>
          <div className="mt-2 text-sm text-zinc-700">
            {profile.party ?? '—'} • {profile.state ?? '—'} • Bioguide: <span className="font-mono">{profile.bioguideId}</span>
          </div>

          <div className="mt-4 grid gap-2 rounded-2xl border bg-zinc-50 p-4 text-sm">
            <div className="text-xs font-semibold text-zinc-600">Profile snapshot</div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <div className="text-xs text-zinc-500">Official site</div>
                <div className="truncate">{senator.member?.officialWebsiteUrl ? <a href={senator.member.officialWebsiteUrl} target="_blank" className="no-underline hover:underline">{senator.member.officialWebsiteUrl}</a> : '—'}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">Contact</div>
                <div className="truncate">{senator.member?.addressInformation?.phoneNumber ?? senator.member?.phoneNumber ?? '—'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BillSection title="Sponsored legislation (recent)" bills={sponsoredBills} />
      <BillSection title="Cosponsored legislation (recent)" bills={cosponsoredBills} />
    </div>
  )
}
