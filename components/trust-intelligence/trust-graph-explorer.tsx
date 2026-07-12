"use client";

import { useEffect, useRef, useState, useCallback, useTransition } from "react";
import type { GraphNode, GraphEdge } from "@/lib/db/schema";
import { ENTITY_COLORS, ENTITY_LABELS, RELATIONSHIP_LABELS } from "@/lib/services/trust-graph/graph-constants";
import { getRootCauseAction, getImpactAnalysisAction } from "@/lib/trust-graph/actions";
import { EntityTypeBadge, ImpactSeverityBadge } from "./trust-graph-ui";
import { cn } from "@/lib/utils";
import { X, ZoomIn, ZoomOut, RefreshCw, Info, GitBranch, Zap } from "lucide-react";

interface NodePos { x: number; y: number; vx: number; vy: number }

function runForceLayout(nodes: GraphNode[], edges: GraphEdge[], width: number, height: number): Map<string, { x: number; y: number }> {
  const cx = width / 2;
  const cy = height / 2;

  // Group nodes by entity type for cluster seeding
  const typeGroups: Record<string, GraphNode[]> = {};
  for (const n of nodes) typeGroups[n.entityType] = [...(typeGroups[n.entityType] ?? []), n];

  const types = Object.keys(typeGroups);
  const positions = new Map<string, NodePos>();

  // Seed positions in circular clusters by type
  types.forEach((type, ti) => {
    const angle = (ti / types.length) * Math.PI * 2;
    const clusterCx = cx + Math.cos(angle) * (Math.min(width, height) * 0.3);
    const clusterCy = cy + Math.sin(angle) * (Math.min(width, height) * 0.3);
    typeGroups[type].forEach((n, ni) => {
      const a2 = (ni / typeGroups[type].length) * Math.PI * 2;
      const r2 = 30 + typeGroups[type].length * 4;
      positions.set(n.id, {
        x: clusterCx + Math.cos(a2) * r2 + (Math.random() - 0.5) * 10,
        y: clusterCy + Math.sin(a2) * r2 + (Math.random() - 0.5) * 10,
        vx: 0, vy: 0,
      });
    });
  });

  // Build adjacency for spring forces
  const edgeMap: Array<[string, string]> = edges.map(e => [e.sourceNodeId, e.targetNodeId]);

  // Run force iterations
  for (let iter = 0; iter < 200; iter++) {
    const alpha = 1 - iter / 200;

    // Reset forces
    for (const p of positions.values()) { p.vx = 0; p.vy = 0; }

    // Repulsion
    const nodeList = nodes;
    for (let i = 0; i < nodeList.length; i++) {
      for (let j = i + 1; j < nodeList.length; j++) {
        const pi = positions.get(nodeList[i].id)!;
        const pj = positions.get(nodeList[j].id)!;
        const dx = pi.x - pj.x || 0.001;
        const dy = pi.y - pj.y || 0.001;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
        const force = (2500 / (dist * dist)) * alpha;
        pi.vx += (dx / dist) * force;
        pi.vy += (dy / dist) * force;
        pj.vx -= (dx / dist) * force;
        pj.vy -= (dy / dist) * force;
      }
    }

    // Attraction along edges
    for (const [src, tgt] of edgeMap) {
      const ps = positions.get(src);
      const pt = positions.get(tgt);
      if (!ps || !pt) continue;
      const dx = pt.x - ps.x;
      const dy = pt.y - ps.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
      const target = 120;
      const force = ((dist - target) / dist) * 0.05 * alpha;
      ps.vx += dx * force;
      ps.vy += dy * force;
      pt.vx -= dx * force;
      pt.vy -= dy * force;
    }

    // Gravity toward center
    for (const p of positions.values()) {
      p.vx += (cx - p.x) * 0.002 * alpha;
      p.vy += (cy - p.y) * 0.002 * alpha;
    }

    // Apply
    for (const p of positions.values()) {
      p.x = Math.max(40, Math.min(width - 40, p.x + p.vx));
      p.y = Math.max(40, Math.min(height - 40, p.y + p.vy));
    }
  }

  const result = new Map<string, { x: number; y: number }>();
  for (const [id, p] of positions.entries()) result.set(id, { x: p.x, y: p.y });
  return result;
}

interface GraphExplorerProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onBuildGraph: () => void;
  building: boolean;
}

type AnalysisTab = "none" | "root-cause" | "impact";

export function TrustGraphExplorer({ nodes, edges, onBuildGraph, building }: GraphExplorerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dims, setDims] = useState({ w: 900, h: 600 });
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const [analysisTab, setAnalysisTab] = useState<AnalysisTab>("none");
  const [rootCause, setRootCause] = useState<any>(null);
  const [impact, setImpact] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  // Resize observer
  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      for (const e of entries) {
        setDims({ w: e.contentRect.width, h: Math.max(500, e.contentRect.width * 0.6) });
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Recompute layout when nodes/edges/dims change
  useEffect(() => {
    if (nodes.length === 0) return;
    const pos = runForceLayout(nodes, edges, dims.w, dims.h);
    setPositions(pos);
  }, [nodes, edges, dims]);

  const visibleNodes = filterType ? nodes.filter(n => n.entityType === filterType) : nodes;
  const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
  const visibleEdges = edges.filter(e => visibleNodeIds.has(e.sourceNodeId) && visibleNodeIds.has(e.targetNodeId));

  // Connected nodes when a node is selected
  const connectedIds = selectedNode ? new Set([
    selectedNode.id,
    ...edges.filter(e => e.sourceNodeId === selectedNode.id || e.targetNodeId === selectedNode.id)
      .flatMap(e => [e.sourceNodeId, e.targetNodeId]),
  ]) : null;

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node);
    setRootCause(null);
    setImpact(null);
    setAnalysisTab("none");
  }, []);

  const handleRootCause = () => {
    if (!selectedNode) return;
    setAnalysisTab("root-cause");
    startTransition(async () => {
      const res = await getRootCauseAction(selectedNode.id);
      if (res.data) setRootCause(res.data);
    });
  };

  const handleImpact = () => {
    if (!selectedNode) return;
    setAnalysisTab("impact");
    startTransition(async () => {
      const res = await getImpactAnalysisAction(selectedNode.id);
      if (res.data) setImpact(res.data);
    });
  };

  // Pan handlers
  const onMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as Element).closest(".graph-node")) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };
  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isPanning) return;
    setPan({ x: panStart.current.px + (e.clientX - panStart.current.x), y: panStart.current.py + (e.clientY - panStart.current.y) });
  };
  const onMouseUp = () => setIsPanning(false);

  const entityTypes = [...new Set(nodes.map(n => n.entityType))];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterType(null)}
            className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors",
              filterType === null ? "bg-[#EEF2F7] text-[var(--color-ink)]" : "text-[var(--color-ink-dim)] hover:bg-[#F8F9FB]")}
          >
            All
          </button>
          {entityTypes.map(type => {
            const color = ENTITY_COLORS[type];
            return (
              <button
                key={type}
                onClick={() => setFilterType(t => t === type ? null : type)}
                className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors border",
                  filterType === type ? "text-white" : "text-[var(--color-ink-dim)] hover:bg-[#F8F9FB]")}
                style={filterType === type ? { backgroundColor: color?.fill, borderColor: color?.stroke } : { borderColor: "transparent" }}
              >
                {ENTITY_LABELS[type] ?? type}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setScale(s => Math.min(2, s + 0.2))} className="rounded-lg border border-[var(--color-line)] p-1.5 hover:bg-[#F8F9FB]"><ZoomIn className="h-3.5 w-3.5" /></button>
          <button onClick={() => setScale(s => Math.max(0.3, s - 0.2))} className="rounded-lg border border-[var(--color-line)] p-1.5 hover:bg-[#F8F9FB]"><ZoomOut className="h-3.5 w-3.5" /></button>
          <button onClick={() => { setScale(1); setPan({ x: 0, y: 0 }); }} className="rounded-lg border border-[var(--color-line)] px-2.5 py-1.5 text-xs hover:bg-[#F8F9FB]">Reset</button>
          <button
            onClick={onBuildGraph}
            disabled={building}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--color-blue)]/20 border border-[var(--color-blue)]/30 px-3 py-1.5 text-xs font-medium text-[var(--color-blue)] hover:bg-[var(--color-blue)]/30 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", building && "animate-spin")} />
            {building ? "Building…" : "Rebuild Graph"}
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* SVG Canvas */}
        <div className="relative flex-1 min-w-0 rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/40 overflow-hidden" style={{ height: dims.h }}>
          {nodes.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[var(--color-ink-dim)]">
              <GitBranch className="h-12 w-12 opacity-30" />
              <p className="text-sm font-medium">No graph data</p>
              <p className="text-xs opacity-60">Click "Rebuild Graph" to generate the governance knowledge graph</p>
            </div>
          ) : (
            <svg
              ref={svgRef}
              width={dims.w}
              height={dims.h}
              className={cn("select-none", isPanning ? "cursor-grabbing" : "cursor-grab")}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            >
              <defs>
                {Object.entries(ENTITY_COLORS).map(([type, color]) => (
                  <radialGradient key={type} id={`grad-${type}`} cx="40%" cy="35%" r="70%">
                    <stop offset="0%" stopColor={color.stroke} stopOpacity="0.9" />
                    <stop offset="100%" stopColor={color.fill} stopOpacity="1" />
                  </radialGradient>
                ))}
                <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="rgba(30,41,59,0.25)" />
                </marker>
              </defs>

              <g transform={`translate(${pan.x},${pan.y}) scale(${scale})`}>
                {/* Edges */}
                {visibleEdges.map(edge => {
                  const sp = positions.get(edge.sourceNodeId);
                  const tp = positions.get(edge.targetNodeId);
                  if (!sp || !tp) return null;
                  const src = nodes.find(n => n.id === edge.sourceNodeId);
                  const color = ENTITY_COLORS[src?.entityType ?? "vendor"];
                  const highlight = connectedIds
                    ? connectedIds.has(edge.sourceNodeId) && connectedIds.has(edge.targetNodeId)
                    : true;
                  const opacity = highlight ? 0.35 : 0.08;
                  const strokeW = Math.max(0.5, (edge.strength / 100) * 2);

                  // Curve
                  const mx = (sp.x + tp.x) / 2;
                  const my = (sp.y + tp.y) / 2 - 20;
                  return (
                    <path
                      key={edge.id}
                      d={`M ${sp.x} ${sp.y} Q ${mx} ${my} ${tp.x} ${tp.y}`}
                      fill="none"
                      stroke={color?.stroke ?? "#fff"}
                      strokeWidth={strokeW}
                      strokeOpacity={opacity}
                      markerEnd="url(#arrowhead)"
                    />
                  );
                })}

                {/* Nodes */}
                {visibleNodes.map(node => {
                  const pos = positions.get(node.id);
                  if (!pos) return null;
                  const color = ENTITY_COLORS[node.entityType];
                  const isSelected = selectedNode?.id === node.id;
                  const isHovered = hoveredNode === node.id;
                  const isDimmed = connectedIds ? !connectedIds.has(node.id) : false;
                  const r = isSelected ? 14 : isHovered ? 12 : 10;
                  const meta = node.metadata as Record<string, unknown>;

                  return (
                    <g
                      key={node.id}
                      className="graph-node"
                      transform={`translate(${pos.x},${pos.y})`}
                      style={{ cursor: "pointer", opacity: isDimmed ? 0.25 : 1 }}
                      onClick={() => handleNodeClick(node)}
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                    >
                      {isSelected && (
                        <circle r={r + 6} fill="none" stroke={color?.stroke} strokeWidth={1.5} strokeOpacity={0.5} strokeDasharray="4 2" />
                      )}
                      <circle
                        r={r}
                        fill={`url(#grad-${node.entityType})`}
                        stroke={color?.stroke}
                        strokeWidth={isSelected ? 2 : 1}
                        strokeOpacity={isSelected ? 1 : 0.6}
                      />
                      {/* Score dot for high-risk items */}
                      {node.entityType === "risk" && Number(meta.score ?? 0) >= 15 && (
                        <circle cx={r - 3} cy={-r + 3} r={3} fill="#ef4444" stroke="#1a1a2e" strokeWidth={1} />
                      )}
                      {(isHovered || isSelected || (visibleNodes.length < 30)) && (
                        <text
                          y={r + 14}
                          textAnchor="middle"
                          fontSize="9"
                          fill={color?.text ?? "#fff"}
                          fillOpacity={0.85}
                          style={{ pointerEvents: "none" }}
                        >
                          {node.name.length > 16 ? node.name.slice(0, 14) + "…" : node.name}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
          )}
        </div>

        {/* Detail panel */}
        {selectedNode && (
          <div className="w-72 shrink-0 rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-4 space-y-4 overflow-y-auto" style={{ maxHeight: dims.h }}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <EntityTypeBadge type={selectedNode.entityType} />
                <p className="mt-2 font-semibold text-[var(--color-ink)] text-sm leading-snug">{selectedNode.name}</p>
              </div>
              <button onClick={() => setSelectedNode(null)} className="shrink-0 rounded-lg p-1 hover:bg-[#F8F9FB]"><X className="h-3.5 w-3.5" /></button>
            </div>

            {/* Metadata */}
            {Object.entries(selectedNode.metadata as Record<string, string | number | boolean | null>).filter(([, v]) => v != null && v !== "").length > 0 && (
              <div className="rounded-xl bg-white p-3 space-y-1.5">
                {Object.entries(selectedNode.metadata as Record<string, string | number | boolean | null>).map(([k, v]) => {
                  if (v == null || v === "") return null;
                  return (
                    <div key={k} className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-[var(--color-ink-faint)] capitalize">{k.replace(/([A-Z])/g, " $1").toLowerCase()}</span>
                      <span className="text-[11px] font-medium text-[var(--color-ink)]">{String(v)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Analysis buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleRootCause}
                disabled={isPending}
                className={cn("flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium transition-colors",
                  analysisTab === "root-cause" ? "border-purple-200 bg-purple-100 text-purple-700" : "border-[var(--color-line)] hover:bg-[#F8F9FB] text-[var(--color-ink-dim)]")}
              >
                <GitBranch className="h-4 w-4" />
                Root Cause
              </button>
              <button
                onClick={handleImpact}
                disabled={isPending}
                className={cn("flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium transition-colors",
                  analysisTab === "impact" ? "border-orange-200 bg-orange-100 text-orange-700" : "border-[var(--color-line)] hover:bg-[#F8F9FB] text-[var(--color-ink-dim)]")}
              >
                <Zap className="h-4 w-4" />
                Impact
              </button>
            </div>

            {isPending && (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="h-4 w-4 animate-spin text-[var(--color-ink-dim)]" />
              </div>
            )}

            {/* Root cause results */}
            {analysisTab === "root-cause" && rootCause && !isPending && (
              <div className="space-y-3">
                <p className="text-xs text-[var(--color-ink-dim)] leading-relaxed">{rootCause.summary}</p>
                {rootCause.causes.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">Upstream Causes</p>
                    {rootCause.causes.map((c: any, i: number) => (
                      <div key={i} className="rounded-xl bg-white p-2.5 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <EntityTypeBadge type={c.entityType} />
                          <ImpactSeverityBadge severity={c.impact} />
                        </div>
                        <p className="text-xs font-medium text-[var(--color-ink)]">{c.name}</p>
                        <p className="text-[10px] text-[var(--color-ink-faint)]">{c.relationship}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Impact results */}
            {analysisTab === "impact" && impact && !isPending && (
              <div className="space-y-3">
                <p className="text-xs text-[var(--color-ink-dim)] leading-relaxed">{impact.summary}</p>
                {impact.impacts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">Downstream Impact</p>
                    {impact.impacts.map((imp: any, i: number) => (
                      <div key={i} className="rounded-xl bg-white p-2.5 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <EntityTypeBadge type={imp.entityType} />
                          <ImpactSeverityBadge severity={imp.severity} />
                        </div>
                        <p className="text-xs font-medium text-[var(--color-ink)]">{imp.name}</p>
                        <p className="text-[10px] text-[var(--color-ink-faint)]">{imp.relationship}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Hint */}
            {analysisTab === "none" && (
              <div className="flex items-start gap-2 rounded-xl bg-white p-3 text-[11px] text-[var(--color-ink-faint)]">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>Use Root Cause™ to trace upstream causes or Impact™ to see downstream effects.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
