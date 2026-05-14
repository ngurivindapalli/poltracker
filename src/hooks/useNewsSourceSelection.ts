"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  DEFAULT_NEWS_SOURCE_IDS,
  isDefaultNewsSourceSelection,
  normalizeNewsSourcesParam,
  validateNewsSourceIds,
  buildNewsApiSourcesQueryParam
} from "@/lib/newsSources"

const STORAGE_KEY = "poltracker-news-sources"

function readUrlSources(searchParams: URLSearchParams): string[] | null {
  if (!searchParams.has("sources")) return null
  const raw = searchParams.get("sources") ?? ""
  const v = validateNewsSourceIds(normalizeNewsSourcesParam(raw))
  return v.length > 0 ? v : [...DEFAULT_NEWS_SOURCE_IDS]
}

function readStorage(): string[] | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return null
    const ids = validateNewsSourceIds(parsed.map(String))
    return ids.length > 0 ? ids : null
  } catch {
    return null
  }
}

export function useNewsSourceSelection() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [selectedIds, setSelectedIds] = useState<string[]>(DEFAULT_NEWS_SOURCE_IDS)
  const [ready, setReady] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Initial hydrate: URL overrides localStorage; then defaults
  useEffect(() => {
    const fromUrl = readUrlSources(searchParams)
    if (fromUrl) {
      setSelectedIds(fromUrl)
      setReady(true)
      return
    }
    const fromStorage = readStorage()
    if (fromStorage) {
      setSelectedIds(fromStorage)
    }
    setReady(true)
  }, [searchParams])

  const sourcesQueryValue = useMemo(() => {
    const effective =
      selectedIds.length > 0 ? selectedIds : DEFAULT_NEWS_SOURCE_IDS
    return buildNewsApiSourcesQueryParam(effective)
  }, [selectedIds])

  const persist = useCallback((ids: string[]) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    } catch {
      /* ignore */
    }
  }, [])

  const syncUrl = useCallback(
    (ids: string[]) => {
      const params = new URLSearchParams(searchParams.toString())
      if (isDefaultNewsSourceSelection(ids)) {
        params.delete("sources")
      } else {
        params.set("sources", buildNewsApiSourcesQueryParam(ids))
      }
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  const updateSelection = useCallback(
    (ids: string[]) => {
      setSelectedIds(ids)
      persist(ids)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        syncUrl(ids)
      }, 250)
    },
    [persist, syncUrl]
  )

  return {
    selectedIds,
    setSelectedIds: updateSelection,
    sourcesQueryValue,
    ready
  }
}
