export type Ideology = "left" | "center" | "right"

/**
 * Determine ideology from party affiliation
 */
export function ideologyFromParty(party?: string): Ideology {
  if (!party) return "center"
  
  const partyLower = party.toLowerCase()
  if (partyLower.includes("democrat")) return "left"
  if (partyLower.includes("republican")) return "right"
  return "center"
}

/**
 * Invert ideology (for opposing view)
 */
export function invertIdeology(i: Ideology): Ideology {
  if (i === "left") return "right"
  if (i === "right") return "left"
  return "center"
}
