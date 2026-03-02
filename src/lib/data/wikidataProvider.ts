/**
 * Wikidata Provider
 * Fetches family and biographical data using SPARQL queries
 */

import { FamilyMember } from '../types/senatorExtended'

// Simple in-memory LRU cache
const cache = new Map<string, { data: FamilyMember[]; timestamp: number }>()
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const MAX_CACHE_SIZE = 100

function getCacheKey(fullName: string): string {
  return `wikidata:${fullName.toLowerCase().trim()}`
}

function evictOldEntries() {
  if (cache.size <= MAX_CACHE_SIZE) return
  
  const entries = Array.from(cache.entries())
  entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
  
  // Remove oldest 10% of entries
  const toRemove = Math.floor(entries.length * 0.1)
  for (let i = 0; i < toRemove; i++) {
    cache.delete(entries[i][0])
  }
}

export async function getSenatorFamily(fullName: string): Promise<FamilyMember[]> {
  const cacheKey = getCacheKey(fullName)
  const cached = cache.get(cacheKey)
  
  // Return cached data if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data
  }

  try {
    const data = await fetchWikidataFamily(fullName)
    
    // Cache the result
    evictOldEntries()
    cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    })
    
    return data
  } catch (error) {
    console.error('Wikidata fetch error:', error)
    // Return cached data even if expired, as fallback
    if (cached) return cached.data
    return []
  }
}

async function fetchWikidataFamily(fullName: string): Promise<FamilyMember[]> {
  // Wikidata SPARQL endpoint
  const endpoint = 'https://query.wikidata.org/sparql'
  
  // Extract first and last name for better matching
  const nameParts = fullName.trim().split(/\s+/)
  const lastName = nameParts[nameParts.length - 1]
  const firstName = nameParts[0]
  
  // SPARQL query to find person and their family relationships
  const query = `
    SELECT ?person ?personLabel ?spouse ?spouseLabel ?child ?childLabel ?occupation ?occupationLabel
    WHERE {
      ?person wdt:P31 wd:Q5 .  # Is a human
      ?person ?label "${fullName}"@en .
      OPTIONAL {
        ?person wdt:P26 ?spouse .  # Spouse
      }
      OPTIONAL {
        ?person wdt:P40 ?child .  # Child
      }
      OPTIONAL {
        ?person wdt:P106 ?occupation .  # Occupation
      }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
    }
    LIMIT 10
  `

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sparql-query',
        'Accept': 'application/sparql-results+json',
        'User-Agent': 'PolTracker/1.0 (contact: dev@poltracker.app)'
      },
      body: query
    })

    if (!response.ok) {
      throw new Error(`Wikidata API error: ${response.status}`)
    }

    const data = await response.json()
    return parseWikidataResponse(data)
  } catch (error) {
    console.error('Wikidata query error:', error)
    return []
  }
}

function parseWikidataResponse(data: any): FamilyMember[] {
  const family: FamilyMember[] = []
  
  if (!data.results || !data.results.bindings) {
    return family
  }

  const bindings = data.results.bindings
  
  // Extract spouse
  const spouseBinding = bindings.find((b: any) => b.spouseLabel)
  if (spouseBinding?.spouseLabel?.value) {
    family.push({
      name: spouseBinding.spouseLabel.value,
      relation: 'spouse',
      occupation: spouseBinding.occupationLabel?.value
    })
  }

  // Extract children
  bindings.forEach((binding: any) => {
    if (binding.childLabel?.value) {
      family.push({
        name: binding.childLabel.value,
        relation: 'child'
      })
    }
  })

  return family
}
