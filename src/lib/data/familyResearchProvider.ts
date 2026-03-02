/**
 * Family Research Provider
 * Fetches structured professional data for family members from Wikidata
 */

export interface Organization {
  name: string
  role: string
  type: 'corporate' | 'ngo' | 'government' | 'law firm' | 'investment' | 'consulting'
}

export interface FamilyResearchMember {
  id: string
  name: string
  relation: string
  occupation?: string
  organizations: Organization[]
  hasWikipediaPage?: boolean
}

/**
 * Check if a person is prominent based on professional roles
 */
export function isProminent(person: FamilyResearchMember): boolean {
  // Check for Wikipedia page (would need to be set during data fetch)
  if (person.hasWikipediaPage === true) {
    return true
  }

  // Check for prominent role types
  return person.organizations.some(org =>
    org.type === 'corporate' ||
    org.type === 'government' ||
    org.type === 'investment' ||
    (org.role.toLowerCase().includes('board') || 
     org.role.toLowerCase().includes('director') ||
     org.role.toLowerCase().includes('executive') ||
     org.role.toLowerCase().includes('ceo') ||
     org.role.toLowerCase().includes('president'))
  )
}

/**
 * Get family research profile from Wikidata
 */
export async function getFamilyResearchProfile(fullName: string): Promise<FamilyResearchMember[]> {
  try {
    // Query Wikidata for the senator first to get their QID
    const senatorQuery = `
      SELECT ?person ?personLabel WHERE {
        ?person wdt:P31 wd:Q5.
        ?person rdfs:label "${fullName}"@en.
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }
      LIMIT 1
    `

    const senatorResponse = await fetch('https://query.wikidata.org/sparql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'PolTracker/1.0 (research tool)'
      },
      body: new URLSearchParams({
        query: senatorQuery,
        format: 'json'
      })
    })

    if (!senatorResponse.ok) {
      console.error('Wikidata query failed:', senatorResponse.status)
      return []
    }

    const senatorData = await senatorResponse.json()
    const bindings = senatorData.results?.bindings || []
    
    if (bindings.length === 0) {
      return []
    }

    const senatorQid = bindings[0].person?.value?.split('/').pop()
    if (!senatorQid) {
      return []
    }

    // Query for family members and their professional roles
    const familyQuery = `
      SELECT DISTINCT ?person ?personLabel ?relation ?relationLabel ?occupation ?occupationLabel 
             ?org ?orgLabel ?role ?roleLabel WHERE {
        {
          # Spouse
          wd:${senatorQid} wdt:P26 ?person.
          BIND("spouse" AS ?relation)
        } UNION {
          # Children
          wd:${senatorQid} wdt:P40 ?person.
          BIND("child" AS ?relation)
        }
        
        # Get occupation
        OPTIONAL { ?person wdt:P106 ?occupation. }
        
        # Get employer/board positions
        OPTIONAL {
          ?person p:P108 ?employerStatement.
          ?employerStatement ps:P108 ?org.
          OPTIONAL { ?employerStatement pq:P2868 ?role. }
        }
        OPTIONAL {
          ?person p:P3320 ?boardStatement.
          ?boardStatement ps:P3320 ?org.
          OPTIONAL { ?boardStatement pq:P2868 ?role. }
        }
        
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }
      LIMIT 50
    `

    const familyResponse = await fetch('https://query.wikidata.org/sparql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'PolTracker/1.0 (research tool)'
      },
      body: new URLSearchParams({
        query: familyQuery,
        format: 'json'
      })
    })

    if (!familyResponse.ok) {
      console.error('Wikidata family query failed:', familyResponse.status)
      return []
    }

    const familyData = await familyResponse.json()
    const familyBindings = familyData.results?.bindings || []

    // Group by person and collect organizations
    const personMap = new Map<string, {
      id: string
      name: string
      relation: string
      occupation?: string
      organizations: Organization[]
    }>()

    for (const binding of familyBindings) {
      const personId = binding.person?.value?.split('/').pop() || ''
      const personName = binding.personLabel?.value || ''
      const relation = binding.relation?.value || 'other'
      const occupation = binding.occupationLabel?.value || binding.occupation?.value || undefined
      const orgName = binding.orgLabel?.value || binding.org?.value || ''
      const role = binding.roleLabel?.value || binding.role?.value || 'Member'

      if (!personName || !personId) continue

      if (!personMap.has(personId)) {
        personMap.set(personId, {
          id: personId,
          name: personName,
          relation,
          occupation,
          organizations: []
        })
      }

      const person = personMap.get(personId)!
      
      // Add organization if it exists and is relevant
      if (orgName && orgName !== personName) {
        // Determine organization type
        const orgType = determineOrganizationType(orgName, role)
        
        // Only include if it's a professional role
        if (isProfessionalRole(orgType)) {
          // Check for duplicates
          const existing = person.organizations.find(
            o => o.name === orgName && o.role === role
          )
          
          if (!existing) {
            person.organizations.push({
              name: orgName,
              role,
              type: orgType
            })
          }
        }
      }
    }

    // Filter to only include people with professional roles
    const results = Array.from(personMap.values())
      .filter(person => person.organizations.length > 0 || person.occupation)
      .map(person => ({
        ...person,
        id: `family-${person.id}`
      }))

    return results
  } catch (error) {
    console.error('Error fetching family research profile:', error)
    return []
  }
}

/**
 * Determine organization type from name and role
 */
function determineOrganizationType(orgName: string, role: string): Organization['type'] {
  const nameLower = orgName.toLowerCase()
  const roleLower = role.toLowerCase()

  // Check for board positions
  if (roleLower.includes('board') || roleLower.includes('director') || roleLower.includes('trustee')) {
    // Could be corporate, NGO, or investment
    if (nameLower.includes('fund') || nameLower.includes('capital') || nameLower.includes('investment') || nameLower.includes('equity')) {
      return 'investment'
    }
    if (nameLower.includes('foundation') || nameLower.includes('charity') || nameLower.includes('non-profit')) {
      return 'ngo'
    }
    return 'corporate'
  }

  // Law firms
  if (nameLower.includes('law') || nameLower.includes('legal') || nameLower.includes('attorney') || nameLower.includes('counsel')) {
    return 'law firm'
  }

  // Government
  if (nameLower.includes('government') || nameLower.includes('department') || nameLower.includes('agency') || 
      nameLower.includes('federal') || nameLower.includes('state') || nameLower.includes('city')) {
    return 'government'
  }

  // Investment firms
  if (nameLower.includes('fund') || nameLower.includes('capital') || nameLower.includes('investment') || 
      nameLower.includes('equity') || nameLower.includes('venture')) {
    return 'investment'
  }

  // Consulting
  if (nameLower.includes('consulting') || nameLower.includes('advisory') || nameLower.includes('strategy')) {
    return 'consulting'
  }

  // NGOs
  if (nameLower.includes('foundation') || nameLower.includes('charity') || nameLower.includes('non-profit') || 
      nameLower.includes('institute') || nameLower.includes('society')) {
    return 'ngo'
  }

  // Default to corporate
  return 'corporate'
}

/**
 * Check if organization type is professional/relevant
 */
function isProfessionalRole(type: Organization['type']): boolean {
  return ['corporate', 'ngo', 'government', 'law firm', 'investment', 'consulting'].includes(type)
}
