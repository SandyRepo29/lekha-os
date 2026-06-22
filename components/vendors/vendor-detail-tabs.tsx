"use client";

import Link from "next/link";
import {
  FileText, ShieldCheck, BarChart2, History, Sparkles, Download,
  TrendingUp, AlertTriangle, ClipboardCheck, FileSignature,
  ArrowRight,
} from "lucide-react";
import { Tabs } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { DocumentUpload } from "./document-upload";
import { DocumentActions } from "./document-actions";
import { DocumentEdit } from "./document-edit";
import { DocumentCategoryBadge } from "./document-category-badge";
import { DocumentMetadata } from "./document-metadata";
import { DOCUMENT_CATEGORY_LABELS, DOCUMENT_CATEGORY_COLORS } from "@/lib/ai/gemini";
import { cn } from "@/lib/utils";
import { DocumentRequests } from "./document-requests";
import { ComplianceChecklist } from "./compliance-checklist";
import { ComplianceBreakdown } from "./compliance-breakdown";
import { AiSummary } from "./ai-summary";
import { RiskPanel } from "./risk-panel";
import { AiInsightPanel } from "@/components/ai/ai-insight-panel";
import { AiRecommendedActions } from "@/components/ai/ai-recommended-actions";
import { refreshScoreExplanation, refreshRiskExplanation } from "@/lib/vendors/ai-insights-actions";
import type { RecommendedAction } from "@/lib/services/ai-insights-service";
import { VendorNotes } from "./vendor-notes";
import { VendorReviews } from "./vendor-reviews";
import { PortalLink } from "./portal-link";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Vendor, VendorDocument, DocumentRequest, Assessment, VendorReview } from "@/lib/db/schema";
import type { ChecklistResult } from "@/lib/services/template-service";
import type { RiskScore } from "@/lib/services/risk-engine";
import type { ActivityItem } from "@/lib/repositories/activity-repo";
import type { DocCounts } from "@/lib/services/vendor-service";
import { Badge } from "@/components/ui/badge";
import { TrustScoreWidget } from "./trust-score-widget";
import { ScoreRing } from "@/components/app-shell/score-ring";
import { getTrustLevel, TRUST_LEVEL_COLORS } from "@/lib/services/trust-score";

type Props = {
  vendor: Omit<Vendor, "aiRecommendedActions"> & {
    aiScoreExplanation?: string | null;
    aiScoreExplainedAt?: Date | null;
    aiRiskExplanation?: string | null;
    aiRiskExplainedAt?: Date | null;
    aiRecommendedActions?: RecommendedAction[] | null;
    aiActionsGeneratedAt?: Date | null;
  };
  docs: VendorDocument[];
  urls: (string | null)[];
  checklist: ChecklistResult | null;
  requests: DocumentRequest[];
  assessments: Assessment[];
  reviews: VendorReview[];
  vendorActivity: ActivityItem[];
  riskScore: RiskScore;
  docCounts: DocCounts;
  openRequests: number;
  expiredCount: number;
  aiEnabled: boolean;
  orgId: string;
  trustScore: number | null;
  trustBreakdown: any;
  trustNarrative: string | null;
};

export function VendorDetailTabs({
  vendor, docs, urls, checklist, requests, assessments, reviews,
  vendorActivity, riskScore, docCounts, openRequests, expiredCount, aiEnabled, orgId,
  trustScore, trustBreakdown, trustNarrative,
}: Props) {

  const trustLevel = trustScore !== null ? getTrustLevel(trustScore) : null;

  const tabs = [
    {
      id: "overview",
      label: "Overview",
    },
    {
      id: "evidence",
      label: "Evidence",
      count: docs.length,
      badge: expiredCount > 0 ? "danger" as const : undefined,
    },
    {
      id: "compliance",
      label: "Compliance",
      count: checklist ? checklist.requiredTotal - checklist.requiredDone : undefined,
      badge: checklist && checklist.completionScore < 100 ? "warn" as const : undefined,
    },
    {
      id: "trust-score",
      label: "Trust Score™",
    },
    {
      id: "risk",
      label: "Risks & Assessments",
      badge: (riskScore.level === "high" || riskScore.level === "critical") ? "danger" as const : undefined,
    },
    {
      id: "activity",
      label: "Activity",
      count: openRequests > 0 ? openRequests : undefined,
      badge: openRequests > 0 ? "warn" as const : undefined,
    },
  ];

  return (
    <Tabs tabs={tabs} defaultTab="overview">
      {(activeTab) => (
        <>
          {/* ──── OVERVIEW TAB ──── */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* Vendor summary row */}
              <div className="grid gap-4 sm:grid-cols-[200px_1fr]">

                {/* Trust Score ring */}
                <Card className="relative flex flex-col items-center justify-center overflow-hidden p-6">
                  <div className="pointer-events-none absolute inset-0"
                    style={{ background: "radial-gradient(ellipse at 50% 110%, rgba(99,102,241,.18), transparent 65%)" }} />
                  <div className="relative flex flex-col items-center text-center">
                    <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
                      Trust Score™
                    </div>
                    <ScoreRing value={trustScore ?? 0} size={96} />
                    {trustLevel && (
                      <div className="mt-2 text-xs font-bold" style={{ color: TRUST_LEVEL_COLORS[trustLevel] }}>
                        {trustLevel}
                      </div>
                    )}
                  </div>
                </Card>

                {/* Key stats */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <OverviewStat label="Documents"   value={docs.length}              sub={`${expiredCount} expired`}       color="blue" />
                  <OverviewStat label="Assessments" value={assessments.length}       sub={assessments.length > 0 ? "completed" : "none yet"} color="purple" />
                  <OverviewStat label="Open Requests" value={openRequests}           sub="pending"                         color={openRequests > 0 ? "amber" : "neutral"} />
                  <OverviewStat label="Reviews"     value={reviews.length}           sub="governance reviews"              color="emerald" />
                </div>
              </div>

              {/* Quick actions to related modules */}
              <Card className="p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
                  Vendor in other modules
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <ModuleLink href="/risks"              icon={AlertTriangle}   label="Risk Lens™"         color="red" />
                  <ModuleLink href="/contract-governance" icon={FileSignature}  label="Contracts"          color="orange" />
                  <ModuleLink href="/audits"             icon={ClipboardCheck}  label="Audit Management"   color="purple" />
                  <ModuleLink href="/trust-intelligence" icon={TrendingUp}      label="Trust Analytics™"   color="indigo" />
                </div>
              </Card>

              {/* AI Summary */}
              {aiEnabled && (
                <Card className="p-5">
                  <AiSummary
                    vendorId={vendor.id}
                    summary={vendor.aiSummary}
                    summaryAt={vendor.aiSummaryAt}
                    aiEnabled={aiEnabled}
                  />
                </Card>
              )}

              {/* Notes */}
              {vendor.notes && (
                <Card className="p-5">
                  <VendorNotes vendorId={vendor.id} notes={vendor.notes} />
                </Card>
              )}
            </div>
          )}

          {/* ──── EVIDENCE TAB (renamed from Documents) ──── */}
          {activeTab === "evidence" && (
            <div className="space-y-5">
              <Card>
                <SectionHeading
                  title="Evidence Documents"
                  subtitle={`${docs.length} document${docs.length !== 1 ? "s" : ""} tracked`}
                  icon={FileText}
                  action={
                    <span className="flex items-center gap-1.5 text-xs text-[var(--color-ink-faint)]">
                      <Sparkles className="h-3.5 w-3.5 text-[var(--color-blue)]" />
                      {aiEnabled ? "AI extraction on" : "AI extraction off"}
                    </span>
                  }
                />

                {docs.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="No documents yet"
                    description="Upload certifications, policies or evidence below."
                  />
                ) : (
                  <div className="divide-y divide-[var(--color-line)]">
                    {docs.map((d, i) => (
                      <div key={d.id} className="flex items-start gap-3 px-5 py-3.5">
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-ink-faint)]" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-[var(--color-ink)]">{d.documentType}</span>
                            <StatusBadge value={d.status} />
                            <DocumentCategoryBadge category={(d as any).category} />
                          </div>
                          <DocumentMetadata
                            extracted={d.extracted as Record<string, unknown> | null}
                            issuedOn={d.issuedOn}
                            expiresOn={d.expiresOn}
                          />
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {urls[i] && (
                            <a href={urls[i]!} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-[var(--color-blue)] hover:underline transition-colors">
                              <Download className="h-3.5 w-3.5" /> Open
                            </a>
                          )}
                          <DocumentEdit
                            documentId={d.id}
                            documentType={d.documentType}
                            issuedOn={d.issuedOn}
                            expiresOn={d.expiresOn}
                          />
                          <DocumentActions documentId={d.id} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-[var(--color-line)] p-5">
                  <DocumentUpload orgId={orgId} vendorId={vendor.id} />
                </div>
              </Card>

              <Card>
                <SectionHeading title="Document requests" icon={FileText} />
                <div className="p-5">
                  <DocumentRequests requests={requests} vendorId={vendor.id} />
                </div>
              </Card>

              {docs.length > 0 && <CategoryBreakdown docs={docs} />}
            </div>
          )}

          {/* ──── COMPLIANCE TAB ──── */}
          {activeTab === "compliance" && (
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-5">
                <Card className="p-5 space-y-5">
                  <ComplianceBreakdown
                    risk={vendor.riskLevel}
                    currentScore={vendor.complianceScore}
                    docs={docs}
                  />
                  <div className="border-t border-[var(--color-line)] pt-4">
                    <AiInsightPanel
                      title="Explain this score"
                      content={vendor.aiScoreExplanation ?? null}
                      generatedAt={vendor.aiScoreExplainedAt ?? null}
                      isStale={!!vendor.aiScoreExplainedAt && new Date(vendor.updatedAt) > new Date(vendor.aiScoreExplainedAt)}
                      aiEnabled={aiEnabled}
                      onGenerate={() => refreshScoreExplanation(vendor.id)}
                    />
                  </div>
                </Card>
                <Card className="p-5">
                  <AiRecommendedActions
                    vendorId={vendor.id}
                    actions={(vendor.aiRecommendedActions as RecommendedAction[] | null) ?? null}
                    generatedAt={vendor.aiActionsGeneratedAt ?? null}
                    isStale={!!vendor.aiActionsGeneratedAt && new Date(vendor.updatedAt) > new Date(vendor.aiActionsGeneratedAt)}
                    aiEnabled={aiEnabled}
                  />
                </Card>
              </div>
              <div className="space-y-5">
                {checklist ? (
                  <Card className="p-5">
                    <ComplianceChecklist checklist={checklist} />
                  </Card>
                ) : (
                  <Card className="p-5">
                    <p className="text-sm text-[var(--color-ink-dim)]">
                      No compliance template assigned.{" "}
                      <Link href={`/vendors/${vendor.id}/edit`} className="text-[var(--color-blue)] hover:underline">
                        Assign a template
                      </Link>{" "}
                      to track required documents.
                    </p>
                  </Card>
                )}
                <Card className="p-5">
                  <PortalLink vendorId={vendor.id} />
                </Card>
              </div>
            </div>
          )}

          {/* ──── TRUST SCORE™ TAB ──── */}
          {activeTab === "trust-score" && (
            <div className="max-w-2xl space-y-5">
              <TrustScoreWidget
                vendorId={vendor.id}
                trustScore={trustScore}
                breakdown={trustBreakdown}
                narrative={trustNarrative}
                aiEnabled={aiEnabled}
              />
              {aiEnabled && (
                <Card className="p-5">
                  <AiSummary
                    vendorId={vendor.id}
                    summary={vendor.aiSummary}
                    summaryAt={vendor.aiSummaryAt}
                    aiEnabled={aiEnabled}
                  />
                </Card>
              )}
            </div>
          )}

          {/* ──── RISKS & ASSESSMENTS TAB ──── */}
          {activeTab === "risk" && (
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-5">
                <Card className="p-5 space-y-5">
                  <RiskPanel risk={riskScore} />
                  <div className="border-t border-[var(--color-line)] pt-4">
                    <AiInsightPanel
                      title="Explain this risk"
                      content={vendor.aiRiskExplanation ?? null}
                      generatedAt={vendor.aiRiskExplainedAt ?? null}
                      isStale={!!vendor.aiRiskExplainedAt && new Date(vendor.updatedAt) > new Date(vendor.aiRiskExplainedAt)}
                      aiEnabled={aiEnabled}
                      onGenerate={() => refreshRiskExplanation(vendor.id, riskScore.factors)}
                    />
                  </div>
                </Card>
                {/* Link to full Risk Lens™ */}
                <Card className="p-4">
                  <p className="mb-2 text-xs text-[var(--color-ink-faint)]">
                    Manage linked risks in Risk Lens™
                  </p>
                  <Link href="/risks"
                    className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-blue)] hover:underline">
                    <AlertTriangle className="h-4 w-4" /> Open Risk Lens™ <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Card>
              </div>
              <div className="space-y-5">
                <Card>
                  <SectionHeading
                    title="Security assessments"
                    action={
                      <Link href={`/vendors/${vendor.id}/assessment`}
                        className="text-xs font-medium text-[var(--color-blue)] hover:underline transition-colors">
                        {assessments.length === 0 ? "Start assessment" : "New assessment"}
                      </Link>
                    }
                  />
                  {assessments.length === 0 ? (
                    <EmptyState
                      icon={ShieldCheck}
                      title="No assessments yet"
                      description="Run a security assessment to quantify this vendor's security posture."
                    />
                  ) : (
                    <div className="divide-y divide-[var(--color-line)]">
                      {assessments.map((a) => (
                        <div key={a.id} className="flex items-center justify-between px-5 py-3">
                          <div>
                            <p className="text-sm font-medium text-[var(--color-ink)]">{a.title}</p>
                            <p className="text-xs text-[var(--color-ink-faint)]">
                              {a.completedAt
                                ? `Completed ${new Date(a.completedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                                : "In progress"}
                            </p>
                          </div>
                          {a.score !== null ? (
                            <span className="font-[family-name:var(--font-display)] font-bold text-lg"
                              style={{ color: a.score >= 70 ? "#10b981" : a.score >= 50 ? "#f59e0b" : "#ef4444" }}>
                              {a.score}<span className="text-xs font-normal text-[var(--color-ink-faint)]">/100</span>
                            </span>
                          ) : (
                            <StatusBadge value="pending" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}

          {/* ──── ACTIVITY TAB ──── */}
          {activeTab === "activity" && (
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-5">
                <Card>
                  <SectionHeading title="Governance reviews" icon={History} />
                  <div className="p-5">
                    <VendorReviews reviews={reviews} vendorId={vendor.id} />
                  </div>
                </Card>
              </div>
              <div className="space-y-5">
                {vendorActivity.length > 0 ? (
                  <Card>
                    <SectionHeading title="Activity log" icon={BarChart2} />
                    <div className="px-5 py-3">
                      <ActivityFeed items={vendorActivity} />
                    </div>
                  </Card>
                ) : (
                  <Card className="p-5">
                    <EmptyState
                      icon={BarChart2}
                      title="No activity yet"
                      description="Actions on this vendor will appear here."
                    />
                  </Card>
                )}
                <Card className="p-5">
                  <VendorNotes vendorId={vendor.id} notes={vendor.notes} />
                </Card>
              </div>
            </div>
          )}
        </>
      )}
    </Tabs>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function OverviewStat({ label, value, sub, color }: {
  label: string; value: number; sub: string; color: string;
}) {
  const textColor =
    color === "blue" ? "text-blue-400" :
    color === "purple" ? "text-purple-400" :
    color === "amber" ? "text-amber-400" :
    color === "emerald" ? "text-emerald-400" :
    "text-[var(--color-ink-dim)]";

  return (
    <Card className="p-4">
      <div className={`font-[family-name:var(--font-display)] text-2xl font-extrabold ${textColor}`}>
        {value}
      </div>
      <div className="mt-0.5 text-xs font-semibold text-[var(--color-ink-dim)]">{label}</div>
      <div className="mt-0.5 text-[11px] text-[var(--color-ink-faint)]">{sub}</div>
    </Card>
  );
}

const MODULE_COLORS: Record<string, { icon: string; bg: string; hover: string }> = {
  red:    { icon: "text-red-400",    bg: "bg-red-500/10",    hover: "group-hover:bg-red-500/20" },
  orange: { icon: "text-orange-400", bg: "bg-orange-500/10", hover: "group-hover:bg-orange-500/20" },
  purple: { icon: "text-purple-400", bg: "bg-purple-500/10", hover: "group-hover:bg-purple-500/20" },
  indigo: { icon: "text-indigo-400", bg: "bg-indigo-500/10", hover: "group-hover:bg-indigo-500/20" },
};

function ModuleLink({ href, icon: Icon, label, color }: {
  href: string; icon: React.ComponentType<{ className?: string }>; label: string; color: string;
}) {
  const c = MODULE_COLORS[color] ?? MODULE_COLORS.indigo;
  return (
    <Link href={href}
      className="group flex items-center gap-2.5 rounded-xl border border-[var(--color-line)] bg-white/[0.02] px-3 py-3 transition-all hover:bg-white/[0.05] hover:border-white/10">
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors", c.bg, c.hover)}>
        <Icon className={cn("h-4 w-4", c.icon)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-[var(--color-ink-dim)] group-hover:text-[var(--color-ink)] truncate">{label}</div>
      </div>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--color-ink-faint)]" />
    </Link>
  );
}

function CategoryBreakdown({ docs }: { docs: { category?: string | null }[] }) {
  const counts: Record<string, number> = {};
  docs.forEach((d) => {
    const cat = (d as any).category ?? "other";
    counts[cat] = (counts[cat] ?? 0) + 1;
  });

  const hasCategories = docs.some((d) => (d as any).category);
  if (!hasCategories) return null;

  return (
    <Card className="p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
        Documents by category
      </p>
      <div className="flex flex-wrap gap-2">
        {Object.entries(counts).map(([cat, n]) => {
          const colors = DOCUMENT_CATEGORY_COLORS[cat] ?? DOCUMENT_CATEGORY_COLORS.other;
          const label = DOCUMENT_CATEGORY_LABELS[cat] ?? "Other";
          return (
            <div key={cat} className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
              colors.text, colors.bg, colors.border
            )}>
              {label}
              <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px]">{n}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
