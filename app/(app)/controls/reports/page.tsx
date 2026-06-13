export const dynamic = "force-dynamic";

import Link from "next/link";
import { FileText, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";

export default async function ControlReportsPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Reports</h1>
        <p className="text-sm text-[var(--color-ink-dim)]">Export control data and health reports</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-blue)]/15 flex items-center justify-center">
              <FileText className="h-5 w-5 text-[var(--color-blue)]" />
            </div>
            <div>
              <p className="text-sm font-semibold">Control Library</p>
              <p className="text-xs text-[var(--color-ink-dim)]">All controls with status and health</p>
            </div>
          </div>
          <Link href="/api/v1/controls/export/csv">
            <Button variant="outline" size="sm" className="w-full">
              <Download className="h-4 w-4" /> Download CSV
            </Button>
          </Link>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-purple)]/15 flex items-center justify-center">
              <FileText className="h-5 w-5 text-[var(--color-purple)]" />
            </div>
            <div>
              <p className="text-sm font-semibold">Testing Report</p>
              <p className="text-xs text-[var(--color-ink-dim)]">All test records with results</p>
            </div>
          </div>
          <Link href="/api/v1/controls/tests/export/csv">
            <Button variant="outline" size="sm" className="w-full">
              <Download className="h-4 w-4" /> Download CSV
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
