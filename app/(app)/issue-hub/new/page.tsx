export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { createIssueAction } from "@/lib/issue-hub/actions";

export default async function NewIssuePage() {
  await requireUser();

  async function handleCreate(formData: FormData) {
    "use server";
    const result = await createIssueAction(formData);
    if (result && "issue" in result && result.issue) {
      redirect(`/issue-hub/${result.issue.id}`);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">New Issue</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
          Log a governance issue for tracking and remediation
        </p>
      </div>

      <Card className="p-6">
        <form action={handleCreate} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              name="title"
              required
              className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-indigo-500/50"
              placeholder="Brief description of the issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              name="description"
              rows={4}
              className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-indigo-500/50 resize-none"
              placeholder="Detailed description, context, and impact..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Issue Type</label>
              <select
                name="issueType"
                className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-indigo-500/50"
              >
                <option value="custom">Custom</option>
                <option value="risk">Risk</option>
                <option value="audit_finding">Audit Finding</option>
                <option value="capa">CAPA</option>
                <option value="control_failure">Control Failure</option>
                <option value="policy_gap">Policy Gap</option>
                <option value="privacy_issue">Privacy Issue</option>
                <option value="vendor_issue">Vendor Issue</option>
                <option value="contract_obligation">Contract Obligation</option>
                <option value="compliance_gap">Compliance Gap</option>
                <option value="security_incident">Security Incident</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Source Module</label>
              <select
                name="sourceModule"
                className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-indigo-500/50"
              >
                <option value="">Manual / Other</option>
                <option value="Risk Lens™">Risk Lens™</option>
                <option value="Audit Management">Audit Management</option>
                <option value="Control Center™">Control Center™</option>
                <option value="Evidence Vault™">Evidence Vault™</option>
                <option value="Policy Governance™">Policy Governance™</option>
                <option value="DPDP Privacy™">DPDP Privacy™</option>
                <option value="Contract Governance™">Contract Governance™</option>
                <option value="Vendor Hub™">Vendor Hub™</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Severity</label>
              <select
                name="severity"
                className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-indigo-500/50"
              >
                <option value="medium">Medium</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="low">Low</option>
                <option value="informational">Informational</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Priority</label>
              <select
                name="priority"
                className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-indigo-500/50"
              >
                <option value="p3">P3 — Medium</option>
                <option value="p1">P1 — Critical</option>
                <option value="p2">P2 — High</option>
                <option value="p4">P4 — Low</option>
                <option value="p5">P5 — Informational</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Due Date</label>
            <input
              name="dueDate"
              type="date"
              className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-indigo-500/50"
            />
            <p className="text-xs text-[var(--color-ink-dim)] mt-1">
              Leave blank to auto-set based on severity SLA
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit">Create Issue</Button>
            <a href="/issue-hub/list">
              <Button variant="outline" type="button">Cancel</Button>
            </a>
          </div>
        </form>
      </Card>
    </div>
  );
}
