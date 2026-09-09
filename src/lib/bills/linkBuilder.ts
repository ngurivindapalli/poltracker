export interface BillLinkData {
  congress: string | number
  type: string
  number: string | number
}

const TYPE_PATHS: Record<string, string> = {
  hr: "house-bill",
  s: "senate-bill",
  hjres: "house-joint-resolution",
  sjres: "senate-joint-resolution",
  hconres: "house-concurrent-resolution",
  sconres: "senate-concurrent-resolution",
  hres: "house-resolution",
  sres: "senate-resolution",
}

const TYPE_LABELS: Record<string, string> = {
  hr: "H.R.",
  s: "S.",
  hjres: "H.J.Res.",
  sjres: "S.J.Res.",
  hconres: "H.Con.Res.",
  sconres: "S.Con.Res.",
  hres: "H.Res.",
  sres: "S.Res.",
}

function normalizeType(type: string): string {
  return String(type || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "")
}

export function congressOrdinal(n: string | number): string {
  const num = Number(n)
  if (!Number.isFinite(num)) return String(n)
  const j = num % 10
  const k = num % 100
  let suffix = "th"
  if (k < 11 || k > 13) {
    if (j === 1) suffix = "st"
    else if (j === 2) suffix = "nd"
    else if (j === 3) suffix = "rd"
  }
  return `${num}${suffix}`
}

export function formatBillIdentifier(
  type: string,
  number: string | number
): string {
  const label = TYPE_LABELS[normalizeType(type)] || String(type || "").toUpperCase()
  return `${label} ${number}`.trim()
}

/**
 * Build a public Congress.gov bill link from bill data.
 * Returns an empty string when congress, type, or number is missing.
 */
export function buildBillLink(bill: BillLinkData): string {
  const congress = String(bill.congress || "").trim()
  const type = normalizeType(String(bill.type || ""))
  const number = String(bill.number || "").trim()

  if (!congress || !type || !number) return ""

  const typePath = TYPE_PATHS[type] || `${type}-bill`
  return `https://www.congress.gov/bill/${congressOrdinal(congress)}-congress/${typePath}/${number}`
}
