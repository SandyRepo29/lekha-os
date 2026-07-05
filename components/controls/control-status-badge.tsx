const STATUS_STYLES: Record<string, string> = {
  implemented: "bg-green-100 border-green-200 text-green-700",
  partial: "bg-yellow-100 border-yellow-200 text-yellow-700",
  not_implemented: "bg-slate-100 border-slate-200 text-slate-600",
  not_applicable: "bg-slate-100 border-slate-200 text-slate-600",
};

const STATUS_LABELS: Record<string, string> = {
  implemented: "Implemented",
  partial: "Partial",
  not_implemented: "Not Implemented",
  not_applicable: "N/A",
};

const TYPE_STYLES: Record<string, string> = {
  preventive: "bg-blue-100 border-blue-200 text-blue-700",
  detective: "bg-purple-100 border-purple-200 text-purple-700",
  corrective: "bg-orange-100 border-orange-200 text-orange-700",
  compensating: "bg-cyan-100 border-cyan-200 text-cyan-700",
  administrative: "bg-indigo-100 border-indigo-200 text-indigo-700",
  technical: "bg-emerald-100 border-emerald-200 text-emerald-700",
  physical: "bg-amber-100 border-amber-200 text-amber-700",
  hybrid: "bg-fuchsia-100 border-fuchsia-200 text-fuchsia-700",
};

const AUTOMATION_STYLES: Record<string, string> = {
  manual: "bg-slate-100 border-slate-200 text-slate-600",
  semi_automated: "bg-sky-100 border-sky-200 text-sky-700",
  automated: "bg-green-100 border-green-200 text-green-700",
  ai_assisted: "bg-violet-100 border-violet-200 text-violet-700",
};

const AUTOMATION_LABELS: Record<string, string> = {
  manual: "Manual",
  semi_automated: "Semi-Auto",
  automated: "Automated",
  ai_assisted: "AI Assisted",
};

const TEST_RESULT_STYLES: Record<string, string> = {
  passed: "bg-green-100 border-green-200 text-green-700",
  failed: "bg-red-100 border-red-200 text-red-700",
  partially_effective: "bg-yellow-100 border-yellow-200 text-yellow-700",
  exception: "bg-orange-100 border-orange-200 text-orange-700",
  not_tested: "bg-slate-100 border-slate-200 text-slate-600",
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
  return <Badge cls={TYPE_STYLES[type] ?? "bg-slate-100 border-slate-200 text-slate-600"} label={label} />;
}

export function AutomationBadge({ level }: { level: string | null }) {
  if (!level) return null;
  return <Badge cls={AUTOMATION_STYLES[level] ?? AUTOMATION_STYLES.manual} label={AUTOMATION_LABELS[level] ?? level} />;
}

export function TestResultBadge({ result }: { result: string }) {
  return <Badge cls={TEST_RESULT_STYLES[result] ?? TEST_RESULT_STYLES.not_tested} label={TEST_RESULT_LABELS[result] ?? result} />;
}
