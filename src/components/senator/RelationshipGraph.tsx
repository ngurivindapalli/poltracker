'use client'

import { useState, useEffect, useCallback } from 'react'
import { ReactFlow, Node, Edge, Background, Controls, useReactFlow, ReactFlowProvider, MarkerType, BackgroundVariant } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { RelationshipGraph as RelationshipGraphType } from '@/lib/types/senatorExtended'
import ModernNode from './ModernNode'

interface RelationshipGraphProps {
  bioguideId: string
}

const nodeTypes = {
  modern: ModernNode
}

function RelationshipGraphInner({ bioguideId }: RelationshipGraphProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [graph, setGraph] = useState<RelationshipGraphType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [colleagueInfo, setColleagueInfo] = useState<{ name: string; state?: string } | null>(null)
  const { fitView } = useReactFlow()

  useEffect(() => {
    if (isOpen && !graph) {
      loadGraph()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, graph])

  // Safe fitView call with auto-center
  useEffect(() => {
    if (isOpen && graph && graph.nodes.length > 0) {
      // Small delay to ensure ReactFlow is fully mounted
      const timer = setTimeout(() => {
        try {
          fitView({ padding: 0.2 })
        } catch (err) {
          console.error('Error calling fitView:', err)
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen, graph, fitView])

  async function loadGraph() {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/senator/${bioguideId}/relationship-graph`)
      if (!response.ok) throw new Error('Failed to fetch relationship graph')
      const data = await response.json()
      setGraph(data.relationship_graph)
      
      // Extract colleague info from graph nodes
      const colleagueNode = data.relationship_graph?.nodes?.find((n: any) => n.type === 'colleague')
      if (colleagueNode) {
        setColleagueInfo({
          name: colleagueNode.label,
          state: data.senatorState
        })
      }
    } catch (err) {
      console.error('Error fetching relationship graph:', err)
      setError('Unable to load relationship graph')
    } finally {
      setLoading(false)
    }
  }

  // Check if we have prominent family members
  const prominentFamilyNodes = graph?.nodes.filter(n => n.type === 'family-prominent') || []
  const hasProminentFamily = prominentFamilyNodes.length > 0

  const nodes: Node[] = graph?.nodes.map((n) => {
    return {
      id: n.id,
      type: 'modern',
      data: { 
        label: n.label,
        type: n.type
      },
      position: { x: Math.random() * 800, y: Math.random() * 600 }, // Would use proper layout algorithm
    }
  }) || []

  const edges: Edge[] = graph?.edges.map((e) => ({
    id: `${e.source}-${e.target}`,
    source: e.source,
    target: e.target,
    label: e.label.replace(/_/g, ' '),
    type: 'smoothstep',
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: '#6B7280', strokeWidth: 2 },
    labelStyle: { fill: '#374151', fontWeight: 500, fontSize: '11px' }
  })) || []

  return (
    <section style={{ marginTop: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 600 }}>
          Relationship Graph
        </h2>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: isOpen ? '#EF4444' : '#3B82F6',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          {isOpen ? 'Collapse' : 'Expand Graph'}
        </button>
      </div>

      {!isOpen && (
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
          Click &quot;Expand Graph&quot; to view the interactive relationship network showing connections between the senator, family members, donors, investments, and organizations.
        </div>
      )}

      {isOpen && (
        <div>
          {loading && (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#6B7280' }}>
              Loading relationship graph...
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '1.5rem',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '8px',
                color: '#991B1B',
                fontSize: '0.9rem'
              }}
            >
              {error}
            </div>
          )}

          {!loading && !error && graph && (
            <>
              {!hasProminentFamily ? (
                // Empty state card when no prominent family members
                <div className="rounded-2xl border bg-white shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Family & Close Associates — Professional Overview
                  </h3>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className="text-sm text-gray-600">
                      No publicly documented prominent family members with
                      corporate, executive, or government roles.
                    </p>

                    {colleagueInfo && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-800">
                          State Colleague:
                        </p>
                        <p className="text-sm text-gray-600">
                          {colleagueInfo.name} — U.S. Senator {colleagueInfo.state && `(${colleagueInfo.state})`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Render graph when prominent family exists
                <div className="rounded-2xl shadow-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4">
                  {nodes.length > 0 ? (
                    <div className="w-full" style={{ height: '600px' }}>
                      <ReactFlow 
                        nodes={nodes} 
                        edges={edges}
                        nodeTypes={nodeTypes}
                        defaultEdgeOptions={{
                          type: 'smoothstep',
                          animated: true,
                          markerEnd: { type: MarkerType.ArrowClosed }
                        }}
                      >
                        <Background variant={BackgroundVariant.Dots} gap={40} size={1} />
                        <Controls />
                      </ReactFlow>
                    </div>
                  ) : (
                    <div style={{ padding: '4rem', textAlign: 'center', color: '#6B7280' }}>
                      No relationship data available to display.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}

export default function RelationshipGraph({ bioguideId }: RelationshipGraphProps) {
  return (
    <ReactFlowProvider>
      <RelationshipGraphInner bioguideId={bioguideId} />
    </ReactFlowProvider>
  )
}
