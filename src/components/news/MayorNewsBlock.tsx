"use client"

import { FilteredNewsFeedSuspended } from "@/components/news/FilteredNewsFeed"

export function MayorNewsBlock({ slug }: { slug: string }) {
  return (
    <FilteredNewsFeedSuspended
      title="Latest News"
      buildApiUrl={(sourcesParam) =>
        `/api/mayor-news/${encodeURIComponent(slug)}?sources=${encodeURIComponent(sourcesParam)}`
      }
      reloadDeps={[slug]}
    />
  )
}
