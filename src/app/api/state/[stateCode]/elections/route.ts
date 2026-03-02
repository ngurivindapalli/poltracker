export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * Elections API Route
 * Returns upcoming elections for a state from static JSON file
 * Always returns { elections: [] } on error (never throws)
 */
export async function GET(
  _req: Request,
  { params }: { params: { stateCode: string } }
) {
  try {
    const stateCode = params.stateCode.toUpperCase()
    
    // Read static elections data
    const dataPath = join(process.cwd(), 'data', 'stateElections.json')
    
    let electionsData: Record<string, any[]>
    try {
      const fileContent = readFileSync(dataPath, 'utf-8')
      electionsData = JSON.parse(fileContent)
    } catch (err) {
      // File doesn't exist or invalid JSON - return empty array
      console.error('Error reading elections data:', err)
      return NextResponse.json({ elections: [] })
    }
    
    // Get elections for this state (normalize to uppercase)
    const elections = electionsData[stateCode] || []
    
    return NextResponse.json({ elections })
  } catch (err) {
    // Always return empty array on any error
    console.error('Error in elections route:', err)
    return NextResponse.json({ elections: [] })
  }
}
