import { NextResponse } from "next/server"
import { representatives } from "@/data/representatives"

export async function GET() {
  return NextResponse.json({ representatives })
}
