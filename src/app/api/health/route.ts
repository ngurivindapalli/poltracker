export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasKey: Boolean(process.env.API_DATA_GOV_KEY),
    nodeVersion: process.version
  })
}
