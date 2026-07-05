"use client";

import Link from "next/link";
import {
  FileText, ShieldCheck, BarChart2, History, Sparkles, Download,
  TrendingUp, AlertTriangle, ClipboardCheck, FileSignature,
  ArrowRight, Eye, Activity, Monitor,
} from "lucide-react";
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
import { refreshScoreExplanation } from "@/lib/vendors/ai-insights-actions";
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
import { TrustScoreWidget } from "./trust-score-widget";
import { ScoreRing } from "@/components/app-shell/score-ring";
import { getTrustLevel, TRUST_LEVEL_COLORS } from "@/lib/services/trust-score";
import { computeContractHealth, CONTRACT_HEALTH_BG, CONTRACT_HEALTH_LABELS } from "@/lib/services/contract-health";

export type VendorTabProps = {
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
  vendorRisks?: any[];
  vendorContracts?: any[];
};

// ──── OVERVIEW TAB ────
export function OverviewPanel({
  vendor, docs, assessments, expiredCount, aiEnabled, trustScore, vendorRisks = [], vendorContracts = [],
}: VendorTabProps) {
  const trustLevel = trustScore !== null ? getTrustLevel(trustScore) : null;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <OverviewStat label="Documents"     value={docs.length}          sub={`${expiredCount} expired`}              color="blue" />
          <OverviewStat label="Assessments"   value={assessments.length}   sub={assessments.length > 0 ? "completed" : "none yet"} color="purple" />
          <OverviewStat label="Active Risks"  value={vendorRisks.length}   sub="linked risks"                           color={vendorRisks.length > 0 ? "amber" : "neutral"} />
          <OverviewStat label="Contracts"     value={vendorContracts.length} sub="tracked contracts"                    color="emerald" />
        </div>
      </div>

      <Card className="p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
          Vendor in other modules
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ModuleLink href="/risks"               icon={AlertTriangle}  label="Risk Lens™"        color="red" />
          <ModuleLink href="/contract-governance"  icon={FileSignature}  label="Contracts"         color="orange" />
          <ModuleLink href="/audits"              icon={ClipboardCheck}  label="Audit Management"  color="purple" />
          <ModuleLink href="/trust-intelligence"  icon={TrendingUp}      label="Trust Analytics™"  color="indigo" />
        </div>
      </Card>

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

      {vendor.notes && (
        <Card className="p-5">
          <VendorNotes vendorId={vendor.id} notes={vendor.notes} />
        </Card>
      )}
    </div>
  );
}

// ──── ASSESSMENTS TAB ────
export function AssessmentsPanel({ vendor, assessments, riskScore }: VendorTabProps) {
  return (
    <div className="space-y-5">
      <Card>
        <SectionHeading
          title="Security assessments"
          icon={ShieldCheck}
          action={
            <Link href={`/vendors/${vendor.id}/assessment`}
              className="text-xs font-medium text-[var(--color-blue)] hover:underline transition-colors">
              {assessments.length === 0 ? "Start first assessment" : "New assessment"}
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
              <div key={a.id} className="flex items-center justify-between px-5 py-3.5">
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
      <Card className="p-5">
        <RiskPanel risk={riskScore} />
      </Card>
    </div>
  );
}

// ──── RISKS TAB ────
export function RisksPanel({ vendorRisks = [] }: VendorTabProps) {
  return (
    <div className="space-y-5">
      <Card>
        <SectionHeading
          title="Linked risks"
          icon={AlertTriangle}
          subtitle={vendorRisks.length > 0 ? `${vendorRisks.length} active risk${vendorRisks.length !== 1 ? "s" : ""}` : undefined}
          action={
            <Link href="/risks/new"
              className="text-xs font-medium text-[var(--color-blue)] hover:underline transition-colors">
              Add risk
            </Link>
          }
        />
        {vendorRisks.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="No active risks linked"
            description="Risks from Risk Lens™ linked to this vendor will appear here."
            action={
              <Link href="/risks/new"
                className="text-xs font-medium text-[var(--color-blue)] hover:underline">
                Create a risk in Risk Lens™
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-[var(--color-line)]">
            {vendorRisks.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-[var(--color-ink)] truncate">{r.title}</p>
                    <RiskStatusChip status={r.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--color-ink-faint)] capitalize">
                    {(r.category ?? "").replace(/_/g, " ")}
                    {r.inherentScore ? ` · Score ${r.inherentScore}` : ""}
                  </p>
                </div>
                <Link href={`/risks/${r.id}`}
                  className="ml-3 shrink-0 text-xs text-[var(--color-blue)] hover:underline">
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card className="p-4">
        <p className="text-xs text-[var(--color-ink-faint)] mb-2">Manage all risks in Risk Lens™</p>
        <Link href="/risks" className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-blue)] hover:underline">
          <AlertTriangle className="h-4 w-4" /> Open Risk Lens™ <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Card>
    </div>
  );
}

// ──── COMPLIANCE TAB ────
export function CompliancePanel({ vendor, docs, checklist, aiEnabled }: VendorTabProps) {
  return (
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
  );
}

// ──── EVIDENCE TAB ────
export function EvidencePanel({ vendor, docs, urls, requests, aiEnabled, orgId }: VendorTabProps) {
  return (
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
  );
}

// ──── AUDITS TAB ────
export function AuditsPanel() {
  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
            <ClipboardCheck className="h-5 w-5 text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">Audit Management</h3>
            <p className="mt-1 text-xs text-[var(--color-ink-faint)]">
              Audits are managed org-wide in the Audit Management module. Create audits and associate vendor evidence from there.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/audits/new"
                className="flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-xs font-medium text-[var(--color-ink)] hover:bg-[#EEF2F7] transition-colors">
                <ClipboardCheck className="h-3.5 w-3.5" /> Create audit
              </Link>
              <Link href="/audits"
                className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-blue)] hover:underline">
                View all audits <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </Card>
      <Card className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
            <Eye className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">Auditor Workspace</h3>
            <p className="mt-1 text-xs text-[var(--color-ink-faint)]">
              External auditors can access vendor evidence via the Auditor Workspace. Create an audit room and link this vendor's documents.
            </p>
            <Link href="/auditor-collaboration"
              className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[var(--color-blue)] hover:underline">
              Open Auditor Workspace <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ──── CONTRACTS TAB ────
export function ContractsPanel({ vendor, vendorContracts = [] }: VendorTabProps) {
  return (
    <div className="space-y-5">
      <Card>
        <SectionHeading
          title="Contract Workspace"
          icon={FileSignature}
          subtitle={vendorContracts.length > 0 ? `${vendorContracts.length} contract${vendorContracts.length !== 1 ? "s" : ""}` : undefined}
          action={
            <div className="flex items-center gap-3">
              <Link href="/contract-governance/ai"
                className="text-xs font-medium text-purple-400 hover:underline transition-colors">
                Contract Intelligence™
              </Link>
              <Link href="/contract-governance/new"
                className="text-xs font-medium text-[var(--color-blue)] hover:underline transition-colors">
                New contract
              </Link>
            </div>
          }
        />
        {vendorContracts.length === 0 ? (
          <EmptyState
            icon={FileSignature}
            title="No contracts linked"
            description="Contracts from Contract Governance™ linked to this vendor will appear here."
            action={
              <Link href="/contract-governance/new"
                className="text-xs font-medium text-[var(--color-blue)] hover:underline">
                Create a contract
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-[var(--color-line)]">
            {vendorContracts.map((c) => {
              const daysUntilExpiry = c.expiryDate
                ? Math.floor((new Date(c.expiryDate).getTime() - Date.now()) / 86_400_000)
                : null;
              const health = computeContractHealth({
                isActive: c.status === "active",
                daysUntilExpiry,
                openObligations: 0,
                overdueObligations: 0,
                totalObligations: 0,
                legalExceptions: 0,
                complianceScore: vendor.complianceScore,
                vendorRisk: vendor.riskLevel ?? "medium",
              });
              const healthBg = CONTRACT_HEALTH_BG[health.level];
              const healthLabel = CONTRACT_HEALTH_LABELS[health.level];

              let renewalUrgency: { text: string; cls: string } | null = null;
              if (daysUntilExpiry !== null) {
                if (daysUntilExpiry < 0)
                  renewalUrgency = { text: "Expired", cls: "bg-red-100 text-red-700" };
                else if (daysUntilExpiry <= 30)
                  renewalUrgency = { text: `${daysUntilExpiry}d to expiry`, cls: "bg-red-100 text-red-700" };
                else if (daysUntilExpiry <= 90)
                  renewalUrgency = { text: `${daysUntilExpiry}d to expiry`, cls: "bg-amber-100 text-amber-700" };
              }

              return (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-[var(--color-ink)] truncate">{c.title}</p>
                      <ContractStatusChip status={c.status} />
                      {renewalUrgency && (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${renewalUrgency.cls}`}>
                          {renewalUrgency.text}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--color-ink-faint)]">
                      {c.contractType ? (c.contractType as string).replace(/_/g, " ") : "Contract"}
                      {c.expiryDate ? ` · Expires ${new Date(c.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${healthBg}`}>
                        {health.overall} · {healthLabel}
                      </div>
                      <p className="mt-0.5 text-[10px] text-[var(--color-ink-faint)]">Contract Health</p>
                    </div>
                    <Link href={`/contract-governance/${c.id}`}
                      className="text-xs text-[var(--color-blue)] hover:underline">
                      View
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Quick links */}
      {vendorContracts.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: "Renewal Timeline", href: "/contract-governance/renewals", desc: "Track expiry & notice periods" },
            { label: "Obligation Tracker", href: "/contract-governance/obligations", desc: "Open obligations & due dates" },
            { label: "Contract Intelligence™", href: "/contract-governance/ai", desc: "AI analysis & executive summary" },
          ].map((l) => (
            <Link key={l.href} href={l.href}
              className="rounded-xl border border-[var(--color-line)] bg-white px-4 py-3 hover:bg-[#F8F9FB] transition-colors">
              <p className="text-xs font-semibold text-[var(--color-ink)]">{l.label}</p>
              <p className="mt-0.5 text-[10px] text-[var(--color-ink-faint)]">{l.desc}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ──── MONITORING TAB ────
export function MonitoringPanel() {
  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10">
            <Monitor className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">Continuous Vendor Monitoring</h3>
            <p className="mt-1 text-xs text-[var(--color-ink-faint)]">
              Domain SSL, certificate, and reputation monitoring for this vendor is managed in Security Monitoring. View live monitoring status and open alerts.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/security-center"
                className="flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-xs font-medium text-[var(--color-ink)] hover:bg-[#EEF2F7] transition-colors">
                <Monitor className="h-3.5 w-3.5" /> Open Security Monitoring
              </Link>
            </div>
          </div>
        </div>
      </Card>
      <Card className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10">
            <Activity className="h-5 w-5 text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">Governance Monitoring</h3>
            <p className="mt-1 text-xs text-[var(--color-ink-faint)]">
              Continuous Monitoring™ runs 7 automated governance rules and generates alerts across all vendors. Check open alerts and trust score drift.
            </p>
            <Link href="/trust-intelligence/monitoring"
              className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[var(--color-blue)] hover:underline">
              View monitoring dashboard <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ──── TRUST SCORE™ TAB ────
export function TrustScorePanel({ vendor, trustScore, trustBreakdown, trustNarrative, aiEnabled }: VendorTabProps) {
  return (
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
  );
}

// ──── ACTIVITY TAB ────
export function ActivityPanel({ vendor, reviews, vendorActivity }: VendorTabProps) {
  return (
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
  );
}

// ──── LIFECYCLE TAB ────
export function LifecyclePanel({ vendor }: VendorTabProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--color-blue)]/20 bg-[var(--color-blue)]/5 p-4">
        <p className="text-sm text-[var(--color-blue)]">
          Manage the full vendor relationship lifecycle — transitions, approvals, and history.
        </p>
        <Link href={`/vendors/${vendor.id}/lifecycle`}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-blue)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity">
          Open Lifecycle Manager <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Link href={`/vendors/${vendor.id}/lifecycle`}
          className="group flex flex-col gap-2 rounded-xl border border-[var(--color-line)] bg-white p-4 hover:bg-[#F8F9FB] transition-colors">
          <Activity className="h-5 w-5 text-indigo-400" />
          <span className="text-sm font-semibold text-[var(--color-ink)]">Lifecycle</span>
          <span className="text-xs text-[var(--color-ink-faint)]">View and transition lifecycle states</span>
        </Link>
        <Link href={`/vendors/${vendor.id}/renewal`}
          className="group flex flex-col gap-2 rounded-xl border border-[var(--color-line)] bg-white p-4 hover:bg-[#F8F9FB] transition-colors">
          <Monitor className="h-5 w-5 text-emerald-400" />
          <span className="text-sm font-semibold text-[var(--color-ink)]">Renewal</span>
          <span className="text-xs text-[var(--color-ink-faint)]">AI renewal assessment and decisions</span>
        </Link>
        <Link href={`/vendors/${vendor.id}/offboarding`}
          className="group flex flex-col gap-2 rounded-xl border border-[var(--color-line)] bg-white p-4 hover:bg-[#F8F9FB] transition-colors">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <span className="text-sm font-semibold text-[var(--color-ink)]">Offboarding</span>
          <span className="text-xs text-[var(--color-ink-faint)]">9-step offboarding checklist</span>
        </Link>
      </div>
    </div>
  );
}

// ──── CONTACTS TAB ────
export function ContactsPanel({ vendor }: VendorTabProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--color-line)] bg-white p-4">
        <p className="text-sm text-[var(--color-ink-faint)]">
          Manage vendor contacts across all relationship types — primary, security, legal, finance, and more.
        </p>
        <Link href={`/vendors/${vendor.id}/contacts`}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-dim)] hover:bg-[#EEF2F7] hover:text-[var(--color-ink)] transition-colors">
          Manage contacts <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

// ──── TIMELINE TAB ────
export function TimelinePanel({ vendor }: VendorTabProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--color-line)] bg-white p-4">
        <p className="text-sm text-[var(--color-ink-faint)]">
          Complete chronological history of all governance events for this vendor.
        </p>
        <Link href={`/vendors/${vendor.id}/timeline`}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-dim)] hover:bg-[#EEF2F7] hover:text-[var(--color-ink)] transition-colors">
          View full timeline <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function OverviewStat({ label, value, sub, color }: {
  label: string; value: number; sub: string; color: string;
}) {
  const textColor =
    color === "blue" ? "text-blue-500" :
    color === "purple" ? "text-purple-500" :
    color === "amber" ? "text-amber-500" :
    color === "emerald" ? "text-emerald-500" :
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
  red:    { icon: "text-red-500",    bg: "bg-red-100",    hover: "group-hover:bg-red-200" },
  orange: { icon: "text-orange-500", bg: "bg-orange-100", hover: "group-hover:bg-orange-200" },
  purple: { icon: "text-purple-500", bg: "bg-purple-100", hover: "group-hover:bg-purple-200" },
  indigo: { icon: "text-indigo-500", bg: "bg-indigo-100", hover: "group-hover:bg-indigo-200" },
};

function ModuleLink({ href, icon: Icon, label, color }: {
  href: string; icon: React.ComponentType<{ className?: string }>; label: string; color: string;
}) {
  const c = MODULE_COLORS[color] ?? MODULE_COLORS.indigo;
  return (
    <Link href={href}
      className="group flex items-center gap-2.5 rounded-xl border border-[var(--color-line)] bg-white px-3 py-3 transition-all hover:bg-[#F8F9FB] hover:border-[var(--color-line)]">
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

function RiskStatusChip({ status }: { status?: string }) {
  const colors: Record<string, string> = {
    identified:       "bg-blue-100 text-blue-700 border-blue-200",
    under_assessment: "bg-amber-100 text-amber-700 border-amber-200",
    open:             "bg-red-100 text-red-700 border-red-200",
    mitigating:       "bg-orange-100 text-orange-700 border-orange-200",
    accepted:         "bg-purple-100 text-purple-700 border-purple-200",
  };
  const label = (status ?? "open").replace(/_/g, " ");
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize",
      colors[status ?? "open"] ?? "bg-slate-100 text-[var(--color-ink-faint)] border-[var(--color-line)]")}>
      {label}
    </span>
  );
}

function ContractStatusChip({ status }: { status?: string }) {
  const colors: Record<string, string> = {
    draft:     "bg-slate-100 text-[var(--color-ink-faint)] border-[var(--color-line)]",
    active:    "bg-green-100 text-green-700 border-green-200",
    expiring:  "bg-amber-100 text-amber-700 border-amber-200",
    expired:   "bg-red-100 text-red-700 border-red-200",
    terminated:"bg-red-100 text-red-700 border-red-200",
    renewed:   "bg-blue-100 text-blue-700 border-blue-200",
  };
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize",
      colors[status ?? "draft"] ?? "bg-slate-100 text-[var(--color-ink-faint)] border-[var(--color-line)]")}>
      {(status ?? "draft").replace(/_/g, " ")}
    </span>
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
              <span className="rounded-full bg-[#EEF2F7] px-1.5 py-0.5 text-[10px]">{n}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
