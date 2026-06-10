export const dynamic = "force-dynamic";

import { FileText, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";

export default async function ContractReportsPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Contract Reports</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">Export contract data for reporting and analysis</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/20 text-indigo-400 flex-shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Contract Portfolio CSV</h3>
              <p className="text-sm text-[var(--color-ink-dim)] mb-4">
                Export all contracts with status, value, expiry dates and owner information.
              </p>
              <a href="/api/v1/contracts/export/csv">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" /> Download CSV
                </Button>
              </a>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-500/20 text-orange-400 flex-shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Obligations CSV</h3>
              <p className="text-sm text-[var(--color-ink-dim)] mb-4">
                Export all contractual obligations with due dates, status and risk level.
              </p>
              <a href="/api/v1/contracts/obligations/export/csv">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" /> Download CSV
                </Button>
              </a>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-yellow-500/20 text-yellow-400 flex-shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Renewals Report CSV</h3>
              <p className="text-sm text-[var(--color-ink-dim)] mb-4">
                Export contracts sorted by expiry date with notice periods and action deadlines.
              </p>
              <a href="/api/v1/contracts/renewals/export/csv">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" /> Download CSV
                </Button>
              </a>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/20 text-red-400 flex-shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Clause Risk Report CSV</h3>
              <p className="text-sm text-[var(--color-ink-dim)] mb-4">
                Export all contract clauses with risk levels and AI analysis summaries.
              </p>
              <a href="/api/v1/contracts/clauses/export/csv">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" /> Download CSV
                </Button>
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
