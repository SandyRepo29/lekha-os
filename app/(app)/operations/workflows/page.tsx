export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getWorkflowsAction, getWorkflowInstancesAction } from "@/lib/toe/actions";
import { ToeSubNav, InstanceStatusBadge, fmtDt } from "@/components/toe/toe-ui";
import { GitBranch, Play, Plus, Clock } from "lucide-react";
import { StartWorkflowButton, CreateWorkflowButton } from "@/components/toe/workflow-actions";

export default async function WorkflowsPage() {
  await requireUser();

  const [wfResult, instResult] = await Promise.all([
    getWorkflowsAction(),
    getWorkflowInstancesAction({ limit: 20 }),
  ]);

  const workflows = ((wfResult as { data?: unknown[] } | null)?.data ?? []) as Array<{
    id: string; name: string; description: string | null; trigger_event: string | null;
    status: string; is_template: boolean; version: number; created_at: string;
    steps: unknown[];
  }>;

  const instances = ((instResult as { data?: unknown[] } | null)?.data ?? []) as Array<{
    id: string; workflow_name: string; status: string; current_step: number;
    total_steps: number; started_at: string; completed_at: string | null;
  }>;

  const templates = workflows.filter(w => w.is_template);
  const orgWorkflows = workflows.filter(w => !w.is_template);

  return (
    <div className="space-y-6 p-6">
      <ToeSubNav />

      <div className="pt-2 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Workflow Orchestration Engine™</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
            Multi-step governance workflows connecting every module into complete business processes.
          </p>
        </div>
        <CreateWorkflowButton />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Workflow Templates */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-[var(--color-blue)]" />
            <span className="text-sm font-semibold">Built-in Templates</span>
            <span className="ml-auto rounded-full bg-[var(--color-blue)]/10 px-2 py-0.5 text-[11px] text-[var(--color-blue)]">{templates.length}</span>
          </div>
          {templates.length === 0
            ? <p className="text-sm text-[var(--color-ink-dim)]">No templates found. Run the migration to seed built-in workflow templates.</p>
            : (
              <div className="space-y-3">
                {templates.map(wf => (
                  <div key={wf.id} className="rounded-xl border border-[var(--color-line)] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{wf.name}</div>
                        {wf.description && <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">{wf.description}</p>}
                        {wf.trigger_event && (
                          <div className="mt-1 font-mono text-[11px] text-[var(--color-blue)]">trigger: {wf.trigger_event}</div>
                        )}
                        <div className="mt-1 text-[11px] text-[var(--color-ink-dim)]">{(wf.steps as unknown[]).length} steps</div>
                      </div>
                      <StartWorkflowButton workflowId={wf.id} name={wf.name} />
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>

        {/* Org Workflows */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-semibold">Custom Workflows</span>
            <span className="ml-auto rounded-full bg-purple-500/10 px-2 py-0.5 text-[11px] text-purple-400">{orgWorkflows.length}</span>
          </div>
          {orgWorkflows.length === 0
            ? (
              <div className="py-8 text-center">
                <GitBranch className="mx-auto mb-3 h-8 w-8 text-[var(--color-ink-dim)]" />
                <p className="text-sm text-[var(--color-ink-dim)]">No custom workflows yet.</p>
                <p className="mt-1 text-xs text-[var(--color-ink-dim)]">Create a workflow to orchestrate your governance processes.</p>
              </div>
            )
            : (
              <div className="space-y-3">
                {orgWorkflows.map(wf => (
                  <div key={wf.id} className="rounded-xl border border-[var(--color-line)] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{wf.name}</div>
                        {wf.description && <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">{wf.description}</p>}
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            wf.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-400'
                          }`}>{wf.status}</span>
                          <span className="text-[11px] text-[var(--color-ink-dim)]">v{wf.version} · {(wf.steps as unknown[]).length} steps</span>
                        </div>
                      </div>
                      <StartWorkflowButton workflowId={wf.id} name={wf.name} />
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </div>

      {/* Workflow Instances */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-[var(--color-ink-dim)]" />
          <span className="text-sm font-semibold">Workflow Runs</span>
          <span className="ml-auto rounded-full bg-[#F8F9FB] px-2 py-0.5 text-[11px] text-[var(--color-ink-dim)]">{instances.length}</span>
        </div>
        {instances.length === 0
          ? <p className="text-sm text-[var(--color-ink-dim)]">No workflow runs yet. Start a workflow using the &#9654; button above.</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-line)] text-left text-[var(--color-ink-dim)]">
                    <th className="pb-2 font-medium">Workflow</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Progress</th>
                    <th className="pb-2 font-medium">Started</th>
                    <th className="pb-2 font-medium">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {instances.map(inst => (
                    <tr key={inst.id} className="border-b border-[var(--color-line)] last:border-0">
                      <td className="py-2.5 pr-4 font-medium">{inst.workflow_name}</td>
                      <td className="py-2.5 pr-4"><InstanceStatusBadge status={inst.status} /></td>
                      <td className="py-2.5 pr-4 text-[var(--color-ink-dim)]">
                        {inst.total_steps > 0 ? `${inst.current_step}/${inst.total_steps}` : "—"}
                      </td>
                      <td className="py-2.5 pr-4 text-[var(--color-ink-dim)]">{fmtDt(inst.started_at)}</td>
                      <td className="py-2.5 text-[var(--color-ink-dim)]">{inst.completed_at ? fmtDt(inst.completed_at) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
    </div>
  );
}
