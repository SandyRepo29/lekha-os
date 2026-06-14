export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getChecks } from "@/lib/services/continuous-compliance/continuous-compliance-service";
import { runCheckAction } from "@/lib/continuous-compliance/actions";
import { Shield, Play } from "lucide-react";
import { CheckResultBadge, SeverityBadge, CategoryIcon, CcSubNav } from "@/components/continuous-compliance/cc-ui";

const CATEGORIES = ["all","aws","azure","gcp","github","microsoft_365","google_workspace","okta","custom"];

export default async function ChecksPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const sp = await searchParams;
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const checks = await getChecks(orgId).catch(() => []);
  const category = sp.category ?? "all";
  const filtered = category === "all" ? checks : checks.filter(c => c.category === category);

  const byCategory = checks.reduce<Record<string, number>>((acc, c) => {
    acc[c.category] = (acc[c.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 p-6">
      <CcSubNav />

      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Compliance Checks Library™</h1>
        <p className="text-sm text-[var(--color-ink-dim)]">{checks.length} prebuilt + custom automated checks across {Object.keys(byCategory).length} categories</p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <Link
            key={cat}
            href={`/continuous-compliance/checks${cat === "all" ? "" : `?category=${cat}`}`}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
              category === cat
                ? "bg-[var(--color-blue)]/10 border-[var(--color-blue)]/40 text-[var(--color-blue)]"
                : "border-[var(--color-line)] text-[var(--color-ink-dim)] hover:bg-white/[0.04]"
            }`}
          >
            {cat !== "all" && <CategoryIcon category={cat} />}
            <span className="capitalize">{cat.replace(/_/g, " ")}</span>
            {cat !== "all" && <span className="opacity-60">({byCategory[cat] ?? 0})</span>}
          </Link>
        ))}
      </div>

      {/* Check cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(check => (
          <div key={check.id} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.06] text-lg">
                <CategoryIcon category={check.category} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-sm">{check.name}</div>
                    {check.isBuiltin && (
                      <span className="mt-0.5 inline-block rounded-full bg-[var(--color-blue)]/10 px-1.5 py-0.5 text-[10px] text-[var(--color-blue)]">Built-in</span>
                    )}
                  </div>
                  <SeverityBadge severity={check.severity} />
                </div>
                {check.description && (
                  <p className="mt-1.5 text-[11px] text-[var(--color-ink-faint)] leading-relaxed">{check.description}</p>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] text-[var(--color-ink-faint)]">
                <Shield className="h-3 w-3" />
                <span className="capitalize">{check.schedule}</span>
              </div>
              <form action={async () => { "use server"; await runCheckAction(check.id); }}>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-[var(--color-blue)]/10 px-2.5 py-1 text-[11px] font-medium text-[var(--color-blue)] hover:bg-[var(--color-blue)]/20 transition-colors"
                >
                  <Play className="h-3 w-3" /> Run
                </button>
              </form>
            </div>

            {Array.isArray(check.frameworks) && (check.frameworks as string[]).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {(check.frameworks as string[]).slice(0, 3).map((f: string) => (
                  <span key={f} className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-[var(--color-ink-faint)]">{f}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-sm text-[var(--color-ink-faint)]">
          No checks in this category yet.
        </div>
      )}
    </div>
  );
}
