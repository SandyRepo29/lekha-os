import { cn } from "@/lib/utils";
import { computeRiskScore, scoreToLevel, type RiskScoreLevel } from "@/backend/src/modules/risk-lens/risk-scoring";

// ---- Risk Status Badge ----

const statusStyles: Record<string, string> = {
  identified: "bg-blue-100 text-blue-700 border border-blue-200",
  under_assessment: "bg-purple-100 text-purple-700 border border-purple-200",
  open: "bg-amber-100 text-amber-700 border border-amber-200",
  mitigating: "bg-indigo-100 text-indigo-700 border border-indigo-200",
  accepted: "bg-slate-100 text-slate-700 border border-slate-200",
  transferred: "bg-cyan-100 text-cyan-700 border border-cyan-200",
  closed: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  archived: "bg-zinc-100 text-zinc-700 border border-zinc-200",
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
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", statusStyles[status] ?? "bg-zinc-100 text-zinc-700")}>
      {statusLabels[status] ?? status}
    </span>
  );
}

// ---- Risk Score Level Badge ----

const levelStyles: Record<RiskScoreLevel, string> = {
  low: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  moderate: "bg-lime-100 text-lime-700 border border-lime-200",
  high: "bg-amber-100 text-amber-700 border border-amber-200",
  critical: "bg-red-100 text-red-700 border border-red-200",
  severe: "bg-purple-100 text-purple-700 border border-purple-200",
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
  operational: "bg-slate-100 text-slate-700",
  cyber_security: "bg-red-100 text-red-700",
  compliance: "bg-indigo-100 text-indigo-700",
  vendor: "bg-blue-100 text-blue-700",
  privacy: "bg-purple-100 text-purple-700",
  financial: "bg-emerald-100 text-emerald-700",
  legal: "bg-amber-100 text-amber-700",
  strategic: "bg-cyan-100 text-cyan-700",
  technology: "bg-violet-100 text-violet-700",
  business_continuity: "bg-orange-100 text-orange-700",
  third_party: "bg-sky-100 text-sky-700",
  regulatory: "bg-rose-100 text-rose-700",
  custom: "bg-zinc-100 text-zinc-700",
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
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", categoryColors[category] ?? "bg-zinc-100 text-zinc-700")}>
      {categoryLabels[category] ?? category}
    </span>
  );
}

// ---- Treatment Status Badge ----

const treatmentStatusStyles: Record<string, string> = {
  open: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-zinc-100 text-zinc-700",
};

export function TreatmentStatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = { open: "Open", in_progress: "In Progress", completed: "Completed", cancelled: "Cancelled" };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", treatmentStatusStyles[status] ?? "bg-zinc-100 text-zinc-700")}>
      {labels[status] ?? status}
    </span>
  );
}
