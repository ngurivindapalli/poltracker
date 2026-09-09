import { NextResponse } from "next/server"
import { socialAccounts } from "@/data/socialAccounts"
import { fetchTweetsForHandle } from "@/lib/twitter"

export async function GET(
  _req: Request,
  { params }: { params: { bioguideId: string } }
) {
  try {
    const bioguideId = (params.bioguideId || "").toUpperCase()
    const handle = socialAccounts[bioguideId] || socialAccounts[params.bioguideId] || ""
    if (!handle) {
      return NextResponse.json({ tweets: [] })
    }
    const tweets = await fetchTweetsForHandle(handle)
    return NextResponse.json({ tweets })
  } catch {
    return NextResponse.json({ tweets: [] })
  }
}
