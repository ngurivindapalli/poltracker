import { getBaseUrl } from "@/lib/getBaseUrl"

export async function buildContext(question: string): Promise<string> {
  const lower = question.toLowerCase()
  const context: string[] = []
  const base = getBaseUrl()

  // Bills context
  if (lower.includes("bill") || lower.includes("legislation")) {
    try {
      const res = await fetch(`${base}/api/bills`, {
        next: { revalidate: 3600 }
      })
      
      if (res.ok) {
        const data = await res.json()
        const billsList = Array.isArray(data) ? data : data.bills || []
        
        if (billsList.length > 0) {
          const billsContext = billsList
            .slice(0, 10)
            .map((b: any) => {
              const billId = b.bill_id || `${b.type || 'S'}.${b.number || ''}`
              const congress = b.congress || '118'
              const type = (b.type || 's').toLowerCase()
              const number = b.number || ''
              
              // Build proper Congress.gov link
              let typePath = type
              if (type === 's') {
                typePath = 'senate-bill'
              } else if (type === 'hr' || type === 'h') {
                typePath = 'house-bill'
              } else {
                typePath = `${type}-bill`
              }
              
              const link = `https://www.congress.gov/bill/${congress}th-congress/${typePath}/${number}`
              
              return `Bill: ${b.title || 'Untitled Bill'}
ID: ${billId}
Summary: ${b.latestAction || b.description || 'No summary available'}
Link: ${link}`
            })
            .join("\n\n")
          
          context.push(billsContext)
        }
      }
    } catch (err) {
      console.error("Error fetching bills for context:", err)
    }
  }

  // Senators and Representatives context
  if (lower.includes("senator") || lower.includes("representative") || lower.includes("congress")) {
    try {
      const [senRes, repRes] = await Promise.all([
        fetch(`${base}/api/senators`, { next: { revalidate: 3600 } }),
        fetch(`${base}/api/representatives`, { next: { revalidate: 3600 } })
      ])
      
      if (senRes.ok) {
        const senatorsData = await senRes.json()
        const senators = Array.isArray(senatorsData) ? senatorsData : senatorsData.senators || []
        
        if (senators.length > 0) {
          const senatorsContext = senators
            .slice(0, 20)
            .map((s: any) => `${s.name || 'Unknown'} (${s.party || 'Unknown'}) - ${s.state || 'Unknown'}`)
            .join("\n")
          
          context.push(`Senators:\n${senatorsContext}`)
        }
      }
      
      if (repRes.ok) {
        const repsData = await repRes.json()
        const reps = Array.isArray(repsData) ? repsData : repsData.representatives || []
        
        if (reps.length > 0) {
          const repsContext = reps
            .slice(0, 20)
            .map((r: any) => `${r.name || 'Unknown'} (${r.party || 'Unknown'}) - ${r.state || 'Unknown'} ${r.district ? `District ${r.district}` : ''}`)
            .join("\n")
          
          context.push(`Representatives:\n${repsContext}`)
        }
      }
    } catch (err) {
      console.error("Error fetching legislators for context:", err)
    }
  }

  // State news context
  if (lower.includes("news") || lower.includes("state")) {
    try {
      // Extract state from question if mentioned
      const stateMatch = question.match(/\b([A-Z]{2})\b/i)
      if (stateMatch) {
        const stateCode = stateMatch[1].toUpperCase()
        const res = await fetch(`${base}/api/state/${stateCode}/news`, {
          next: { revalidate: 900 }
        })
        
        if (res.ok) {
          const newsData = await res.json()
          const articles = newsData.articles || []
          
          if (articles.length > 0) {
            const newsContext = articles
              .slice(0, 5)
              .map((a: any) => `${a.title || 'Untitled'} - ${a.source || 'Unknown Source'}`)
              .join("\n")
            
            context.push(`State News:\n${newsContext}`)
          }
        }
      }
    } catch (err) {
      console.error("Error fetching state news for context:", err)
    }
  }

  return context.join("\n\n")
}
