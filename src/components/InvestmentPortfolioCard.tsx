'use client'

import { useMemo } from 'react'

export interface Investment {
  asset_name: string
  asset_type: 'stock' | 'ETF' | 'private equity' | 'crypto' | 'real estate'
  estimated_value_range: {
    min: number
    max: number
  }
  disclosure_date: string
  source: string
}

interface InvestmentPortfolioCardProps {
  investments: Investment[]
  memberName?: string
}

const ASSET_TYPE_LABELS: Record<string, string> = {
  stock: 'Stock',
  ETF: 'ETF',
  'private equity': 'Private Equity',
  crypto: 'Cryptocurrency',
  'real estate': 'Real Estate'
}

const ASSET_TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  stock: { bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF' },
  ETF: { bg: '#F0FDF4', border: '#22C55E', text: '#166534' },
  'private equity': { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
  crypto: { bg: '#FCE7F3', border: '#EC4899', text: '#9F1239' },
  'real estate': { bg: '#F3E8FF', border: '#A855F7', text: '#6B21A8' }
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

export default function InvestmentPortfolioCard({ investments, memberName }: InvestmentPortfolioCardProps) {
  const sortedInvestments = useMemo(() => {
    return [...investments].sort((a, b) => {
      const typeOrder = ['stock', 'ETF', 'private equity', 'crypto', 'real estate']
      const aIndex = typeOrder.indexOf(a.asset_type)
      const bIndex = typeOrder.indexOf(b.asset_type)
      if (aIndex !== bIndex) return aIndex - bIndex
      return a.asset_name.localeCompare(b.asset_name)
    })
  }, [investments])

  const totalRange = useMemo(() => {
    const total = sortedInvestments.reduce(
      (acc, inv) => ({
        min: acc.min + inv.estimated_value_range.min,
        max: acc.max + inv.estimated_value_range.max
      }),
      { min: 0, max: 0 }
    )
    return total
  }, [sortedInvestments])

  if (investments.length === 0) {
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
          No investment disclosures available.
        </div>
      </section>
    )
  }

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
          const typeColor = ASSET_TYPE_COLORS[investment.asset_type] || ASSET_TYPE_COLORS.stock
          const disclosureDate = new Date(investment.disclosure_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })

          return (
            <div
              key={index}
              style={{
                padding: '1.5rem',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                transition: 'box-shadow 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
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
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
                    {formatCurrency(investment.estimated_value_range.min)} - {formatCurrency(investment.estimated_value_range.max)}
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
