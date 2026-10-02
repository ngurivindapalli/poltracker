import { NextResponse } from "next/server"
import { fetchTweetsForHandle } from "@/lib/twitter"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _req: Request,
  { params }: { params: { handle: string } }
) {
  try {
    const tweets = await fetchTweetsForHandle(params.handle || "")
    return NextResponse.json({ tweets })
  } catch (err) {
    console.info("[twitter]", {
      provider: "twitter",
      endpoint: "handle_route",
      errorType: err instanceof Error ? err.name : "server_error",
    })
    return NextResponse.json({ tweets: [] })
  }
}
