import fs from "fs"
import path from "path"

export type Legislator = {
  id: { bioguide: string }
  name: { official_full: string }
  terms: Array<{
    type: "sen" | "rep"
    state: string
    district?: number
    end?: string
  }>
}

let cached: Legislator[] | null = null

export function getLegislators(): Legislator[] {
  if (cached) return cached

  try {
    // Try multiple possible locations
    const possiblePaths = [
      path.join(process.cwd(), "data", "legislators-current.json"),
      path.join(process.cwd(), "src", "data", "legislators-current.json"),
      path.join(process.cwd(), "public", "data", "legislators-current.json"),
    ]

    let fileContent: string | null = null
    for (const filePath of possiblePaths) {
      try {
        if (fs.existsSync(filePath)) {
          fileContent = fs.readFileSync(filePath, "utf-8")
          break
        }
      } catch (e) {
        // Continue to next path
      }
    }

    if (!fileContent) {
      throw new Error("Legislator file not found in any expected location")
    }

    const parsed = JSON.parse(fileContent)
    cached = Array.isArray(parsed)
      ? parsed
      : parsed.legislators ?? []
  } catch (err) {
    console.error("Legislator dataset missing. Federal Officials will not render.", err)
    cached = []
  }

  return cached
}

/**
 * Get legislators for a specific state
 */
export function getLegislatorsByState(stateCode: string): Legislator[] {
  const all = getLegislators()
  return all.filter(member =>
    member.terms.some(t =>
      t.state === stateCode.toUpperCase() &&
      (!t.end || new Date(t.end) > new Date())
    )
  )
}

/**
 * Get senators for a state
 */
export function getSenatorsByState(stateCode: string): Legislator[] {
  return getLegislatorsByState(stateCode).filter(m =>
    m.terms.some(t => t.type === "sen" && t.state === stateCode.toUpperCase())
  )
}

/**
 * Get representatives for a state
 */
export function getRepresentativesByState(stateCode: string): Legislator[] {
  return getLegislatorsByState(stateCode)
    .filter(m =>
      m.terms.some(t => t.type === "rep" && t.state === stateCode.toUpperCase())
    )
    .sort((a, b) => {
      const da = a.terms.find(t => t.type === "rep")?.district || 0
      const db = b.terms.find(t => t.type === "rep")?.district || 0
      return da - db
    })
}
