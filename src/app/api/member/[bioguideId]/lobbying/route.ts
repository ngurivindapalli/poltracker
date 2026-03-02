import { NextResponse } from "next/server";
import { fetchMember } from "@/lib/congress";

export async function GET(
  req: Request,
  { params }: { params: { bioguideId: string } }
) {
  const bioguideId = params.bioguideId;

  try {
    // Fetch senator info from Congress API
    const memberData = await fetchMember(bioguideId);
    const member = memberData?.member ?? memberData;

    if (!member) {
      return NextResponse.json({
        total: 0,
        filings: 0
      });
    }

    // Extract last name for better LDA search results
    const fullName = member?.directOrderName ?? member?.name ?? member?.fullName ?? "";
    // Parse last name (format is usually "LastName, FirstName")
    const lastName = fullName.includes(",") 
      ? fullName.split(",")[0].trim()
      : fullName.split(" ").pop() || fullName;

    const LDA_KEY = process.env.LDA_API_KEY;

    if (!LDA_KEY) {
      console.log("LDA_API_KEY not configured");
      return NextResponse.json({
        senator: fullName,
        totalLobbying: 0,
        filings: 0
      });
    }

    // Paginate through LDA results (max 5 pages)
    let total = 0;
    let page = 1;
    let results: any[] = [];
    let totalCount = 0;

    while (page <= 5) {
      const url =
        `https://lda.senate.gov/api/v1/filings/` +
        `?senator_name=${encodeURIComponent(lastName)}` +
        `&page=${page}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Token ${LDA_KEY}`
        },
        next: { revalidate: 86400 }
      });

      if (!res.ok) {
        console.log("LDA API error:", res.status);
        break;
      }

      const data = await res.json();

      if (page === 1) {
        totalCount = data.count || 0;
      }

      if (!data.results?.length) break;

      results.push(...data.results);
      page++;
    }

    // Calculate total lobbying amounts
    for (const filing of results) {
      total += Number(filing.income || 0);
      total += Number(filing.expenses || 0);
    }

    return NextResponse.json({
      senator: fullName,
      totalLobbying: total,
      filings: totalCount,
      recentFilings: results.slice(0, 10).map((f: any) => ({
        registrant: f.registrant_name,
        client: f.client_name,
        income: f.income,
        expenses: f.expenses,
        filingDate: f.dt_posted
      }))
    });

  } catch (e) {
    console.error("Lobbying API error:", e);
    return NextResponse.json({
      total: 0,
      filings: 0
    });
  }
}
