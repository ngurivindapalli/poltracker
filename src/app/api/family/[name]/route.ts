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

export async function GET(
  _req: Request,
  { params }: { params: { name: string } }
) {
  try {
    const name = decodeURIComponent(params.name)
    const filePath = getFamilyDataPath()
    const fileContents = readFileSync(filePath, 'utf-8')
    const data = JSON.parse(fileContents)
    
    for (const s of data) {
      if (s.name && s.name.toLowerCase() === name.toLowerCase()) {
        return NextResponse.json(s)
      }
    }
    
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  } catch (err: any) {
    console.error('Error reading family data:', err)
    return NextResponse.json(
      { error: 'Failed to load family data' },
      { status: 500 }
    )
  }
}
