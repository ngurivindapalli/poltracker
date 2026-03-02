"use client";

import { useState, useEffect } from "react";
import InfluenceMap from "@/components/InfluenceMap";
import { Card } from "@/components/ui/Card";
import { GraphNode, GraphEdge } from "@/types/graph";

interface ConnectionsPanelProps {
  bioguideId: string;
}

interface ExtendedGraphNode extends GraphNode {
  data?: {
    label?: string;
    type?: string;
    value?: number | string;
  };
}

interface GraphData {
  nodes: ExtendedGraphNode[];
  edges: GraphEdge[];
}

interface Connection {
  name: string;
  amount?: number;
  totalAmount?: number;
  type?: string;
  relationship?: string;
}

export default function ConnectionsPanel({ bioguideId }: ConnectionsPanelProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [senatorName, setSenatorName] = useState<string>("Senator");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConnections();
  }, [bioguideId]);

  async function fetchConnections() {
    try {
      setLoading(true);
      setError(null);
      const base = process.env.NEXT_PUBLIC_BASE_URL || "";
      const response = await fetch(
        `${base}/api/member/${bioguideId}/connections`
      );
      if (!response.ok) throw new Error("Failed to fetch connections");
      const json: GraphData = await response.json();

      // Convert graph nodes to connections format for InfluenceMap
      const connectionsList: Connection[] = [];
      let foundSenatorName = "Senator";

      if (json.nodes) {
        json.nodes.forEach((node) => {
          const label = node.data?.label || node.label || node.id || "Unknown";
          const nodeType = node.data?.type || node.type;

          // Find senator name (id === "senator")
          if (node.id === "senator") {
            foundSenatorName = label;
            return;
          }

          // Get amount from data.value
          let amount = 0;
          if (node.data?.value) {
            if (typeof node.data.value === "number") {
              amount = node.data.value;
            } else if (typeof node.data.value === "string") {
              const parsed = parseInt(node.data.value.replace(/[$,]/g, ""));
              if (!isNaN(parsed)) {
                amount = parsed;
              }
            }
          }

          // Parse amount from label if present (format: "Name\n$Amount")
          let name = label;
          if (label.includes("\n")) {
            const parts = label.split("\n");
            name = parts[0];
            if (!amount) {
              const amountStr = parts[1]?.replace(/[$,]/g, "");
              amount = parseInt(amountStr) || 0;
            }
          }

          connectionsList.push({
            name,
            amount,
            totalAmount: amount,
            type: nodeType || "lobbyClient",
          });
        });
      }

      setSenatorName(foundSenatorName);
      setConnections(connectionsList);
    } catch (err) {
      console.error("Error fetching connections:", err);
      setError("Unable to load connections data");
      setConnections([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card className="p-8 text-center text-[#64748B]">
        Loading influence network...
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center bg-amber-50 border-amber-100 text-amber-800">
        {error}
      </Card>
    );
  }

  return (
    <InfluenceMap connections={connections} senator={senatorName} />
  );
}
