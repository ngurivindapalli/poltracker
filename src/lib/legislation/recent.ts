import { fetchRecentBills } from "@/lib/congress"
import { buildBillLink } from "@/lib/bills/linkBuilder"

export type RecentLegislationBill = {
  id: string
  congress: number
  billType: string
  billNumber: string
  title: string
  originChamber: string | null
  latestAction: string | null
  updateDate: string | null
  congressUrl: string | null
}

export type RecentLegislationResult = {
  bills: RecentLegislationBill[]
  fetchedAt: string
  status: "ok" | "empty" | "unavailable"
}

function asString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim()
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  return null
}

function normalizeBill(raw: any): RecentLegislationBill | null {
  const congressRaw = raw?.congress
  const congress =
    typeof congressRaw === "number" ? congressRaw : Number(congressRaw)
  const billType = asString(raw?.type)
  const billNumber = asString(raw?.number)
  const title = asString(raw?.title)

  if (!Number.isFinite(congress) || !billType || !billNumber || !title) {
    return null
  }

  const latestAction = asString(raw?.latestAction?.text)
  const updateDate =
    asString(raw?.updateDate) ||
    asString(raw?.updateDateIncludingText) ||
    asString(raw?.latestAction?.actionDate)

  const congressUrl = buildBillLink({
    congress,
    type: billType,
    number: billNumber,
  })

  return {
    id: `${congress}-${billType}-${billNumber}`,
    congress,
    billType,
    billNumber,
    title,
    originChamber: asString(raw?.originChamber),
    latestAction,
    updateDate,
    congressUrl: congressUrl || null,
  }
}

export async function getRecentLegislation(
  limit = 10
): Promise<RecentLegislationResult> {
  const fetchedAt = new Date().toISOString()

  if (!process.env.API_DATA_GOV_KEY) {
    return { bills: [], fetchedAt, status: "unavailable" }
  }

  try {
    const data = await fetchRecentBills(limit)
    const rawBills = Array.isArray(data?.bills) ? data.bills : []
    const bills = rawBills
      .map(normalizeBill)
      .filter((b: RecentLegislationBill | null): b is RecentLegislationBill => b !== null)
      .slice(0, limit)

    return {
      bills,
      fetchedAt,
      status: bills.length === 0 ? "empty" : "ok",
    }
  } catch (err) {
    console.error(
      "Recent legislation fetch failed:",
      err instanceof Error ? err.message : "unknown error"
    )
    return { bills: [], fetchedAt, status: "unavailable" }
  }
}
