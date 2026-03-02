export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getBaseUrl } from '@/lib/getBaseUrl'

export async function GET(
  _req: Request,
  { params }: { params: { name: string } }
) {
  try {
    const name = decodeURIComponent(params.name)
    const baseUrl = getBaseUrl()
    const res = await fetch(`${baseUrl}/data/familyTrees.json`, {
      cache: 'no-store'
    })
    
    if (!res.ok) {
      console.error('Failed loading family trees dataset')
      return NextResponse.json({ error: 'not found' }, { status: 404 })
    }
    
    const data = await res.json()
    
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
