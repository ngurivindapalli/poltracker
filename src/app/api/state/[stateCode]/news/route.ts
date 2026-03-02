export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'

// State code to full name mapping
const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas',
  CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho',
  IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
  KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
  MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia',
  WI: 'Wisconsin', WY: 'Wyoming', DC: 'District of Columbia'
}

// State metadata with cities, counties, and institutions
const STATE_METADATA: Record<string, {
  name: string
  capital: string
  cities: string[]
  counties?: string[]
  institutions: string[]
}> = {
  MO: {
    name: 'Missouri',
    capital: 'Jefferson City',
    cities: ['St. Louis', 'Kansas City', 'Columbia', 'Springfield', 'Independence', 'Lee\'s Summit', 'O\'Fallon', 'St. Joseph', 'St. Charles', 'St. Peters'],
    counties: ['St. Louis', 'Jackson', 'St. Charles', 'St. Louis County', 'Greene', 'Clay', 'Platte', 'Jefferson', 'Boone', 'Cass'],
    institutions: [
      'Missouri legislature',
      'Missouri General Assembly',
      'Missouri Supreme Court',
      'Missouri Secretary of State',
      'Missouri House of Representatives',
      'Missouri Senate',
      'Missouri Governor',
      'Missouri Attorney General'
    ]
  },
  PA: {
    name: 'Pennsylvania',
    capital: 'Harrisburg',
    cities: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading', 'Scranton', 'Lancaster', 'York', 'State College', 'Bethlehem'],
    counties: ['Allegheny', 'Philadelphia', 'Montgomery', 'Bucks', 'Delaware', 'Chester', 'Lancaster', 'York', 'Dauphin', 'Lehigh'],
    institutions: [
      'Pennsylvania General Assembly',
      'Pennsylvania legislature',
      'Pennsylvania Supreme Court',
      'Pennsylvania Secretary of State',
      'Pennsylvania House of Representatives',
      'Pennsylvania Senate',
      'Pennsylvania Governor'
    ]
  },
  VA: {
    name: 'Virginia',
    capital: 'Richmond',
    cities: ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond', 'Newport News', 'Alexandria', 'Hampton', 'Portsmouth', 'Suffolk', 'Roanoke'],
    counties: ['Fairfax', 'Prince William', 'Loudoun', 'Chesterfield', 'Henrico', 'Arlington', 'Virginia Beach', 'Norfolk', 'Richmond', 'Alexandria'],
    institutions: [
      'Virginia General Assembly',
      'Virginia legislature',
      'Virginia Supreme Court',
      'Virginia Secretary of State',
      'Virginia House of Delegates',
      'Virginia Senate',
      'Virginia Governor'
    ]
  },
  CA: {
    name: 'California',
    capital: 'Sacramento',
    cities: ['Los Angeles', 'San Diego', 'San Jose', 'San Francisco', 'Fresno', 'Sacramento', 'Long Beach', 'Oakland', 'Bakersfield', 'Anaheim'],
    counties: ['Los Angeles', 'San Diego', 'Orange', 'Riverside', 'San Bernardino', 'Santa Clara', 'Alameda', 'Sacramento', 'Contra Costa', 'Fresno'],
    institutions: [
      'California State Legislature',
      'California legislature',
      'California Supreme Court',
      'California Secretary of State',
      'California State Assembly',
      'California State Senate',
      'California Governor'
    ]
  },
  TX: {
    name: 'Texas',
    capital: 'Austin',
    cities: ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso', 'Arlington', 'Corpus Christi', 'Plano', 'Laredo'],
    counties: ['Harris', 'Dallas', 'Tarrant', 'Bexar', 'Travis', 'Collin', 'Fort Bend', 'Montgomery', 'Williamson', 'Denton'],
    institutions: [
      'Texas Legislature',
      'Texas legislature',
      'Texas Supreme Court',
      'Texas Secretary of State',
      'Texas House of Representatives',
      'Texas Senate',
      'Texas Governor'
    ]
  },
  NY: {
    name: 'New York',
    capital: 'Albany',
    cities: ['New York', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse', 'Albany', 'New Rochelle', 'Mount Vernon', 'Schenectady', 'Utica'],
    counties: ['Kings', 'Queens', 'New York', 'Suffolk', 'Bronx', 'Nassau', 'Westchester', 'Erie', 'Monroe', 'Richmond'],
    institutions: [
      'New York State Legislature',
      'New York legislature',
      'New York Supreme Court',
      'New York Secretary of State',
      'New York State Assembly',
      'New York State Senate',
      'New York Governor'
    ]
  },
  FL: {
    name: 'Florida',
    capital: 'Tallahassee',
    cities: ['Jacksonville', 'Miami', 'Tampa', 'Orlando', 'St. Petersburg', 'Hialeah', 'Tallahassee', 'Fort Lauderdale', 'Port St. Lucie', 'Cape Coral'],
    counties: ['Miami-Dade', 'Broward', 'Palm Beach', 'Hillsborough', 'Orange', 'Pinellas', 'Duval', 'Polk', 'Brevard', 'Lee'],
    institutions: [
      'Florida Legislature',
      'Florida legislature',
      'Florida Supreme Court',
      'Florida Secretary of State',
      'Florida House of Representatives',
      'Florida Senate',
      'Florida Governor'
    ]
  },
  IL: {
    name: 'Illinois',
    capital: 'Springfield',
    cities: ['Chicago', 'Aurora', 'Naperville', 'Joliet', 'Rockford', 'Elgin', 'Springfield', 'Peoria', 'Champaign', 'Waukegan'],
    counties: ['Cook', 'DuPage', 'Lake', 'Will', 'Kane', 'McHenry', 'Winnebago', 'Madison', 'St. Clair', 'Sangamon'],
    institutions: [
      'Illinois General Assembly',
      'Illinois legislature',
      'Illinois Supreme Court',
      'Illinois Secretary of State',
      'Illinois House of Representatives',
      'Illinois Senate',
      'Illinois Governor'
    ]
  },
  OH: {
    name: 'Ohio',
    capital: 'Columbus',
    cities: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton', 'Parma', 'Canton', 'Youngstown', 'Lorain'],
    counties: ['Cuyahoga', 'Franklin', 'Hamilton', 'Summit', 'Montgomery', 'Lucas', 'Stark', 'Butler', 'Lorain', 'Mahoning'],
    institutions: [
      'Ohio General Assembly',
      'Ohio legislature',
      'Ohio Supreme Court',
      'Ohio Secretary of State',
      'Ohio House of Representatives',
      'Ohio Senate',
      'Ohio Governor'
    ]
  },
  GA: {
    name: 'Georgia',
    capital: 'Atlanta',
    cities: ['Atlanta', 'Augusta', 'Columbus', 'Savannah', 'Athens', 'Sandy Springs', 'Roswell', 'Macon', 'Johns Creek', 'Albany'],
    counties: ['Fulton', 'Gwinnett', 'Cobb', 'DeKalb', 'Clayton', 'Chatham', 'Cherokee', 'Forsyth', 'Henry', 'Richmond'],
    institutions: [
      'Georgia General Assembly',
      'Georgia legislature',
      'Georgia Supreme Court',
      'Georgia Secretary of State',
      'Georgia House of Representatives',
      'Georgia Senate',
      'Georgia Governor'
    ]
  },
  NC: {
    name: 'North Carolina',
    capital: 'Raleigh',
    cities: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem', 'Fayetteville', 'Cary', 'Wilmington', 'High Point', 'Concord'],
    counties: ['Mecklenburg', 'Wake', 'Guilford', 'Forsyth', 'Cumberland', 'Durham', 'Buncombe', 'Gaston', 'Union', 'Cabarrus'],
    institutions: [
      'North Carolina General Assembly',
      'North Carolina legislature',
      'North Carolina Supreme Court',
      'North Carolina Secretary of State',
      'North Carolina House of Representatives',
      'North Carolina Senate',
      'North Carolina Governor'
    ]
  },
  MI: {
    name: 'Michigan',
    capital: 'Lansing',
    cities: ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Lansing', 'Ann Arbor', 'Flint', 'Dearborn', 'Livonia', 'Troy'],
    counties: ['Wayne', 'Oakland', 'Macomb', 'Kent', 'Genesee', 'Washtenaw', 'Ingham', 'Ottawa', 'Kalamazoo', 'Saginaw'],
    institutions: [
      'Michigan Legislature',
      'Michigan legislature',
      'Michigan Supreme Court',
      'Michigan Secretary of State',
      'Michigan House of Representatives',
      'Michigan Senate',
      'Michigan Governor'
    ]
  }
}

// Blocked terms that indicate non-state-owned content
const BLOCKED_TERMS = [
  'virginia',
  'california',
  'new york',
  'texas',
  'florida',
  'pennsylvania',
  'illinois',
  'ohio',
  'georgia',
  'north carolina',
  'michigan',
  'missouri',
  'supreme court of the united states',
  'u.s. house',
  'u.s. senate',
  'white house',
  'congress',
  'capitol hill',
  'washington d.c.',
  'washington dc'
]

// Major news sources allowlist
const MAJOR_NEWS_SOURCES = [
  'reuters', 'associated-press', 'bbc-news', 'cnn', 'fox-news',
  'nbc-news', 'abc-news', 'cbs-news', 'the-new-york-times',
  'the-washington-post', 'the-wall-street-journal', 'politico',
  'axios', 'bloomberg', 'usa-today', 'al-jazeera-english', 'the-guardian-uk'
]

// In-memory cache: Map<cacheKey, { timestamp: number; data: any }>
const cache = new Map<string, { timestamp: number; data: any }>()
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

/**
 * HARD OWNERSHIP SCORING
 * Calculates how strongly an article belongs to a state
 * Returns score (must be ≥ 3 to be accepted)
 */
function calculateStateOwnership(article: any, meta: { name: string; capital: string; cities: string[]; counties?: string[]; institutions: string[] }): number {
  const text = `${article.title || ''} ${article.description || ''}`.toLowerCase()
  let score = 0
  
  // State name (count occurrences, max 2 points)
  const stateNameLower = meta.name.toLowerCase()
  const stateNameMatches = (text.match(new RegExp(stateNameLower, 'g')) || []).length
  if (stateNameMatches >= 2) {
    score += 2
  } else if (stateNameMatches === 1) {
    score += 1
  }
  
  // State capital (2 points)
  if (text.includes(meta.capital.toLowerCase())) {
    score += 2
  }
  
  // Cities (1 point each, max 3 points)
  let cityMatches = 0
  for (const city of meta.cities) {
    if (text.includes(city.toLowerCase())) {
      cityMatches++
      if (cityMatches <= 3) {
        score += 1
      }
    }
  }
  
  // Counties (1 point each, max 2 points)
  if (meta.counties) {
    let countyMatches = 0
    for (const county of meta.counties) {
      if (text.includes(county.toLowerCase())) {
        countyMatches++
        if (countyMatches <= 2) {
          score += 1
        }
      }
    }
  }
  
  // Institutions (2 points each, max 4 points)
  let institutionMatches = 0
  for (const inst of meta.institutions) {
    if (text.includes(inst.toLowerCase())) {
      institutionMatches++
      if (institutionMatches <= 2) {
        score += 2
      }
    }
  }
  
  return score
}

/**
 * Check if article should be blocked
 * Blocks if contains blocked terms UNLESS ownership score is high (≥ 5)
 */
function shouldBlockArticle(article: any, ownershipScore: number, stateName: string): boolean {
  if (ownershipScore >= 5) {
    // High ownership score allows even if blocked terms appear
    return false
  }
  
  const text = `${article.title || ''} ${article.description || ''}`.toLowerCase()
  const stateNameLower = stateName.toLowerCase()
  
  // Check blocked terms, but exclude the current state
  for (const blockedTerm of BLOCKED_TERMS) {
    if (blockedTerm === stateNameLower) continue // Skip current state
    
    if (text.includes(blockedTerm)) {
      return true // Block if contains other state or national terms
    }
  }
  
  return false
}

/**
 * Fetch news with local-focused queries
 * Uses state-specific institutions and locations
 */
async function fetchNewsWithLocalQueries(
  stateName: string,
  stateCode: string,
  scope: string,
  locationValue?: string
): Promise<any[]> {
  if (!process.env.NEWS_API_KEY) {
    return []
  }
  
  const stateMeta = STATE_METADATA[stateCode] || {
    name: stateName,
    capital: '',
    cities: [],
    institutions: []
  }
  
  const queries: string[] = []
  
  if (scope === 'state') {
    // Local-focused state queries (NOT broad "politics" or "election")
    queries.push(`${stateMeta.institutions[0] || stateName + ' General Assembly'}`)
    queries.push(`${stateName} state legislature`)
    queries.push(`${stateName} ballot initiative`)
    queries.push(`${stateMeta.capital} legislation`)
    
    // Add city-specific queries for major cities
    for (const city of stateMeta.cities.slice(0, 2)) {
      queries.push(`${city} county government`)
    }
    
    // Add county-specific queries
    if (stateMeta.counties) {
      for (const county of stateMeta.counties.slice(0, 2)) {
        queries.push(`${county} County election`)
      }
    }
  } else if (scope === 'county' && locationValue) {
    queries.push(`${locationValue} County local government`)
    queries.push(`${locationValue} County commissioners`)
    queries.push(`${locationValue} County zoning`)
    queries.push(`${locationValue} County election`)
  } else if (scope === 'city' && locationValue) {
    queries.push(`${locationValue} local government`)
    queries.push(`${locationValue} city council`)
    queries.push(`${locationValue} school board`)
    queries.push(`${locationValue} municipal`)
  }
  
  const allArticles: any[] = []
  const seenUrls = new Set<string>()
  
  // Fetch all queries in parallel
  const fetchPromises = queries.map(async (query) => {
    const encodedQuery = encodeURIComponent(query)
    const sourcesParam = `&sources=${MAJOR_NEWS_SOURCES.join(',')}`
    const newsApiUrl = `https://newsapi.org/v2/everything?q=${encodedQuery}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${process.env.NEWS_API_KEY}${sourcesParam}`
    
    try {
      const response = await fetch(newsApiUrl, {
        headers: { 'User-Agent': 'PolTracker/1.0' }
      })
      
      if (!response.ok) return []
      
      const data = await response.json()
      return (data.articles || []).filter((article: any) => {
        // Basic filtering
        const url = (article.url || '').toLowerCase()
        if (url.includes('opinion') || url.includes('/blog')) return false
        if (!article.title || !article.title.trim()) return false
        
        const sourceId = (article.source?.id || article.source?.name || '').toLowerCase().replace(/\s+/g, '-')
        if (!MAJOR_NEWS_SOURCES.includes(sourceId)) return false
        
        // Deduplicate by URL
        if (seenUrls.has(article.url)) return false
        seenUrls.add(article.url)
        
        return true
      })
    } catch (err) {
      console.error(`Error fetching query "${query}":`, err)
      return []
    }
  })
  
  const results = await Promise.all(fetchPromises)
  
  // Merge all articles
  for (const articles of results) {
    allArticles.push(...articles)
  }
  
  return allArticles
}

/**
 * Extract keywords (STRICT - only state-specific)
 * Only allows keywords that include state name, cities, counties, or institutions
 */
function extractKeywords(articles: any[], stateName: string, stateCode: string, locationValue?: string): string[] {
  const keywordCounts = new Map<string, number>()
  const allText = articles.map(a => `${a.title} ${a.summary}`).join(' ').toLowerCase()
  
  const stateMeta = STATE_METADATA[stateCode]
  if (!stateMeta) return []
  
  const stateNameLower = stateName.toLowerCase()
  
  // Only allow state-specific keywords
  // Cities
  for (const city of stateMeta.cities) {
    const cityLower = city.toLowerCase()
    if (allText.includes(cityLower)) {
      keywordCounts.set(city, 15)
    }
  }
  
  // Counties
  if (stateMeta.counties) {
    for (const county of stateMeta.counties) {
      const countyLower = county.toLowerCase()
      if (allText.includes(countyLower)) {
        keywordCounts.set(`${county} County`, 12)
      }
    }
  }
  
  // Institutions (must include state name)
  for (const inst of stateMeta.institutions) {
    const instLower = inst.toLowerCase()
    if (allText.includes(instLower)) {
      // Extract just the key part (e.g., "General Assembly" from "Missouri General Assembly")
      const keyPart = inst.replace(new RegExp(stateName, 'gi'), '').trim()
      if (keyPart) {
        keywordCounts.set(`${stateName} ${keyPart}`, 10)
      }
    }
  }
  
  // Location-specific terms (if location selected)
  if (locationValue) {
    const locationLower = locationValue.toLowerCase()
    if (allText.includes(locationLower)) {
      keywordCounts.set(locationValue, 20)
    }
  }
  
  // Local office terms (only if state context is clear)
  const localTerms = [
    'city council',
    'county commissioners',
    'school board',
    'zoning board',
    'municipal',
    'local government'
  ]
  
  for (const term of localTerms) {
    if (allText.includes(term) && allText.includes(stateNameLower)) {
      const count = (allText.match(new RegExp(term, 'gi')) || []).length
      keywordCounts.set(`${stateName} ${term}`, (keywordCounts.get(`${stateName} ${term}`) || 0) + count * 3)
    }
  }
  
  // Sort by frequency and return top 5-7
  const sorted = Array.from(keywordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([keyword]) => keyword)
  
  return sorted
}

/**
 * Generate state-anchored summary
 * Must explicitly mention state institutions, cities, or counties
 * If references another state → discard
 */
function generateSummary(articles: any[], stateName: string, stateCode: string, scope: string, locationValue?: string): string {
  if (articles.length === 0) {
    return ''
  }
  
  const stateMeta = STATE_METADATA[stateCode]
  if (!stateMeta) {
    return ''
  }
  
  let location = stateName
  
  if (scope === 'county' && locationValue) {
    location = `${locationValue} County`
  } else if (scope === 'city' && locationValue) {
    location = locationValue
  }
  
  // Extract state-specific themes
  const themes: string[] = []
  const seenThemes = new Set<string>()
  const mentionedCities: string[] = []
  const mentionedInstitutions: string[] = []
  
  for (const article of articles.slice(0, 3)) {
    const title = (article.title || '').toLowerCase()
    const summary = (article.summary || '').toLowerCase()
    const combined = `${title} ${summary}`
    
    // Check for state institutions
    for (const inst of stateMeta.institutions) {
      if (combined.includes(inst.toLowerCase()) && !mentionedInstitutions.includes(inst)) {
        mentionedInstitutions.push(inst)
      }
    }
    
    // Check for cities
    for (const city of stateMeta.cities) {
      if (combined.includes(city.toLowerCase()) && !mentionedCities.includes(city)) {
        mentionedCities.push(city)
      }
    }
    
    // Extract themes only if state context is clear
    if (combined.includes(stateName.toLowerCase())) {
      if (combined.includes('legislature') && !seenThemes.has('legislature')) {
        themes.push('legislative activity')
        seenThemes.add('legislature')
      }
      if (combined.includes('election') && !seenThemes.has('election')) {
        themes.push('election administration')
        seenThemes.add('election')
      }
      if (combined.includes('budget') && !seenThemes.has('budget')) {
        themes.push('budget matters')
        seenThemes.add('budget')
      }
    }
  }
  
  // Build state-anchored summary
  if (mentionedInstitutions.length > 0 || mentionedCities.length > 0) {
    const instText = mentionedInstitutions.length > 0 ? mentionedInstitutions[0] : ''
    const cityText = mentionedCities.length > 0 ? mentionedCities.slice(0, 2).join(' and ') : ''
    
    let summary = `Recent political developments in ${location}`
    
    if (instText) {
      summary += ` center on activity in ${instText}`
    }
    
    if (cityText) {
      if (instText) {
        summary += ` and local election administration across ${cityText}`
      } else {
        summary += ` focus on local developments in ${cityText}`
      }
    }
    
    if (themes.length > 0) {
      summary += `. Key areas include ${themes.slice(0, 2).join(' and ')}.`
    } else {
      summary += '.'
    }
    
    return summary
  }
  
  // Fallback if no specific institutions/cities found
  if (themes.length > 0) {
    return `Recent political activity in ${location} focuses on ${themes.slice(0, 2).join(' and ')}. These developments reflect ongoing state-level governance and policy discussions that impact residents and local communities.`
  }
  
  return `Recent political developments in ${location} are being covered by major news sources. Key state-level issues and legislative activities are shaping the political landscape.`
}

/**
 * State Political News API Route
 * Implements strict ownership scoring and filtering
 */
export async function GET(
  req: Request,
  { params }: { params: { stateCode: string } }
) {
  try {
    const stateCode = params.stateCode.toUpperCase()
    
    // Parse query params
    const url = new URL(req.url)
    const scope = url.searchParams.get('scope') || 'state'
    const locationValue = url.searchParams.get('value') || undefined
    
    // Build cache key
    const cacheKey = `${stateCode}:${scope}:${locationValue || 'statewide'}`
    
    // Check cache first
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data)
    }
    
    // Check for API key
    if (!process.env.NEWS_API_KEY) {
      console.error('NEWS_API_KEY missing for state news')
      return NextResponse.json({ articles: [], summary: '', keywords: [] })
    }
    
    const stateName = STATE_NAMES[stateCode] || stateCode
    const stateMeta = STATE_METADATA[stateCode] || {
      name: stateName,
      capital: '',
      cities: [],
      institutions: []
    }
    
    // Fetch news with local-focused queries
    const allArticles = await fetchNewsWithLocalQueries(stateName, stateCode, scope, locationValue)
    
    // Apply strict ownership scoring and filtering
    const filteredArticles = allArticles.filter((article: any) => {
      // Calculate ownership score
      const ownershipScore = calculateStateOwnership(article, stateMeta)
      
      // ACCEPTANCE RULE: Must score ≥ 3
      if (ownershipScore < 3) {
        return false
      }
      
      // Check blocked terms (unless high ownership score)
      if (shouldBlockArticle(article, ownershipScore, stateName)) {
        return false
      }
      
      return true
    })
    
    // Limit to 10 articles and format
    const uniqueArticles = filteredArticles.slice(0, 10).map((article: any) => ({
      title: article.title || '',
      summary: article.description || '',
      source: article.source?.name || article.source || '',
      url: article.url || '',
      publishedAt: article.publishedAt || ''
    }))
    
    // Generate summary and keywords
    const summary = generateSummary(uniqueArticles, stateName, stateCode, scope, locationValue)
    const keywords = extractKeywords(uniqueArticles, stateName, stateCode, locationValue)
    
    const result = {
      articles: uniqueArticles,
      summary,
      keywords
    }
    
    // Cache the results
    cache.set(cacheKey, {
      timestamp: Date.now(),
      data: result
    })
    
    return NextResponse.json(result)
  } catch (err) {
    // Always return empty on any error
    console.error('Error in state news route:', err)
    return NextResponse.json({ articles: [], summary: '', keywords: [] })
  }
}
