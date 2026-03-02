'use client'

import { useState, useEffect, useCallback } from 'react'
import { ReactFlow, Node, Edge, Controls, useReactFlow, ReactFlowProvider, MarkerType } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { RelationshipGraph as RelationshipGraphType } from '@/lib/types/senatorExtended'
import { FamilyMemberNews } from '@/lib/news/familyNewsProvider'
import ModernNode from './ModernNode'
import FamilyNewsPanel from './FamilyNewsPanel'

interface FamilyIntelligenceMonitorProps {
  bioguideId: string
}

const nodeTypes = {
  modern: ModernNode
}

function FamilyIntelligenceMonitorInner({ bioguideId }: FamilyIntelligenceMonitorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [graph, setGraph] = useState<RelationshipGraphType | null>(null)
  const [familyNews, setFamilyNews] = useState<FamilyMemberNews[]>([])
  const [selectedMember, setSelectedMember] = useState<FamilyMemberNews | null>(null)
  const [loading, setLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newActivityDetected, setNewActivityDetected] = useState(false)
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const { fitView } = useReactFlow()

  // Define refreshFamilyNews at the top level
  const refreshFamilyNews = useCallback(async () => {
    if (!bioguideId) return

    try {
      setIsRefreshing(true)
      const res = await fetch(`/api/senator/${bioguideId}/refresh-family-news`)
      if (!res.ok) throw new Error('Failed to refresh family news')
      const data = await res.json()

      setFamilyNews(data.familyMembers || [])

      // Check if new articles were detected
      if (data.newArticlesCount > 0) {
        setNewActivityDetected(true)
        // Find which member has new news
        const memberWithNews = data.familyMembers?.find((m: FamilyMemberNews) => m.news.length > 0)
        if (memberWithNews) {
          const nodeId = graph?.nodes.find(n => n.label === memberWithNews.name)?.id
          if (nodeId) {
            setHighlightedNodeId(nodeId)
          }
        }
      }

      setLastRefreshed(new Date())
    } catch (err) {
      console.error('Failed to refresh family news:', err)
    } finally {
      setIsRefreshing(false)
    }
  }, [bioguideId, graph])

  const loadGraph = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/senator/${bioguideId}/relationship-graph`)
      if (!response.ok) throw new Error('Failed to fetch relationship graph')
      const data = await response.json()
      setGraph(data.relationship_graph)
    } catch (err) {
      console.error('Error fetching relationship graph:', err)
      setError('Unable to load relationship graph')
    } finally {
      setLoading(false)
    }
  }, [bioguideId])

  useEffect(() => {
    if (isOpen && !graph) {
      loadGraph()
    }
  }, [isOpen, graph, loadGraph])

  useEffect(() => {
    if (isOpen && graph && graph.nodes.length > 0) {
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

  // Highlight animation for new activity
  useEffect(() => {
    if (newActivityDetected && highlightedNodeId) {
      const timer = setTimeout(() => {
        setHighlightedNodeId(null)
        setNewActivityDetected(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [newActivityDetected, highlightedNodeId])

  const handleNodeClick = useCallback((nodeId: string) => {
    const member = familyNews.find(m => {
      const graphNode = graph?.nodes.find(n => n.id === nodeId)
      return graphNode && graphNode.label === m.name
    })
    if (member && member.news.length > 0) {
      setSelectedMember(member)
    }
  }, [familyNews, graph])

  const nodes: Node[] = graph?.nodes.map((n) => {
    const memberNews = familyNews.find(m => m.name === n.label)
    const newsCount = memberNews?.news.length || 0
    const hasNewNews = highlightedNodeId === n.id && newActivityDetected

    return {
      id: n.id,
      type: 'modern',
      data: {
        label: n.label,
        type: n.type,
        newsCount,
        hasNewNews,
        onClick: () => handleNodeClick(n.id)
      },
      position: { x: Math.random() * 800, y: Math.random() * 600 },
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
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            Family Intelligence Monitor
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
            Real-time news tracking for family members
          </p>
        </div>
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
          {isOpen ? 'Collapse' : 'Expand Monitor'}
        </button>
      </div>

      {newActivityDetected && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#FEF3C7',
            border: '1px solid #FCD34D',
            borderRadius: '6px',
            color: '#92400E',
            fontSize: '0.875rem',
            marginBottom: '1rem',
            animation: 'flash 2s ease-in-out'
          }}
        >
          ⚡ New Activity Detected - Recent news found for family members
        </div>
      )}

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
          Click &quot;Expand Monitor&quot; to view the interactive family network with real-time news tracking.
        </div>
      )}

      {isOpen && (
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Family Intelligence Monitor</h3>
            <button
              onClick={refreshFamilyNews}
              disabled={isRefreshing}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh News'}
            </button>
          </div>

          {lastRefreshed && (
            <p className="text-xs text-gray-500 mt-2">
              Last updated: {lastRefreshed.toLocaleTimeString()}
            </p>
          )}

          {loading && (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#6B7280' }}>
              Loading family intelligence monitor...
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
            <div className="rounded-2xl border bg-white shadow-lg p-6">
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
                    <Controls />
                  </ReactFlow>
                </div>
              ) : (
                <div style={{ padding: '4rem', textAlign: 'center', color: '#6B7280' }}>
                  No family data available to display.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {selectedMember && (
        <FamilyNewsPanel
          memberName={selectedMember.name}
          relation={selectedMember.relation}
          news={selectedMember.news}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </section>
  )
}

export default function FamilyIntelligenceMonitor({ bioguideId }: FamilyIntelligenceMonitorProps) {
  return (
    <ReactFlowProvider>
      <FamilyIntelligenceMonitorInner bioguideId={bioguideId} />
    </ReactFlowProvider>
  )
}
