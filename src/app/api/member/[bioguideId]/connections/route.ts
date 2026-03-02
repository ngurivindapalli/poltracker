import { NextResponse } from "next/server"
import { fetchLDALobbying } from "@/lib/ldaService"
import { buildLobbyGraph } from "@/lib/lobbying/buildLobbyGraph"
import { fetchMember } from "@/lib/congress"

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
    } catch (e) {
      console.log("Could not fetch member name, using bioguideId")
    }

    // Fetch LDA lobbying clients
    const clients = await fetchLDALobbying(id)

    console.log("LDA Clients:", clients.length)

    // Build graph
    const graph = buildLobbyGraph(id, memberName, clients)

    return NextResponse.json({
      nodes: graph.nodes,
      edges: graph.edges
    })

  } catch (e) {
    console.log("Lobby graph error", e)
    return NextResponse.json({
      nodes: [],
      edges: []
    })
  }
}
