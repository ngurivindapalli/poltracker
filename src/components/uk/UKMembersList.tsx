"use client"

import { useState } from "react"

interface UKMember {
  id: number
  name: string
  party: string | null
  constituency: string | null
  thumbnail?: string
  latestNewsDate?: number
}

interface UKMembersListProps {
  members: UKMember[]
}

export default function UKMembersList({ members }: UKMembersListProps) {
  const [query, setQuery] = useState("")
  const [sortMode, setSortMode] = useState("default")

  const filtered = members.filter((m: UKMember) =>
    m.name.toLowerCase().includes(query.toLowerCase()) ||
    m.party?.toLowerCase().includes(query.toLowerCase()) ||
    m.constituency?.toLowerCase().includes(query.toLowerCase())
  )

  let sorted = [...filtered]

  if (sortMode === "az") {
    sorted.sort((a, b) => a.name.localeCompare(b.name))
  }

  if (sortMode === "news") {
    sorted.sort((a, b) => (b.latestNewsDate || 0) - (a.latestNewsDate || 0))
  }

  return (
    <div>
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search MPs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="px-4 py-2 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />

        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value)}
          className="px-4 py-2 border rounded-xl"
        >
          <option value="default">Sort: Default</option>
          <option value="az">Sort: A-Z</option>
          <option value="news">Sort: Latest News Mentions</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sorted.map((mp: UKMember) => (
          <a
            key={mp.id}
            href={`/uk/member/${mp.id}`}
            className="border rounded-xl p-4 hover:shadow-lg transition"
          >
            <h3 className="font-semibold">{mp.name}</h3>
            <p className="text-sm text-gray-600">{mp.party || 'Unknown'}</p>
            <p className="text-sm text-gray-500">{mp.constituency || 'Unknown'}</p>
          </a>
        ))}
      </div>
    </div>
  )
}
