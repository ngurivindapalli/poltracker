"use client"

import { FilteredNewsFeedSuspended } from "@/components/news/FilteredNewsFeed"

export default function CabinetNews({ name }: { name: string }) {
  return (
    <FilteredNewsFeedSuspended
      title="Recent coverage"
      buildApiUrl={(sourcesParam) =>
        `/api/cabinet-news/${encodeURIComponent(name)}?sources=${encodeURIComponent(sourcesParam)}`
      }
      reloadDeps={[name]}
    />
  )
}
