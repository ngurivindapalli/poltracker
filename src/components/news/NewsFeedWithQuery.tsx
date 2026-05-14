"use client"

import { FilteredNewsFeedSuspended } from "./FilteredNewsFeed"

interface NewsFeedWithQueryProps {
  query: string
}

export default function NewsFeedWithQuery({ query }: NewsFeedWithQueryProps) {
  return (
    <FilteredNewsFeedSuspended
      buildApiUrl={(sourcesParam) =>
        `/api/news?q=${encodeURIComponent(query)}&sources=${encodeURIComponent(sourcesParam)}`
      }
      reloadDeps={[query]}
    />
  )
}
