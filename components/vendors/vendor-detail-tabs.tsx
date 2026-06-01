"use client";

import Link from "next/link";
import { FileText, ShieldCheck, BarChart2, History, Sparkles, Download } from "lucide-react";
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
import { docStatusTone } from "@/lib/ui-maps";
import { Badge } from "@/components/ui/badge";

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
};

export function VendorDetailTabs({
  vendor, docs, urls, checklist, requests, assessments, reviews,
  vendorActivity, riskScore, docCounts, openRequests, expiredCount, aiEnabled, orgId,
}: Props) {

  const tabs = [
    {
      id: "documents",
      label: "Documents",
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
      id: "risk",
      label: "Risk & Assessments",
      badge: (riskScore.level === "high" || riskScore.level === "critical") ? "danger" as const : undefined,
    },
    {
      id: "activity",
      label: "Reviews & Activity",
      count: openRequests > 0 ? openRequests : undefined,
      badge: openRequests > 0 ? "warn" as const : undefined,
    },
  ];

  return (
    <Tabs tabs={tabs} defaultTab="documents">
      {(activeTab) => (
        <>
          {/* ──── DOCUMENTS TAB ──── */}
          {activeTab === "documents" && (
            <div className="space-y-5">
              <Card>
                <SectionHeading
                  title="Documents"
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
                    {docs.map((d, i) => {
                      return (
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
                      );
                    })}
                  </div>
                )}

                <div className="border-t border-[var(--color-line)] p-5">
                  <DocumentUpload orgId={orgId} vendorId={vendor.id} />
                </div>
              </Card>

              {/* Document requests in Documents tab */}
              <Card>
                <SectionHeading title="Document requests" icon={FileText} />
                <div className="p-5">
                  <DocumentRequests requests={requests} vendorId={vendor.id} />
                </div>
              </Card>

              {/* Notes in Documents tab */}
              <Card className="p-5">
                <VendorNotes vendorId={vendor.id} notes={vendor.notes} />
              </Card>
            </div>
          )}

          {/* ──── COMPLIANCE TAB ──── */}
          {activeTab === "compliance" && (
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-5">
                {/* AI Vendor Summary */}
                <Card className="p-5">
                  <AiSummary
                    vendorId={vendor.id}
                    summary={vendor.aiSummary}
                    summaryAt={vendor.aiSummaryAt}
                    aiEnabled={aiEnabled}
                  />
                </Card>
                {/* Score breakdown + AI Explain Score */}
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
                {/* AI Recommended Actions */}
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
                {/* Document category breakdown */}
                {docs.length > 0 && (
                  <CategoryBreakdown docs={docs} />
                )}
                {/* Checklist */}
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
                {/* Portal link */}
                <Card className="p-5">
                  <PortalLink vendorId={vendor.id} />
                </Card>
              </div>
            </div>
          )}

          {/* ──── RISK & ASSESSMENTS TAB ──── */}
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
              </div>
              <div className="space-y-5">
                {/* Assessment summary */}
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

          {/* ──── REVIEWS & ACTIVITY TAB ──── */}
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
              </div>
            </div>
          )}
        </>
      )}
    </Tabs>
  );
}

// ─── Category breakdown helper ────────────────────────────────────────────────

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
