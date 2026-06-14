export const dynamic = "force-dynamic";

import { BarChart3, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";

export default async function WorkflowReportsPage() {
  const session = await requireUser();

  if (session.demo || !session.org) {
    return (
      <Card className="p-8 text-center">
        <p className="font-semibold">Not available in demo mode.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Reports</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">Export workflow data for governance reporting</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { title: "Workflow Library", description: "All workflows with status, module, and run counts", href: "/api/v1/workflows?format=csv" },
          { title: "Workflow Runs", description: "All execution records with status and duration", href: "/api/v1/workflow-runs?format=csv" },
          { title: "Pending Approvals", description: "All pending approval requests", href: "/api/v1/workflow-runs?format=csv&status=waiting" },
        ].map((report) => (
          <Card key={report.title} className="p-5 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-4 w-4 text-[var(--color-blue)]" />
                <p className="text-sm font-semibold">{report.title}</p>
              </div>
              <p className="text-xs text-[var(--color-ink-dim)]">{report.description}</p>
            </div>
            <a href={report.href}>
              <Button variant="outline" size="sm"><Download className="h-4 w-4" /> Export</Button>
            </a>
          </Card>
        ))}
      </div>
    </div>
  );
}
