import { cn } from "@/lib/utils";
import { computeRiskScore, scoreToLevel, type RiskScoreLevel } from "@/lib/services/risk-scoring";

// ---- Risk Status Badge ----

const statusStyles: Record<string, string> = {
  identified: "bg-blue-500/15 text-blue-300 border border-blue-500/25",
  under_assessment: "bg-purple-500/15 text-purple-300 border border-purple-500/25",
  open: "bg-amber-500/15 text-amber-300 border border-amber-500/25",
  mitigating: "bg-indigo-500/15 text-indigo-300 border border-indigo-500/25",
  accepted: "bg-slate-500/15 text-slate-300 border border-slate-500/25",
  transferred: "bg-cyan-500/15 text-cyan-300 border border-cyan-500/25",
  closed: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25",
  archived: "bg-zinc-500/15 text-zinc-400 border border-zinc-500/25",
};

const statusLabels: Record<string, string> = {
  identified: "Identified",
  under_assessment: "Under Assessment",
  open: "Open",
  mitigating: "Mitigating",
  accepted: "Accepted",
  transferred: "Transferred",
  closed: "Closed",
  archived: "Archived",
};

export function RiskStatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", statusStyles[status] ?? "bg-zinc-500/15 text-zinc-400")}>
      {statusLabels[status] ?? status}
    </span>
  );
}

// ---- Risk Score Level Badge ----

const levelStyles: Record<RiskScoreLevel, string> = {
  low: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25",
  moderate: "bg-lime-500/15 text-lime-300 border border-lime-500/25",
  high: "bg-amber-500/15 text-amber-300 border border-amber-500/25",
  critical: "bg-red-500/15 text-red-400 border border-red-500/25",
  severe: "bg-purple-600/15 text-purple-300 border border-purple-500/25",
};

const levelLabels: Record<RiskScoreLevel, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  critical: "Critical",
  severe: "Severe",
};

export function RiskScoreBadge({ score }: { score: number }) {
  const level = scoreToLevel(score);
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", levelStyles[level])}>
      <span className="font-bold">{score}</span>
      <span className="opacity-80">{levelLabels[level]}</span>
    </span>
  );
}

export function RiskLevelBadge({ level }: { level: RiskScoreLevel }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", levelStyles[level])}>
      {levelLabels[level]}
    </span>
  );
}

// ---- Category Badge ----

const categoryColors: Record<string, string> = {
  operational: "bg-slate-500/15 text-slate-300",
  cyber_security: "bg-red-500/15 text-red-300",
  compliance: "bg-indigo-500/15 text-indigo-300",
  vendor: "bg-blue-500/15 text-blue-300",
  privacy: "bg-purple-500/15 text-purple-300",
  financial: "bg-emerald-500/15 text-emerald-300",
  legal: "bg-amber-500/15 text-amber-300",
  strategic: "bg-cyan-500/15 text-cyan-300",
  technology: "bg-violet-500/15 text-violet-300",
  business_continuity: "bg-orange-500/15 text-orange-300",
  third_party: "bg-sky-500/15 text-sky-300",
  regulatory: "bg-rose-500/15 text-rose-300",
  custom: "bg-zinc-500/15 text-zinc-300",
};

const categoryLabels: Record<string, string> = {
  operational: "Operational",
  cyber_security: "Cyber Security",
  compliance: "Compliance",
  vendor: "Vendor",
  privacy: "Privacy",
  financial: "Financial",
  legal: "Legal",
  strategic: "Strategic",
  technology: "Technology",
  business_continuity: "Business Continuity",
  third_party: "Third Party",
  regulatory: "Regulatory",
  custom: "Custom",
};

export function RiskCategoryBadge({ category }: { category: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", categoryColors[category] ?? "bg-zinc-500/15 text-zinc-300")}>
      {categoryLabels[category] ?? category}
    </span>
  );
}

// ---- Treatment Status Badge ----

const treatmentStatusStyles: Record<string, string> = {
  open: "bg-amber-500/15 text-amber-300",
  in_progress: "bg-blue-500/15 text-blue-300",
  completed: "bg-emerald-500/15 text-emerald-300",
  cancelled: "bg-zinc-500/15 text-zinc-400",
};

export function TreatmentStatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = { open: "Open", in_progress: "In Progress", completed: "Completed", cancelled: "Cancelled" };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", treatmentStatusStyles[status] ?? "bg-zinc-500/15 text-zinc-400")}>
      {labels[status] ?? status}
    </span>
  );
}
