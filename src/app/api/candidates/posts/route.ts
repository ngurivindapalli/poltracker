import { NextResponse } from "next/server"
import posts from "@/data/candidatePosts.json"

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(posts)
}
