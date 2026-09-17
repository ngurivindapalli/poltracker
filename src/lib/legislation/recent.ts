import { getRecentLegislationFromDb } from "@/lib/legislation/store"
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
  const cached = await getRecentLegislationFromDb(limit)
  const bills = (cached.bills || [])
    .map((raw: any) =>
      raw?.billType && raw?.billNumber
        ? ({
            id: raw.id || `${raw.congress}-${raw.billType}-${raw.billNumber}`,
            congress: Number(raw.congress) || 0,
            billType: String(raw.billType),
            billNumber: String(raw.billNumber),
            title: String(raw.title || ""),
            originChamber: raw.originChamber || null,
            latestAction: raw.latestAction || null,
            updateDate: raw.updateDate || null,
            congressUrl:
              raw.congressUrl ||
              buildBillLink({
                congress: raw.congress,
                type: raw.billType,
                number: raw.billNumber,
              }) ||
              null,
          } satisfies RecentLegislationBill)
        : normalizeBill(raw)
    )
    .filter((b: RecentLegislationBill | null): b is RecentLegislationBill => Boolean(b && b.title))
    .slice(0, limit)

  return {
    bills,
    fetchedAt: cached.fetchedAt,
    status:
      bills.length > 0
        ? "ok"
        : cached.status === "unavailable"
          ? "unavailable"
          : "empty",
  }
}
