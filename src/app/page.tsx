'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import SenatorCard from '@/components/SenatorCard'
import SearchBar from '@/components/SearchBar'
import USStateMap from '@/components/USStateMap'
import type { SenatorLite } from '@/lib/types'

export default function HomePage() {
  const [senators, setSenators] = useState<SenatorLite[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/senators')
        
        if (!res.ok) {
          let errorMessage = 'Unable to load senators at the moment.'
          try {
            const errorJson = await res.json()
            if (errorJson?.error) {
              errorMessage = errorJson.error
            }
          } catch {
            // If JSON parsing fails, use default message
          }
          console.error('Failed to fetch senators:', res.status, errorMessage)
          if (alive) setError(errorMessage)
          return
        }

        const json = await res.json()
        if (alive) {
          setSenators(json.senators ?? [])
          setError(null)
        }
      } catch (e: any) {
        console.error('Error fetching senators:', e)
        if (alive) setError('Unable to load senators at the moment.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  // Scroll animation observer
  useEffect(() => {
    if (loading || !gridRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    )

    const cards = gridRef.current.querySelectorAll('.senator-card')
    cards.forEach((card) => {
      observer.observe(card)
    })

    return () => {
      cards.forEach((card) => {
        observer.unobserve(card)
      })
    }
  }, [loading, senators, query])

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
    <div className="page-transition space-y-12">
      {/* Hero Section */}
      <section className="space-y-6 py-12 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-primary sm:text-5xl md:text-6xl">
            Everything you need to understand U.S. legislation — in one place.
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted leading-relaxed">
            Track lawmakers, explore bills, and understand policy through verified data and AI-powered summaries.
          </p>
        </div>
      </section>

      {/* Interactive US Map */}
      <USStateMap />

      {/* Main Content */}
      <div className="space-y-8">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-primary">U.S. Senators</h2>
            <p className="mt-2 text-sm text-muted">
              Search senators, open a profile, and see recent sponsored/cosponsored legislation via official U.S. government APIs.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <SearchBar placeholder="Search by name, state, or party…" value={query} onChange={setQuery} />
            <div className="text-sm text-muted md:text-right">
          {loading ? 'Loading…' : `${filtered.length} shown`}
            </div>
        </div>
      </div>

      {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-[142px] animate-pulse rounded-xl border border-border bg-white" />
          ))}
        </div>
      ) : (
          <div ref={gridRef} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s, index) => (
              <div
                key={s.bioguideId}
                className={`senator-card fade-in-up ${index < 18 ? `stagger-${(index % 6) + 1}` : ''}`}
              >
                <SenatorCard senator={s} />
              </div>
          ))}
        </div>
      )}

        <div className="rounded-xl border border-border bg-white p-4 text-xs text-muted">
        Tip: try searching by a state like <b>NY</b>, or a party like <b>Democrat</b>.
        </div>
      </div>
    </div>
  )
}
