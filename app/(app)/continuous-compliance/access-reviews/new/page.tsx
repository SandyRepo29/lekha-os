export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { createAccessReviewAction } from "@/backend/src/modules/continuous-compliance/actions";
import { ArrowLeft } from "lucide-react";

export default async function NewAccessReviewPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link href="/continuous-compliance/access-reviews" className="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">New Access Review Campaign</h1>
          <p className="text-sm text-[var(--color-ink-dim)]">Launch an access certification campaign</p>
        </div>
      </div>

      <form action={createAccessReviewAction.bind(null, null)} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium">Campaign Name *</label>
          <input name="name" required placeholder="e.g. Q2 2026 Privileged Access Review"
            className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-blue)]" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium">Description</label>
          <textarea name="description" rows={2} placeholder="Campaign scope and objectives"
            className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-blue)]" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium">Campaign Type</label>
            <select name="campaignType"
              className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-blue)]">
              <option value="quarterly">Quarterly</option>
              <option value="privileged">Privileged Access</option>
              <option value="application">Application</option>
              <option value="vendor">Vendor</option>
              <option value="emergency">Emergency</option>
              <option value="annual">Annual</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium">Risk Level</label>
            <select name="riskLevel"
              className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-blue)]">
              <option value="medium">Medium</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium">Due Date</label>
          <input name="dueDate" type="date"
            className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-blue)]" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium">Scope</label>
          <textarea name="scope" rows={2} placeholder="e.g. All admin accounts, privileged roles, and production system access"
            className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-blue)]" />
        </div>
        <button type="submit"
          className="w-full rounded-xl grad-brand py-2.5 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90">
          Create Campaign
        </button>
      </form>
    </div>
  );
}
