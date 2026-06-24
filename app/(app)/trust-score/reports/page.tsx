export const dynamic = "force-dynamic";

import Link from "next/link";
import { FileText, Download, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";

const REPORTS = [
  { title: "Executive Trust Report",   description: "Board-ready executive summary of organizational Trust Score&#8482;, trend, factors, and benchmarking.", href: "/trust-score/insights",          type: "live" as const },
  { title: "Vendor Trust Report",      description: "Full vendor trust portfolio with scores, heatmap, and ranking by trust level.", href: "/trust-score/vendors",           type: "live" as const },
  { title: "Trust Trend Report",       description: "30, 90, and 365-day Trust Score&#8482; history with monthly sparkline and drift analysis.", href: "/trust-score/trends",            type: "live" as const },
  { title: "Trust Benchmark Report",   description: "Industry peer comparison across 5 sectors with percentile ranking and maturity classification.", href: "/trust-score/benchmarking",       type: "live" as const },
  { title: "Trust Forecast Report",    description: "30 and 90-day predictive trust trajectory based on current governance velocity.", href: "/trust-score",                   type: "live" as const },
  { title: "Trust Factor Report",      description: "Detailed breakdown of all 8 Trust Score&#8482; components with source module links and contribution analysis.", href: "/trust-score/factors",           type: "live" as const },
  { title: "Board Trust Summary",      description: "AI-narrated board governance summary including Trust Score&#8482;, benchmark position, and top risks.", href: "/executive-reporting/board-reports", type: "pdf" as const },
  { title: "Compliance Executive PDF", description: "AI-narrated executive compliance summary across all active frameworks.", href: "/reports/compliance/executive",  type: "pdf" as const },
  { title: "Vendor Trust CSV",         description: "Download all vendor trust scores with component breakdown.", href: "/vendors/export",                type: "csv" as const },
  { title: "Risk Register CSV",        description: "Download all open risks with trust impact scores.", href: "/reports/risks/csv",             type: "csv" as const },
  { title: "Audit Findings CSV",       description: "Download all audit findings weighted by trust impact.", href: "/reports/audits/findings",       type: "csv" as const },
];

const TYPE_BADGE = {
  live: { label: "Live View", cls: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
  pdf:  { label: "PDF",       cls: "bg-purple-500/10 text-purple-400 border border-purple-500/20" },
  csv:  { label: "CSV",       cls: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
};
const TYPE_ICON = { live: ExternalLink, pdf: Download, csv: Download };

export default async function TrustReportsPage() {
  await requireUser();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Trust Reports</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
          Export and access all Trust Score&#8482; intelligence &#8212; board summaries, benchmarks, and data exports.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => {
          const badge = TYPE_BADGE[r.type];
          const Icon  = TYPE_ICON[r.type];
          return (
            <Card key={r.title} className="flex flex-col gap-3 p-5 hover:border-[var(--color-blue)]/40 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <FileText className="h-5 w-5 shrink-0 text-[var(--color-blue)] mt-0.5" />
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.cls}`}>{badge.label}</span>
              </div>
              <div>
                <p className="font-semibold text-sm">{r.title}</p>
                <p className="text-xs text-[var(--color-ink-dim)] mt-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: r.description }} />
              </div>
              <Link href={r.href} className="mt-auto flex items-center gap-1.5 text-xs font-medium text-[var(--color-blue)] hover:text-[var(--color-blue)]/80 transition-colors">
                <Icon className="h-3.5 w-3.5" />
                {r.type === "live" ? "Open Report" : r.type === "pdf" ? "Generate PDF" : "Download CSV"}
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
