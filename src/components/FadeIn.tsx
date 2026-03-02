"use client"

import { useEffect, useRef } from "react"

export default function FadeIn({
  children
}: {
  children: any
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting)
            e.target.classList.add("visible")
        })
      },
      { threshold: 0.2 }
    )

    if (ref.current) {
      obs.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        obs.unobserve(ref.current)
      }
    }
  }, [])

  return (
    <div ref={ref} className="fade">
      {children}
    </div>
  )
}
