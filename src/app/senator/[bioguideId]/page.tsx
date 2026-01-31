import Image from 'next/image'
import { getBaseUrl } from '@/lib/getBaseUrl'
import BillSection from '@/components/BillSection'

async function getJson(path: string) {
  const res = await fetch(path, { cache: 'no-store' })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error ?? 'Request failed')
  return json
}

export default async function SenatorPage({ params }: { params: { bioguideId: string } }) {
  const { bioguideId } = params

  const senator = await getJson(`${getBaseUrl()}/api/senator/${bioguideId}`)
  const sponsored = await getJson(`${getBaseUrl()}/api/senator/${bioguideId}/sponsored-bills`)
  const cosponsored = await getJson(`${getBaseUrl()}/api/senator/${bioguideId}/cosponsored-bills`)

  const profile = senator.profile

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

      <BillSection title="Sponsored legislation (recent)" bills={sponsored.bills ?? []} />
      <BillSection title="Cosponsored legislation (recent)" bills={cosponsored.bills ?? []} />
    </div>
  )
}
