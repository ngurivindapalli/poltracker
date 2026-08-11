'use client'

import { useState, useEffect } from 'react'
import { Donor, IndustryExposure } from '@/lib/types/senatorExtended'

interface DonorSectionProps {
  bioguideId: string
}

function formatCurrency(value: number): string {
  if (value == null || !Number.isFinite(value)) return "—"
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`
  }
  return `$${value.toLocaleString()}`
}

export default function DonorSection({ bioguideId }: DonorSectionProps) {
  const [donors, setDonors] = useState<Donor[]>([])
  const [industries, setIndustries] = useState<IndustryExposure[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDonors() {
      try {
        setLoading(true)
        const response = await fetch(`/api/senator/${bioguideId}/donors`)
        if (!response.ok) throw new Error('Failed to fetch donor data')
        const data = await response.json()
        // Normalize Quiver API shape ({ name, amount, ... }) to Donor UI shape
        const rawDonors = Array.isArray(data.top_donors) ? data.top_donors : []
        const mappedDonors: Donor[] = rawDonors
          .map((d: Record<string, unknown>) => {
            const organization = String(d.name ?? d.organization ?? d.org_name ?? "").trim()
            const amountRaw = d.amount ?? d.total
            const amount =
              typeof amountRaw === "number" && Number.isFinite(amountRaw)
                ? amountRaw
                : Number(amountRaw)
            if (!organization || !Number.isFinite(amount)) return null
            return {
              organization,
              amount,
              cycle: d.cycle != null ? String(d.cycle) : "",
              industry: d.industry != null ? String(d.industry) : undefined,
            } satisfies Donor
          })
          .filter((d: Donor | null): d is Donor => d != null)

        const rawIndustries = Array.isArray(data.industry_breakdown)
          ? data.industry_breakdown
          : []
        const mappedIndustries: IndustryExposure[] = rawIndustries
          .map((row: Record<string, unknown>) => {
            const industry = String(row.industry ?? "").trim()
            const totalRaw = row.total_amount ?? row.total
            const total_amount =
              typeof totalRaw === "number" && Number.isFinite(totalRaw)
                ? totalRaw
                : Number(totalRaw)
            const pctRaw = row.percent_of_total ?? row.percentage
            const percent_of_total =
              typeof pctRaw === "number" && Number.isFinite(pctRaw)
                ? pctRaw
                : Number(pctRaw) || 0
            if (!industry || !Number.isFinite(total_amount)) return null
            return {
              industry,
              total_amount,
              percent_of_total,
              donor_count:
                typeof row.donor_count === "number" ? row.donor_count : 0,
            } satisfies IndustryExposure
          })
          .filter((r: IndustryExposure | null): r is IndustryExposure => r != null)

        setDonors(mappedDonors)
        setIndustries(mappedIndustries)
      } catch (err) {
        console.error('Error fetching donors:', err)
        setError('Unable to load donor data')
        setDonors([])
        setIndustries([])
      } finally {
        setLoading(false)
      }
    }
    fetchDonors()
  }, [bioguideId])

  if (loading) {
    return (
      <section style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '1rem', fontWeight: 600 }}>
          Donors & Industry Exposure
        </h2>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>
          Loading donor data...
        </div>
      </section>
    )
  }

  const hasData = donors.length > 0 || industries.length > 0

  if (!hasData) {
    return (
      <section style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '1rem', fontWeight: 600 }}>
          Donors & Industry Exposure
        </h2>
        <div
          style={{
            padding: '1.5rem',
            backgroundColor: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            color: '#6B7280',
            fontSize: '0.9rem'
          }}
        >
          {error || 'Donor data is not currently available. This information is typically sourced from OpenSecrets or FEC databases and requires API access to display.'}
        </div>
      </section>
    )
  }

  return (
    <section style={{ marginTop: '3rem' }}>
      <h2 style={{ fontSize: '1.6rem', marginBottom: '1rem', fontWeight: 600 }}>
        Donors & Industry Exposure
      </h2>

      {/* Top Donors */}
      {donors.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem', color: '#111827' }}>
            Top Donors
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {donors.slice(0, 10).map((donor, index) => (
              <div
                key={index}
                style={{
                  padding: '1rem 1.25rem',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>
                    {donor.organization}
                  </div>
                  {donor.industry && (
                    <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                      {donor.industry}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
                    {formatCurrency(donor.amount)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.25rem' }}>
                    {donor.cycle}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Industry Breakdown */}
      {industries.length > 0 && (
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem', color: '#111827' }}>
            Industry Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {industries.map((industry, index) => (
              <div
                key={index}
                style={{
                  padding: '1rem 1.25rem',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>
                    {industry.industry}
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>
                    {formatCurrency(industry.total_amount)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    style={{
                      flex: 1,
                      height: '8px',
                      backgroundColor: '#E5E7EB',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(industry.percent_of_total, 100)}%`,
                        height: '100%',
                        backgroundColor: '#3B82F6',
                        transition: 'width 0.3s'
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6B7280', minWidth: '60px', textAlign: 'right' }}>
                    {industry.percent_of_total.toFixed(1)}%
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.25rem' }}>
                  {industry.donor_count} {industry.donor_count === 1 ? 'donor' : 'donors'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
