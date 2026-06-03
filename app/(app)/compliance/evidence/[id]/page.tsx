export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Link2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getEvidence } from "@/lib/services/compliance/evidence-service";
import { listFrameworksWithControls } from "@/lib/services/compliance/framework-service";
import * as controlRepo from "@/lib/repositories/control-repo";
import {
  EvidenceStatusBadge,
  EvidenceSourceBadge,
  ControlStatusBadge,
  ControlPriorityBadge,
} from "@/components/compliance/compliance-badges";
import { EvidenceStatusSelect, DeleteEvidence } from "@/components/compliance/evidence-actions";
import { EvidenceMapper } from "@/components/compliance/evidence-mapper";

export default async function EvidenceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireUser();
  if (session.demo || !session.org) notFound();

  const [ev, frameworksWithControls] = await Promise.all([
    getEvidence(session.org.id, id),
    listFrameworksWithControls(session.org.id),
  ]);

  if (!ev) notFound();

  // Resolve the actual control records for mapped controls
  const mappedControls = await Promise.all(
    ev.mappings.map((m) => controlRepo.findById(session.org!.id, m.controlId))
  );
  const validMappedControls = mappedControls.filter(Boolean);
  const mappedControlIds = ev.mappings.map((m) => m.controlId);

  // Shape frameworks for mapper (only pass id, name, controls)
  const mapperFrameworks = frameworksWithControls.map((fw) => ({
    id: fw.id,
    name: fw.name,
    controls: fw.controls.map((c) => ({
      id: c.id,
      controlRef: c.controlRef,
      name: c.name,
      category: c.category,
      status: c.status,
    })),
  }));

  const totalControls = frameworksWithControls.reduce(
    (n, fw) => n + fw.controls.length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/compliance/evidence"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Evidence repository
      </Link>

      {/* Header card */}
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <h1 className="font-[family-name:var(--font-display)] text-xl font-bold leading-snug">
              {ev.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <EvidenceSourceBadge source={ev.source} />
              <EvidenceStatusBadge status={ev.status} />
              {ev.expiresOn && (
                <span
                  className={`text-xs ${
                    new Date(ev.expiresOn) < new Date()
                      ? "text-amber-400"
                      : "text-[var(--color-ink-faint)]"
                  }`}
                >
                  Expires {new Date(ev.expiresOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              )}
            </div>
            {ev.description && (
              <p className="text-sm text-[var(--color-ink-dim)]">{ev.description}</p>
            )}
            {ev.owner && (
              <p className="text-xs text-[var(--color-ink-faint)]">Owner: {ev.owner}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-48">
              <EvidenceStatusSelect evidenceId={id} currentStatus={ev.status} />
            </div>
            <DeleteEvidence evidenceId={id} evidenceTitle={ev.title} />
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Left — control mapper */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">
              Map to controls
            </h2>
            <span className="text-xs text-[var(--color-ink-faint)]">
              {totalControls} controls across {frameworksWithControls.length} frameworks
            </span>
          </div>

          {totalControls === 0 ? (
            <Card className="p-5">
              <p className="text-sm text-[var(--color-ink-dim)]">
                No controls yet.{" "}
                <Link
                  href="/compliance/frameworks/new"
                  className="text-[var(--color-blue)] hover:underline"
                >
                  Add a framework
                </Link>{" "}
                to start mapping.
              </p>
            </Card>
          ) : (
            <Card className="p-4">
              <EvidenceMapper
                evidenceId={id}
                frameworks={mapperFrameworks}
                mappedControlIds={mappedControlIds}
              />
            </Card>
          )}
        </div>

        {/* Right — currently mapped controls */}
        <div className="space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">
            Mapped controls
            <span className="ml-2 text-sm font-normal text-[var(--color-ink-faint)]">
              ({validMappedControls.length})
            </span>
          </h2>

          {validMappedControls.length === 0 ? (
            <Card className="p-5">
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <Link2 className="h-8 w-8 text-[var(--color-ink-faint)]" />
                <p className="text-sm text-[var(--color-ink-dim)]">
                  No controls mapped yet. Use the panel on the left to link this evidence
                  to specific controls.
                </p>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="divide-y divide-[var(--color-line)]">
                {validMappedControls.map((control) => {
                  if (!control) return null;
                  const mapping = ev.mappings.find((m) => m.controlId === control.id);
                  return (
                    <div key={control.id} className="px-4 py-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-[var(--color-ink-faint)]">
                          {control.controlRef}
                        </span>
                        <span className="text-sm font-medium text-[var(--color-ink)] truncate">
                          {control.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ControlStatusBadge status={control.status} />
                        <ControlPriorityBadge priority={control.priority} />
                        {mapping?.mappingType === "ai_suggested" && (
                          <span className="rounded-full border border-[var(--color-blue)]/30 bg-[var(--color-blue)]/10 px-2 py-0.5 text-[10px] text-[var(--color-blue)]">
                            AI suggested
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
