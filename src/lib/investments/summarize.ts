export function summarize(inv: any[]) {
  const map: Record<string, number> = {}

  inv.forEach(i => {
    const t = i.ticker || "Unknown"

    if (!map[t]) map[t] = 0

    map[t] += 5000
  })

  return Object.entries(map)
    .map(([k, v]) => ({
      asset: k,
      value: v
    }))
}
