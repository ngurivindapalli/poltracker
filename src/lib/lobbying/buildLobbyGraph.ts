export function buildLobbyGraph(
  bioguideId: string,
  memberName: string,
  clients: any[]
) {
  const nodes: any[] = []
  const edges: any[] = []

  // CENTER NODE - Senator
  const senatorNode = {
    id: "senator",
    type: "default",
    position: { x: 0, y: 0 },
    style: {
      width: 180,
      height: 60
    },
    data: {
      label: memberName || bioguideId
    }
  }
  nodes.push(senatorNode)

  // CLIENT NODES
  const radius = 650
  
  clients.forEach((client, i) => {
    const clientName = client.name || "Unknown Client"
    const clientId = client.id || `client-${i}`
    const amount = client.amount || 0
    
    const angle = (i / clients.length) * Math.PI * 2
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius

    nodes.push({
      id: clientId,
      position: {
        x: x,
        y: y
      },
      style: {
        width: 200,
        padding: 12
      },
      data: {
        label: clientName,
        value: amount || "Unknown"
      }
    })

    edges.push({
      id: `edge-${clientId}`,
      source: "senator",
      target: clientId,
      type: "bezier",
      markerEnd: {
        type: "arrowclosed",
        width: 20,
        height: 20,
        color: "#64748b"
      },
      style: {
        strokeWidth: 2,
        stroke: "#64748b"
      }
    })
  })

  return {
    nodes,
    edges
  }
}
