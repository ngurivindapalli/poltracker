import { NextResponse } from 'next/server'
import members from '../../../../../../data/bundestag-cache.json'

// Demo bills data for Bundestag members
const DEMO_BILLS: Record<string, any[]> = {
  scholz: [
    {
      title: "Energy Transition Reform Act",
      number: "BT-Drs 20/1234",
      introducedDate: "2024-01-15",
      status: "In Committee",
      url: "https://www.bundestag.de/dokumente"
    },
    {
      title: "EU Budget Proposal Review",
      number: "BT-Drs 20/1156",
      introducedDate: "2023-12-10",
      status: "Passed",
      url: "https://www.bundestag.de/dokumente"
    },
    {
      title: "Infrastructure Investment Plan",
      number: "BT-Drs 20/1089",
      introducedDate: "2023-11-20",
      status: "In Committee",
      url: "https://www.bundestag.de/dokumente"
    }
  ],
  klingbeil: [
    {
      title: "Digital Infrastructure Modernization",
      number: "BT-Drs 20/1345",
      introducedDate: "2024-02-01",
      status: "In Committee",
      url: "https://www.bundestag.de/dokumente"
    },
    {
      title: "Social Security Enhancement Act",
      number: "BT-Drs 20/1200",
      introducedDate: "2024-01-20",
      status: "In Committee",
      url: "https://www.bundestag.de/dokumente"
    }
  ]
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const memberId = params.id
    const member = members.find((m: any) => m.id === memberId)

    if (!member) {
      return NextResponse.json({ bills: [] })
    }

    // Return demo bills if available, otherwise return empty
    const bills = DEMO_BILLS[memberId] || []

    return NextResponse.json({ bills })
  } catch (err: any) {
    console.error('Error fetching Bundestag bills:', err)
    return NextResponse.json({ bills: [] })
  }
}
