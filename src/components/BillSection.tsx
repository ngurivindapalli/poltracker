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

function getBillStatus(b: any): { label: string; className: string } {
  const latestAction = (b.latestAction || '').toLowerCase()
  
  // Check for common status indicators in latestAction
  // Using subtle, professional colors that fit the slate blue theme
  if (latestAction.includes('passed') || latestAction.includes('enacted')) {
    return { label: 'Enacted', className: 'bg-green-50 text-green-800 border-green-200' }
  }
  if (latestAction.includes('signed')) {
    return { label: 'Signed', className: 'bg-blue-50 text-blue-800 border-blue-200' }
  }
  if (latestAction.includes('vetoed')) {
    return { label: 'Vetoed', className: 'bg-red-50 text-red-800 border-red-200' }
  }
  if (latestAction.includes('referred') || latestAction.includes('committee')) {
    return { label: 'In Committee', className: 'bg-amber-50 text-amber-800 border-amber-200' }
  }
  if (latestAction.includes('passed house') || latestAction.includes('passed senate')) {
    return { label: 'Passed', className: 'bg-indigo-50 text-indigo-800 border-indigo-200' }
  }
  
  // Default to "Introduced" if no clear status
  return { label: 'Introduced', className: 'bg-background text-muted border-border' }
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
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-primary">{title}</h2>
          <div className="text-xs text-muted">Top 20</div>
        </div>
        <div className="grid gap-3">
          <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted">No legislation with recorded activity yet.</div>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-primary">{title}</h2>
        <div className="flex items-center gap-3">
          {showToggle && hasUntitledBills && (
            <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={showUntitled}
                onChange={(e) => setShowUntitled(e.target.checked)}
                className="rounded border-border text-accent focus:ring-accent"
              />
              <span>Show placeholder filings</span>
            </label>
          )}
          <div className="text-xs text-muted">Top 20</div>
        </div>
      </div>
      <div className="grid gap-3">
        {displayedBills.map((b: any) => {
          const displayTitle = b.title || b.shortTitle || `${b.type?.toUpperCase()}.${b.number} – ${b.congress}th Congress`
          const status = getBillStatus(b)
          
          const billId = getBillId(b)
          const billKey = `${b.type}-${b.number}`
          
          return (
            <div
              key={billKey}
              className="group relative card-hover rounded-xl border border-border bg-white p-5"
              onMouseEnter={() => setHoveredBill(billKey)}
              onMouseLeave={() => setHoveredBill(null)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-xs text-muted">{billLabel(b)}</div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  <h3 className="mt-1 text-sm font-semibold text-primary leading-snug">{displayTitle}</h3>
                  <div className="mt-3 text-xs text-muted">
                    Introduced: {b.introducedDate ?? '—'}
                    {b.latestAction ? ` • Latest: ${b.latestAction}` : ''}
                  </div>
                  {b.url ? (
                    <div className="mt-3 text-xs">
                      <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent/80 no-underline transition-colors">
                        View on Congress.gov →
                      </a>
                    </div>
                  ) : null}
                </div>
                
                {/* Summarize button - appears on hover */}
                {hoveredBill === billKey && billId && (
                  <button
                    onClick={(e) => handleSummarize(b, e)}
                    className="shrink-0 px-4 py-2 text-xs font-medium text-white bg-accent rounded-lg hover:bg-accent/90 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
                  >
                    Summarize
                  </button>
                )}
              </div>
            </div>
          )
        })}
        {hiddenCount > 0 && (
          <div className="text-xs text-muted italic">
            {hiddenCount} newly introduced {hiddenCount === 1 ? 'filing' : 'filings'} hidden.
          </div>
        )}
      </div>
    </section>
  )
}
