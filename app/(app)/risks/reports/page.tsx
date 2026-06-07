export const dynamic = "force-dynamic";

import Link from "next/link";
import { BarChart2, FileText, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";

const reports = [
  {
    title: "Risk Register PDF",
    description: "All risks with scores, status, categories, and treatment strategies.",
    href: "/reports/risks/register",
    icon: FileText,
  },
  {
    title: "Executive Risk Report",
    description: "AI-narrated board-ready risk summary — posture, critical risks, recommendations.",
    href: "/reports/risks/executive",
    icon: BarChart2,
  },
  {
    title: "Risk Register CSV",
    description: "Export full risk register as a spreadsheet.",
    href: "/reports/risks/csv",
    icon: Download,
  },
  {
    title: "Treatment Plan CSV",
    description: "Export all treatment actions and their progress.",
    href: "/reports/risks/treatments/csv",
    icon: Download,
  },
];

export default async function RiskReportsPage() {
  await requireUser();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Risk Reports</h1>
        <p className="text-sm text-[var(--color-ink-dim)]">Generate and download risk reports</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {reports.map(({ title, description, href, icon: Icon }) => (
          <Card key={title} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4 text-[var(--color-blue)]" />
                  <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold">{title}</h3>
                </div>
                <p className="text-xs text-[var(--color-ink-dim)]">{description}</p>
              </div>
              <Link href={href} target="_blank">
                <Button variant="ghost" size="sm"><Download className="h-4 w-4" /> Download</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
