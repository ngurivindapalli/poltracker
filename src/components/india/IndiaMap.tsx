"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { indiaStateToSlug } from "@/lib/geo/india-states";

// Using a GeoJSON URL - if this doesn't work, we'll fall back to button grid
const GEO_URL = "https://raw.githubusercontent.com/geohacker/india/master/state/india_telengana.geojson";

export default function IndiaMap() {
  const router = useRouter();
  const [hoverName, setHoverName] = useState<string | null>(null);
  const [mapError, setMapError] = useState(false);

  const tooltip = useMemo(() => hoverName, [hoverName]);

  // Fallback to button grid if map fails
  if (mapError) {
    return (
      <div className="bg-white rounded-xl shadow p-8">
        <h3 className="text-xl font-semibold mb-6">Select a State</h3>
        <div className="grid md:grid-cols-4 gap-3">
          {[
            "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa",
            "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
            "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab",
            "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh",
            "Uttarakhand", "West Bengal"
          ].map(state => (
            <button
              key={state}
              onClick={() => router.push(`/india/${indiaStateToSlug(state)}`)}
              className="border rounded-lg p-3 hover:bg-gray-100 transition"
            >
              {state}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700">Interactive map</div>
        <div className="text-sm text-gray-500">{tooltip ? tooltip : "Hover a state"}</div>
      </div>

      <div className="w-full" style={{ height: "420px" }}>
        <ComposableMap 
          projection="geoMercator"
          {...{
            projectionConfig: {
              center: [78, 22],
              scale: 1000
            }
          } as any}
          width={800}
          height={420}
          style={{ width: "100%", height: "100%" }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any) => {
                const name =
                  geo.properties?.st_nm ||
                  geo.properties?.name ||
                  geo.properties?.NAME_1 ||
                  "Unknown";

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => setHoverName(name)}
                    onMouseLeave={() => setHoverName(null)}
                    onClick={() => {
                      const slug = indiaStateToSlug(name);
                      router.push(`/india/${slug}`);
                    }}
                    style={{
                      default: { fill: "#E5E7EB", outline: "none" },
                      hover: { fill: "#CBD5E1", outline: "none", cursor: "pointer" },
                      pressed: { fill: "#94A3B8", outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        Click a state to view its Chief Minister profile + state news.
      </div>
    </div>
  );
}
