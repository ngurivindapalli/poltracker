'use client'

import { useState, useEffect } from 'react'
import { FamilyMember } from '@/lib/types/senatorExtended'

interface FamilySectionProps {
  bioguideId: string
}

const RELATION_LABELS: Record<string, string> = {
  spouse: 'Spouse',
  child: 'Child',
  parent: 'Parent',
  sibling: 'Sibling',
  other: 'Other'
}

export default function FamilySection({ bioguideId }: FamilySectionProps) {
  const [family, setFamily] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFamily() {
      try {
        setLoading(true)
        const response = await fetch(`/api/senator/${bioguideId}/family`)
        if (!response.ok) throw new Error('Failed to fetch family data')
        const data = await response.json()
        setFamily(data.family || [])
      } catch (err) {
        console.error('Error fetching family:', err)
        setError('Unable to load family data')
        setFamily([])
      } finally {
        setLoading(false)
      }
    }
    fetchFamily()
  }, [bioguideId])

  if (loading) {
    return (
      <section style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '1rem', fontWeight: 600 }}>
          Family & Connections
        </h2>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>
          Loading family data...
        </div>
      </section>
    )
  }

  if (error || family.length === 0) {
    return (
      <section style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '1rem', fontWeight: 600 }}>
          Family & Connections
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
          {error || 'Family and biographical connection data is not currently available. This information is sourced from Wikidata and may require additional processing to display.'}
        </div>
      </section>
    )
  }

  return (
    <section style={{ marginTop: '3rem' }}>
      <h2 style={{ fontSize: '1.6rem', marginBottom: '1rem', fontWeight: 600 }}>
        Family & Connections
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {family.map((member, index) => (
          <div
            key={index}
            style={{
              padding: '1.25rem',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px'
            }}
          >
            <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#111827' }}>
              {member.name}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 500 }}>Relation:</span> {RELATION_LABELS[member.relation] || member.relation}
            </div>
            {member.occupation && (
              <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 500 }}>Occupation:</span> {member.occupation}
                {member.organization && ` at ${member.organization}`}
              </div>
            )}
            {member.education && (
              <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 500 }}>Education:</span> {member.education}
              </div>
            )}
            {member.previous_positions && member.previous_positions.length > 0 && (
              <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                <span style={{ fontWeight: 500 }}>Previous Positions:</span> {member.previous_positions.join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
