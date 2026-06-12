export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { findAllIncidents } from "@/lib/repositories/ai-governance-repo";
import Link from "next/link";
import { Bug, Plus } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  hallucination: "Hallucination", bias_event: "Bias Event", data_exposure: "Data Exposure",
  unauthorized_usage: "Unauthorized Usage", model_failure: "Model Failure",
  prompt_injection: "Prompt Injection", compliance_violation: "Compliance Violation", other: "Other",
};
const SEV_COLORS: Record<string, string> = {
  low: "bg-emerald-500/10 text-emerald-400", medium: "bg-yellow-500/10 text-yellow-400",
  high: "bg-orange-500/10 text-orange-400", critical: "bg-red-500/10 text-red-400",
};
const STATUS_COLORS: Record<string, string> = {
  open: "bg-red-500/10 text-red-400", investigating: "bg-blue-500/10 text-blue-400",
  contained: "bg-yellow-500/10 text-yellow-400", resolved: "bg-emerald-500/10 text-emerald-400",
  closed: "bg-gray-500/10 text-gray-400",
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
            <Bug className="h-6 w-6 text-red-400" /> AI Incidents™
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Track hallucinations, bias events, data exposure, prompt injection, and compliance violations.</p>
        </div>
        <Link href="/ai-governance/incidents/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          <Plus className="h-4 w-4" /> Report Incident
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Open", value: open, color: "text-red-400" },
          { label: "Investigating", value: investigating, color: "text-blue-400" },
          { label: "Resolved", value: resolved, color: "text-emerald-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-4">
            <div className="text-xs text-[var(--color-ink-dim)]">{label}</div>
            <div className={`mt-1 text-2xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
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
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${SEV_COLORS[i.severity] ?? ""}`}>{i.severity}</span>
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
