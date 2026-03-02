/**
 * People-Only Relationship Graph Builder
 * Constructs graph showing only prominent people directly related to the Senator
 */

import {
  GraphNode,
  GraphEdge,
  RelationshipGraph
} from '../types/senatorExtended'
import { FamilyResearchMember, isProminent } from '../data/familyResearchProvider'

interface Person {
  name: string
  bioguideId?: string
  relation?: string
  type: 'senator' | 'colleague'
}

interface GraphInput {
  senatorId: string
  senatorName: string
  senatorState: string
  prominentFamily: FamilyResearchMember[]
  sameStateSenator?: Person
}

export function buildRelationshipGraph(input: GraphInput): RelationshipGraph {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  // Add senator as center node
  const senatorNodeId = `senator-${input.senatorId}`
  nodes.push({
    id: senatorNodeId,
    label: input.senatorName,
    type: 'senator',
    metadata: { bioguideId: input.senatorId }
  })

  // Add prominent family members only
  input.prominentFamily.forEach((member, index) => {
    const nodeId = `family-${input.senatorId}-${index}`
    nodes.push({
      id: nodeId,
      label: member.name,
      type: 'family-prominent',
      metadata: { 
        relation: member.relation, 
        occupation: member.occupation,
        organizations: member.organizations
      }
    })

    // Add edge based on relation
    let edgeLabel: GraphEdge['label'] = 'spouse_of'
    if (member.relation === 'child') edgeLabel = 'parent_of'
    else if (member.relation === 'parent') edgeLabel = 'parent_of'
    else if (member.relation === 'sibling') edgeLabel = 'spouse_of' // Would need sibling_of type

    edges.push({
      source: senatorNodeId,
      target: nodeId,
      label: edgeLabel,
      metadata: { relation: member.relation }
    })
  })

  // ALWAYS include same-state senator (mandatory)
  if (input.sameStateSenator) {
    const nodeId = `colleague-${input.senatorId}`
    nodes.push({
      id: nodeId,
      label: input.sameStateSenator.name,
      type: 'colleague',
      metadata: { bioguideId: input.sameStateSenator.bioguideId }
    })
    edges.push({
      source: senatorNodeId,
      target: nodeId,
      label: 'colleague_of',
      metadata: { relation: 'same_state_senator' }
    })
  }

  // FALLBACK: If no prominent family but we have colleague, that's fine
  // Graph should have at least 2 nodes (senator + colleague)
  if (nodes.length === 1 && input.sameStateSenator) {
    const nodeId = `colleague-fallback-${input.senatorId}`
    nodes.push({
      id: nodeId,
      label: input.sameStateSenator.name,
      type: 'colleague',
      metadata: { bioguideId: input.sameStateSenator.bioguideId }
    })
    edges.push({
      source: senatorNodeId,
      target: nodeId,
      label: 'colleague_of',
      metadata: { relation: 'same_state_senator' }
    })
  }

  return { nodes, edges }
}
