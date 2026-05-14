"use client"

import { FilteredNewsFeedSuspended } from "@/components/news/FilteredNewsFeed"

export function GovernorNewsBlock({ slug }: { slug: string }) {
  return (
    <FilteredNewsFeedSuspended
      title="Latest News"
      buildApiUrl={(sourcesParam) =>
        `/api/governor-news/${encodeURIComponent(slug)}?sources=${encodeURIComponent(sourcesParam)}`
      }
      reloadDeps={[slug]}
    />
  )
}
