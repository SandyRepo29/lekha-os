export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { findAllIncidents } from "@/lib/repositories/ai-governance-repo";
import Link from "next/link";
import { Bug, Plus } from "lucide-react";
import { AIGovStat, AIIncidentSeverityBadge } from "@/components/ai-governance/ai-governance-ui";

const TYPE_LABELS: Record<string, string> = {
  hallucination: "Hallucination", bias_event: "Bias Event", data_exposure: "Data Exposure",
  unauthorized_usage: "Unauthorized Usage", model_failure: "Model Failure",
  prompt_injection: "Prompt Injection", compliance_violation: "Compliance Violation", other: "Other",
};
const STATUS_COLORS: Record<string, string> = {
  open: "bg-red-100 text-red-700", investigating: "bg-[var(--color-blue)]/10 text-[var(--color-blue)]",
  contained: "bg-yellow-100 text-yellow-700", resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-slate-100 text-[var(--color-ink-faint)]",
};

export default async function AiIncidentsPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const incidents = await findAllIncidents(orgId).catch(() => []);

  const open = incidents.filter(i => i.status === "open").length;
  const investigating = incidents.filter(i => i.status === "investigating").length;
  const resolved = incidents.filter(i => i.status === "resolved" || i.status === "closed").length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bug className="h-6 w-6 text-red-700" /> AI Incidents™
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Track hallucinations, bias events, data exposure, prompt injection, and compliance violations.</p>
        </div>
        <Link href="/ai-governance/incidents/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          <Plus className="h-4 w-4" /> Report Incident
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <AIGovStat label="Open" value={open} accent={open > 0 ? "danger" : "neutral"} />
        <AIGovStat label="Investigating" value={investigating} accent={investigating > 0 ? "warn" : "neutral"} />
        <AIGovStat label="Resolved" value={resolved} accent={resolved > 0 ? "good" : "neutral"} />
      </div>

      <div className="space-y-3">
        {incidents.map((i) => (
          <div key={i.id} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-4 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="font-medium">{i.title}</div>
              <div className="mt-1 text-xs text-[var(--color-ink-dim)]">{i.description?.slice(0, 100)}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-xs text-[var(--color-ink-dim)]">{TYPE_LABELS[i.incidentType] ?? i.incidentType}</span>
                <span className="text-xs text-[var(--color-ink-dim)]">·</span>
                <span className="text-xs text-[var(--color-ink-dim)]">
                  {new Date(i.detectedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 items-end shrink-0">
              <AIIncidentSeverityBadge severity={i.severity} />
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[i.status] ?? ""}`}>{i.status}</span>
            </div>
          </div>
        ))}
        {incidents.length === 0 && (
          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] py-12 text-center text-[var(--color-ink-dim)]">
            No incidents reported yet.
          </div>
        )}
      </div>
    </div>
  );
}
