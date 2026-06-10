export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createWorkflowAction } from "@/lib/workflow-studio/actions";
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
  { value: "manual", label: "Manual — started by a user" },
  { value: "record_created", label: "Record Created — when a new record is created" },
  { value: "record_updated", label: "Record Updated — when a record is updated" },
  { value: "status_changed", label: "Status Changed — when status changes" },
  { value: "date_reached", label: "Date Reached — on a specific date" },
  { value: "score_threshold", label: "Score Threshold — when a score crosses a threshold" },
  { value: "scheduled", label: "Scheduled — recurring on a schedule" },
];

export default async function NewWorkflowPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; module?: string; trigger?: string; name?: string; description?: string }>;
}) {
  const session = await requireUser();
  const sp = await searchParams;

  async function handleCreate(formData: FormData) {
    "use server";
    const result = await createWorkflowAction(formData);
    if (result && "id" in result) {
      redirect(`/workflow-studio/${result.id}`);
    }
  }

  if (session.demo || !session.org) {
    return (
      <Card className="p-8 text-center">
        <p className="font-semibold">Not available in demo mode.</p>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">New Workflow</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">Create a governance automation workflow</p>
      </div>

      <Card className="p-6">
        <form action={handleCreate} className="space-y-5">
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
              defaultValue={sp.name ?? ""}
              placeholder="e.g. Vendor Onboarding, Risk Review, Policy Approval"
              className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={sp.description ?? ""}
              placeholder="What does this workflow do?"
              className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="module">Module</label>
              <select
                id="module"
                name="module"
                defaultValue={sp.module ?? "custom"}
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
                defaultValue={sp.trigger ?? "manual"}
                className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                {TRIGGER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit">Create Workflow</Button>
            <a href="/workflow-studio/library">
              <Button type="button" variant="outline">Cancel</Button>
            </a>
          </div>
        </form>
      </Card>
    </div>
  );
}
