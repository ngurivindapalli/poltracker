export function buildNgoGraph(ngoData: any[], senatorName: string) {
  const nodes: any[] = []
  const edges: any[] = []

  const rootId = senatorName.replace(/\s/g, "_")

  nodes.push({
    id: "senator",
    label: senatorName,
    type: "senator"
  })

  ngoData.forEach((ngo: any, index: number) => {
    const ngoName = ngo.name || `NGO ${index + 1}`
    const id = "ngo-" + index

    nodes.push({
      id,
      label: ngoName,
      type: "ngo"
    })

    edges.push({
      id: "e-" + id,
      from: "senator",
      to: id,
      label: "NGO Affiliation"
    })
  })

  return { nodes, edges }
}
