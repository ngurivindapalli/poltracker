"use client"

import { ComposableMap, Geographies, Geography } from "react-simple-maps"

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"

const FIPS_TO_STATE: Record<string, string> = {
  "01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA",
  "08":"CO","09":"CT","10":"DE","11":"DC","12":"FL",
  "13":"GA","15":"HI","16":"ID","17":"IL","18":"IN",
  "19":"IA","20":"KS","21":"KY","22":"LA","23":"ME",
  "24":"MD","25":"MA","26":"MI","27":"MN","28":"MS",
  "29":"MO","30":"MT","31":"NE","32":"NV","33":"NH",
  "34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND",
  "39":"OH","40":"OK","41":"OR","42":"PA","44":"RI",
  "45":"SC","46":"SD","47":"TN","48":"TX","49":"UT",
  "50":"VT","51":"VA","53":"WA","54":"WV","55":"WI",
  "56":"WY"
}

// State colors based on Senate majority (static for now)
const STATE_COLORS: Record<string, string> = {
  // Republican majority
  TX: "#DC2626", FL: "#DC2626", AL: "#DC2626", AK: "#DC2626",
  AR: "#DC2626", ID: "#DC2626", IN: "#DC2626", IA: "#DC2626",
  KS: "#DC2626", KY: "#DC2626", LA: "#DC2626", MS: "#DC2626",
  MO: "#DC2626", MT: "#DC2626", NE: "#DC2626", ND: "#DC2626",
  OK: "#DC2626", SC: "#DC2626", SD: "#DC2626", TN: "#DC2626",
  UT: "#DC2626", WV: "#DC2626", WY: "#DC2626", OH: "#DC2626",
  // Democratic majority
  CA: "#2563EB", NY: "#2563EB", IL: "#2563EB", MA: "#2563EB",
  CT: "#2563EB", DE: "#2563EB", HI: "#2563EB", MD: "#2563EB",
  MN: "#2563EB", NJ: "#2563EB", OR: "#2563EB", RI: "#2563EB",
  VT: "#2563EB", WA: "#2563EB", CO: "#2563EB", NV: "#2563EB",
  NM: "#2563EB", VA: "#2563EB", MI: "#2563EB", WI: "#2563EB",
  // Split delegation (purple)
  ME: "#7C3AED", AZ: "#7C3AED", GA: "#7C3AED", NH: "#7C3AED",
  PA: "#7C3AED", NC: "#7C3AED"
}

// Resolve state color (no async, no hooks)
const resolveStateColor = (stateCode?: string) => {
  if (!stateCode) return "#E5E7EB"
  return STATE_COLORS[stateCode] ?? "#E5E7EB"
}

export default function USStateMap() {
  return (
    <div className="w-full h-[500px] bg-card rounded-[8px] overflow-hidden">
      <ComposableMap 
        projection="geoAlbersUsa"
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const fipsCode = geo.id ? String(geo.id).padStart(2, '0') : ''
              const stateCode = fipsCode ? FIPS_TO_STATE[fipsCode] : undefined

              const fillColor = resolveStateColor(stateCode)

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fillColor}
                  stroke="#FFFFFF"
                  strokeWidth={0.5}
                  onClick={() => {
                    if (!stateCode) return
                    window.open(`/state/${stateCode}`, "_blank")
                  }}
                  style={{
                    default: {
                      outline: "none",
                      cursor: "pointer",
                      transition: "fill 0.2s ease"
                    },
                    hover: {
                      filter: "brightness(0.9)",
                      cursor: "pointer"
                    },
                    pressed: {
                      outline: "none"
                    }
                  }}
                />
              )
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  )
}
