'use client'

import { useState } from 'react'

export default function CredibilityInfo() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs text-muted hover:text-primary underline focus:outline-none transition-colors"
      >
        How is credibility defined?
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal */}
          <div className="absolute left-0 top-6 z-50 w-80 rounded-xl border border-border bg-white p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-semibold text-primary">
                  How We Rank News Credibility
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-muted hover:text-primary transition-colors"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-2 text-xs text-muted leading-relaxed">
                <p>
                  PolTracker ranks news sources based on reporting reliability — not political viewpoint.
                </p>
                <p>
                  Credibility is determined by factors such as primary reporting, editorial standards, source transparency, and historical accuracy.
                </p>
                <p>
                  Wire services like Reuters and the Associated Press rank highest because they frequently conduct original reporting that other outlets cite.
                </p>
                <p>
                  Opinion pieces, blogs, and speculative commentary are not included in credibility-ranked results.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
