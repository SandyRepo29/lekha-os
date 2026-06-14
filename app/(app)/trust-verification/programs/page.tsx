export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getPrograms } from "@/lib/services/trust-verification/trust-verification-service";
import { ShieldCheck, Star, Lock, Brain, AlertTriangle, Building2, ClipboardCheck, Award, Flag, ArrowRight, Plus } from "lucide-react";

const BADGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "shield-check": ShieldCheck, "building-2": Building2, "lock": Lock, "brain": Brain,
  "alert-triangle": AlertTriangle, "star": Star, "clipboard-check": ClipboardCheck,
  "shield": ShieldCheck, "flag": Flag, "award": Award,
};

export default async function ProgramsPage() {
  const session = await requireUser();
  const programs = await getPrograms(session.org?.id ?? "").catch(() => []);
  const builtin = programs.filter((p: any) => p.programType === "builtin");
  const custom = programs.filter((p: any) => p.programType === "custom");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Verification Programs™</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Built-in and custom verification programs — each with requirements, evidence, and validity periods.</p>
        </div>
        <Link href="/trust-verification/applications/new" className="flex items-center gap-2 rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white">
          <ShieldCheck className="h-4 w-4" /> Apply Now
        </Link>
      </div>

      {/* Built-in Programs */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-[var(--color-ink-dim)] uppercase tracking-wider">AUDT Built-in Programs</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {builtin.map((p: any) => {
            const Icon = BADGE_ICONS[p.badgeIcon ?? "shield-check"] ?? ShieldCheck;
            return (
              <div key={p.id} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
                <div className="flex items-start gap-3 mb-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: `${p.badgeColor}20` }}>
                    <span style={{ color: p.badgeColor }}><Icon className="h-5 w-5" /></span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm">{p.name}</div>
                    <div className="text-[11px] text-[var(--color-ink-faint)] mt-0.5">Valid {p.validityMonths}mo · {p.reviewFrequency}</div>
                  </div>
                </div>
                <p className="text-xs text-[var(--color-ink-dim)] mb-3 leading-relaxed">{p.description}</p>
                <div className="space-y-1 mb-4">
                  <div className="text-[11px] font-medium text-[var(--color-ink-dim)] uppercase tracking-wide mb-1">Requirements</div>
                  {(p.requirements ?? []).slice(0, 4).map((req: any) => (
                    <div key={req.id} className="flex items-center gap-1.5 text-[11px] text-[var(--color-ink-dim)]">
                      <span className="h-1 w-1 rounded-full bg-[var(--color-ink-faint)] shrink-0" />
                      {req.label}
                    </div>
                  ))}
                  {(p.requirements ?? []).length > 4 && (
                    <div className="text-[11px] text-[var(--color-ink-faint)]">+{p.requirements.length - 4} more…</div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[11px] text-[var(--color-ink-faint)]">
                    <span>Score ≥ {p.minTrustScore}</span>
                    <span>Controls ≥ {p.minControlHealth}%</span>
                  </div>
                  <Link href={`/trust-verification/applications/new?programId=${p.id}`}
                    className="flex items-center gap-1 rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium hover:bg-white/[0.07]">
                    Apply <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Programs */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-ink-dim)] uppercase tracking-wider">Custom Programs</h2>
          <button className="flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-1.5 text-xs font-medium hover:bg-white/[0.07]">
            <Plus className="h-3.5 w-3.5" /> Create Program
          </button>
        </div>
        {custom.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {custom.map((p: any) => (
              <div key={p.id} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/10">
                    <Star className="h-5 w-5 text-violet-400" />
                  </span>
                  <div>
                    <div className="font-semibold text-sm">{p.name}</div>
                    <div className="text-[11px] text-[var(--color-ink-faint)]">Custom · {p.validityMonths}mo</div>
                  </div>
                </div>
                <p className="text-xs text-[var(--color-ink-dim)]">{p.description ?? "No description."}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--color-line)] p-8 text-center">
            <Star className="mx-auto mb-3 h-8 w-8 text-[var(--color-ink-faint)]" />
            <div className="text-sm font-medium mb-1">No custom programs</div>
            <p className="text-xs text-[var(--color-ink-dim)]">Create custom verification programs tailored to your industry or partner requirements.</p>
          </div>
        )}
      </div>
    </div>
  );
}
