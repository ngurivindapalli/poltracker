export type CampaignStatus = "active" | "exploratory" | "suspended" | "ended"

export interface Campaign {
  id: string
  candidateName: string
  office: string
  country: string
  region: string
  party: string
  campaignStatus: CampaignStatus
  summary: string
  keyIssues: string[]
  websiteUrl: string
  donationUrl?: string
  socialLinks?: {
    twitter?: string
    facebook?: string
    instagram?: string
  }
  lastUpdated: string
}

export const CAMPAIGNS: Campaign[] = [
  // US
  {
    id: "us-2024-trump",
    candidateName: "Donald Trump",
    office: "President",
    country: "United States",
    region: "National",
    party: "Republican",
    campaignStatus: "ended",
    summary: "Won the 2024 presidential election. Campaign focused on immigration enforcement, economic nationalism, and America First foreign policy.",
    keyIssues: ["Immigration", "Economy", "Border Security", "Trade"],
    websiteUrl: "https://www.donaldjtrump.com",
    lastUpdated: "2025-01-20",
  },
  {
    id: "us-2024-harris",
    candidateName: "Kamala Harris",
    office: "President",
    country: "United States",
    region: "National",
    party: "Democrat",
    campaignStatus: "ended",
    summary: "2024 Democratic presidential nominee. Campaign emphasized reproductive rights, democracy, and economic opportunity.",
    keyIssues: ["Reproductive Rights", "Democracy", "Healthcare", "Climate"],
    websiteUrl: "https://kamalaharris.com",
    lastUpdated: "2024-11-06",
  },
  {
    id: "us-senate-ohio-2026",
    candidateName: "Bernie Moreno",
    office: "US Senate",
    country: "United States",
    region: "Ohio",
    party: "Republican",
    campaignStatus: "active",
    summary: "Ohio Senator seeking re-election. Focuses on economic growth, manufacturing jobs, and America First trade policy.",
    keyIssues: ["Manufacturing", "Trade", "Jobs", "Energy"],
    websiteUrl: "https://bernforohio.com",
    lastUpdated: "2026-05-01",
  },
  {
    id: "us-senate-michigan-2026",
    candidateName: "Elissa Slotkin",
    office: "US Senate",
    country: "United States",
    region: "Michigan",
    party: "Democrat",
    campaignStatus: "active",
    summary: "Freshman Michigan Senator running for re-election, focusing on bipartisan solutions for workers and families.",
    keyIssues: ["Auto Industry", "Healthcare", "National Security", "Veterans"],
    websiteUrl: "https://elissaslotkin.org",
    lastUpdated: "2026-04-15",
  },
  // Canada
  {
    id: "canada-2025-carney",
    candidateName: "Mark Carney",
    office: "Prime Minister",
    country: "Canada",
    region: "National",
    party: "Liberal",
    campaignStatus: "ended",
    summary: "Won the 2025 Canadian federal election. Campaign focused on economic sovereignty, housing, and Canada-US trade relations.",
    keyIssues: ["Housing", "US-Canada Trade", "Climate", "Economy"],
    websiteUrl: "https://liberal.ca",
    lastUpdated: "2025-04-28",
  },
  {
    id: "canada-2025-poilievre",
    candidateName: "Pierre Poilievre",
    office: "Prime Minister",
    country: "Canada",
    region: "National",
    party: "Conservative",
    campaignStatus: "ended",
    summary: "Conservative leader who ran in the 2025 federal election on affordability, crime, and anti-carbon tax platforms.",
    keyIssues: ["Affordability", "Crime", "Carbon Tax", "Housing"],
    websiteUrl: "https://conservative.ca",
    lastUpdated: "2025-04-28",
  },
  {
    id: "canada-ontario-2026",
    candidateName: "Doug Ford",
    office: "Premier of Ontario",
    country: "Canada",
    region: "Ontario",
    party: "Progressive Conservative",
    campaignStatus: "active",
    summary: "Ontario Premier seeking continued majority government. Focus on infrastructure, healthcare, and affordability.",
    keyIssues: ["Infrastructure", "Healthcare", "Hydro Rates", "Manufacturing"],
    websiteUrl: "https://ontariopc.ca",
    lastUpdated: "2026-03-10",
  },
  // Europe
  {
    id: "france-2027-macron",
    candidateName: "Emmanuel Macron",
    office: "President",
    country: "France",
    region: "National",
    party: "Renaissance",
    campaignStatus: "exploratory",
    summary: "French President term ends in 2027. Observers tracking potential policy shifts and succession planning within the centrist alliance.",
    keyIssues: ["EU Leadership", "Economic Reform", "Defence", "Immigration"],
    websiteUrl: "https://en-marche.fr",
    lastUpdated: "2026-02-01",
  },
  {
    id: "germany-2025-merz",
    candidateName: "Friedrich Merz",
    office: "Chancellor",
    country: "Germany",
    region: "National",
    party: "CDU",
    campaignStatus: "ended",
    summary: "CDU leader who won the 2025 federal election and formed a coalition government as Chancellor.",
    keyIssues: ["Migration", "Economy", "Defence", "Energy"],
    websiteUrl: "https://cdu.de",
    lastUpdated: "2025-03-18",
  },
  {
    id: "spain-2027-sanchez",
    candidateName: "Pedro Sanchez",
    office: "Prime Minister",
    country: "Spain",
    region: "National",
    party: "PSOE",
    campaignStatus: "active",
    summary: "Current Spanish PM governing with a coalition. Focus on green transition, social rights, and regional tensions in Catalonia.",
    keyIssues: ["Green Economy", "Catalonia", "Housing", "Labour"],
    websiteUrl: "https://psoe.es",
    lastUpdated: "2026-01-15",
  },
  // Latin America
  {
    id: "mexico-2024-sheinbaum",
    candidateName: "Claudia Sheinbaum",
    office: "President",
    country: "Mexico",
    region: "National",
    party: "Morena",
    campaignStatus: "ended",
    summary: "Won Mexico's 2024 presidential election in a landslide. First female president of Mexico, continuing the AMLO transformation agenda.",
    keyIssues: ["Security", "Infrastructure", "Energy Sovereignty", "Social Programs"],
    websiteUrl: "https://morena.si",
    lastUpdated: "2024-10-01",
  },
  {
    id: "brazil-2026-lula",
    candidateName: "Luiz Inácio Lula da Silva",
    office: "President",
    country: "Brazil",
    region: "National",
    party: "PT (Workers' Party)",
    campaignStatus: "exploratory",
    summary: "Current Brazilian president navigating re-election prospects in 2026. Focus on social equity, Amazon protection, and Lava Jato legacy.",
    keyIssues: ["Amazon", "Poverty", "Democracy", "Economy"],
    websiteUrl: "https://lula.com.br",
    lastUpdated: "2026-01-20",
  },
  {
    id: "argentina-2027-milei",
    candidateName: "Javier Milei",
    office: "President",
    country: "Argentina",
    region: "National",
    party: "La Libertad Avanza",
    campaignStatus: "active",
    summary: "Libertarian president implementing radical economic shock therapy. Planning campaign messaging for legislative midterm gains.",
    keyIssues: ["Dollarization", "Deficit Reduction", "State Reform", "Inflation"],
    websiteUrl: "https://libertadavanza.ar",
    lastUpdated: "2026-03-05",
  },
  {
    id: "colombia-2026-petro",
    candidateName: "Gustavo Petro",
    office: "President",
    country: "Colombia",
    region: "National",
    party: "Pacto Historico",
    campaignStatus: "active",
    summary: "First left-wing president of Colombia, pushing healthcare reform, peace negotiations, and green economy transition.",
    keyIssues: ["Peace Process", "Healthcare", "Anti-Corruption", "Environment"],
    websiteUrl: "https://petro.com.co",
    lastUpdated: "2026-02-10",
  },
]
