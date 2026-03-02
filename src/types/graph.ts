export type GraphNode = {
  id: string
  label?: string
  type?: string
  importance?: string
  relationship?: string
  lobbiedValue?: number | string
}

export type GraphEdge = {
  id?: string | number
  source?: string
  target?: string
  from?: string
  to?: string
  label?: string
  relationship?: string
  importance?: string
  lobbiedValue?: number | string
}
