'use client'

export interface Affiliation {
  organization: string
  type: 'NGO' | 'Board' | 'Think Tank' | 'Corporate'
  role: string
  start_date?: string
  end_date?: string
}

interface AffiliationsSectionProps {
  affiliations: Affiliation[]
}

const AFFILIATION_TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  NGO: { bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF' },
  Board: { bg: '#F0FDF4', border: '#22C55E', text: '#166534' },
  'Think Tank': { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
  Corporate: { bg: '#F3E8FF', border: '#A855F7', text: '#6B21A8' }
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'Present'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    })
  } catch {
    return dateString
  }
}

export default function AffiliationsSection({ affiliations }: AffiliationsSectionProps) {
  if (affiliations.length === 0) {
    return (
      <section style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '1rem', fontWeight: 600 }}>
          Affiliations & NGOs
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
          No affiliations disclosed.
        </div>
      </section>
    )
  }

  // Group by type
  const grouped = affiliations.reduce((acc, aff) => {
    if (!acc[aff.type]) acc[aff.type] = []
    acc[aff.type].push(aff)
    return acc
  }, {} as Record<string, Affiliation[]>)

  return (
    <section style={{ marginTop: '3rem' }}>
      <h2 style={{ fontSize: '1.6rem', marginBottom: '1rem', fontWeight: 600 }}>
        Affiliations & NGOs
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {Object.entries(grouped).map(([type, affs]) => {
          const typeColor = AFFILIATION_TYPE_COLORS[type] || AFFILIATION_TYPE_COLORS.NGO

          return (
            <div key={type}>
              <div
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: typeColor.bg,
                  border: `1px solid ${typeColor.border}`,
                  borderRadius: '6px',
                  marginBottom: '0.75rem',
                  display: 'inline-block'
                }}
              >
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: typeColor.text }}>
                  {type}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {affs.map((aff, index) => {
                  const dateRange = aff.start_date
                    ? `${formatDate(aff.start_date)} - ${formatDate(aff.end_date)}`
                    : 'Ongoing'

                  return (
                    <div
                      key={index}
                      style={{
                        padding: '1.25rem',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem', color: '#111827' }}>
                            {aff.organization}
                          </h3>
                          <div style={{ fontSize: '0.9rem', color: '#6B7280' }}>
                            {aff.role}
                          </div>
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6B7280', textAlign: 'right' }}>
                          {dateRange}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
