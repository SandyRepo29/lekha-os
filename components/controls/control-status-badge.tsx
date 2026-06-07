const STATUS_STYLES: Record<string, string> = {
  implemented: "bg-green-500/20 border-green-500/30 text-green-400",
  partial: "bg-yellow-500/20 border-yellow-500/30 text-yellow-400",
  not_implemented: "bg-white/5 border-white/10 text-white/40",
  not_applicable: "bg-white/5 border-white/10 text-white/30",
};

const STATUS_LABELS: Record<string, string> = {
  implemented: "Implemented",
  partial: "Partial",
  not_implemented: "Not Implemented",
  not_applicable: "N/A",
};

const TYPE_STYLES: Record<string, string> = {
  preventive: "bg-blue-500/15 border-blue-500/25 text-blue-400",
  detective: "bg-purple-500/15 border-purple-500/25 text-purple-400",
  corrective: "bg-orange-500/15 border-orange-500/25 text-orange-400",
  compensating: "bg-cyan-500/15 border-cyan-500/25 text-cyan-400",
  administrative: "bg-indigo-500/15 border-indigo-500/25 text-indigo-300",
  technical: "bg-emerald-500/15 border-emerald-500/25 text-emerald-400",
  physical: "bg-amber-500/15 border-amber-500/25 text-amber-400",
  hybrid: "bg-fuchsia-500/15 border-fuchsia-500/25 text-fuchsia-400",
};

const AUTOMATION_STYLES: Record<string, string> = {
  manual: "bg-white/5 border-white/10 text-white/50",
  semi_automated: "bg-sky-500/15 border-sky-500/25 text-sky-400",
  automated: "bg-green-500/15 border-green-500/25 text-green-400",
  ai_assisted: "bg-violet-500/15 border-violet-500/25 text-violet-400",
};

const AUTOMATION_LABELS: Record<string, string> = {
  manual: "Manual",
  semi_automated: "Semi-Auto",
  automated: "Automated",
  ai_assisted: "AI Assisted",
};

const TEST_RESULT_STYLES: Record<string, string> = {
  passed: "bg-green-500/20 border-green-500/30 text-green-400",
  failed: "bg-red-500/20 border-red-500/30 text-red-400",
  partially_effective: "bg-yellow-500/20 border-yellow-500/30 text-yellow-400",
  exception: "bg-orange-500/20 border-orange-500/30 text-orange-400",
  not_tested: "bg-white/5 border-white/10 text-white/40",
};

const TEST_RESULT_LABELS: Record<string, string> = {
  passed: "Passed",
  failed: "Failed",
  partially_effective: "Partial",
  exception: "Exception",
  not_tested: "Not Tested",
};

function Badge({ cls, label }: { cls: string; label: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
}

export function ControlStatusBadge({ status }: { status: string }) {
  return <Badge cls={STATUS_STYLES[status] ?? STATUS_STYLES.not_implemented} label={STATUS_LABELS[status] ?? status} />;
}

export function ControlTypeBadge({ type }: { type: string | null }) {
  if (!type) return null;
  const label = type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ");
  return <Badge cls={TYPE_STYLES[type] ?? "bg-white/5 border-white/10 text-white/40"} label={label} />;
}

export function AutomationBadge({ level }: { level: string | null }) {
  if (!level) return null;
  return <Badge cls={AUTOMATION_STYLES[level] ?? AUTOMATION_STYLES.manual} label={AUTOMATION_LABELS[level] ?? level} />;
}

export function TestResultBadge({ result }: { result: string }) {
  return <Badge cls={TEST_RESULT_STYLES[result] ?? TEST_RESULT_STYLES.not_tested} label={TEST_RESULT_LABELS[result] ?? result} />;
}
