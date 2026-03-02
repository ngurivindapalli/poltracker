export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getBaseUrl } from '@/lib/getBaseUrl'

export async function GET() {
  try {
    const baseUrl = getBaseUrl()
    const res = await fetch(`${baseUrl}/data/familyTrees.json`, {
      cache: 'no-store'
    })
    
    if (!res.ok) {
      console.error('Failed loading family trees dataset')
      return NextResponse.json([])
    }
    
    const data = await res.json()
    console.log('Loaded Family Trees:', Array.isArray(data) ? data.length : 0)
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('Error reading family data:', err)
    return NextResponse.json([])
  }
}
