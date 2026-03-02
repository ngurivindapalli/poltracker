import { NextResponse } from "next/server"
import { timeline } from "@/lib/investments/timeline"
import { loadInvestments } from "@/lib/investments/loadInvestments"
import { getSenatorName } from "@/lib/senators"

export async function GET(
  req: Request,
  { params }: { params: { bioguideId: string } }
) {
  try {
    const name = await getSenatorName(params.bioguideId)

    const inv = loadInvestments()
      .filter(i =>
        i.senator
          .toLowerCase()
          .includes(name.toLowerCase())
      )

    return NextResponse.json(timeline(inv))
  } catch (e) {
    console.log("Portfolio history API error:", e)
    return NextResponse.json([])
  }
}
