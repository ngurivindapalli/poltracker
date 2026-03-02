export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

function getFamilyDataPath() {
  const enrichedPath = join(process.cwd(), 'backend', 'data', 'senator_family_trees_enriched.json')
  const defaultPath = join(process.cwd(), 'backend', 'data', 'senator_family_trees.json')
  
  if (existsSync(enrichedPath)) {
    return enrichedPath
  }
  return defaultPath
}

export async function GET() {
  try {
    const filePath = getFamilyDataPath()
    const fileContents = readFileSync(filePath, 'utf-8')
    const data = JSON.parse(fileContents)
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('Error reading family data:', err)
    return NextResponse.json(
      { error: 'Failed to load family data' },
      { status: 500 }
    )
  }
}
