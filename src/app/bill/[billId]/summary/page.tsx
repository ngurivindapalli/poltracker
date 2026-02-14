'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { parseSummary, formatContent, type SummarySection } from '@/lib/summaryParser'

type SummaryData = {
  summary?: string
  billInfo?: {
    title: string
    congress: string
    type: string
    number: string
    url: string | null
  }
  error?: string
  fallback?: boolean
}

export default function BillSummaryPage({ params }: { params: { billId: string } }) {
  const { billId } = params
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Parse billId: format is "congress-type-number" (e.g., "118-s-1234")
  const parts = billId.split('-')
  const isValid = parts.length === 3
  
  useEffect(() => {
    if (!isValid) {
      setLoading(false)
      return
    }
    
    const fetchSummary = async () => {
      try {
        const response = await fetch(`/api/bill/${billId}/summary`)
        const json = await response.json()
        setData(json)
      } catch (err) {
        console.error('Error fetching summary:', err)
        setData({ error: 'Unable to load summary' })
      } finally {
        setLoading(false)
      }
    }
    
    fetchSummary()
  }, [billId, isValid])
  
  // Parse summary into sections
  const parsedSections = useMemo(() => {
    if (!data?.summary) return []
    return parseSummary(data.summary)
  }, [data?.summary])
  
  if (!isValid) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <div className="text-lg font-semibold text-red-800">Invalid bill ID</div>
        </div>
      </div>
    )
  }
  
  const [congress, type, number] = parts
  const billInfo = data?.billInfo
  const summary = data?.summary
  const error = data?.error
  const isFallback = data?.fallback === true

  return (
    <div className="page-transition space-y-8">
      <div>
        <Link 
          href="/"
          className="text-sm text-muted hover:text-primary underline transition-colors"
        >
          ← Back to Home
        </Link>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-primary">
            {billInfo?.title || `${type.toUpperCase()}.${number} – ${congress}th Congress`}
          </h1>
          {billInfo && (
            <div className="mt-2 text-sm text-muted">
              {billInfo.congress}th Congress • {billInfo.type?.toUpperCase()} {billInfo.number}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-white p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-primary">Bill Summary</h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              <div className="text-sm text-muted">Generating summary...</div>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
              Unable to generate summary at this time.
            </div>
          ) : parsedSections.length > 0 ? (
            <div className="space-y-8">
              {isFallback && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
                  This summary was generated using limited data due to temporary AI availability.
                </div>
              )}
              
              {parsedSections.map((section, sectionIndex) => {
                const formattedContent = formatContent(section.content)
                
                return (
                  <div key={sectionIndex} className="space-y-4">
                    <h3 className="text-lg font-semibold text-primary">
                      {section.title}
                    </h3>
                    
                    <div className="space-y-4 text-sm text-muted leading-relaxed">
                      {formattedContent.map((block, blockIndex) => {
                        if (block.type === 'list') {
                          return (
                            <ul key={blockIndex} className="ml-5 list-disc space-y-2">
                              {block.items.map((item, itemIndex) => (
                                <li key={itemIndex} className="pl-1">
                                  {item}
                                </li>
                              ))}
                            </ul>
                          )
                        } else {
                          return (
                            <div key={blockIndex} className="space-y-3">
                              {block.items.map((paragraph, paraIndex) => (
                                <p key={paraIndex} className="leading-relaxed">
                                  {paragraph}
                                </p>
                              ))}
                            </div>
                          )
                        }
                      })}
                    </div>
                  </div>
                )
              })}
              
              <div className="mt-8 pt-5 border-t border-border">
                <p className="text-xs text-muted">
                  {isFallback 
                    ? 'This summary is based on available bill information and does not replace the official bill text.'
                    : 'This summary was generated by AI to improve readability and does not replace the official bill text.'}
                </p>
              </div>
            </div>
          ) : summary ? (
            // Fallback: if parsing fails, show raw summary (cleaned)
            <div className="space-y-4">
              {isFallback && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
                  This summary was generated using limited data due to temporary AI availability.
                </div>
              )}
              
              <div className="text-sm text-muted leading-relaxed whitespace-pre-wrap">
                {summary.replace(/\*\*/g, '').replace(/\*/g, '')}
              </div>
              
              <div className="mt-6 pt-5 border-t border-border">
                <p className="text-xs text-muted">
                  {isFallback 
                    ? 'This summary is based on available bill information and does not replace the official bill text.'
                    : 'This summary was generated by AI to improve readability and does not replace the official bill text.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
              No summary available.
            </div>
          )}
        </div>

        {billInfo?.url && (
          <div className="text-sm">
            <a
              href={billInfo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent/80 underline transition-colors"
            >
              View full bill on Congress.gov →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
