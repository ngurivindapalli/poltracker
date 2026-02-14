export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'
import { fetchBill } from '@/lib/congress'
import { getPublicBillUrl } from '@/lib/bills'
import OpenAI from 'openai'

// In-memory cache for bill summaries
const summaryCache = new Map<
  string,
  { summary: string; timestamp: number; fallback?: boolean }
>()

const CACHE_TTL = 1000 * 60 * 60 // 1 hour

/**
 * Generate a fallback summary from bill data when OpenAI is unavailable
 */
function generateFallbackSummary(bill: any, congress: string, type: string, number: string): string {
  const billTitle = bill?.title ?? bill?.shortTitle ?? `${type.toUpperCase()}.${number}`
  
  // Try to get official summary first
  if (bill?.summary?.text) {
    return `This bill was introduced in the ${congress}th Congress.

${bill.summary.text}

For full details, refer to the official bill text.`
  }
  
  // Build fallback from available data
  const parts: string[] = []
  parts.push(`This bill was introduced in the ${congress}th Congress.`)
  parts.push(`\nIt focuses on ${billTitle}.`)
  
  if (bill?.introducedDate) {
    parts.push(`\nIntroduced: ${bill.introducedDate}`)
  }
  
  if (bill?.sponsors?.item) {
    const sponsors = Array.isArray(bill.sponsors.item) 
      ? bill.sponsors.item 
      : [bill.sponsors.item]
    const sponsorNames = sponsors
      .map((s: any) => s?.fullName ?? s?.name)
      .filter(Boolean)
      .join(', ')
    if (sponsorNames) {
      parts.push(`\nSponsor(s): ${sponsorNames}`)
    }
  }
  
  if (bill?.latestAction?.text) {
    parts.push(`\nLatest Action: ${bill.latestAction.text}`)
  }
  
  parts.push(`\n\nFor full details, refer to the official bill text.`)
  
  return parts.join('')
}

export async function GET(
  _req: Request,
  { params }: { params: { billId: string } }
) {
  try {
    const { billId } = params
    
    console.log('Bill summary route hit:', billId)
    
    // Parse billId: format is "congress-type-number" (e.g., "118-s-1234")
    const parts = billId.split('-')
    if (parts.length !== 3) {
      console.error('Invalid bill ID format:', billId)
      return NextResponse.json(
        { error: 'Invalid bill ID format' },
        { status: 400 }
      )
    }
    
    const [congress, type, number] = parts
    
    // Check cache first (after parsing to ensure valid billId)
    const cached = summaryCache.get(billId)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Returning cached summary for:', billId)
      
      // Still need billInfo, so fetch it (but skip OpenAI call)
      let billData
      try {
        billData = await fetchBill(congress, type, number)
        const bill = billData?.bill ?? billData
        const billInfo = {
          title: bill?.title ?? bill?.shortTitle ?? `${type.toUpperCase()}.${number}`,
          congress: bill?.congress ?? congress,
          type: bill?.type ?? type,
          number: bill?.number ?? number,
          url: getPublicBillUrl(bill) ?? null
        }
        
        return NextResponse.json({
          summary: cached.summary,
          fallback: cached.fallback || false,
          billInfo
        })
      } catch (err) {
        // If bill fetch fails, still return cached summary with minimal info
        return NextResponse.json({
          summary: cached.summary,
          fallback: cached.fallback || false,
          billInfo: {
            title: `${type.toUpperCase()}.${number}`,
            congress,
            type,
            number,
            url: null
          }
        })
      }
    }
    
    // Fetch bill data from Congress API
    let billData
    try {
      console.log('Fetching bill data from Congress API:', { congress, type, number })
      billData = await fetchBill(congress, type, number)
    } catch (err: any) {
      console.error('Error fetching bill:', err?.message || 'Unknown error')
      return NextResponse.json(
        { error: 'Unable to fetch bill data' },
        { status: 500 }
      )
    }
    
    const bill = billData?.bill ?? billData
    
    // Extract bill information
    const billInfo = {
      title: bill?.title ?? bill?.shortTitle ?? `${type.toUpperCase()}.${number}`,
      congress: bill?.congress ?? congress,
      type: bill?.type ?? type,
      number: bill?.number ?? number,
      url: getPublicBillUrl(bill) ?? null
    }
    
    // Get bill text or summary for ChatGPT
    let billText = ''
    
    // Try to get summary text first (most concise)
    if (bill?.summary?.text) {
      billText = bill.summary.text
    } else if (bill?.summary?.as) {
      billText = bill.summary.as
    } else if (bill?.latestAction?.text) {
      billText = bill.latestAction.text
    } else if (bill?.title) {
      billText = bill.title
      if (bill?.shortTitle && bill.shortTitle !== bill.title) {
        billText += `\n\nShort Title: ${bill.shortTitle}`
      }
    }
    
    // If we don't have enough text, try to get more context
    if (!billText || billText.length < 100) {
      const parts: string[] = []
      if (bill?.title) parts.push(`Title: ${bill.title}`)
      if (bill?.shortTitle) parts.push(`Short Title: ${bill.shortTitle}`)
      if (bill?.introducedDate) parts.push(`Introduced: ${bill.introducedDate}`)
      if (bill?.latestAction?.text) parts.push(`Latest Action: ${bill.latestAction.text}`)
      if (bill?.sponsors?.item) {
        const sponsors = Array.isArray(bill.sponsors.item) 
          ? bill.sponsors.item 
          : [bill.sponsors.item]
        const sponsorNames = sponsors
          .map((s: any) => s?.fullName ?? s?.name)
          .filter(Boolean)
          .join(', ')
        if (sponsorNames) parts.push(`Sponsors: ${sponsorNames}`)
      }
      billText = parts.join('\n\n')
    }
    
    console.log('Bill text length:', billText?.length)
    
    if (!billText || billText.trim().length === 0) {
      console.error('Insufficient bill data for summarization')
      return NextResponse.json(
        { 
          error: 'Insufficient bill data available for summarization',
          billInfo 
        },
        { status: 400 }
      )
    }
    
    // Try OpenAI API if key is available
    if (process.env.OPENAI_API_KEY) {
      console.log('OpenAI key exists, attempting API call')
      
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        })
        
        console.log('Calling OpenAI API for summary generation')
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a nonpartisan policy analyst. Summarize legislation clearly and factually. Avoid political persuasion or opinion.'
            },
            {
              role: 'user',
              content: `Summarize the following bill in plain English. Include:\n- What the bill does\n- Who it affects\n- Major provisions\n- Potential impacts\n\nAvoid political persuasion or opinion.\n\nBill Information:\n${billText}`
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
        
        const summary = completion.choices?.[0]?.message?.content
        
        if (summary) {
          console.log('Summary generated successfully, length:', summary.length)
          
          // Cache the successful OpenAI response
          summaryCache.set(billId, {
            summary,
            timestamp: Date.now(),
            fallback: false
          })
          
          return NextResponse.json({
            summary,
            fallback: false,
            billInfo
          })
        }
      } catch (err: any) {
        // Handle 429 quota errors gracefully
        if (err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('quota')) {
          console.log('OpenAI quota exceeded (429), using fallback summary')
          
          const fallbackSummary = generateFallbackSummary(bill, congress, type, number)
          
          // Cache the fallback summary
          summaryCache.set(billId, {
            summary: fallbackSummary,
            timestamp: Date.now(),
            fallback: true
          })
          
          return NextResponse.json({
            summary: fallbackSummary,
            fallback: true,
            billInfo
          })
        }
        
        // For other OpenAI errors, log but don't crash
        console.error('OpenAI API error:', err?.status || 'unknown', err?.message || 'Unknown error')
        console.log('Falling back to non-AI summary due to OpenAI error')
      }
    } else {
      console.log('OpenAI key not available, using fallback summary')
    }
    
    // Generate fallback summary when OpenAI is unavailable or fails
    const fallbackSummary = generateFallbackSummary(bill, congress, type, number)
    
    // Cache the fallback summary
    summaryCache.set(billId, {
      summary: fallbackSummary,
      timestamp: Date.now(),
      fallback: true
    })
    
    return NextResponse.json({
      summary: fallbackSummary,
      fallback: true,
      billInfo
    })
  } catch (err: any) {
    // Log error but don't expose stack traces to user
    console.error('Error in summary route:', err?.message || 'Unknown error')
    return NextResponse.json(
      { error: 'Unable to generate summary at this time' },
      { status: 500 }
    )
  }
}
