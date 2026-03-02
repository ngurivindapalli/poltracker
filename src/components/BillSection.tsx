'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Determines if a bill has a meaningful title.
 * A bill is considered untitled if both title and shortTitle are missing or empty.
 */
function hasMeaningfulTitle(bill: any): boolean {
  const hasTitle = bill?.title && bill.title.trim().length > 0
  const hasShortTitle = bill?.shortTitle && bill.shortTitle.trim().length > 0
  return hasTitle || hasShortTitle
}

/**
 * Determines if a bill has recorded legislative activity beyond introduction.
 * A bill has activity if it contains latestAction.text OR latestAction.actionDate.
 */
function hasLegislativeActivity(bill: any): boolean {
  const latestAction = bill?.latestAction
  
  // If latestAction is an object, check for text or actionDate
  if (latestAction && typeof latestAction === 'object') {
    return !!(latestAction.text || latestAction.actionDate)
  }
  
  // If latestAction is a string (already simplified), it has activity
  if (latestAction && typeof latestAction === 'string' && latestAction.trim().length > 0) {
    return true
  }
  
  return false
}

function billLabel(b: any) {
  const parts = [b?.congress ? `${b.congress}th` : null, b?.type, b?.number ? `#${b.number}` : null]
    .filter(Boolean)
    .join(' ')
  return parts || 'Bill'
}

function getBillStatus(b: any): { label: string; color: string; bgColor: string; borderColor: string } {
  const latestAction = (b.latestAction || '').toLowerCase()
  
  // Check for common status indicators in latestAction
  if (latestAction.includes('passed') || latestAction.includes('enacted')) {
    return { label: 'Enacted', color: '#065F46', bgColor: '#D1FAE5', borderColor: '#6EE7B7' }
  }
  if (latestAction.includes('signed')) {
    return { label: 'Signed', color: '#1E40AF', bgColor: '#DBEAFE', borderColor: '#93C5FD' }
  }
  if (latestAction.includes('vetoed')) {
    return { label: 'Vetoed', color: '#991B1B', bgColor: '#FEE2E2', borderColor: '#FCA5A5' }
  }
  if (latestAction.includes('referred') || latestAction.includes('committee')) {
    return { label: 'In Committee', color: '#92400E', bgColor: '#FEF3C7', borderColor: '#FCD34D' }
  }
  if (latestAction.includes('passed house') || latestAction.includes('passed senate')) {
    return { label: 'Passed', color: '#3730A3', bgColor: '#E0E7FF', borderColor: '#A5B4FC' }
  }
  
  // Default to "Introduced"
  return { label: 'Introduced', color: '#6B7280', bgColor: '#F9FAFB', borderColor: '#E5E7EB' }
}

interface BillSectionProps {
  title: string
  bills: any[]
  showToggle?: boolean
}

export default function BillSection({ title, bills, showToggle = true }: BillSectionProps) {
  const [showUntitled, setShowUntitled] = useState(false)
  const [hoveredBill, setHoveredBill] = useState<string | null>(null)
  const router = useRouter()
  
  // Generate bill ID from bill data
  function getBillId(bill: any): string {
    if (bill?.congress && bill?.type && bill?.number) {
      return `${bill.congress}-${bill.type.toLowerCase()}-${bill.number}`
    }
    return ''
  }
  
  function handleSummarize(bill: any, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const billId = getBillId(bill)
    if (billId) {
      router.push(`/bill/${billId}/summary`)
    }
  }

  const { displayedBills, hiddenCount, hasUntitledBills } = useMemo(() => {
    // Step 1: Filter out untitled bills (hide bills without meaningful titles)
    const titledBills = bills.filter(hasMeaningfulTitle)
    const untitledBills = bills.filter((b: any) => !hasMeaningfulTitle(b))
    const hasUntitledBills = untitledBills.length > 0

    // Step 2: Filter bills with activity (AFTER title filtering)
    // Only show bills that have recorded legislative activity
    const billsWithActivity = titledBills.filter(hasLegislativeActivity)

    // Combine based on toggle state (preserve all data internally)
    const billsToShow = showUntitled ? bills : billsWithActivity

    // Sort by introducedDate (most recent first) - sorting occurs AFTER filtering
    const sorted = [...billsToShow].sort((a, b) => {
      const dateA = a.introducedDate ? new Date(a.introducedDate).getTime() : 0
      const dateB = b.introducedDate ? new Date(b.introducedDate).getTime() : 0
      return dateB - dateA // Most recent first
    })

    // Calculate total hidden count (untitled + no activity)
    const billsWithoutActivity = titledBills.filter((b: any) => !hasLegislativeActivity(b))
    const hiddenCount = untitledBills.length + (showUntitled ? 0 : billsWithoutActivity.length)

    return {
      displayedBills: sorted,
      hiddenCount,
      hasUntitledBills
    }
  }, [bills, showUntitled])

  if (displayedBills.length === 0) {
    return (
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1.6rem", marginBottom: "1rem", fontWeight: 600 }}>
          {title}
        </h2>
        <div style={{ 
          padding: "1.5rem", 
          backgroundColor: "#F9FAFB", 
          border: "1px solid #E5E7EB", 
          borderRadius: "8px",
          color: "#555",
          fontSize: "0.9rem"
        }}>
          No legislation with recorded activity yet.
        </div>
      </section>
    )
  }

  return (
    <section style={{ marginBottom: "3rem" }}>
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
        marginBottom: "1rem"
      }}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 600 }}>
          {title}
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {showToggle && hasUntitledBills && (
            <label style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.5rem", 
              fontSize: "0.75rem", 
              color: "#6B7280",
              cursor: "pointer"
            }}>
              <input
                type="checkbox"
                checked={showUntitled}
                onChange={(e) => setShowUntitled(e.target.checked)}
                style={{
                  cursor: "pointer"
                }}
              />
              <span>Show placeholder filings</span>
            </label>
          )}
          <div style={{ fontSize: "0.75rem", color: "#6B7280" }}>Top 20</div>
        </div>
      </div>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {displayedBills.map((b: any) => {
          const displayTitle = b.title || b.shortTitle || `${b.type?.toUpperCase()}.${b.number} – ${b.congress}th Congress`
          const status = getBillStatus(b)
          
          const billId = getBillId(b)
          const billKey = `${b.type}-${b.number}`
          const isHovered = hoveredBill === billKey
          
          return (
            <div
              key={billKey}
              style={{
                background: "#FFFFFF",
                borderRadius: "10px",
                padding: "1.5rem",
                border: "1px solid #E5E7EB",
                boxShadow: isHovered ? "0 2px 8px rgba(0,0,0,0.1)" : "0 1px 3px rgba(0,0,0,0.08)",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={() => setHoveredBill(billKey)}
              onMouseLeave={() => setHoveredBill(null)}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                    <div style={{ fontSize: "0.75rem", color: "#6B7280" }}>{billLabel(b)}</div>
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      color: status.color,
                      backgroundColor: status.bgColor,
                      border: `1px solid ${status.borderColor}`
                    }}>
                      {status.label}
                    </span>
                  </div>
                  <h3 style={{ 
                    fontSize: "1rem", 
                    fontWeight: 600, 
                    color: "#111827",
                    marginBottom: "0.75rem",
                    lineHeight: 1.4
                  }}>
                    {displayTitle}
                  </h3>
                  <div style={{ fontSize: "0.875rem", color: "#6B7280", marginBottom: "0.5rem" }}>
                    Introduced: {b.introducedDate ?? '—'}
                    {b.latestAction ? ` • Latest: ${b.latestAction}` : ''}
                  </div>
                  {b.url && (
                    <div style={{ marginTop: "0.75rem" }}>
                      <a 
                        href={b.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ 
                          color: "#2563EB", 
                          textDecoration: "none",
                          fontSize: "0.875rem"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = "underline"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = "none"
                        }}
                      >
                        View on Congress.gov →
                      </a>
                    </div>
                  )}
                </div>
                
                {/* Summarize button - appears on hover */}
                {isHovered && billId && (
                  <button
                    onClick={(e) => handleSummarize(b, e)}
                    style={{
                      flexShrink: 0,
                      padding: "0.5rem 1rem",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: "#FFFFFF",
                      backgroundColor: "#2563EB",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "background-color 0.2s ease",
                      whiteSpace: "nowrap"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#1D4ED8"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#2563EB"
                    }}
                  >
                    Summarize
                  </button>
                )}
              </div>
            </div>
          )
        })}
        {hiddenCount > 0 && (
          <div style={{ 
            fontSize: "0.75rem", 
            color: "#6B7280", 
            fontStyle: "italic",
            padding: "0.5rem 0"
          }}>
            {hiddenCount} newly introduced {hiddenCount === 1 ? 'filing' : 'filings'} hidden.
          </div>
        )}
      </div>
    </section>
  )
}
