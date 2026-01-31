'use client'

import { useEffect, useMemo, useState } from 'react'
import SenatorCard from '@/components/SenatorCard'
import SearchBar from '@/components/SearchBar'
import type { SenatorLite } from '@/lib/types'
import { getBaseUrl } from '@/lib/getBaseUrl'

export default function HomePage() {
  const [senators, setSenators] = useState<SenatorLite[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch(`${getBaseUrl()}/api/senators`)
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error ?? 'Failed to load senators')
        if (alive) setSenators(json.senators ?? [])
      } catch (e: any) {
        if (alive) setError(e?.message ?? String(e))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return senators
    return senators.filter((s) => {
      return (
        s.name.toLowerCase().includes(q) ||
        (s.state ?? '').toLowerCase().includes(q) ||
        (s.party ?? '').toLowerCase().includes(q)
      )
    })
  }, [query, senators])

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">U.S. Senators</h1>
        <p className="text-sm text-zinc-700">
          Search senators, open a profile, and see recent sponsored/cosponsored legislation via official U.S.
          government APIs.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <SearchBar placeholder="Search by name, state, or party…" value={query} onChange={setQuery} />
        <div className="text-sm text-zinc-600 md:text-right">
          {loading ? 'Loading…' : `${filtered.length} shown`}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
          <div className="mt-2 text-xs text-red-700">
            Make sure you created <code>.env.local</code> with <code>API_DATA_GOV_KEY</code>.
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-[142px] animate-pulse rounded-2xl border bg-zinc-50" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <SenatorCard key={s.bioguideId} senator={s} />
          ))}
        </div>
      )}

      <div className="rounded-2xl border bg-zinc-50 p-4 text-xs text-zinc-700">
        Tip: try searching by a state like <b>NY</b>, or a party like <b>Democrat</b>.
      </div>
    </div>
  )
}
