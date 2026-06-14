export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getWorkflowDetail } from "@/lib/services/workflow-studio/workflow-service";
import { updateWorkflowAction } from "@/lib/workflow-studio/actions";
import { GitBranch } from "lucide-react";

const MODULE_OPTIONS = [
  { value: "vendor_hub", label: "Vendor Hub™" },
  { value: "audit_management", label: "Audit Management" },
  { value: "risk_lens", label: "Risk Lens™" },
  { value: "control_center", label: "Control Center™" },
  { value: "policy_governance", label: "Policy Governance™" },
  { value: "dpdp_privacy", label: "DPDP Privacy™" },
  { value: "contract_governance", label: "Contract Governance™" },
  { value: "issue_hub", label: "Issue Hub™" },
  { value: "evidence_vault", label: "Evidence Vault™" },
  { value: "trust_intelligence", label: "Trust Intelligence™" },
  { value: "custom", label: "Custom" },
];

const TRIGGER_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "record_created", label: "Record Created" },
  { value: "record_updated", label: "Record Updated" },
  { value: "status_changed", label: "Status Changed" },
  { value: "date_reached", label: "Date Reached" },
  { value: "score_threshold", label: "Score Threshold" },
  { value: "scheduled", label: "Scheduled" },
];

export default async function EditWorkflowPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;

  if (session.demo || !session.org) return notFound();

  const wf = await getWorkflowDetail(session.org.id, id).catch(() => null);
  if (!wf) notFound();

  async function handleUpdate(formData: FormData) {
    "use server";
    await updateWorkflowAction(id, formData);
    redirect(`/workflow-studio/${id}`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Edit Workflow</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">{wf.name}</p>
      </div>

      <Card className="p-6">
        <form action={handleUpdate} className="space-y-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <GitBranch className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium">Workflow Definition</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="name">Workflow Name *</label>
            <input
              id="name"
              name="name"
              required
              defaultValue={wf.name}
              className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={wf.description ?? ""}
              className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="module">Module</label>
              <select
                id="module"
                name="module"
                defaultValue={wf.module}
                className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                {MODULE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="triggerType">Trigger</label>
              <select
                id="triggerType"
                name="triggerType"
                defaultValue={wf.triggerType}
                className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                {TRIGGER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit">Save Changes</Button>
            <a href={`/workflow-studio/${id}`}>
              <Button type="button" variant="outline">Cancel</Button>
            </a>
          </div>
        </form>
      </Card>
    </div>
  );
}
