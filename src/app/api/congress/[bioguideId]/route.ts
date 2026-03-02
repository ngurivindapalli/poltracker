import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { bioguideId: string } }
) {
  const API_KEY = process.env.API_DATA_GOV_KEY;
  const bioguide = params.bioguideId;

  try {
    console.log("Congress call:", bioguide);

    const sponsoredURL =
      `https://api.congress.gov/v3/member/${bioguide}/sponsored-legislation?api_key=${API_KEY}`;

    const cosponsoredURL =
      `https://api.congress.gov/v3/member/${bioguide}/cosponsored-legislation?api_key=${API_KEY}`;

    const [sRes, cRes] = await Promise.all([
      fetch(sponsoredURL, { cache: "no-store" }),
      fetch(cosponsoredURL, { cache: "no-store" })
    ]);

    const sJson = await sRes.json();
    const cJson = await cRes.json();

    console.log("Sponsored:", sJson.sponsoredLegislation?.length);
    console.log("Cosponsored:", cJson.cosponsoredLegislation?.length);

    const cleanBills = (bills: any[]) => {
      return bills
        .filter(b =>
          b &&
          b.number &&
          b.type &&
          (b.titles?.length || b.title)
        )
        .map(b => ({
          number: b.number,
          type: b.type,
          title: b.titles?.[0]?.title || b.title,
          latestAction: b.latestAction?.text || "Introduced"
        }));
    };

    return NextResponse.json({
      sponsored: cleanBills(sJson.sponsoredLegislation || []),
      cosponsored: cleanBills(cJson.cosponsoredLegislation || [])
    });

  } catch (e) {
    console.error("Congress Error:", e);

    return NextResponse.json({
      sponsored: [],
      cosponsored: []
    });
  }
}
