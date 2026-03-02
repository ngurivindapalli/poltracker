export function timeline(inv: any[]) {
  const years: Record<string, number> = {}

  inv.forEach(i => {
    const y = new Date(i.date).getFullYear()

    if (!years[y])
      years[y] = 0

    years[y] += 5000
  })

  return Object.entries(years)
    .map(([y, v]) => ({
      year: parseInt(y),
      total: v
    }))
    .sort((a, b) => a.year - b.year)
}
