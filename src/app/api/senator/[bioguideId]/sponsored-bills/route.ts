import { NextResponse } from "next/server"

export async function GET() {
  console.log("Bills API temporarily disabled")

  return NextResponse.json({
    disabled: true,
    bills: []
  })
}
