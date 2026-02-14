'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ComposableMap,
  Geographies,
  Geography
} from 'react-simple-maps'

// US states GeoJSON URL (using a public CDN)
const geoUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'

// State code to full name mapping
const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
  DC: 'District of Columbia'
}

// Color mapping for political control
const COLOR_MAP: Record<string, string> = {
  blue: '#2563EB',   // Democrat majority
  red: '#DC2626',    // Republican majority
  purple: '#7C3AED', // Split delegation
  gray: '#9CA3AF'    // No data / fallback
}

// Hover color lightening/darkening
const HOVER_COLOR_MAP: Record<string, string> = {
  blue: '#3B82F6',   // Lighter blue
  red: '#EF4444',    // Lighter red
  purple: '#8B5CF6', // Lighter purple
  gray: '#D1D5DB'    // Lighter gray
}

type StateColorMap = Record<string, 'blue' | 'red' | 'purple' | 'gray'>

export default function USStateMap() {
  const router = useRouter()
  const [hoveredState, setHoveredState] = useState<string | null>(null)
  const [stateColors, setStateColors] = useState<StateColorMap>({})
  const [loading, setLoading] = useState(true)

  // Fetch state colors on mount
  useEffect(() => {
    const fetchStateColors = async () => {
      try {
        const res = await fetch('/api/state-colors')
        if (res.ok) {
          const colors = await res.json()
          setStateColors(colors)
        }
      } catch (err) {
        console.error('Error fetching state colors:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchStateColors()
  }, [])

  const handleStateClick = (stateCode: string) => {
    if (stateCode && STATE_NAMES[stateCode]) {
      router.push(`/state/${stateCode}`)
    }
  }

  /**
   * Get the base fill color for a state based on political control
   */
  const getStateFill = (stateCode: string, isHovered: boolean): string => {
    const colorKey = stateColors[stateCode] || 'gray'
    return isHovered ? (HOVER_COLOR_MAP[colorKey] || COLOR_MAP[colorKey]) : COLOR_MAP[colorKey]
  }

  return (
    <div className="w-full rounded-xl border border-border bg-white p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-primary">Explore by State</h2>
        <p className="mt-1 text-sm text-muted">
          Click a state to view news and legislation from its representatives
        </p>
      </div>
      
      {loading && (
        <div className="w-full rounded-lg bg-background p-8 text-center text-sm text-muted" style={{ minHeight: '400px' }}>
          Loading state data...
        </div>
      )}
      
      {!loading && (
        <div className="w-full overflow-hidden rounded-lg bg-background" style={{ minHeight: '400px' }}>
          <ComposableMap
            projection="geoAlbersUsa"
            className="w-full"
            style={{ width: '100%', height: 'auto', pointerEvents: 'auto' }}
          >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                // us-atlas uses 'STUSPS' property for state codes (e.g., "CA", "NY")
                // Fallback to 'name' if STUSPS is not available
                const stateCode = (geo.properties?.STUSPS || geo.properties?.name || geo.id || '').toUpperCase()
                const isHovered = hoveredState === stateCode
                const fillColor = getStateFill(stateCode, isHovered)
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fillColor}
                    stroke="#FFFFFF"
                    strokeWidth={0.5}
                    style={{
                      default: {
                        outline: 'none',
                        cursor: 'pointer',
                        transition: 'fill 0.2s ease',
                        pointerEvents: 'auto'
                      },
                      hover: {
                        outline: 'none',
                        cursor: 'pointer',
                        transition: 'fill 0.2s ease',
                        pointerEvents: 'auto'
                      },
                      pressed: {
                        outline: 'none',
                        opacity: 0.8,
                        pointerEvents: 'auto'
                      }
                    }}
                    onMouseEnter={() => {
                      if (stateCode) {
                        setHoveredState(stateCode)
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredState(null)
                    }}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (stateCode && STATE_NAMES[stateCode]) {
                        handleStateClick(stateCode)
                      }
                    }}
                  />
                )
              })
            }
          </Geographies>
        </ComposableMap>
        </div>
      )}
      
      {hoveredState && STATE_NAMES[hoveredState] && (
        <div className="mt-4 text-center text-sm text-muted">
          {STATE_NAMES[hoveredState]} — Click to explore
        </div>
      )}
      
      {!loading && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: COLOR_MAP.blue }} />
            <span>Democrat Majority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: COLOR_MAP.red }} />
            <span>Republican Majority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: COLOR_MAP.purple }} />
            <span>Split Delegation</span>
          </div>
        </div>
      )}
    </div>
  )
}
