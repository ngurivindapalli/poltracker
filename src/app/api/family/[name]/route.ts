export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  _req: Request,
  { params }: { params: { name: string } }
) {
  try {
    const name = decodeURIComponent(params.name)
    const filePath = path.join(process.cwd(), 'public', 'data', 'familyTrees.json')
    
    if (!fs.existsSync(filePath)) {
      console.log('familyTrees.json not found')
      return NextResponse.json({ error: 'not found' }, { status: 404 })
    }
    
    const raw = fs.readFileSync(filePath, 'utf8')
    const data = JSON.parse(raw)
    
    for (const s of data) {
      if (s.name && s.name.toLowerCase() === name.toLowerCase()) {
        return NextResponse.json(s)
      }
    }
    
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  } catch (err: any) {
    console.error('Error reading family data:', err)
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
}
