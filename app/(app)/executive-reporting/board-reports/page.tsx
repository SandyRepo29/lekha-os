export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getReports } from "@/lib/services/executive-reporting/executive-reporting-service";
import Link from "next/link";
import { ArrowLeft, FileText, Download, Plus, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { GenerateReportButton } from "./generate-report-button";

const REPORT_TYPES = [
  { key: "board_governance", label: "Board Governance Report", desc: "Full governance overview for board of directors" },
  { key: "risk_committee", label: "Risk Committee Report", desc: "Risk posture, top risks, and treatment status" },
  { key: "audit_committee", label: "Audit Committee Report", desc: "Audit findings, CAPAs, and remediation progress" },
  { key: "privacy_governance", label: "Privacy Governance Report", desc: "DPDP compliance, data assets, and consent status" },
  { key: "vendor_governance", label: "Vendor Governance Report", desc: "Vendor trust scores, risk exposure, and reviews" },
  { key: "contract_governance", label: "Contract Governance Report", desc: "Contract health, expiry, and obligation status" },
  { key: "executive_governance", label: "Executive Governance Report", desc: "Executive summary across all governance domains" },
  { key: "trust_intelligence", label: "Trust Intelligence Report", desc: "Org Trust Score™ deep-dive and driver analysis" },
];

const STATUS_STYLES: Record<string, string> = {
  ready: "bg-emerald-500/15 text-emerald-400",
  generating: "bg-amber-500/15 text-amber-400",
  draft: "bg-[var(--color-line)] text-[var(--color-ink-dim)]",
  failed: "bg-red-500/15 text-red-400",
};

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ready: CheckCircle,
  generating: Clock,
  draft: FileText,
  failed: AlertCircle,
};

export default async function BoardReportsPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";

  const reports = await getReports(orgId).catch(() => []);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/executive-reporting" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]">
          <ArrowLeft className="h-3.5 w-3.5" />
          Executive Reporting™
        </Link>
        <h1 className="text-2xl font-bold">Board Reporting™</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
          Generate pre-built board-ready reports for governance committees and leadership.
        </p>
      </div>

      {/* Report type cards */}
      <div>
        <h2 className="mb-4 text-base font-semibold">Available Report Types</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {REPORT_TYPES.map(({ key, label, desc }) => (
            <div
              key={key}
              className="flex items-start justify-between rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-5"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--color-blue)]/10 mt-0.5">
                  <FileText className="h-4 w-4 text-[var(--color-blue)]" />
                </div>
                <div>
                  <div className="font-semibold text-sm">{label}</div>
                  <div className="text-xs text-[var(--color-ink-dim)] mt-0.5">{desc}</div>
                </div>
              </div>
              <GenerateReportButton reportType={key} label="Generate" />
            </div>
          ))}
        </div>
      </div>

      {/* Generated reports history */}
      <div>
        <h2 className="mb-4 text-base font-semibold">Generated Reports</h2>
        {reports.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-dim)]">
                  <th className="px-4 py-3 font-medium">Report</th>
                  <th className="px-4 py-3 font-medium">Format</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {reports.map((r) => {
                  const StatusIcon = STATUS_ICONS[r.status] ?? FileText;
                  return (
                    <tr key={r.id} className="hover:bg-[var(--color-blue)]/5">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <StatusIcon className="h-3.5 w-3.5 text-[var(--color-ink-dim)]" />
                          <span className="font-medium">{r.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 uppercase text-xs text-[var(--color-ink-dim)]">{r.format}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status] ?? ""}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-ink-dim)]">
                        {r.generatedAt ? new Date(r.generatedAt).toLocaleDateString() : new Date(r.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--color-line)] p-10 text-center">
            <FileText className="mx-auto h-10 w-10 text-[var(--color-ink-dim)] mb-3" />
            <p className="font-medium">No reports generated yet</p>
            <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Generate your first board report from the templates above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
