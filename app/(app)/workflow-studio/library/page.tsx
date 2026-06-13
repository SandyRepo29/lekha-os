export const dynamic = "force-dynamic";

import Link from "next/link";
import { AlertCircle, Plus, GitBranch, Zap, Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { listWorkflows } from "@/lib/services/workflow-studio/workflow-service";
import {
  WorkflowStatusBadge,
  WorkflowTriggerBadge,
  WorkflowFilterChip,
} from "@/components/workflow-studio/workflow-ui";

const MODULE_LABELS: Record<string, string> = {
  vendor_hub:         "Vendor Hub™",
  evidence_vault:     "Evidence Vault™",
  audit_management:   "Audit Management",
  risk_lens:          "Risk Lens™",
  control_center:     "Control Center™",
  policy_governance:  "Policy Governance™",
  dpdp_privacy:       "DPDP Privacy™",
  contract_governance:"Contract Governance™",
  issue_hub:          "Issue Hub™",
  trust_intelligence: "Trust Intelligence™",
  custom:             "Custom",
};

export default async function WorkflowLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; module?: string; search?: string }>;
}) {
  const session = await requireUser();
  const sp = await searchParams;

  if (session.demo || !session.org) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="h-10 w-10 mx-auto mb-3 text-[var(--color-ink-dim)]" />
        <p className="font-semibold">Workflow Library</p>
        <p className="text-sm text-[var(--color-ink-dim)] mt-1">Connect Supabase to manage workflows.</p>
      </Card>
    );
  }

  const workflows = await listWorkflows(session.org.id, {
    status: sp.status || undefined,
    module: sp.module || undefined,
    search: sp.search || undefined,
  });

  const statuses = ["draft", "active", "archived", "deprecated"];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Workflow Library</h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">{workflows.length} workflow{workflows.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/workflow-studio/new"><Button><Plus className="h-4 w-4" /> New Workflow</Button></Link>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        <WorkflowFilterChip label="All" active={!sp.status} href="/workflow-studio/library" />
        {statuses.map((s) => (
          <WorkflowFilterChip
            key={s}
            label={s.charAt(0).toUpperCase() + s.slice(1)}
            active={sp.status === s}
            href={`/workflow-studio/library?status=${s}`}
          />
        ))}
      </div>

      {/* Workflow grid */}
      {workflows.length === 0 ? (
        <Card className="p-12 text-center">
          <GitBranch className="h-10 w-10 mx-auto mb-3 text-[var(--color-ink-dim)]" />
          <p className="font-semibold">No workflows yet</p>
          <p className="text-sm text-[var(--color-ink-dim)] mt-1">Create your first governance workflow.</p>
          <div className="mt-4">
            <Link href="/workflow-studio/new"><Button><Plus className="h-4 w-4" /> New Workflow</Button></Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workflows.map((wf) => (
            <Link key={wf.id} href={`/workflow-studio/${wf.id}`}>
              <Card className="p-5 hover:bg-white/[0.03] transition-colors h-full flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <GitBranch className="h-4 w-4" />
                  </div>
                  <WorkflowStatusBadge status={wf.status} />
                </div>
                <div>
                  <p className="font-semibold text-sm">{wf.name}</p>
                  {wf.description && <p className="text-xs text-[var(--color-ink-dim)] mt-0.5 line-clamp-2">{wf.description}</p>}
                </div>
                <div className="mt-auto flex items-center justify-between text-xs text-[var(--color-ink-dim)]">
                  <span className="px-2 py-0.5 rounded-full bg-white/5">{MODULE_LABELS[wf.module] ?? wf.module}</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Play className="h-3 w-3" /> {wf.runCount}</span>
                    {wf.activeRunCount > 0 && <span className="flex items-center gap-1 text-[var(--color-blue)]"><Zap className="h-3 w-3" /> {wf.activeRunCount}</span>}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
