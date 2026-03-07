export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { fetchMember } from '@/lib/congress'
import { getLatestBillsForOfficial } from '@/lib/bills/latestBills'
import { buildContext } from '@/lib/ai/contextBuilder'
import OpenAI from 'openai'

type ChatRequest = {
  message: string
  bioguideId?: string
  state?: string
}

type ChatResponse = {
  answer: string
  sources?: Array<{
    type: "bill" | "profile" | "news"
    title: string
    url?: string
  }>
}

/**
 * Check if message is asking for latest bill
 */
function isLatestBillQuery(message: string): boolean {
  const lower = message.toLowerCase()
  return /(latest|newest|most recent|recent).*(bill|legislation)/i.test(lower)
}

/**
 * Format bill for direct response (without OpenAI)
 * Returns both formatted text and the bill link
 */
function formatBill(bill: any): { text: string; link: string } {
  // Parse bill ID to extract congress, type, and number
  // Format: "congress-type-number" (e.g., "118-s-1234")
  let congress = '118' // Default to current congress
  let billType = ''
  let billNumber = ''
  
  if (bill.billId) {
    const parts = bill.billId.split('-')
    if (parts.length >= 3) {
      congress = parts[0]
      billType = parts[1].toLowerCase() // 's' or 'hr'
      billNumber = parts[2]
    } else if (parts.length === 2) {
      billType = parts[0].toLowerCase()
      billNumber = parts[1]
    }
  }
  
  // Convert bill type to Congress.gov format
  // 's' -> 'senate-bill', 'hr' -> 'house-bill', 'hres' -> 'house-resolution', etc.
  let typePath = billType
  if (billType === 's') {
    typePath = 'senate-bill'
  } else if (billType === 'hr' || billType === 'h') {
    typePath = 'house-bill'
  } else if (billType === 'hres') {
    typePath = 'house-resolution'
  } else if (billType === 'sres') {
    typePath = 'senate-resolution'
  } else {
    typePath = `${billType}-bill`
  }
  
  // If we have URL from the bill, use it; otherwise construct it
  const congressLink = bill.url || 
    `https://www.congress.gov/bill/${congress}th-congress/${typePath}/${billNumber}`

  const date = bill.introducedDate 
    ? new Date(bill.introducedDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Date not available'

  // Format bill ID for display (e.g., "S.4567" or "H.R.1234")
  const displayBillId = billType && billNumber 
    ? `${billType.toUpperCase()}.${billNumber}`
    : bill.billId || 'N/A'

  let text = `The latest bill introduced by this official is:\n\n`
  text += `${displayBillId} — ${bill.title}\n\n`
  text += `Introduced: ${date}\n\n`
  
  if (bill.summary) {
    text += `Summary:\n${bill.summary}\n\n`
  } else {
    text += `This bill was introduced on ${date}.\n\n`
  }
  
  text += `Read the bill:\n${congressLink}`

  return {
    text,
    link: congressLink
  }
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

export async function POST(req: Request) {
  try {
    const body: ChatRequest = await req.json()
    const { message, bioguideId, state } = body

    if (!message || !message.trim()) {
      return NextResponse.json(
        { answer: "Please provide a message." },
        { status: 400 }
      )
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        answer: "Chat is not configured on this deployment. Please set OPENAI_API_KEY environment variable."
      })
    }

    // Special handler: "latest bill" query
    if (isLatestBillQuery(message) && bioguideId) {
      const bills = await getLatestBillsForOfficial(bioguideId, 1)
      
      if (bills.length > 0) {
        const latestBill = bills[0]
        const formattedBill = formatBill(latestBill)
        
        return NextResponse.json({
          answer: formattedBill.text,
          link: formattedBill.link,
          sources: [{
            type: "bill",
            title: latestBill.title,
            url: formattedBill.link
          }]
        })
      } else {
        return NextResponse.json({
          answer: "I couldn't find any recent bills for this official. The data may not be available yet, or the official may not have sponsored any recent legislation. Please try again later or check the official's page directly."
        })
      }
    }

    // Build RAG context from question
    const context = await buildContext(message)
    
    // Add official-specific context if bioguideId provided
    let officialContext = ''
    const sources: ChatResponse['sources'] = []
    
    if (bioguideId) {
      try {
        const memberData = await fetchMember(bioguideId)
        const member = memberData?.member ?? memberData
        
        const name = member?.directOrderName ?? member?.name ?? member?.fullName ?? "Unknown"
        const party = member?.partyName ?? member?.party ?? "Unknown"
        const memberState = member?.state ?? state ?? "Unknown"
        
        officialContext = `Current Official Context:\n- Name: ${name}\n- Party: ${party}\n- State: ${memberState}\n\n`
        
        sources.push({
          type: "profile",
          title: name
        })

        // Add latest bills for this official
        const bills = await getLatestBillsForOfficial(bioguideId, 5)
        if (bills.length > 0) {
          officialContext += `Latest Bills:\n${bills.map(b => `- ${b.title} (${b.billId})`).join('\n')}\n\n`
          bills.forEach(bill => {
            sources.push({
              type: "bill",
              title: bill.title,
              url: bill.url
            })
          })
        }
      } catch (err) {
        console.error("Error fetching member profile:", err)
      }
    }

    // Build full context
    const fullContext = officialContext + (context ? `General Context:\n${context}` : '')

    // Call OpenAI with RAG context
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are the Politeia political intelligence assistant.

Use the provided context to answer questions about:
* US legislation
* senators
* representatives
* political news

Always include bill links if available.
Never hallucinate bill IDs.
Be concise and helpful.`
        },
        {
          role: "user",
          content: `Question: ${message}\n\n${fullContext ? `Context:\n${fullContext}` : ''}`
        }
      ],
      temperature: 0.2,
      max_tokens: 500
    })

    const answer = completion.choices[0]?.message?.content || 
                   "I couldn't generate a response. Please try again."

    return NextResponse.json({
      answer,
      sources: sources.length > 0 ? sources : undefined
    })

  } catch (err: any) {
    console.error('Chat API error:', err)
    return NextResponse.json({
      answer: "An error occurred while processing your request. Please try again later."
    }, { status: 500 })
  }
}
