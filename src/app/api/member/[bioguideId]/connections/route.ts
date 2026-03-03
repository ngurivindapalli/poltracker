import { NextResponse } from "next/server"
import { fetchLDAFilings } from "@/lib/ldaService"
import { buildLobbyGraph } from "@/lib/lobbying/buildLobbyGraph"
import { fetchMember, fetchSponsoredLegislation } from "@/lib/congress"

interface MatchedFiling {
  client: string;
  issue: string;
  amount: number;
  score: number;
  matchType: string;
}

/**
 * Fetch sponsored bills for a member using the centralized Congress API helper
 */
async function fetchSponsoredBills(bioguideId: string): Promise<any[]> {
  try {
    const data = await fetchSponsoredLegislation(bioguideId, 100);
    return data?.sponsoredLegislation || [];
  } catch (e) {
    console.log("Bills fetch error:", e);
    return [];
  }
}

/**
 * Extract bill identifiers and subjects for matching
 */
function extractBillIdentifiers(bills: any[]): { billNumbers: string[]; subjects: string[]; keywords: string[] } {
  const billNumbers: string[] = [];
  const subjects: string[] = [];
  const keywords: string[] = [];

  // Common lobbying-relevant keywords
  const keywordList = [
    "defense", "military", "veterans", "agriculture", "farm", "energy",
    "health", "medicare", "medicaid", "tax", "budget", "education",
    "infrastructure", "transportation", "environment", "climate",
    "immigration", "border", "trade", "technology", "cybersecurity",
    "banking", "finance", "housing", "labor", "employment", "social security",
    "homeland", "security", "intelligence", "foreign", "appropriations",
    "telecommunications", "broadband", "internet", "privacy", "antitrust"
  ];

  for (const bill of bills) {
    // Extract bill number (e.g., "S.1234", "H.R.5678")
    if (bill.number && bill.type) {
      billNumbers.push(`${bill.type}.${bill.number}`);
      billNumbers.push(`${bill.type} ${bill.number}`);
      billNumbers.push(`${bill.type}${bill.number}`);
    }

    // Extract policy area
    if (bill.policyArea?.name) {
      subjects.push(bill.policyArea.name);
    }

    // Extract title keywords
    if (bill.title) {
      const titleLower = bill.title.toLowerCase();
      for (const kw of keywordList) {
        if (titleLower.includes(kw)) {
          keywords.push(kw);
        }
      }
    }

    // Extract latest action text keywords
    if (bill.latestAction?.text) {
      const actionLower = bill.latestAction.text.toLowerCase();
      for (const kw of keywordList) {
        if (actionLower.includes(kw)) {
          keywords.push(kw);
        }
      }
    }
  }

  // Dedupe
  return {
    billNumbers: [...new Set(billNumbers)],
    subjects: [...new Set(subjects)],
    keywords: [...new Set(keywords)]
  };
}

/**
 * Match LDA filings by bill numbers, subjects, and keywords
 */
function matchLDAByBill(
  billNumbers: string[],
  subjects: string[],
  keywords: string[],
  ldaFilings: any[]
): MatchedFiling[] {
  const matches: MatchedFiling[] = [];

  const normalize = (s: string = "") => s.toLowerCase().replace(/[^a-z0-9]/g, "");

  // Debug: log sample filing structure
  if (ldaFilings.length > 0) {
    const sample = ldaFilings[0];
    console.log("Sample LDA filing keys:", Object.keys(sample));
    console.log("Sample issue code:", sample.general_issue_code_display || sample.general_issue_code);
  }

  for (const filing of ldaFilings) {
    // Get all text from filing to search
    const specificIssue = filing.specific_issue || "";
    const issueArea = filing.general_issue_code_display || filing.general_issue_code || "";
    const activities = filing.lobbying_activities?.map((a: any) => 
      `${a.description || ""} ${a.general_issue_code_display || ""}`
    ).join(" ") || "";
    const allText = `${specificIssue} ${issueArea} ${activities}`.toLowerCase();
    const allTextNorm = normalize(allText);

    let score = 0;
    let matchType = "";

    // Direct bill number match (highest weight)
    for (const bill of billNumbers) {
      const billNorm = normalize(bill);
      if (allTextNorm.includes(billNorm) || allText.includes(bill.toLowerCase())) {
        score += 5;
        matchType = `Bill: ${bill}`;
        break;
      }
    }

    // Subject / policy area match (medium weight)
    for (const subject of subjects) {
      const subjectNorm = normalize(subject);
      if (subjectNorm.length > 3 && allTextNorm.includes(subjectNorm)) {
        score += 3;
        if (!matchType) matchType = `Policy: ${subject.slice(0, 30)}`;
      }
    }

    // Keyword match (lower weight but broader)
    for (const kw of keywords) {
      if (allText.includes(kw)) {
        score += 1;
        if (!matchType) matchType = `Keyword: ${kw}`;
      }
    }

    if (score > 0) {
      matches.push({
        client: filing.client?.name || filing.registrant?.name || "Unknown",
        amount: Number(filing.income) || Number(filing.amount) || 0,
        issue: issueArea || specificIssue.slice(0, 100),
        score,
        matchType,
      });
    }
  }

  return matches;
}

export async function GET(
  req: Request,
  { params }: { params: { bioguideId: string } }
) {
  try {
    const id = params.bioguideId

    // Fetch member name from Congress API
    let memberName = id
    try {
      const memberData = await fetchMember(id)
      const member = memberData?.member ?? memberData
      memberName = member?.directOrderName ?? member?.name ?? member?.fullName ?? id
      console.log("Senator:", memberName)
    } catch (e) {
      console.log("Could not fetch member name, using bioguideId")
    }

    // Fetch sponsored bills for this member
    const bills = await fetchSponsoredBills(id)
    console.log("Sponsored bills:", bills.length)

    // Extract bill identifiers, subjects, and keywords
    const { billNumbers, subjects, keywords } = extractBillIdentifiers(bills)
    console.log("Bill numbers:", billNumbers.slice(0, 5))
    console.log("Subjects:", subjects.slice(0, 5))
    console.log("Keywords:", keywords)

    // Fetch raw LDA filings
    const ldaFilings = await fetchLDAFilings()
    console.log("Total LDA filings:", ldaFilings.length)

    // Match filings by bill numbers, subjects, and keywords
    const matches = matchLDAByBill(billNumbers, subjects, keywords, ldaFilings)
    console.log("Matched filings:", matches.length)

    // If no bills found, return empty with reason
    if (bills.length === 0) {
      return NextResponse.json({
        nodes: [],
        edges: [],
        connections: [],
        reason: "No sponsored legislation found for this senator"
      })
    }

    // If no matches found, return empty with reason
    if (matches.length === 0) {
      return NextResponse.json({
        nodes: [],
        edges: [],
        connections: [],
        reason: "No lobbying activity matched to sponsored legislation",
        billCount: bills.length,
        subjects: subjects.slice(0, 10)
      })
    }

    // Aggregate by client and rank by score
    const aggregated = matches.reduce((acc: Record<string, any>, curr) => {
      if (!acc[curr.client]) {
        acc[curr.client] = {
          client: curr.client,
          totalAmount: 0,
          score: 0,
          issues: new Set<string>(),
          matchTypes: new Set<string>(),
          filings: 0,
        };
      }

      acc[curr.client].totalAmount += Number(curr.amount || 0);
      acc[curr.client].score += curr.score;
      acc[curr.client].issues.add(curr.issue);
      acc[curr.client].matchTypes.add(curr.matchType);
      acc[curr.client].filings += 1;

      return acc;
    }, {});

    // Convert to array and sort by score (relevance), then amount
    const ranked = Object.values(aggregated)
      .map((c: any) => ({
        id: `client-${c.client.replace(/\s+/g, '-').toLowerCase()}`,
        name: c.client,
        amount: c.totalAmount,
        score: c.score,
        issue: Array.from(c.issues).join(", "),
        matchTypes: Array.from(c.matchTypes),
        filingsCount: c.filings,
      }))
      .sort((a: any, b: any) => b.score - a.score || b.amount - a.amount)
      .slice(0, 10);

    // Build graph using ranked clients
    const graph = buildLobbyGraph(id, memberName, ranked)

    return NextResponse.json({
      nodes: graph.nodes,
      edges: graph.edges,
      connections: ranked,
      matchedCount: matches.length,
      billCount: bills.length,
      topSubjects: subjects.slice(0, 10)
    })

  } catch (e) {
    console.log("Lobby graph error", e)
    return NextResponse.json({
      nodes: [],
      edges: [],
      connections: [],
      reason: "Error processing lobbying data"
    })
  }
}
