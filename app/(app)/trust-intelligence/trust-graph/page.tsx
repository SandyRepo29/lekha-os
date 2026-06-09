export const dynamic = "force-dynamic";

import { GitBranch, Network, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { EmptyState } from "@/components/ui/empty-state";
import { getGraphForOrg } from "@/lib/repositories/trust-graph-repo";
import { getGraphData } from "@/lib/services/trust-graph/graph-service";
import { TrustGraphWrapper } from "@/components/trust-intelligence/trust-graph-wrapper";
import { TrustGraphChat } from "@/components/trust-intelligence/trust-graph-chat";
import { GraphStat, EntityLegend } from "@/components/trust-intelligence/trust-graph-ui";
import type { GraphNode, GraphEdge } from "@/lib/db/schema";

export default async function TrustGraphPage() {
  const session = await requireUser();

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState
          icon={GitBranch}
          title="Trust Graph™"
          description="Connect your workspace to visualise governance relationships."
        />
      </Card>
    );
  }

  const { nodes, edges } = await getGraphForOrg(session.org.id);

  // Compute metrics if graph exists
  let metrics: Awaited<ReturnType<typeof getGraphData>>["metrics"] | null = null;
  if (nodes.length > 0) {
    try {
      const data = await getGraphData(session.org.id);
      metrics = data.metrics;
    } catch {
      // non-fatal
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold flex items-center gap-2">
            <Network className="h-6 w-6 text-[var(--color-blue)]" />
            Trust Graph™
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
            Governance knowledge graph — entity relationships, root cause analysis, and impact paths
          </p>
        </div>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <GraphStat label="Total Nodes" value={metrics.totalNodes} sub="governance entities" />
          <GraphStat label="Relationships" value={metrics.totalEdges} sub="mapped connections" />
          <GraphStat
            label="Most Connected"
            value={metrics.mostConnectedNode?.name ?? "—"}
            sub={metrics.mostConnectedNode ? `${metrics.mostConnectedNode.connections} connections · ${metrics.mostConnectedNode.entityType}` : "Build graph first"}
          />
          <GraphStat
            label="Entity Types"
            value={Object.keys(metrics.entityCounts).length}
            sub={Object.entries(metrics.entityCounts).map(([k, v]) => `${v} ${k}s`).slice(0, 2).join(" · ")}
          />
        </div>
      )}

      {/* Legend */}
      <Card className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)] mb-3">Entity Types</p>
        <EntityLegend />
      </Card>

      {/* Graph Explorer */}
      <Card className="p-4">
        <TrustGraphWrapper
          initialNodes={nodes as GraphNode[]}
          initialEdges={edges as GraphEdge[]}
        />
      </Card>

      {/* AI Governance Reasoner */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--color-blue)]" />
          <h2 className="text-sm font-semibold">Governance Reasoner™</h2>
          <span className="ml-auto text-xs text-[var(--color-ink-faint)]">Powered by Gemini</span>
        </div>
        <p className="text-xs text-[var(--color-ink-dim)]">
          Ask about governance dependencies, root causes, trust impact paths, or which entities to prioritise.
        </p>
        <TrustGraphChat />
      </Card>
    </div>
  );
}
