export const dynamic = "force-dynamic";

import {
  Database,
  MapPin,
  Clock,
  Download,
  Trash2,
  Bot,
  ShieldCheck,
  FileText,
  Users,
  Building2,
  ClipboardCheck,
  HardDrive,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import {
  getDataGovernanceStats,
  getRecentAuditEvents,
} from "@/lib/services/data-governance-service";
import { DataExportButton } from "./data-export-button";
import { DeletionRequestButton } from "./deletion-request-button";

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 text-[var(--color-ink-faint)]">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-2xl font-bold text-[var(--color-ink)]">{value}</p>
    </div>
  );
}

function SectionLabel({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <Icon className="h-4 w-4 text-[var(--color-ink-faint)]" />
      <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
        {label}
      </span>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatAction(action: string): string {
  return action
    .replace(/\./g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default async function DataGovernancePage() {
  const session = await requireUser();

  if (!session.org) {
    return <div className="text-[var(--color-ink-dim)]">No organization found.</div>;
  }

  const [stats, events] = await Promise.all([
    getDataGovernanceStats(session.org.id),
    getRecentAuditEvents(session.org.id, 8),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          Data Governance
        </h1>
        <p className="text-sm text-[var(--color-ink-dim)]">
          Transparency into how your data is stored, processed, and protected.
        </p>
      </div>

      {/* Data Summary */}
      <div className="space-y-2">
        <SectionLabel icon={Database} label="Data Summary" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard icon={FileText} label="Documents" value={stats.documentCount} />
          <StatCard icon={HardDrive} label="Storage" value={formatBytes(stats.storageBytesUsed)} />
          <StatCard icon={Building2} label="Vendors" value={stats.vendorCount} />
          <StatCard icon={ClipboardCheck} label="Assessments" value={stats.assessmentCount} />
          <StatCard icon={Users} label="Active Users" value={stats.userCount} />
        </div>
      </div>

      {/* Data Residency + Retention side by side */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Data Residency */}
        <div className="space-y-2">
          <SectionLabel icon={MapPin} label="Data Residency" />
          <Card>
            <CardContent className="space-y-3 pt-5">
              {[
                { label: "Application Region", value: "Mumbai (ap-south-1)" },
                { label: "Database", value: "Supabase Postgres · Mumbai" },
                { label: "File Storage", value: "Supabase Storage · Mumbai" },
                { label: "AI Processing", value: "Google Gemini · Regional" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-2">
                  <span className="text-sm text-[var(--color-ink-dim)]">{label}</span>
                  <span className="text-right text-sm font-medium text-[var(--color-ink)]">
                    {value}
                  </span>
                </div>
              ))}
              <div className="mt-1 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2 text-xs text-emerald-400">
                All customer data stored in India — compliant with DPDP Act 2023 data localisation guidance.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Retention */}
        <div className="space-y-2">
          <SectionLabel icon={Clock} label="Data Retention" />
          <Card>
            <CardContent className="space-y-3 pt-5">
              {[
                { label: "Documents", value: "Indefinite (platform default)" },
                { label: "Deleted Documents", value: "30-day recovery window" },
                { label: "Audit Logs", value: "7 years (regulatory)" },
                { label: "Login History", value: "12 months" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-2">
                  <span className="text-sm text-[var(--color-ink-dim)]">{label}</span>
                  <span className="text-right text-sm font-medium text-[var(--color-ink)]">
                    {value}
                  </span>
                </div>
              ))}
              <p className="mt-1 text-xs text-[var(--color-ink-faint)]">
                Custom retention policies available on Enterprise plan.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Transparency */}
      <div className="space-y-2">
        <SectionLabel icon={Bot} label="AI Transparency" />
        <Card>
          <CardContent className="pt-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  ok: true,
                  heading: "Used for your services",
                  body: "Documents are processed with Lekha AI for compliance analysis, risk extraction, and summarisation — exclusively for your organisation.",
                },
                {
                  ok: false,
                  heading: "Never used for training",
                  body: "Your documents are never used to train foundation models, create datasets, or improve AI for other customers.",
                },
                {
                  ok: true,
                  heading: "Tenant-isolated processing",
                  body: "AI inference is scoped to your tenant. No cross-tenant data access occurs at any stage of AI processing.",
                },
              ].map(({ ok, heading, body }) => (
                <div
                  key={heading}
                  className={`rounded-xl border p-3 ${
                    ok
                      ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                      : "border-red-500/20 bg-red-500/[0.04]"
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                        ok
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {ok ? "✓" : "✗"}
                    </span>
                    <span className="text-sm font-semibold text-[var(--color-ink)]">
                      {heading}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-[var(--color-ink-dim)]">{body}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Controls */}
      <div className="space-y-2">
        <SectionLabel icon={ShieldCheck} label="Data Controls" />
        <Card>
          <CardContent className="pt-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[var(--color-ink)]">Export Your Data</h3>
                <p className="text-sm text-[var(--color-ink-dim)]">
                  Download a ZIP archive containing metadata for all your documents, vendors, assessments, risks, and audit logs.
                </p>
                <DataExportButton orgId={session.org.id} orgName={session.org.name} />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[var(--color-ink)]">Request Data Deletion</h3>
                <p className="text-sm text-[var(--color-ink-dim)]">
                  Submit a request to permanently delete all your organisation&apos;s data from the platform. A support ticket will be raised.
                </p>
                <DeletionRequestButton orgName={session.org.name} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security checklist */}
      <div className="space-y-2">
        <SectionLabel icon={ShieldCheck} label="Security Controls" />
        <Card>
          <CardContent className="pt-5">
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { label: "Private storage buckets", ok: true },
                { label: "Tenant folder isolation", ok: true },
                { label: "Row-Level Security (RLS)", ok: true },
                { label: "Tenant-scoped queries enforced", ok: true },
                { label: "Signed URLs only (15 min TTL)", ok: true },
                { label: "Audit logging on all mutations", ok: true },
                { label: "AES-256-GCM credential encryption", ok: true },
                { label: "TLS in transit", ok: true },
                { label: "Supabase at-rest encryption", ok: true },
                { label: "Vector search tenant isolation", ok: true },
                { label: "BYOK / Customer Managed Keys", ok: false, note: "Enterprise roadmap" },
                { label: "Customer-owned storage (S3/Azure)", ok: false, note: "Enterprise roadmap" },
              ].map(({ label, ok, note }) => (
                <div key={label} className="flex items-center gap-2 text-sm">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      ok
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-[var(--color-line)] text-[var(--color-ink-faint)]"
                    }`}
                  >
                    {ok ? "✓" : "–"}
                  </span>
                  <span className={ok ? "text-[var(--color-ink)]" : "text-[var(--color-ink-dim)]"}>
                    {label}
                  </span>
                  {note && (
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-[var(--color-ink-faint)]">
                      {note}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Audit Events */}
      <div className="space-y-2">
        <SectionLabel icon={Clock} label="Recent Audit Events (Last 30 Days)" />
        <Card>
          {events.length === 0 ? (
            <CardContent className="py-8 text-center text-sm text-[var(--color-ink-dim)]">
              No audit events in the last 30 days.
            </CardContent>
          ) : (
            <div className="divide-y divide-[var(--color-line)]">
              {events.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-blue)]" />
                    <span className="text-sm text-[var(--color-ink)]">
                      {formatAction(ev.action)}
                    </span>
                    {ev.entityType && (
                      <span className="hidden text-xs text-[var(--color-ink-faint)] sm:block">
                        {ev.entityType.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-[var(--color-ink-faint)]">
                    {formatRelativeTime(ev.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
