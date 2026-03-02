'use client'

import { ReactFlow, Node, Edge, Background, Controls } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { GraphNode, GraphEdge } from "@/types/graph"

function nodeColor(type: string): string {
  if (type === "senator") return "#2563eb" // Blue
  if (type === "donor") return "#9333ea" // Purple
  if (type === "investment") return "#16a34a" // Green
  if (type === "ngo") return "#f59e0b" // Orange
  return "#64748b" // Gray
}

const NodeLabel = ({ data }: { data: any }) => {
  const label = data?.label || data?.name || "Unknown"
  const isSenator = data?.isSenator || false
  
  return (
    <div style={{
      padding: "10px 16px",
      background: isSenator ? "#2563eb" : "#4a5568",
      color: "white",
      borderRadius: "10px",
      fontSize: "13px",
      fontWeight: 500,
      minWidth: "140px",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{ fontWeight: 600 }}>
        {label}
      </div>
      {data.value && !isSenator && (
        <div style={{
          marginTop: "4px",
          fontSize: "12px",
          opacity: 0.8
        }}>
          ${typeof data.value === 'number' ? data.value.toLocaleString() : data.value}
        </div>
      )}
    </div>
  )
}

interface ExtendedGraphNode extends GraphNode {
  data?: any
  position?: { x: number; y: number }
}

interface ConnectionsGraphProps {
  nodes: ExtendedGraphNode[]
  edges: GraphEdge[]
}

export default function ConnectionsGraph({ nodes, edges }: ConnectionsGraphProps) {
  console.log("Graph Nodes:", nodes)

  if (!nodes?.length) {
    return (
      <div style={{ padding: 40 }}>
        No lobbying data available
      </div>
    )
  }

  // Convert to ReactFlow format
  const flowNodes: Node[] = nodes.map((n, index) => {
    // Extract label from data.label or label property
    const label = n.data?.label || n.label || n.id || "Unknown"
    
    // Determine if this is the senator node
    const isSenator = n.id === "senator" || n.type === "senator"
    
    // Use position from node if available, otherwise calculate
    let position = n.position || { x: 0, y: 0 }
    
    // If no position provided, calculate radial layout for non-senator nodes
    if (!n.position && !isSenator) {
      const angle = (index / nodes.length) * Math.PI * 2
      const radius = 350
      position = {
        x: 500 + Math.cos(angle) * radius,
        y: 300 + Math.sin(angle) * radius
      }
    } else if (isSenator && !n.position) {
      position = { x: 500, y: 300 }
    }

    return {
      id: String(n.id) + "_" + index,
      data: {
        label: label,
        isSenator: isSenator,
        ...n.data
      },
      position: position,
      style: {
        background: isSenator ? nodeColor('senator') : nodeColor('entity'),
        color: 'white',
        borderRadius: 10,
        padding: 10,
        fontSize: '12px',
        fontWeight: 600,
        minWidth: 100,
        textAlign: 'center',
        border: '2px solid rgba(255, 255, 255, 0.2)'
      },
      type: "default"
    }
  })

  // Convert edges to ReactFlow format with safety checks
  const flowEdges: Edge[] = edges
    .filter(e => e.source || e.from)
    .filter(e => e.target || e.to)
    .map((e, index) => ({
      id: `edge_${index}`,
      source: String(e.source || e.from),
      target: String(e.target || e.to),
      label: e.label || e.relationship || "Connection",
      type: "smoothstep",
      style: { stroke: '#6B7280', strokeWidth: 2 },
      labelStyle: { fill: '#374151', fontSize: '11px', fontWeight: 500, backgroundColor: 'white', padding: '2px 6px', borderRadius: '4px' },
      labelBgStyle: { fill: 'white', fillOpacity: 0.8 },
    }))

  const nodeTypes = {
    default: NodeLabel
  }

  return (
    <div style={{ height: '500px', border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}
