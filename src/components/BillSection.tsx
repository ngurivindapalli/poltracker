'use client'

import { useState, useMemo } from 'react'

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
  if (latestAction.includes('passed') || latestAction.includes('enacted')) {
    return { label: 'Enacted', className: 'bg-green-100 text-green-700 border-green-200' }
  }
  if (latestAction.includes('signed')) {
    return { label: 'Signed', className: 'bg-blue-100 text-blue-700 border-blue-200' }
  }
  if (latestAction.includes('vetoed')) {
    return { label: 'Vetoed', className: 'bg-red-100 text-red-700 border-red-200' }
  }
  if (latestAction.includes('referred') || latestAction.includes('committee')) {
    return { label: 'In Committee', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
  }
  if (latestAction.includes('passed house') || latestAction.includes('passed senate')) {
    return { label: 'Passed', className: 'bg-purple-100 text-purple-700 border-purple-200' }
  }
  
  // Default to "Introduced" if no clear status
  return { label: 'Introduced', className: 'bg-zinc-100 text-zinc-700 border-zinc-200' }
}

interface BillSectionProps {
  title: string
  bills: any[]
  showToggle?: boolean
}

export default function BillSection({ title, bills, showToggle = true }: BillSectionProps) {
  const [showUntitled, setShowUntitled] = useState(false)

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
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          <div className="text-xs text-zinc-600">Top 20</div>
        </div>
        <div className="grid gap-3">
          <div className="rounded-2xl border p-4 text-sm text-zinc-600">No legislation with recorded activity yet.</div>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex items-center gap-3">
          {showToggle && hasUntitledBills && (
            <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showUntitled}
                onChange={(e) => setShowUntitled(e.target.checked)}
                className="rounded border-zinc-300 text-zinc-600 focus:ring-zinc-500"
              />
              <span>Show placeholder filings</span>
            </label>
          )}
          <div className="text-xs text-zinc-600">Top 20</div>
        </div>
      </div>
      <div className="grid gap-3">
        {displayedBills.map((b: any) => {
          const displayTitle = b.title || b.shortTitle || `${b.type?.toUpperCase()}.${b.number} – ${b.congress}th Congress`
          const status = getBillStatus(b)
          
          return (
            <div key={`${b.type}-${b.number}`} className="rounded-2xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-xs text-zinc-500">{billLabel(b)}</div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  <h3 className="mt-1 text-sm font-semibold">{displayTitle}</h3>
                  <div className="mt-2 text-xs text-zinc-600">
                    Introduced: {b.introducedDate ?? '—'}
                    {b.latestAction ? ` • Latest: ${b.latestAction}` : ''}
                  </div>
                  {b.url ? (
                    <div className="mt-2 text-xs">
                      <a href={b.url} target="_blank" rel="noopener noreferrer" className="no-underline hover:underline">
                        View on Congress.gov
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
        {hiddenCount > 0 && (
          <div className="text-xs text-zinc-500 italic">
            {hiddenCount} newly introduced {hiddenCount === 1 ? 'filing' : 'filings'} hidden.
          </div>
        )}
      </div>
    </section>
  )
}
