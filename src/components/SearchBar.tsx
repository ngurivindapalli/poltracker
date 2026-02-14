'use client'

import { useEffect, useMemo, useState } from 'react'

export default function SearchBar({
  placeholder,
  value,
  onChange
}: {
  placeholder: string
  value: string
  onChange: (value: string) => void
}) {
  const [local, setLocal] = useState(value)

  useEffect(() => {
    setLocal(value)
  }, [value])

  // small debounce to avoid re-render churn for large lists
  const debounced = useMemo(() => {
    let t: any
    return (next: string) => {
      clearTimeout(t)
      t = setTimeout(() => onChange(next), 150)
    }
  }, [onChange])

  return (
    <div className="w-full">
      <input
        value={local}
        onChange={(e) => {
          const next = e.target.value
          setLocal(next)
          debounced(next)
        }}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-primary placeholder:text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
      />
    </div>
  )
}
