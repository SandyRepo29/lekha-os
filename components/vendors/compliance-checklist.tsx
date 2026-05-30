import { CheckCircle2, Circle, AlertTriangle, XCircle, ChevronDown } from "lucide-react";
import type { ChecklistResult } from "@/lib/services/template-service";

export function ComplianceChecklist({ checklist }: { checklist: ChecklistResult }) {
  const { templateName, items, requiredTotal, requiredDone, completionScore } = checklist;
  const required = items.filter((i) => i.isRequired);
  const optional = items.filter((i) => !i.isRequired);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[var(--color-ink)]">Onboarding checklist</div>
          <div className="mt-0.5 text-xs text-[var(--color-ink-faint)]">
            Template: {templateName} · {requiredDone}/{requiredTotal} required docs
          </div>
        </div>
        <div className={`text-right font-[family-name:var(--font-display)] text-2xl font-bold ${
          completionScore === 100 ? "text-emerald-400" : completionScore >= 60 ? "text-[var(--color-blue)]" : "text-amber-400"
        }`}>
          {completionScore}%
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${completionScore}%`,
            background: completionScore === 100
              ? "linear-gradient(90deg, #10b981, #34d058)"
              : completionScore >= 60
              ? "linear-gradient(90deg, #6366f1, #8b5cf6)"
              : "linear-gradient(90deg, #f59e0b, #fbbf24)",
          }}
        />
      </div>

      {/* Required docs */}
      <ul className="space-y-1.5">
        {required.map((item) => (
          <li key={item.documentType} className="flex items-center gap-2.5">
            <ItemIcon item={item} />
            <span className={`text-sm flex-1 ${item.uploaded ? "text-[var(--color-ink)]" : "text-[var(--color-ink-dim)]"}`}>
              {item.documentType}
            </span>
            {item.uploaded && item.status !== "valid" && (
              <span className={`text-xs font-semibold ${item.status === "expired" ? "text-red-400" : "text-amber-400"}`}>
                {item.status}
              </span>
            )}
          </li>
        ))}
      </ul>

      {/* Optional docs */}
      {optional.length > 0 && (
        <details className="group">
          <summary className="flex cursor-pointer items-center gap-1.5 text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-ink-dim)]">
            <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
            {optional.filter((i) => !i.uploaded).length} optional docs not uploaded
          </summary>
          <ul className="mt-2 space-y-1.5 pl-5">
            {optional.map((item) => (
              <li key={item.documentType} className="flex items-center gap-2.5">
                <ItemIcon item={item} />
                <span className="text-sm text-[var(--color-ink-faint)]">{item.documentType}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function ItemIcon({ item }: { item: { uploaded: boolean; status: string; isRequired: boolean } }) {
  if (!item.uploaded) return <Circle className="h-4 w-4 shrink-0 text-[var(--color-ink-faint)]" />;
  if (item.status === "expired") return <XCircle className="h-4 w-4 shrink-0 text-red-400" />;
  if (item.status === "expiring") return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />;
  return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />;
}
