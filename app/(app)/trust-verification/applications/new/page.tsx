export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getPrograms } from "@/lib/services/trust-verification/trust-verification-service";
import { applyForVerificationAction } from "@/lib/trust-verification/actions";
import { ShieldCheck } from "lucide-react";

export default async function NewApplicationPage({ searchParams }: { searchParams: { programId?: string } }) {
  const session = await requireUser();
  const programs = await getPrograms(session.org?.id ?? "").catch(() => []);
  const builtinPrograms = programs.filter((p: any) => p.programType === "builtin");

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Apply for Verification</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Select a verification program and submit your application for review.</p>
      </div>

      <form action={async (fd: FormData) => {
        "use server";
        const result = await applyForVerificationAction(null, fd);
        if (result?.ok) redirect("/trust-verification/applications");
      }} className="space-y-5 rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-6">

        <div>
          <label className="mb-1.5 block text-sm font-medium">Verification Program</label>
          <select name="programId" defaultValue={searchParams.programId ?? ""} required
            className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2.5 text-sm focus:border-[var(--color-blue)]/50 focus:outline-none">
            <option value="" disabled>Select a program…</option>
            {builtinPrograms.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name} — min. Trust Score {p.minTrustScore}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Current Trust Score (optional)</label>
          <input type="number" name="trustScore" min="0" max="100" placeholder="e.g. 87"
            className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2.5 text-sm focus:border-[var(--color-blue)]/50 focus:outline-none" />
          <p className="mt-1 text-xs text-[var(--color-ink-faint)]">Leave blank and it will be computed from your current governance data.</p>
        </div>

        {/* Program previews */}
        <div className="rounded-xl border border-[var(--color-line)]/60 bg-white/[0.02] p-4">
          <div className="text-xs font-medium text-[var(--color-ink-dim)] uppercase tracking-wide mb-3">What happens after you apply</div>
          <div className="space-y-2">
            {[
              "1. Eligibility check — automated review of your governance metrics",
              "2. Evidence review — your policies, controls & assessments examined",
              "3. Control validation — control health and testing reviewed",
              "4. Risk review — open critical risks assessed",
              "5. Verification assessment — overall governance assessment generated",
              "6. Decision — Approved, Conditionally Approved, or Rejected",
              "7. Certificate issued — public certificate with QR code published",
            ].map(step => (
              <div key={step} className="flex items-start gap-2 text-xs text-[var(--color-ink-dim)]">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-blue)]" />
                {step}
              </div>
            ))}
          </div>
        </div>

        <button type="submit"
          className="w-full rounded-xl grad-brand py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
          Submit Application
        </button>
      </form>
    </div>
  );
}
