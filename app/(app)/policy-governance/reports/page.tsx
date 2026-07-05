export const dynamic = "force-dynamic";

import Link from "next/link";
import { Download, FileText, Shield, GitBranch } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { getDashboardMetrics } from "@/lib/services/policy-governance/policy-governance-service";

export default async function PolicyReportsPage() {
  const session = await requireUser();
  const metrics = session.org ? await getDashboardMetrics(session.org.id) : null;

  const reports = [
    {
      title: "Policy Library",
      description: "Full list of all policies with status, type, owner, health score, and review dates.",
      icon: FileText,
      href: "/api/v1/policies/export/csv",
      format: "CSV",
      count: metrics?.total ?? 0,
      label: "policies",
    },
    {
      title: "Control Mappings",
      description: "Export all policy-to-control linkages for compliance audit trails.",
      icon: Shield,
      href: "/api/v1/policies/mappings/controls/csv",
      format: "CSV",
      count: null,
      label: null,
    },
    {
      title: "Framework Mappings",
      description: "Export all policy-to-framework linkages showing compliance coverage.",
      icon: GitBranch,
      href: "/api/v1/policies/mappings/frameworks/csv",
      format: "CSV",
      count: null,
      label: null,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Policy Reports</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
          Download policy data for compliance audits and governance reviews
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <Card key={r.title} className="p-5 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-blue)]/10 shrink-0">
                <r.icon className="h-4 w-4 text-[var(--color-blue)]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold">{r.title}</h2>
                <p className="text-xs text-[var(--color-ink-dim)] mt-0.5 leading-relaxed">{r.description}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-[var(--color-line)]">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-[#F8F9FB] rounded-full px-2 py-0.5 text-[var(--color-ink-dim)]">{r.format}</span>
                {r.count !== null && (
                  <span className="text-xs text-[var(--color-ink-faint)]">{r.count} {r.label}</span>
                )}
              </div>
              <Link href={r.href}>
                <Button variant="outline" size="sm">
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold mb-2">Compliance Report (PDF)</h2>
        <p className="text-sm text-[var(--color-ink-dim)] mb-4">
          Generate a full compliance PDF including policy status, attestation rates, and control coverage summary.
        </p>
        <Link href="/reports/compliance/executive">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
            Executive Compliance PDF
          </Button>
        </Link>
      </Card>
    </div>
  );
}
