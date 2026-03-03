export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'familyTrees.json')
    
    if (!fs.existsSync(filePath)) {
      console.log('familyTrees.json not found')
      return NextResponse.json([])
    }
    
    const raw = fs.readFileSync(filePath, 'utf8')
    const data = JSON.parse(raw)
    console.log('Loaded Family Trees:', Array.isArray(data) ? data.length : 0)
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('Error reading family data:', err)
    return NextResponse.json([])
  }
}
