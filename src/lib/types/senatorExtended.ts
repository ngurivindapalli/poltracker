/**
 * Extended Senator Data Model
 * Adds intelligence layers: investments, donors, family, affiliations, relationship graph
 */

import { GraphNode as BaseGraphNode, GraphEdge as BaseGraphEdge } from "@/types/graph";

export interface Investment {
  asset_name: string
  asset_type: 'stock' | 'ETF' | 'private equity' | 'crypto' | 'real estate' | 'bond' | 'other'
  value_range: {
    min: number
    max: number
  }
  transaction_type?: 'purchase' | 'sale' | 'hold' | 'gift'
  transaction_date?: string
  source: string
}

export interface Donor {
  organization: string
  amount: number
  cycle: string
  industry?: string
}

export interface IndustryExposure {
  industry: string
  total_amount: number
  percent_of_total: number
  donor_count: number
}

export interface FamilyMember {
  name: string
  relation: 'spouse' | 'child' | 'parent' | 'sibling' | 'other'
  occupation?: string
  organization?: string
  education?: string
  previous_positions?: string[]
}

export interface Affiliation {
  organization: string
  type: 'NGO' | 'Board' | 'Corporate' | 'Committee' | 'Think Tank' | 'Other'
  role: string
  start_date?: string
  end_date?: string
  source: string
}

export interface SenatorGraphNode extends BaseGraphNode {
  type: 'senator' | 'family' | 'family-prominent' | 'colleague' | 'person'
  metadata?: Record<string, any>
}

export interface SenatorGraphEdge extends BaseGraphEdge {
  label: 'spouse_of' | 'parent_of' | 'child_of' | 'colleague_of' | 'co_sponsored_with'
  metadata?: Record<string, any>
}

export interface RelationshipGraph {
  nodes: SenatorGraphNode[]
  edges: SenatorGraphEdge[]
}

export interface SenatorExtended {
  bioguideId: string
  investments: Investment[]
  donors: {
    top_donors: Donor[]
    industry_breakdown: IndustryExposure[]
  }
  family: FamilyMember[]
  affiliations: Affiliation[]
  relationship_graph: RelationshipGraph
}
