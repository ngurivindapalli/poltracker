import Image from 'next/image'
import Link from 'next/link'
import type { SenatorLite } from '@/lib/types'

export default function SenatorCard({ senator }: { senator: SenatorLite }) {
  return (
    <Link
      href={`/senator/${senator.bioguideId}`}
      className="no-underline"
    >
      <div className="flex gap-4 rounded-2xl border p-4 hover:shadow-sm">
        <div className="relative h-[110px] w-[90px] shrink-0 overflow-hidden rounded-xl bg-zinc-100">
          <Image
            src={senator.imageUrl}
            alt={senator.name}
            fill
            sizes="90px"
            className="object-cover"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="text-base font-semibold leading-tight">{senator.name}</div>
          <div className="mt-1 text-sm text-zinc-700">
            {senator.party ?? '—'} • {senator.state ?? '—'}
          </div>
          <div className="mt-3 text-xs text-zinc-500">
            Click to view sponsored and cosponsored legislation.
          </div>
        </div>
      </div>
    </Link>
  )
}
