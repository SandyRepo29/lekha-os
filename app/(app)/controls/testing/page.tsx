export const dynamic = "force-dynamic";

import Link from "next/link";
import { Beaker, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { findAllTests } from "@/lib/repositories/control-center-repo";
import { TestResultBadge } from "@/components/controls/control-status-badge";
import { ControlStat } from "@/components/controls/control-ui";

export default async function TestingPage() {
  const session = await requireUser();

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState icon={Beaker} title="Testing" description="Connect Supabase to view test records." />
      </Card>
    );
  }

  const tests = await findAllTests(session.org.id);

  const passCount = tests.filter((t) => t.result === "passed").length;
  const failCount = tests.filter((t) => t.result === "failed").length;
  const passRate = tests.length === 0 ? 0 : Math.round((passCount / tests.length) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Testing</h1>
          <p className="text-sm text-[var(--color-ink-dim)]">All control test records</p>
        </div>
        <Link href="/controls/library">
          <Button size="sm" variant="outline"><Plus className="h-4 w-4" /> Add Test (from control)</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <ControlStat label="Total Tests" value={tests.length} accent="neutral" />
        <ControlStat label="Passed" value={passCount} accent="good" sub={`${passRate}% pass rate`} />
        <ControlStat label="Failed" value={failCount} accent={failCount > 0 ? "danger" : "neutral"} />
      </div>

      {tests.length === 0 ? (
        <Card>
          <EmptyState icon={Beaker} title="No tests yet" description="Add test records from individual control pages." />
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-left">
                  <th className="px-4 py-3 text-xs font-medium text-[var(--color-ink-dim)] uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 text-xs font-medium text-[var(--color-ink-dim)] uppercase tracking-wide">Control</th>
                  <th className="px-4 py-3 text-xs font-medium text-[var(--color-ink-dim)] uppercase tracking-wide">Result</th>
                  <th className="px-4 py-3 text-xs font-medium text-[var(--color-ink-dim)] uppercase tracking-wide">Tester</th>
                  <th className="px-4 py-3 text-xs font-medium text-[var(--color-ink-dim)] uppercase tracking-wide">Method</th>
                  <th className="px-4 py-3 text-xs font-medium text-[var(--color-ink-dim)] uppercase tracking-wide">Comments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {tests.map((t) => (
                  <tr key={t.id} className="hover:bg-white">
                    <td className="px-4 py-3 font-mono text-xs text-[var(--color-ink-dim)]">{t.testDate}</td>
                    <td className="px-4 py-3">
                      <Link href={`/controls/${t.controlId}`} className="hover:text-[var(--color-blue)] transition-colors">
                        <span className="font-mono text-xs text-[var(--color-blue)]">{t.controlRef}</span>
                        <p className="text-sm font-medium truncate max-w-[200px]">{t.controlName}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3"><TestResultBadge result={t.result} /></td>
                    <td className="px-4 py-3 text-xs">{t.testerFullName ?? t.testerName ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-[var(--color-ink-dim)]">{t.method ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-[var(--color-ink-dim)] max-w-[200px] truncate">{t.comments ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
