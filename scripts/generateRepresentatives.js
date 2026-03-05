const fs = require("fs")
require("dotenv").config({ path: ".env.local" })

const CONGRESS_API_URL = "https://api.congress.gov/v3/member"
const API_KEY = process.env.API_DATA_GOV_KEY

async function generate() {
  if (!API_KEY) {
    console.error("ERROR: API_DATA_GOV_KEY not found in .env.local")
    console.error("Please add your Congress.gov API key to .env.local")
    process.exit(1)
  }

  console.log("Fetching House members from Congress.gov API...")
  
  try {
    let allMembers = []
    let offset = 0
    const limit = 250
    
    // Fetch all pages
    while (true) {
      const url = `${CONGRESS_API_URL}?limit=${limit}&offset=${offset}&api_key=${API_KEY}`
      console.log(`Fetching page: offset=${offset}, limit=${limit}`)
      
      const res = await fetch(url)
      
      if (!res.ok) {
        throw new Error(`Congress API failed: ${res.status} ${res.statusText}`)
      }
      
      const data = await res.json()
      const members = data.members || []
      
      if (members.length === 0) break
      
      allMembers = allMembers.concat(members)
      console.log(`Loaded ${members.length} members (total: ${allMembers.length})`)
      
      // If we got fewer than the limit, we've reached the end
      if (members.length < limit) break
      
      offset += limit
    }
    
    console.log(`\nTotal members loaded: ${allMembers.length}`)
    
    // Debug: log first member structure
    if (allMembers.length > 0) {
      console.log("\nSample member structure:")
      console.log(JSON.stringify(allMembers[0], null, 2).substring(0, 500))
    }
    
    // Process all members and filter for House in the mapping function
    console.log(`\nProcessing ${allMembers.length} members...`)
    
    processLegislators(allMembers)
  } catch (err) {
    console.error("Error:", err.message)
    process.exit(1)
  }
}

function processLegislators(legislators) {
  const CURRENT_YEAR = 2024
  
  const reps = legislators
    .map(member => {
      // Get terms - handle both array and item structure
      const terms = member.terms?.item || member.terms || []
      
      // Find current House term (no endYear or endYear >= current year)
      const houseTerm = terms.find(term => {
        const chamber = (term.chamber || term.chamberName || term.memberType || '').toString().toLowerCase()
        const isHouse = chamber.includes('house') || chamber.includes('representative')
        if (!isHouse) return false
        
        // Check if it's a current term (no endYear or endYear >= current year)
        const endYear = term.endYear || term.endDate
        return !endYear || (typeof endYear === 'number' && endYear >= CURRENT_YEAR)
      })
      
      // If no current House term found, skip
      if (!houseTerm) return null

      const bioguideId = member.bioguideId || member.bioguide_id || member.id
      const name = member.name || member.directOrderName || `${member.firstName || ''} ${member.lastName || ''}`.trim()

      return {
        name: name,
        bioguideId: bioguideId,
        state: houseTerm.state || member.state,
        party: houseTerm.party || houseTerm.partyName || member.partyName || member.party,
        district: houseTerm.district || member.district || "At-Large",
        imageUrl: `https://unitedstates.github.io/images/congress/225x275/${bioguideId}.jpg`
      }
    })
    .filter(rep => rep && rep.bioguideId && rep.name && rep.state)

  const output = `export interface Representative {
  bioguideId: string;
  name: string;
  state: string;
  party: string;
  district: number | string;
  imageUrl: string;
}

export const representatives: Representative[] = ${JSON.stringify(reps, null, 2)}
`

  fs.writeFileSync("src/data/representatives.ts", output)

  console.log("Generated representatives:", reps.length)
}

generate().catch(err => {
  console.error("Error:", err)
  process.exit(1)
})
