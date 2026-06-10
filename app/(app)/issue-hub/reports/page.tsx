export const dynamic = "force-dynamic";

import { BarChart3, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";

export default async function IssueReportsPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Reports</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
          Export issue data for analysis and audit purposes
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-500/20 text-indigo-400">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium">Issue Registry Export</p>
              <p className="text-xs text-[var(--color-ink-dim)]">All issues with metadata</p>
            </div>
          </div>
          <a href="/api/v1/issues/export/csv">
            <Button variant="outline" size="sm" className="w-full">
              <Download className="h-4 w-4" /> Download CSV
            </Button>
          </a>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-green-500/20 text-green-400">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium">Tasks Export</p>
              <p className="text-xs text-[var(--color-ink-dim)]">All remediation tasks</p>
            </div>
          </div>
          <a href="/api/v1/issues/tasks/export/csv">
            <Button variant="outline" size="sm" className="w-full">
              <Download className="h-4 w-4" /> Download CSV
            </Button>
          </a>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-purple-500/20 text-purple-400">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium">Exceptions Export</p>
              <p className="text-xs text-[var(--color-ink-dim)]">All exception requests with status</p>
            </div>
          </div>
          <a href="/api/v1/issues/exceptions/export/csv">
            <Button variant="outline" size="sm" className="w-full">
              <Download className="h-4 w-4" /> Download CSV
            </Button>
          </a>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-orange-500/20 text-orange-400">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium">SLA Breach Report</p>
              <p className="text-xs text-[var(--color-ink-dim)]">Issues breaching SLA targets</p>
            </div>
          </div>
          <a href="/api/v1/issues/export/csv?slaBreached=true">
            <Button variant="outline" size="sm" className="w-full">
              <Download className="h-4 w-4" /> Download CSV
            </Button>
          </a>
        </Card>
      </div>
    </div>
  );
}
