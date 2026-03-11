import OpenAI from "openai"
import { NextResponse } from "next/server"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const systemPrompt = `
You are an assistant for a political intelligence website.

Answer using the website data provided.

RULES:

Use clean readable formatting.

Never use markdown symbols like ** or ###.

Use this format:

Politician:
Tammy Baldwin

Latest Bill:
RARE Act

Bill Number:
S 3716

Status:
In Committee

Introduced:
2026

Link:
Congress.gov URL

Keep answers concise and structured.
`

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    const lastMessage = messages[messages.length - 1]?.content || ""

    // Fetch all context data from single endpoint
    let context = ""
    
    try {
      const { getBaseUrl } = await import('@/lib/getBaseUrl')
      const base = getBaseUrl()
      const contextRes = await fetch(`${base}/api/context`, { cache: 'no-store' })
      if (contextRes.ok) {
        const data = await contextRes.json()
        
        context = `\nSENATORS:\n${JSON.stringify(data.senators?.slice(0, 20) || [], null, 2)}\n`
        context += `\nBILLS:\n${JSON.stringify(data.bills?.slice(0, 20) || [], null, 2)}\n`
        context += `\nGERMAN MEMBERS:\n${JSON.stringify(data.germany?.slice(0, 10) || [], null, 2)}\n`
        context += `\nUK NEWS:\n${JSON.stringify(data.ukNews?.slice(0, 10) || [], null, 2)}\n`
      }
    } catch (error) {
      console.error('Error fetching context:', error)
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `${systemPrompt}

SITE DATA:

${context}
`
        },
        ...messages
      ]
    })

    let text = completion.choices[0].message.content || ""

    // Clean output formatting
    const clean = text
      .replace(/\*\*/g, "")
      .replace(/###/g, "")
      .replace(/#{1,6}\s/g, "")
      .replace(/\n{3,}/g, "\n\n")

    return NextResponse.json({
      reply: clean
    })
  } catch (error) {
    console.error("AI API error:", error)
    return NextResponse.json(
      { reply: "Sorry, I'm having trouble processing your request. Please try again." },
      { status: 500 }
    )
  }
}
