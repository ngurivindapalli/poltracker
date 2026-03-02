"use client"

import { useState, useEffect } from "react"
import USMap from "@/components/maps/USMap"
import BackButton from "@/components/BackButton"
import SenatorGrid from "@/components/senators/SenatorGrid"
import { senatorImageUrl } from "@/lib/images"

type Senator = {
  bioguideId: string
  name: string
  party?: string
  state?: string
  imageUrl?: string
}

export default function USPage() {
  const [senators, setSenators] = useState<Senator[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSenators() {
      try {
        const res = await fetch('/api/senators')
        if (res.ok) {
          const data = await res.json()
          setSenators(data.senators || [])
        }
      } catch (err) {
        console.error('Error fetching senators:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSenators()
  }, [])

  // Map API response to SenatorGrid format
  const mappedSenators = senators.map(s => ({
    id: s.bioguideId,
    bioguideId: s.bioguideId,
    name: s.name,
    state: s.state || '',
    party: s.party,
    image: s.imageUrl || senatorImageUrl(s.bioguideId),
    imageUrl: s.imageUrl || senatorImageUrl(s.bioguideId)
  }))

  return (
    <div className="countryPage">
      <BackButton />
      <h1>United States</h1>

      {/* President */}
      <div className="leaderCenter">
        <img
          src="/flags/us.png"
          width="160"
          height="160"
          alt="United States"
          onError={(e) => {
            e.currentTarget.src = "/images/placeholder-avatar.svg";
          }}
        />
        <h2>United States</h2>
        <p>President of the United States</p>
      </div>

      {/* Map */}
      <USMap />

      {/* Senators */}
      {loading ? (
        <div className="text-gray-500 text-center py-8">Loading senators...</div>
      ) : (
        <SenatorGrid senators={mappedSenators} />
      )}
    </div>
  )
}
