export interface CanadaParty {
  name: string
  abbreviation: string
  ideology: string
  leader: string
  seats?: number
}

export interface CanadaProvince {
  name: string
  slug: string
  capital: string
  premier?: string
  governingParty?: string
  type: "province" | "territory"
}

export const CANADA_FEDERAL = {
  primeMinister: "Mark Carney",
  governorGeneral: "Mary Simon",
  parliamentName: "Parliament of Canada",
  senate: "Senate of Canada",
  houseOfCommons: "House of Commons",
  electionSystem: "First-past-the-post (single-member districts)",
  lastElection: "April 2025",
  nextElection: "By April 2030",
  governmentUrl: "https://www.canada.ca",
  constitutionYear: 1867,
  governmentType: "Federal Parliamentary Constitutional Monarchy",
}

export const CANADA_PARTIES: CanadaParty[] = [
  {
    name: "Liberal Party of Canada",
    abbreviation: "LPC",
    ideology: "Liberal, Progressive",
    leader: "Mark Carney",
    seats: 168,
  },
  {
    name: "Conservative Party of Canada",
    abbreviation: "CPC",
    ideology: "Conservative, Fiscal Conservative",
    leader: "Pierre Poilievre",
    seats: 144,
  },
  {
    name: "New Democratic Party",
    abbreviation: "NDP",
    ideology: "Social Democratic",
    leader: "Jagmeet Singh",
    seats: 24,
  },
  {
    name: "Bloc Québécois",
    abbreviation: "BQ",
    ideology: "Quebec Nationalism, Social Democracy",
    leader: "Yves-François Blanchet",
    seats: 22,
  },
  {
    name: "Green Party of Canada",
    abbreviation: "GPC",
    ideology: "Green Politics, Progressivism",
    leader: "Elizabeth May",
    seats: 1,
  },
]

export const CANADA_PROVINCES: CanadaProvince[] = [
  { name: "Ontario", slug: "ontario", capital: "Toronto", premier: "Doug Ford", governingParty: "Progressive Conservative", type: "province" },
  { name: "Quebec", slug: "quebec", capital: "Quebec City", premier: "François Legault", governingParty: "Coalition Avenir Québec", type: "province" },
  { name: "British Columbia", slug: "british-columbia", capital: "Victoria", premier: "David Eby", governingParty: "BC NDP", type: "province" },
  { name: "Alberta", slug: "alberta", capital: "Edmonton", premier: "Danielle Smith", governingParty: "United Conservative Party", type: "province" },
  { name: "Manitoba", slug: "manitoba", capital: "Winnipeg", premier: "Wab Kinew", governingParty: "NDP", type: "province" },
  { name: "Saskatchewan", slug: "saskatchewan", capital: "Regina", premier: "Scott Moe", governingParty: "Saskatchewan Party", type: "province" },
  { name: "Nova Scotia", slug: "nova-scotia", capital: "Halifax", premier: "Tim Houston", governingParty: "Progressive Conservative", type: "province" },
  { name: "New Brunswick", slug: "new-brunswick", capital: "Fredericton", premier: "Susan Holt", governingParty: "Liberal", type: "province" },
  { name: "Newfoundland and Labrador", slug: "newfoundland-labrador", capital: "St. John's", premier: "Andrew Furey", governingParty: "Liberal", type: "province" },
  { name: "Prince Edward Island", slug: "pei", capital: "Charlottetown", premier: "Dennis King", governingParty: "Progressive Conservative", type: "province" },
  { name: "Northwest Territories", slug: "northwest-territories", capital: "Yellowknife", type: "territory" },
  { name: "Yukon", slug: "yukon", capital: "Whitehorse", premier: "Ranj Pillai", governingParty: "Liberal", type: "territory" },
  { name: "Nunavut", slug: "nunavut", capital: "Iqaluit", type: "territory" },
]
