import { getBaseUrl } from '../getBaseUrl'

export async function loadInvestments() {
  try {
    const baseUrl = getBaseUrl()
    const res = await fetch(`${baseUrl}/data/trades.csv`, {
      cache: 'no-store'
    })
    
    if (!res.ok) {
      console.log("Investment data file not available")
      return []
    }
    
    const csv = await res.text()

    // Check if file contains error
    if (csv.includes("404") || csv.includes("Not Found")) {
      console.log("Investment data file not available")
      return []
    }

    const rows = csv.split("\n").slice(1)

    const investments = rows
      .filter(r => r.trim() && !r.includes("404"))
      .map(r => {
        // Handle CSV with quoted fields - more robust parsing
        const parts: string[] = []
        let current = ""
        let inQuotes = false

        for (let i = 0; i < r.length; i++) {
          const char = r[i]
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === ',' && !inQuotes) {
            parts.push(current.trim())
            current = ""
          } else {
            current += char
          }
        }
        parts.push(current.trim())

        // Map columns - adjust indices based on actual CSV structure
        // Expected: [index, senator, ticker, date, type, amount, ...]
        return {
          senator: parts[1] || "",
          ticker: parts[2] || "",
          amount: parts[5] || "0",
          date: parts[3] || ""
        }
      })
      .filter(i => i.senator && i.ticker) // Only return valid entries
    
    console.log('Loaded Trades:', investments.length)
    return investments
  } catch (error) {
    console.error('Error loading investments:', error)
    return []
  }
}
