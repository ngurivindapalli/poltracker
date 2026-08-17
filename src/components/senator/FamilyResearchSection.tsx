'use client'

import { useState, useEffect } from 'react'
import { FamilyResearchMember } from '@/lib/data/familyResearchProvider'

interface FamilyResearchSectionProps {
  bioguideId: string
  country?: 'US' | 'UK'
}

const RELATION_LABELS: Record<string, string> = {
  spouse: 'Spouse',
  child: 'Child',
  parent: 'Parent',
  sibling: 'Sibling',
  other: 'Other'
}

const TYPE_BADGES: Record<string, { label: string; className: string }> = {
  corporate: { label: 'Corporate', className: 'bg-blue-100 text-blue-800' },
  board: { label: 'Board', className: 'bg-purple-100 text-purple-800' },
  government: { label: 'Government', className: 'bg-green-100 text-green-800' },
  legal: { label: 'Legal', className: 'bg-indigo-100 text-indigo-800' },
  investment: { label: 'Investment', className: 'bg-yellow-100 text-yellow-800' },
  consulting: { label: 'Consulting', className: 'bg-gray-100 text-gray-800' },
  ngo: { label: 'NGO', className: 'bg-pink-100 text-pink-800' }
}

export default function FamilyResearchSection({ bioguideId, country = 'US' }: FamilyResearchSectionProps) {
  const [familyMembers, setFamilyMembers] = useState<FamilyResearchMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFamilyResearch() {
      try {
        setLoading(true)
        setError(null)
        const apiPath = country === 'UK' 
          ? `/api/uk/member/${bioguideId}`
          : `/api/senator/${bioguideId}/family-research`
        const response = await fetch(apiPath)
        if (!response.ok) throw new Error('Failed to fetch family research data')
        const data = await response.json()
        // Handle both US and UK API response formats
        setFamilyMembers(data.familyMembers || data.familyResearch || [])
      } catch (err) {
        console.error('Error fetching family research:', err)
        setError('Unable to load family research data')
        setFamilyMembers([])
      } finally {
        setLoading(false)
      }
    }
    fetchFamilyResearch()
  }, [bioguideId, country])

  if (loading) {
    return (
      <section style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '1rem', fontWeight: 600 }}>
          Family and close associates
        </h2>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>
          Loading family research data...
        </div>
      </section>
    )
  }

  if (error || familyMembers.length === 0) {
    return (
      <section style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '1rem', fontWeight: 600 }}>
          Family and close associates
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
          {error || 'No publicly documented professional affiliations found for immediate family members.'}
        </div>
      </section>
    )
  }

  return (
    <section style={{ marginTop: '3rem' }}>
      <h2 style={{ fontSize: '1.6rem', marginBottom: '1.5rem', fontWeight: 600 }}>
        Family and close associates
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {familyMembers.map((member) => {
          // Check if member has market-relevant roles
          const hasMarketRelevance = member.organizations.some(
            org => org.type === 'corporate' || org.type === 'investment' || 
                   (org.role.toLowerCase().includes('board') || org.role.toLowerCase().includes('director'))
          )

          return (
            <div
              key={member.id}
              className={`rounded-lg p-5 border ${
                hasMarketRelevance 
                  ? 'border-yellow-400 bg-yellow-50' 
                  : 'border-gray-200 bg-white'
              }`}
              style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}
            >
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem', color: '#111827' }}>
                  {member.name}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                  {RELATION_LABELS[member.relation] || member.relation}
                </div>
              </div>

              {member.occupation && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                    Occupation
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                    {member.occupation}
                  </div>
                </div>
              )}

              {member.organizations.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.75rem' }}>
                    Professional Involvement:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {member.organizations.map((org, index) => {
                      const isBoardRole = org.role.toLowerCase().includes('board') || 
                                         org.role.toLowerCase().includes('director') ||
                                         org.role.toLowerCase().includes('trustee')
                      const badgeType = isBoardRole ? 'board' : org.type
                      const badge = TYPE_BADGES[badgeType] || TYPE_BADGES.corporate

                      return (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            backgroundColor: '#F9FAFB'
                          }}
                        >
                          <span style={{ fontSize: '0.875rem', color: '#111827', flex: 1 }}>
                            <strong>{org.name}</strong> · {org.role}
                          </span>
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                          {org.type === 'corporate' && (
                            <span className="text-xs font-medium px-2 py-1 rounded bg-blue-100 text-blue-800">
                              Corporate
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
