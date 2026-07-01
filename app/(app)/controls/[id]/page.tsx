export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit2, Shield, Beaker, Bot } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { findControlById, findTestsByControl, getHealthInputs } from "@/lib/repositories/control-center-repo";
import { db } from "@/lib/db";
import { count, eq } from "drizzle-orm";
import { controlFrameworks } from "@/lib/db/schema";
import { computeControlHealth, HEALTH_COMPONENT_LABELS } from "@/lib/services/control-health";
import { generateControlNarrative } from "@/lib/services/control-center/ai-control-service";
import { ControlHealthBadge } from "@/components/controls/control-health-badge";
import { ControlStatusBadge, ControlTypeBadge, AutomationBadge, TestResultBadge } from "@/components/controls/control-status-badge";
import { DeleteControlButton, ComputeHealthButton, AddTestForm, DeleteTestButton } from "@/components/controls/control-detail-actions";

function Section({ title, icon: Icon, children }: { title: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 text-[var(--color-ink-dim)] uppercase tracking-wide">
        {Icon && <Icon className="h-4 w-4" />}
        {title}
      </h2>
      {children}
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-[var(--color-ink-dim)] mb-0.5">{label}</dt>
      <dd className="text-sm">{value ?? <span className="text-white/30">—</span>}</dd>
    </div>
  );
}

export default async function ControlDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;

  if (session.demo || !session.org) notFound();

  const [control, tests, inputs, frameworkCountResult] = await Promise.all([
    findControlById(session.org.id, id),
    findTestsByControl(id),
    getHealthInputs(session.org.id, id),
    db.select({ count: count() }).from(controlFrameworks).where(eq(controlFrameworks.controlId, id)),
  ]);
  const linkedFrameworkCount = frameworkCountResult[0]?.count ?? 0;

  if (!control) notFound();

  const health = computeControlHealth(inputs);
  const aiNarrative = await generateControlNarrative(session.org.id, control, health).catch(() => null);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/controls/library" className="text-[var(--color-ink-dim)] hover:text-white transition-colors mt-1">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-[var(--color-blue)] bg-[var(--color-blue)]/10 px-2 py-0.5 rounded">
                {control.controlRef}
              </span>
              <ControlStatusBadge status={control.status} />
              {control.controlType && <ControlTypeBadge type={control.controlType} />}
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">{control.name}</h1>
            {control.ownerName && (
              <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">Owner: {control.ownerName}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ComputeHealthButton controlId={id} />
          <Link href={`/controls/${id}/edit`}>
            <Button variant="outline" size="sm"><Edit2 className="h-4 w-4" /> Edit</Button>
          </Link>
          <DeleteControlButton id={id} />
        </div>
      </div>

      {/* Health Score Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold">Control Health™</h2>
          <ControlHealthBadge score={health.overall} size="md" />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-6">
          {Object.entries(health.components).map(([key, score]) => (
            <div key={key}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--color-ink-dim)]">{HEALTH_COMPONENT_LABELS[key as keyof typeof HEALTH_COMPONENT_LABELS]}</span>
                <span className="font-medium">{score}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-all ${score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {(health.strengths.length > 0 || health.concerns.length > 0) && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {health.strengths.length > 0 && (
              <div>
                <p className="text-xs font-medium text-green-400 mb-2">Strengths</p>
                <ul className="space-y-1">
                  {health.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-[var(--color-ink-dim)] flex gap-2">
                      <span className="text-green-400 flex-shrink-0">✓</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {health.concerns.length > 0 && (
              <div>
                <p className="text-xs font-medium text-orange-400 mb-2">Concerns</p>
                <ul className="space-y-1">
                  {health.concerns.map((c, i) => (
                    <li key={i} className="text-xs text-[var(--color-ink-dim)] flex gap-2">
                      <span className="text-orange-400 flex-shrink-0">!</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* AI Narrative */}
      {aiNarrative && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Bot className="h-4 w-4 text-[var(--color-blue)]" />
            AI Control Analysis
          </h2>
          <div className="text-sm text-[var(--color-ink)] leading-relaxed whitespace-pre-wrap">
            {aiNarrative}
          </div>
        </Card>
      )}

      {/* Details */}
      <Section title="Overview" icon={Shield}>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Detail label="Control ID" value={<span className="font-mono text-xs text-[var(--color-blue)]">{control.controlRef}</span>} />
          <Detail label="Category" value={<span className="capitalize">{control.category?.replace(/_/g, " ")}</span>} />
          <Detail label="Priority" value={<span className="capitalize">{control.priority}</span>} />
          <Detail label="Control Type" value={control.controlType ? <ControlTypeBadge type={control.controlType} /> : null} />
          <Detail label="Automation" value={control.automationLevel ? <AutomationBadge level={control.automationLevel} /> : null} />
          <Detail label="Frequency" value={<span className="capitalize">{control.frequency?.replace(/_/g, " ")}</span>} />
          <Detail label="Last Tested" value={control.lastTested} />
          <Detail label="Next Test" value={control.nextTestDate} />
          <Detail label="Next Review" value={control.nextReviewDate} />
        </dl>

        {control.description && (
          <div className="mt-5 pt-5 border-t border-[var(--color-line)]">
            <dt className="text-xs text-[var(--color-ink-dim)] mb-1">Description</dt>
            <dd className="text-sm text-[var(--color-ink)] leading-relaxed">{control.description}</dd>
          </div>
        )}

        {control.objective && (
          <div className="mt-3">
            <dt className="text-xs text-[var(--color-ink-dim)] mb-1">Objective</dt>
            <dd className="text-sm text-[var(--color-ink)] leading-relaxed">{control.objective}</dd>
          </div>
        )}
      </Section>

      {/* Coverage stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className={`text-2xl font-bold ${inputs.totalEvidenceCount > 0 ? "text-green-400" : "text-white/30"}`}>
            {inputs.approvedEvidenceCount}/{inputs.totalEvidenceCount}
          </p>
          <p className="text-xs text-[var(--color-ink-dim)] mt-1">Approved Evidence</p>
        </Card>
        <Card className="p-4 text-center">
          <p className={`text-2xl font-bold ${inputs.totalRisks > 0 ? "text-blue-400" : "text-white/30"}`}>
            {inputs.totalRisks}
          </p>
          <p className="text-xs text-[var(--color-ink-dim)] mt-1">Linked Risks</p>
        </Card>
        <Card className="p-4 text-center">
          <p className={`text-2xl font-bold ${inputs.openFindings > 0 ? "text-orange-400" : "text-green-400"}`}>
            {inputs.openFindings}
          </p>
          <p className="text-xs text-[var(--color-ink-dim)] mt-1">Open Findings</p>
        </Card>
      </div>

      {/* Testing */}
      <Section title="Testing" icon={Beaker}>
        <div className="flex justify-end mb-4">
          <AddTestForm controlId={id} />
        </div>
        {tests.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-dim)]">No tests recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-[var(--color-line)]">
                  <th className="pb-2 text-xs text-[var(--color-ink-dim)] font-medium">Date</th>
                  <th className="pb-2 text-xs text-[var(--color-ink-dim)] font-medium">Result</th>
                  <th className="pb-2 text-xs text-[var(--color-ink-dim)] font-medium">Tester</th>
                  <th className="pb-2 text-xs text-[var(--color-ink-dim)] font-medium">Method</th>
                  <th className="pb-2 text-xs text-[var(--color-ink-dim)] font-medium">Comments</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {tests.map((t) => (
                  <tr key={t.id} className="hover:bg-white">
                    <td className="py-3 pr-4 font-mono text-xs text-[var(--color-ink-dim)]">{t.testDate}</td>
                    <td className="py-3 pr-4"><TestResultBadge result={t.result} /></td>
                    <td className="py-3 pr-4 text-xs">{t.testerFullName ?? t.testerName ?? "—"}</td>
                    <td className="py-3 pr-4 text-xs text-[var(--color-ink-dim)]">{t.method ?? "—"}</td>
                    <td className="py-3 pr-4 text-xs text-[var(--color-ink-dim)] max-w-[200px] truncate">{t.comments ?? "—"}</td>
                    <td className="py-3"><DeleteTestButton testId={t.id} controlId={id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Connected Entities */}
      <section className="rounded-2xl border border-[var(--color-line)] bg-white p-5 space-y-4">
        <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">Connected Entities</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link href="/compliance/frameworks" className="rounded-xl border border-[var(--color-line)] p-3 hover:bg-[#F8F9FB] transition-colors">
            <div className={`text-2xl font-bold ${linkedFrameworkCount > 0 ? "text-[var(--color-ink)]" : "text-[var(--color-ink-dim)]"}`}>{linkedFrameworkCount}</div>
            <div className="text-xs text-[var(--color-ink-dim)] mt-0.5">Linked Frameworks</div>
          </Link>
          <Link href="/risks/list" className="rounded-xl border border-[var(--color-line)] p-3 hover:bg-[#F8F9FB] transition-colors">
            <div className={`text-2xl font-bold ${inputs.totalRisks > 0 ? "text-[var(--color-ink)]" : "text-[var(--color-ink-dim)]"}`}>{inputs.totalRisks}</div>
            <div className="text-xs text-[var(--color-ink-dim)] mt-0.5">Linked Risks</div>
          </Link>
          <Link href={`/controls/${id}`} className="rounded-xl border border-[var(--color-line)] p-3 hover:bg-[#F8F9FB] transition-colors">
            <div className={`text-2xl font-bold ${inputs.totalTests > 0 ? "text-[var(--color-ink)]" : "text-[var(--color-ink-dim)]"}`}>{inputs.totalTests}</div>
            <div className="text-xs text-[var(--color-ink-dim)] mt-0.5">Tests Recorded</div>
          </Link>
          <Link href="/compliance/evidence" className="rounded-xl border border-[var(--color-line)] p-3 hover:bg-[#F8F9FB] transition-colors">
            <div className={`text-2xl font-bold ${inputs.totalEvidenceCount > 0 ? "text-[var(--color-ink)]" : "text-[var(--color-ink-dim)]"}`}>{inputs.totalEvidenceCount}</div>
            <div className="text-xs text-[var(--color-ink-dim)] mt-0.5">Linked Evidence</div>
          </Link>
        </div>
        <p className="text-xs text-[var(--color-ink-dim)]">
          View the full dependency map in{" "}
          <Link href="/trust-intelligence/trust-graph" className="text-[var(--color-blue)] hover:underline">
            Trust Graph™
          </Link>
        </p>
      </section>
    </div>
  );
}
