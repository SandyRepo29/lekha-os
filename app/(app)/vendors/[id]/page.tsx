export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Package, Clock, User, FileBarChart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScoreRing } from "@/components/app-shell/score-ring";
import { StatusBadge } from "@/components/ui/status-badge";
import { DeleteVendor } from "@/components/vendors/delete-vendor";
import { VendorStatus } from "@/components/vendors/vendor-status";
import { VendorDetailTabs } from "@/components/vendors/vendor-detail-tabs";
import { requireUser } from "@/lib/auth/session";
import { canEdit, canDelete } from "@/lib/ui/role-guard";
import { getVendor } from "@/lib/services/vendor-service";
import { listForVendor } from "@/lib/services/document-service";
import { getChecklistForVendor } from "@/lib/services/template-service";
import { listRequests } from "@/lib/services/request-service";
import { listAssessments } from "@/lib/services/assessment-service";
import { listReviews } from "@/lib/services/review-service";
import { listVendorActivity } from "@/lib/repositories/activity-repo";
import { createSignedUrl } from "@/lib/storage/server";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { computeRiskScore } from "@/lib/services/risk-engine";
import { scoreLabelColor, scoreLabel } from "@/lib/ui/colors";
import { computeAndSaveTrustScore, getTrustHistory } from "@/lib/services/trust-score-service";
import { TrustScoreWidget } from "@/components/vendors/trust-score-widget";
import { TrustScoreBadge } from "@/components/vendors/trust-score-badge";
import { findActiveByVendor } from "@/lib/repositories/risk-repo";
import { findContractsByOrg } from "@/lib/repositories/contract-repo";
import { db } from "@/lib/db";
import { count, eq } from "drizzle-orm";
import { assetVendors } from "@/lib/db/schema";

export default async function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireUser();
  if (session.demo || !session.org) notFound();

  const vendor = await getVendor(session.org.id, id);
  if (!vendor) notFound();

  const [docs, checklist, requests, assessments, reviews, vendorActivity, vendorRisks, vendorContracts, assetCountResult, trustHistory] = await Promise.all([
    listForVendor(session.org.id, id),
    getChecklistForVendor(session.org.id, id),
    listRequests(session.org.id, id),
    listAssessments(session.org.id, id),
    listReviews(session.org.id, id),
    listVendorActivity(session.org.id, id, 15),
    findActiveByVendor(session.org.id, id),
    findContractsByOrg(session.org.id, { vendorId: id }),
    db.select({ count: count() }).from(assetVendors).where(eq(assetVendors.vendorId, id)),
    getTrustHistory(session.org.id, id, 7).catch(() => [] as any[]),
  ]);
  const linkedAssetCount = assetCountResult[0]?.count ?? 0;
  const previousTrustScore: number | undefined =
    trustHistory.length >= 2 ? (trustHistory[trustHistory.length - 2] as any)?.overallScore : undefined;

  const urls = await Promise.all(
    docs.map((d) => d.storagePath ? createSignedUrl(d.storagePath) : null)
  );

  const expiredCount = docs.filter((d) => d.status === "expired").length;
  const expiringCount = docs.filter((d) => d.status === "expiring").length;
  const openRequests = requests.filter((r) => r.status === "requested").length;

  const docCounts = {
    total: docs.length,
    valid: docs.filter((d) => d.status === "valid").length,
    expiring: expiringCount,
    expired: expiredCount,
  };
  const riskScore = computeRiskScore(vendor, docCounts, null);

  // Compute Trust Score™ (refreshes on each page load if stale > 1h)
  let trustBreakdown = null;
  const trustIsStale =
    !vendor.trustScoreAt || Date.now() - new Date(vendor.trustScoreAt).getTime() > 3600 * 1000;
  if (trustIsStale) {
    trustBreakdown = await computeAndSaveTrustScore(session.org.id, id, "page_load").catch(() => null);
  } else {
    // Reconstruct minimal breakdown for display — widget will recompute on demand
    trustBreakdown = null;
  }

  return (
    <div className="space-y-5">
      {/* Back link */}
      <Link href="/vendors" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to vendors
      </Link>

      {/* Vendor header */}
      <Card className="p-5">
        <div className="flex flex-wrap items-start gap-5">
          {/* Avatar */}
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/[0.06] font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink-dim)]">
            {vendor.name[0].toUpperCase()}
          </div>

          {/* Core info */}
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-[family-name:var(--font-display)] text-xl font-bold leading-tight">
                {vendor.name}
              </h1>
              <VendorStatus vendorId={vendor.id} current={vendor.status} />
              <StatusBadge value={vendor.riskLevel} type="risk" />
              <TrustScoreBadge score={vendor.trustScore ?? null} showScore size="sm" previousScore={previousTrustScore} />
              {expiredCount > 0 && <StatusBadge value="expired" />}
              {expiringCount > 0 && (
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                  {expiringCount} expiring
                </span>
              )}
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-ink-faint)]">
              {vendor.category && (
                <span className="font-medium text-[var(--color-ink-dim)]">{vendor.category}</span>
              )}
              {vendor.contactEmail && (
                <a href={`mailto:${vendor.contactEmail}`} className="hover:text-[var(--color-blue)] transition-colors">
                  {vendor.contactEmail}
                </a>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Added {new Date(vendor.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
              {vendor.ownerName && (
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {vendor.ownerName}
                  {vendor.ownerDepartment && ` · ${vendor.ownerDepartment}`}
                </span>
              )}
            </div>
          </div>

          {/* Compliance score */}
          <div className="shrink-0 text-center">
            <ScoreRing value={vendor.complianceScore} size={96} />
            <p className={`mt-1 text-xs font-semibold ${scoreLabelColor(vendor.complianceScore)}`}>
              {scoreLabel(vendor.complianceScore)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 flex-col items-end gap-2 self-start">
            <div className="flex gap-2">
              {canEdit(session.org?.role ?? "viewer") && (
                <Link href={`/vendors/${vendor.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                </Link>
              )}
              <a
                href={`/vendors/${vendor.id}/executive-report`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "primary", size: "sm" }), "gap-1.5")}
                title="AI-generated executive summary — board-ready"
              >
                <FileBarChart className="h-3.5 w-3.5" /> Executive Report
              </a>
              <a
                href={`/vendors/${vendor.id}/audit-package`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
              >
                <Package className="h-3.5 w-3.5" /> Audit PDF
              </a>
              {canDelete(session.org?.role ?? "viewer") && (
                <DeleteVendor vendorId={vendor.id} vendorName={vendor.name} />
              )}
            </div>
          </div>
        </div>

        {/* Notes (inline, no separate card) */}
        {vendor.notes && (
          <p className="mt-4 rounded-xl border border-[var(--color-line)] bg-white/[0.02] px-4 py-3 text-sm text-[var(--color-ink-dim)] leading-relaxed">
            {vendor.notes}
          </p>
        )}
      </Card>

      {/* Tabbed content */}
      <VendorDetailTabs
        vendor={vendor as any}
        docs={docs}
        urls={urls}
        checklist={checklist}
        requests={requests}
        assessments={assessments}
        reviews={reviews}
        vendorActivity={vendorActivity}
        riskScore={riskScore}
        docCounts={docCounts}
        openRequests={openRequests}
        expiredCount={expiredCount}
        aiEnabled={isGeminiConfigured()}
        orgId={session.org.id}
        trustScore={vendor.trustScore ?? null}
        trustBreakdown={trustBreakdown}
        trustNarrative={vendor.aiTrustNarrative ?? null}
        vendorRisks={vendorRisks}
        vendorContracts={vendorContracts}
      />

      {/* Connected Entities */}
      <section className="rounded-2xl border border-[var(--color-line)] bg-white/[0.03] p-5 space-y-4">
        <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">Connected Entities</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link href={`/risks/list`} className="rounded-xl border border-[var(--color-line)] p-3 hover:bg-white/[0.04] transition-colors">
            <div className={`text-2xl font-bold ${vendorRisks.length > 0 ? "text-[var(--color-ink)]" : "text-[var(--color-ink-dim)]"}`}>{vendorRisks.length}</div>
            <div className="text-xs text-[var(--color-ink-dim)] mt-0.5">Linked Risks</div>
          </Link>
          <Link href={`/contract-governance/library`} className="rounded-xl border border-[var(--color-line)] p-3 hover:bg-white/[0.04] transition-colors">
            <div className={`text-2xl font-bold ${vendorContracts.length > 0 ? "text-[var(--color-ink)]" : "text-[var(--color-ink-dim)]"}`}>{vendorContracts.length}</div>
            <div className="text-xs text-[var(--color-ink-dim)] mt-0.5">Contracts</div>
          </Link>
          <Link href={`/asset-intelligence/registry`} className="rounded-xl border border-[var(--color-line)] p-3 hover:bg-white/[0.04] transition-colors">
            <div className={`text-2xl font-bold ${linkedAssetCount > 0 ? "text-[var(--color-ink)]" : "text-[var(--color-ink-dim)]"}`}>{linkedAssetCount}</div>
            <div className="text-xs text-[var(--color-ink-dim)] mt-0.5">Linked Assets</div>
          </Link>
          <Link href={`/vendors/${vendor.id}`} className="rounded-xl border border-[var(--color-line)] p-3 hover:bg-white/[0.04] transition-colors">
            <div className={`text-2xl font-bold ${assessments.length > 0 ? "text-[var(--color-ink)]" : "text-[var(--color-ink-dim)]"}`}>{assessments.length}</div>
            <div className="text-xs text-[var(--color-ink-dim)] mt-0.5">Assessments</div>
          </Link>
        </div>
        <p className="text-xs text-[var(--color-ink-dim)]">
          View the full dependency map in{" "}
          <Link href="/trust-intelligence/trust-graph" className="text-[var(--color-blue)] hover:underline">
            Trust Graph&#8482;
          </Link>
        </p>
      </section>
    </div>
  );
}
