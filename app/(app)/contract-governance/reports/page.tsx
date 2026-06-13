export const dynamic = "force-dynamic";

import { FileText, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";

const REPORTS = [
  {
    title: "Contract Portfolio CSV",
    description: "Export all contracts with status, value, expiry dates and owner information.",
    href: "/api/v1/contracts/export/csv",
    iconBg: "bg-[var(--color-blue)]/20",
    iconColor: "text-[var(--color-blue)]",
  },
  {
    title: "Obligations CSV",
    description: "Export all contractual obligations with due dates, status and risk level.",
    href: "/api/v1/contracts/obligations/export/csv",
    iconBg: "bg-orange-500/20",
    iconColor: "text-orange-400",
  },
  {
    title: "Renewals Report CSV",
    description: "Export contracts sorted by expiry date with notice periods and action deadlines.",
    href: "/api/v1/contracts/renewals/export/csv",
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
  },
  {
    title: "Clause Risk Report CSV",
    description: "Export all contract clauses with risk levels and AI analysis summaries.",
    href: "/api/v1/contracts/clauses/export/csv",
    iconBg: "bg-red-500/20",
    iconColor: "text-red-400",
  },
];

export default async function ContractReportsPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Contract Reports</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">Export contract data for reporting and analysis</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {REPORTS.map((r) => (
          <Card key={r.title} className="p-6">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${r.iconBg} ${r.iconColor}`}>
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{r.title}</h3>
                <p className="text-sm text-[var(--color-ink-dim)] mb-4">{r.description}</p>
                <a href={r.href}>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" /> Download CSV
                  </Button>
                </a>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
