"use client";

import { useState, useTransition } from "react";
import { buildGraphAction } from "@/lib/trust-graph/actions";
import { toast } from "@/components/ui/toast-simple";
import { TrustGraphExplorer } from "./trust-graph-explorer";
import type { GraphNode, GraphEdge } from "@/lib/db/schema";

interface Props {
  initialNodes: GraphNode[];
  initialEdges: GraphEdge[];
}

export function TrustGraphWrapper({ initialNodes, initialEdges }: Props) {
  const [nodes, setNodes] = useState<GraphNode[]>(initialNodes);
  const [edges, setEdges] = useState<GraphEdge[]>(initialEdges);
  const [building, startTransition] = useTransition();
  const [buildResult, setBuildResult] = useState<{ nodeCount: number; edgeCount: number } | null>(
    initialNodes.length > 0 ? { nodeCount: initialNodes.length, edgeCount: initialEdges.length } : null
  );
  const [error, setError] = useState<string | null>(null);

  const handleBuild = () => {
    setError(null);
    toast("Rebuilding Trust Graph&#8230;", "loading", 0);
    startTransition(async () => {
      const res = await buildGraphAction();
      if (res.error) {
        setError(res.error);
        toast("Failed to rebuild Trust Graph", "error");
        return;
      }
      if (res.data) {
        setBuildResult(res.data);
        const { getGraphDataAction } = await import("@/lib/trust-graph/actions");
        const graphRes = await getGraphDataAction();
        if (graphRes.data) {
          setNodes(graphRes.data.nodes as GraphNode[]);
          setEdges(graphRes.data.edges as GraphEdge[]);
        }
        toast("Trust Graph rebuilt successfully", "success");
      }
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</div>
      )}
      {buildResult && (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
          Graph built: {buildResult.nodeCount} nodes · {buildResult.edgeCount} relationships
        </div>
      )}
      <TrustGraphExplorer
        nodes={nodes}
        edges={edges}
        onBuildGraph={handleBuild}
        building={building}
      />
    </div>
  );
}
