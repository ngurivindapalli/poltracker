import { NextResponse } from "next/server"
import { fetchTweetsForHandle } from "@/lib/twitter"

export async function GET(
  _req: Request,
  { params }: { params: { handle: string } }
) {
  try {
    const tweets = await fetchTweetsForHandle(params.handle || "")
    return NextResponse.json({ tweets })
  } catch {
    return NextResponse.json({ tweets: [] })
  }
}
