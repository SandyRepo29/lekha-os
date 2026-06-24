export const dynamic = "force-dynamic";

import Link from "next/link";
import { FileText, Download, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { CcSubNav } from "@/components/continuous-compliance/cc-ui";

const REPORTS = [
  {
    title:       "Compliance Check Results",
    description: "All automated compliance check results with pass/fail status and remediation guidance.",
    href:        "/continuous-compliance/checks",
    type:        "live",
  },
  {
    title:       "Framework Readiness Report",
    description: "Per-framework compliance readiness scores, control coverage, and gap analysis.",
    href:        "/continuous-compliance/readiness",
    type:        "live",
  },
  {
    title:       "Vendor Compliance Report",
    description: "Third-party vendor compliance posture &#8212; trust scores and non-compliant vendor list.",
    href:        "/continuous-compliance/vendor-compliance",
    type:        "live",
  },
  {
    title:       "Compliance Timeline",
    description: "90-day compliance score history &#8212; trend, drift analysis, and snapshot log.",
    href:        "/continuous-compliance/timeline",
    type:        "live",
  },
  {
    title:       "Compliance Alerts",
    description: "All open and resolved compliance signals from automated monitoring.",
    href:        "/continuous-compliance/signals",
    type:        "live",
  },
  {
    title:       "Evidence Health Report",
    description: "Evidence monitoring status &#8212; current, expiring, and missing evidence items.",
    href:        "/continuous-compliance/health",
    type:        "live",
  },
  {
    title:       "Compliance Framework PDF",
    description: "Per-framework compliance PDF report with controls, evidence, and readiness narrative.",
    href:        "/compliance/reports",
    type:        "pdf",
  },
  {
    title:       "Executive Compliance PDF",
    description: "AI-narrated executive compliance summary across all active frameworks.",
    href:        "/reports/compliance/executive",
    type:        "pdf",
  },
  {
    title:       "Controls CSV Export",
    description: "Download all controls with health scores, test status, and coverage data.",
    href:        "/api/v1/controls/export/csv",
    type:        "csv",
  },
  {
    title:       "Evidence CSV Export",
    description: "Download all evidence items with status, framework mappings, and expiry dates.",
    href:        "/reports/compliance/evidence",
    type:        "csv",
  },
  {
    title:       "Compliance Gaps CSV",
    description: "Download all open compliance gaps with severity, framework, and recommended actions.",
    href:        "/reports/compliance/gaps",
    type:        "csv",
  },
] as const;

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  live: { label: "Live View",  cls: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
  pdf:  { label: "PDF",        cls: "bg-purple-500/10 text-purple-400 border border-purple-500/20" },
  csv:  { label: "CSV",        cls: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
};

const TYPE_ICON: Record<string, typeof ExternalLink> = {
  live: ExternalLink,
  pdf:  Download,
  csv:  Download,
};

export default async function ComplianceReportsPage() {
  await requireUser();

  return (
    <div className="space-y-6 p-6">
      <CcSubNav />

      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Reports</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
          Compliance reports, exports, and live views across all governance modules
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
              <Link
                href={r.href}
                className="mt-auto flex items-center gap-1.5 text-xs font-medium text-[var(--color-blue)] hover:text-[var(--color-blue)]/80 transition-colors"
              >
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
