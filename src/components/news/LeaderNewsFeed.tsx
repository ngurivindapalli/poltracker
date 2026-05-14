"use client"

import { FilteredNewsFeedSuspended } from "@/components/news/FilteredNewsFeed"

export function LeaderNewsFeed({ leaderSlug }: { leaderSlug: string }) {
  return (
    <FilteredNewsFeedSuspended
      title="Recent News"
      buildApiUrl={(sourcesParam) =>
        `/api/leader-news/${encodeURIComponent(leaderSlug)}?sources=${encodeURIComponent(sourcesParam)}`
      }
      reloadDeps={[leaderSlug]}
    />
  )
}
