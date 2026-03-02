import { NextResponse } from "next/server"
import { loadInvestments } from "@/lib/investments/loadInvestments"
import { summarize } from "@/lib/investments/summarize"
import { getSenatorName } from "@/lib/senators"

export async function GET(
  req: Request,
  { params }: { params: { bioguideId: string } }
) {
  try {
    const name = await getSenatorName(params.bioguideId)

    const all = loadInvestments()

    const mine = all.filter(i =>
      i.senator
        .toLowerCase()
        .includes(name.toLowerCase())
    )

    const summary = summarize(mine)

    return NextResponse.json(summary)
  } catch (e) {
    console.log("Portfolio API error:", e)
    return NextResponse.json([])
  }
}
