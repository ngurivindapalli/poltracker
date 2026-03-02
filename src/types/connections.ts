export interface EntityDTO {
  id: string
  name: string
  imageUrl?: string
  kind: string
  orgSubtype?: string
}

export interface EdgeDTO {
  id: string
  relType: string
  category: string
  confidenceLabel: string
  confidenceScore: number
  importanceScore: number
}

export interface ConnectionsResponse {
  senator: any
  sections: {
    family: { nodes: EntityDTO[]; edges: EdgeDTO[] }
    government: { nodes: EntityDTO[]; edges: EdgeDTO[] }
    business: { nodes: EntityDTO[]; edges: EdgeDTO[] }
    ngo: { nodes: EntityDTO[]; edges: EdgeDTO[] }
  }
}
