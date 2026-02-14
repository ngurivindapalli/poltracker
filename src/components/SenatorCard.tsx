import Image from 'next/image'
import Link from 'next/link'
import type { SenatorLite } from '@/lib/types'

export default function SenatorCard({ senator }: { senator: SenatorLite }) {
  return (
    <Link
      href={`/senator/${senator.bioguideId}`}
      className="no-underline"
    >
      <div className="card-hover flex gap-4 rounded-xl border border-border bg-white p-5">
        <div className="relative h-[110px] w-[90px] shrink-0 overflow-hidden rounded-lg bg-background">
          <Image
            src={senator.imageUrl}
            alt={senator.name}
            fill
            sizes="90px"
            className="object-cover"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <div className="text-base font-semibold leading-tight text-primary">{senator.name}</div>
          <div className="mt-2 text-sm text-muted">
            {senator.party ?? '—'} • {senator.state ?? '—'}
          </div>
          <div className="mt-3 text-xs text-muted">
            Click to view sponsored and cosponsored legislation.
          </div>
        </div>
      </div>
    </Link>
  )
}
