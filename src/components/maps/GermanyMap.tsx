"use client"

import {
  ComposableMap,
  Geographies,
  Geography
} from "react-simple-maps"

import { useRouter } from "next/navigation"

const geoUrl = "/maps/germany-states.geo.json"

export default function GermanyMap() {
  const router = useRouter()

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center", marginBottom: "2.5rem" }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          center: [10.5, 51.1],
          scale: 2600
        }}
        width={800}
        height={600}
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const name =
                geo.properties.name ||
                geo.properties.NAME_1 ||
                geo.properties.gen ||
                ""

              // Map state names to slugs
              const stateSlugMap: Record<string, string> = {
                "Baden-Württemberg": "baden-wurttemberg",
                "Bavaria": "bavaria",
                "Berlin": "berlin",
                "Brandenburg": "brandenburg",
                "Bremen": "bremen",
                "Hamburg": "hamburg",
                "Hesse": "hesse",
                "Lower Saxony": "lower-saxony",
                "Mecklenburg-Vorpommern": "mecklenburg-vorpommern",
                "North Rhine-Westphalia": "north-rhine-westphalia",
                "Rhineland-Palatinate": "rhineland-palatinate",
                "Saarland": "saarland",
                "Saxony": "saxony",
                "Saxony-Anhalt": "saxony-anhalt",
                "Schleswig-Holstein": "schleswig-holstein",
                "Thuringia": "thuringia"
              }

              const slug = stateSlugMap[name] || name
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/ü/g, "u")
                .replace(/ö/g, "o")
                .replace(/ä/g, "a")
                .replace(/ß/g, "ss")

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => router.push(`/germany/state/${encodeURIComponent(slug)}`)}
                  style={{
                    default: {
                      fill: "#e5e7eb",
                      stroke: "#ffffff",
                      strokeWidth: 1,
                      outline: "none"
                    },
                    hover: {
                      fill: "#3b82f6",
                      outline: "none",
                      cursor: "pointer"
                    },
                    pressed: {
                      fill: "#1e40af",
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
