export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, FileSearch, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { listEvidence } from "@/lib/services/compliance/evidence-service";
import * as evidenceRepo from "@/lib/repositories/evidence-repo";
import {
  EvidenceStatusBadge,
  EvidenceSourceBadge,
} from "@/components/compliance/compliance-badges";
import { AutoImportButton } from "@/components/compliance/auto-import-button";
import { ComplianceStat, FilterChip, formatDate, isExpiredDate } from "@/components/compliance/compliance-ui";

export default async function EvidencePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; source?: string }>;
}) {
  const session = await requireUser();
  const { status, source } = await searchParams;

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState
          icon={FileSearch}
          title="Evidence repository"
          description="Connect Supabase to manage compliance evidence."
        />
      </Card>
    );
  }

  const items = await listEvidence(session.org.id, {
    status: status || undefined,
    source: source || undefined,
  });

  const enriched = await Promise.all(
    items.map(async (ev) => {
      const mappings = await evidenceRepo.findMappingsByEvidence(ev.id);
      return { ...ev, mappedCount: mappings.length };
    })
  );

  const approved = items.filter((e) => e.status === "approved").length;
  const expired  = items.filter((e) => e.status === "expired").length;
  const draft    = items.filter((e) => e.status === "draft").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            Evidence Repository
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)]">
            {items.length} item{items.length !== 1 ? "s" : ""} · {approved} approved · {expired} expired
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AutoImportButton />
          <Link href="/compliance/evidence/new">
            <Button variant="primary" size="sm">
              <Plus className="h-4 w-4" /> Add evidence
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat strip */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ComplianceStat label="Total"    value={items.length} />
          <ComplianceStat label="Approved" value={approved} color="text-emerald-400" />
          <ComplianceStat label="Draft"    value={draft}    color="text-[var(--color-blue)]" />
          <ComplianceStat
            label="Expired"
            value={expired}
            color={expired > 0 ? "text-amber-400" : undefined}
            accent={expired > 0 ? "warn" : undefined}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <FilterChip href="/compliance/evidence"            label="All"          active={!status && !source} />
        <FilterChip href="?status=approved"               label="Approved"     active={status === "approved"} />
        <FilterChip href="?status=draft"                  label="Draft"        active={status === "draft"} />
        <FilterChip href="?status=expired"                label="Expired"      active={status === "expired"} />
        <span className="px-1 text-[var(--color-line)]">|</span>
        <FilterChip href="?source=vendor_document"        label="Vendor Docs"  active={source === "vendor_document"} />
        <FilterChip href="?source=vendor_assessment"      label="Assessments"  active={source === "vendor_assessment"} />
        <FilterChip href="?source=manual"                 label="Manual"       active={source === "manual"} />
      </div>

      {/* List */}
      {enriched.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileSearch}
            title="No evidence yet"
            description="Import from your vendor module or add evidence manually."
            action={
              <div className="flex items-center gap-2">
                <AutoImportButton />
                <Link href="/compliance/evidence/new">
                  <Button variant="primary" size="sm">
                    <Plus className="h-4 w-4" /> Add manually
                  </Button>
                </Link>
              </div>
            }
          />
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-left">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
                    Evidence
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
                    Source
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
                    Status
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
                    Expires
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
                    Controls
                  </th>
                  <th className="w-8 px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {enriched.map((ev) => (
                  <tr
                    key={ev.id}
                    className="border-b border-[var(--color-line)] transition-colors last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/compliance/evidence/${ev.id}`}
                        className="font-medium transition-colors hover:text-[var(--color-blue)]"
                      >
                        {ev.title}
                      </Link>
                      {ev.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-[var(--color-ink-faint)]">
                          {ev.description}
                        </p>
                      )}
                      {ev.owner && (
                        <p className="mt-0.5 text-xs text-[var(--color-ink-faint)]">{ev.owner}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <EvidenceSourceBadge source={ev.source} />
                    </td>
                    <td className="px-5 py-3.5">
                      <EvidenceStatusBadge status={ev.status} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[var(--color-ink-dim)]">
                      {ev.expiresOn ? (
                        <span className={isExpiredDate(ev.expiresOn) ? "text-amber-400" : ""}>
                          {formatDate(ev.expiresOn)}
                        </span>
                      ) : (
                        <span className="text-[var(--color-ink-faint)]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span
                        className={`text-sm font-medium ${
                          ev.mappedCount > 0 ? "text-emerald-400" : "text-[var(--color-ink-faint)]"
                        }`}
                      >
                        {ev.mappedCount}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/compliance/evidence/${ev.id}`}
                        className="text-xs text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-ink)]"
                      >
                        →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Import hint banner */}
      <div className="rounded-xl border border-[var(--color-blue)]/20 bg-[var(--color-blue)]/[0.04] p-4">
        <div className="flex items-start gap-3">
          <Download className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-blue)]" />
          <div>
            <p className="text-sm font-medium text-[var(--color-ink)]">
              Auto-import from vendor module
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">
              Vendor documents, completed assessments and approved reviews are automatically
              available as evidence. Click &ldquo;Import from vendors&rdquo; to sync the latest
              data. Existing imports are skipped.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
