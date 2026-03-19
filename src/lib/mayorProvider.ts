import { MAYORS } from "@/data/mayors"

export function getAllMayors() {
  return MAYORS
}

export function getMayorBySlug(slug: string) {
  return MAYORS.find((m) => m.slug === slug) ?? null
}

export function getMayorsByState(state: string) {
  return MAYORS.filter((m) => m.state === state)
}
