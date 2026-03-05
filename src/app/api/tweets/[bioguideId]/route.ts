import { NextResponse } from "next/server"
import tweets from "@/data/tweets.json"

export async function GET(
  req: Request,
  { params }: { params: { bioguideId: string } }
) {
  const data = tweets[params.bioguideId] || []

  return NextResponse.json(data)
}
