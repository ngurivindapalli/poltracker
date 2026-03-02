'use client'

import { useMemo, useState } from 'react'
import { ReactFlow, Node, Edge, Background, Controls, MiniMap, ReactFlowProvider } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

export interface FamilyMember {
  name: string
  relation: string
  occupation?: string
  organization?: string
  government_role?: string
}

export interface Affiliation {
  organization: string
  type: 'NGO' | 'Board' | 'Think Tank' | 'Corporate'
  role: string
  start_date?: string
  end_date?: string
}

interface FamilyTreeGraphProps {
  memberName: string
  family: FamilyMember[]
  affiliations: Affiliation[]
}

export default function FamilyTreeGraph({ memberName, family, affiliations }: FamilyTreeGraphProps) {
  const [showBusiness, setShowBusiness] = useState(true)
  const [showGovernment, setShowGovernment] = useState(true)

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = []
    const edges: Edge[] = []

    // Center node - the politician
    const centerId = 'politician'
    nodes.push({
      id: centerId,
      type: 'default',
      data: { label: memberName },
      position: { x: 400, y: 300 },
      style: {
        background: '#3B82F6',
        color: '#FFFFFF',
        border: '2px solid #1E40AF',
        fontWeight: 600,
        fontSize: '14px',
        padding: '12px',
        borderRadius: '8px'
      }
    })

    let familyX = 100
    let familyY = 100
    const familySpacing = 150

    // Family members
    family.forEach((member, index) => {
      const nodeId = `family-${index}`
      const yPos = familyY + index * familySpacing

      nodes.push({
        id: nodeId,
        type: 'default',
        data: { label: `${member.name}\n${member.relation}` },
        position: { x: familyX, y: yPos },
        style: {
          background: '#F3E8FF',
          color: '#111827',
          border: '2px solid #A855F7',
          fontSize: '12px',
          padding: '10px',
          borderRadius: '6px',
          textAlign: 'center'
        }
      })

      edges.push({
        id: `edge-family-${index}`,
        source: centerId,
        target: nodeId,
        label: member.relation,
        style: { stroke: '#A855F7', strokeWidth: 2 },
        labelStyle: { fill: '#6B21A8', fontWeight: 500, fontSize: '11px' }
      })

      // Add organization/government role nodes if applicable
      if (member.organization && showBusiness) {
        const orgId = `org-${index}`
        nodes.push({
          id: orgId,
          type: 'default',
          data: { label: member.organization },
          position: { x: familyX - 200, y: yPos },
          style: {
            background: '#FEF3C7',
            color: '#111827',
            border: '2px solid #F59E0B',
            fontSize: '11px',
            padding: '8px',
            borderRadius: '6px'
          }
        })
        edges.push({
          id: `edge-org-${index}`,
          source: nodeId,
          target: orgId,
          label: 'works at',
          style: { stroke: '#F59E0B', strokeWidth: 1.5, strokeDasharray: '5,5' },
          labelStyle: { fill: '#92400E', fontSize: '10px' }
        })
      }

      if (member.government_role && showGovernment) {
        const govId = `gov-${index}`
        nodes.push({
          id: govId,
          type: 'default',
          data: { label: member.government_role },
          position: { x: familyX - 200, y: yPos + 50 },
          style: {
            background: '#EFF6FF',
            color: '#111827',
            border: '2px solid #3B82F6',
            fontSize: '11px',
            padding: '8px',
            borderRadius: '6px'
          }
        })
        edges.push({
          id: `edge-gov-${index}`,
          source: nodeId,
          target: govId,
          label: 'role',
          style: { stroke: '#3B82F6', strokeWidth: 1.5, strokeDasharray: '5,5' },
          labelStyle: { fill: '#1E40AF', fontSize: '10px' }
        })
      }
    })

    // Affiliations
    let affilX = 700
    let affilY = 100
    const affilSpacing = 120

    affiliations.forEach((aff, index) => {
      const shouldShow =
        (aff.type === 'Corporate' || aff.type === 'Board') && showBusiness
          ? true
          : (aff.type === 'NGO' || aff.type === 'Think Tank') && showGovernment
          ? true
          : false

      if (!shouldShow) return

      const nodeId = `affil-${index}`
      const yPos = affilY + index * affilSpacing

      const affilColor = aff.type === 'Corporate' || aff.type === 'Board'
        ? { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' }
        : { bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF' }

      nodes.push({
        id: nodeId,
        type: 'default',
        data: { label: `${aff.organization}\n${aff.role}` },
        position: { x: affilX, y: yPos },
        style: {
          background: affilColor.bg,
          color: '#111827',
          border: `2px solid ${affilColor.border}`,
          fontSize: '11px',
          padding: '10px',
          borderRadius: '6px',
          textAlign: 'center'
        }
      })

      const edgeLabel = aff.type === 'Board' ? 'board member' : aff.role.toLowerCase()
      edges.push({
        id: `edge-affil-${index}`,
        source: centerId,
        target: nodeId,
        label: edgeLabel,
        style: {
          stroke: affilColor.border,
          strokeWidth: 2,
          strokeDasharray: aff.type === 'Corporate' || aff.type === 'Board' ? '5,5' : undefined
        },
        labelStyle: { fill: affilColor.text, fontWeight: 500, fontSize: '11px' }
      })
    })

    return { nodes, edges }
  }, [memberName, family, affiliations, showBusiness, showGovernment])

  if (family.length === 0 && affiliations.length === 0) {
    return (
      <section style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '1rem', fontWeight: 600 }}>
          Family & Connections
        </h2>
        <div
          style={{
            padding: '1.5rem',
            backgroundColor: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            color: '#6B7280',
            fontSize: '0.9rem'
          }}
        >
          No family or connection data available.
        </div>
      </section>
    )
  }

  return (
    <section style={{ marginTop: '3rem' }}>
      <h2 style={{ fontSize: '1.6rem', marginBottom: '1rem', fontWeight: 600 }}>
        Family & Connections
      </h2>

      {/* Toggle Controls */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1rem',
          padding: '1rem',
          backgroundColor: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: '8px'
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showBusiness}
            onChange={(e) => setShowBusiness(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ fontSize: '0.875rem', color: '#111827' }}>Show Business Connections</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showGovernment}
            onChange={(e) => setShowGovernment(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ fontSize: '0.875rem', color: '#111827' }}>Show Government Connections</span>
        </label>
      </div>

      {/* React Flow Graph */}
      <div style={{ width: '100%', height: '600px', border: '1px solid #E5E7EB', borderRadius: '8px', backgroundColor: '#FFFFFF' }}>
        <ReactFlowProvider>
          <ReactFlow nodes={nodes} edges={edges}>
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </section>
  )
}
