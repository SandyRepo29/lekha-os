export const dynamic = "force-dynamic";

import Link from "next/link";
import { FileText, Download, FileSpreadsheet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { listFrameworks } from "@/lib/services/compliance/framework-service";
import { SectionLabel } from "@/components/compliance/compliance-ui";

export default async function ComplianceReportsPage() {
  const session = await requireUser();

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState icon={FileText} title="Reports" description="Connect Supabase to generate compliance reports." />
      </Card>
    );
  }

  const frameworks = await listFrameworks(session.org.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Reports</h1>
        <p className="text-sm text-[var(--color-ink-dim)]">
          Download compliance reports in PDF or CSV format.
        </p>
      </div>

      {/* PDF reports */}
      <section className="space-y-3">
        <SectionLabel>PDF Reports</SectionLabel>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Executive summary */}
          <ReportCard
            icon={<FileText className="h-5 w-5 text-[var(--color-blue)]" />}
            title="Executive Compliance Summary"
            description="AI-narrated board-level overview across all frameworks — readiness, gaps, policies."
            href="/reports/compliance/executive"
            format="PDF"
          />

          {/* Per-framework */}
          {frameworks.map((fw) => (
            <ReportCard
              key={fw.id}
              icon={<FileText className="h-5 w-5 text-[var(--color-blue)]" />}
              title={`${fw.name} — Framework Report`}
              description={`Controls table, readiness breakdown, open gaps${fw.readiness ? `, ${fw.readiness.overallScore}% readiness` : ""}.`}
              href={`/reports/compliance/framework/${fw.id}`}
              format="PDF"
            />
          ))}

          {frameworks.length === 0 && (
            <div className="col-span-2 rounded-xl border border-[var(--color-line)] p-5 text-sm text-[var(--color-ink-dim)]">
              No frameworks yet.{" "}
              <Link href="/compliance/frameworks/new" className="text-[var(--color-blue)] hover:underline">
                Add a framework
              </Link>{" "}
              to generate per-framework reports.
            </div>
          )}
        </div>
      </section>

      {/* CSV exports */}
      <section className="space-y-3">
        <SectionLabel>CSV Exports</SectionLabel>

        <div className="grid gap-4 sm:grid-cols-3">
          <ReportCard
            icon={<FileSpreadsheet className="h-5 w-5 text-emerald-700" />}
            title="Controls Export"
            description="All controls across all frameworks with status, priority and category."
            href="/reports/compliance/controls"
            format="CSV"
            download="lekha-controls.csv"
          />
          <ReportCard
            icon={<FileSpreadsheet className="h-5 w-5 text-emerald-700" />}
            title="Evidence Export"
            description="All evidence items with source, status, expiry and mapped control count."
            href="/reports/compliance/evidence"
            format="CSV"
            download="lekha-evidence.csv"
          />
          <ReportCard
            icon={<FileSpreadsheet className="h-5 w-5 text-emerald-700" />}
            title="Gaps Export"
            description="All open gaps with framework, type, severity and description."
            href="/reports/compliance/gaps"
            format="CSV"
            download="lekha-gaps.csv"
          />
        </div>
      </section>

      {/* Note */}
      <p className="text-xs text-[var(--color-ink-faint)]">
        PDF reports open in a new tab for preview or direct download.
        AI-narrated sections use cached Gemini outputs — generate them from the{" "}
        <Link href="/compliance/ai" className="text-[var(--color-blue)] hover:underline">AI Officer</Link> page first for best results.
      </p>
    </div>
  );
}

function ReportCard({
  icon, title, description, href, format, download,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  format: "PDF" | "CSV";
  download?: string;
}) {
  const isPdf = format === "PDF";
  return (
    <Card className="flex flex-col justify-between p-5 gap-4 hover:border-[var(--color-line-strong)] transition-colors">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
            isPdf
              ? "border-[var(--color-blue)]/30 bg-[var(--color-blue)]/10 text-[var(--color-blue)]"
              : "border-emerald-200 bg-emerald-100 text-emerald-700"
          }`}>
            {format}
          </span>
        </div>
        <p className="font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--color-ink)]">
          {title}
        </p>
        <p className="text-xs text-[var(--color-ink-dim)] leading-relaxed">{description}</p>
      </div>
      <a
        href={href}
        target={isPdf ? "_blank" : undefined}
        rel={isPdf ? "noopener noreferrer" : undefined}
        download={download}
        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line-strong)] bg-[#F8F9FB] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] transition-colors hover:bg-[#EEF2F7] w-fit"
      >
        <Download className="h-3.5 w-3.5" />
        Download {format}
      </a>
    </Card>
  );
}
