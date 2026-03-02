'use client'

import { useState, useEffect } from 'react'
import { Investment } from '@/lib/types/senatorExtended'

interface InvestmentSectionProps {
  bioguideId: string
}

const ASSET_TYPE_LABELS: Record<string, string> = {
  stock: 'Stock',
  ETF: 'ETF',
  'private equity': 'Private Equity',
  crypto: 'Cryptocurrency',
  'real estate': 'Real Estate',
  bond: 'Bond',
  other: 'Other'
}

const ASSET_TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  stock: { bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF' },
  ETF: { bg: '#F0FDF4', border: '#22C55E', text: '#166534' },
  'private equity': { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
  crypto: { bg: '#FCE7F3', border: '#EC4899', text: '#9F1239' },
  'real estate': { bg: '#F3E8FF', border: '#A855F7', text: '#6B21A8' },
  bond: { bg: '#E0F2FE', border: '#0EA5E9', text: '#0C4A6E' },
  other: { bg: '#F3F4F6', border: '#6B7280', text: '#374151' }
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`
  }
  return `$${value.toLocaleString()}`
}

export default function InvestmentSection({ bioguideId }: InvestmentSectionProps) {
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchInvestments() {
      try {
        setLoading(true)
        const response = await fetch(`/api/senator/${bioguideId}/investments`)
        if (!response.ok) throw new Error('Failed to fetch investments')
        const data = await response.json()
        setInvestments(data.investments || [])
      } catch (err) {
        console.error('Error fetching investments:', err)
        setError('Unable to load investment data')
        setInvestments([])
      } finally {
        setLoading(false)
      }
    }
    fetchInvestments()
  }, [bioguideId])

  if (loading) {
    return (
      <section style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '1rem', fontWeight: 600 }}>
          Investment Portfolio
        </h2>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>
          Loading investment data...
        </div>
      </section>
    )
  }

  if (error || investments.length === 0) {
    return (
      <section style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '1rem', fontWeight: 600 }}>
          Investment Portfolio
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
          {error || 'Investment disclosure data is not available for this senator. Financial disclosures are typically filed annually and may not be immediately accessible.'}
        </div>
      </section>
    )
  }

  const sortedInvestments = [...investments].sort((a, b) => {
    const typeOrder = ['stock', 'ETF', 'private equity', 'crypto', 'real estate', 'bond', 'other']
    const aIndex = typeOrder.indexOf(a.asset_type)
    const bIndex = typeOrder.indexOf(b.asset_type)
    if (aIndex !== bIndex) return aIndex - bIndex
    return a.asset_name.localeCompare(b.asset_name)
  })

  const totalRange = sortedInvestments.reduce(
    (acc, inv) => ({
      min: acc.min + inv.value_range.min,
      max: acc.max + inv.value_range.max
    }),
    { min: 0, max: 0 }
  )

  return (
    <section style={{ marginTop: '3rem' }}>
      <h2 style={{ fontSize: '1.6rem', marginBottom: '1rem', fontWeight: 600 }}>
        Investment Portfolio
      </h2>

      {/* Total Summary */}
      <div
        style={{
          padding: '1rem 1.5rem',
          backgroundColor: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          marginBottom: '1.5rem'
        }}
      >
        <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>
          Total Estimated Value
        </div>
        <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>
          {formatCurrency(totalRange.min)} - {formatCurrency(totalRange.max)}
        </div>
      </div>

      {/* Investments List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {sortedInvestments.map((investment, index) => {
          const typeColor = ASSET_TYPE_COLORS[investment.asset_type] || ASSET_TYPE_COLORS.other
          const disclosureDate = investment.transaction_date
            ? new Date(investment.transaction_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
            : 'Not disclosed'

          return (
            <div
              key={index}
              style={{
                padding: '1.5rem',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#111827' }}>
                    {investment.asset_name}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        backgroundColor: typeColor.bg,
                        color: typeColor.text,
                        border: `1px solid ${typeColor.border}`,
                        borderRadius: '4px'
                      }}
                    >
                      {ASSET_TYPE_LABELS[investment.asset_type] || investment.asset_type}
                    </span>
                    {investment.transaction_type && (
                      <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                        {investment.transaction_type}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
                    {formatCurrency(investment.value_range.min)} - {formatCurrency(investment.value_range.max)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6B7280', marginTop: '0.75rem' }}>
                <span>Disclosed: {disclosureDate}</span>
                <span>•</span>
                <span>{investment.source}</span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
