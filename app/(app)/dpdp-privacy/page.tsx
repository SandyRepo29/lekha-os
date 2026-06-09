export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Database,
  UserCheck,
  FileSearch,
  Clock,
  AlertTriangle,
  Globe,
  Plus,
  Shield,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/services/privacy/privacy-service";
import { PrivacyRequestStatusBadge, PrivacyRequestTypeBadge } from "@/components/privacy/privacy-badges";
import { PrivacyScoreWidget } from "@/components/privacy/privacy-score-widget";

function Stat({
  label,
  value,
  icon: Icon,
  color,
  href,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  href?: string;
}) {
  const content = (
    <Card className="p-5 flex items-center gap-4 hover:bg-white/[0.04] transition-colors">
      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-[var(--color-ink-dim)]">{label}</p>
      </div>
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default async function DpdpPrivacyDashboardPage() {
  const session = await requireUser();

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState
          icon={Shield}
          title="DPDP Privacy™"
          description="Connect Supabase to manage your DPDP compliance."
        />
      </Card>
    );
  }

  const data = await getDashboardData(session.org.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            DPDP Privacy™
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
            India DPDP Act 2023 — data inventory, consent, DSR, retention, transfers
          </p>
        </div>
        <Link href="/dpdp-privacy/inventory/new">
          <Button>
            <Plus className="h-4 w-4" /> Add Data Asset
          </Button>
        </Link>
      </div>

      {/* Metrics strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Stat
          label="Total Assets"
          value={data.assetMetrics.total}
          icon={Database}
          color="bg-indigo-500/20 text-indigo-400"
          href="/dpdp-privacy/inventory"
        />
        <Stat
          label="Sensitive Assets"
          value={data.assetMetrics.sensitive}
          icon={Shield}
          color="bg-orange-500/20 text-orange-400"
          href="/dpdp-privacy/inventory"
        />
        <Stat
          label="Cross-Border"
          value={data.assetMetrics.crossBorder}
          icon={Globe}
          color="bg-purple-500/20 text-purple-400"
          href="/dpdp-privacy/transfers"
        />
        <Stat
          label="Open DSRs"
          value={data.dsrMetrics.open}
          icon={FileSearch}
          color="bg-blue-500/20 text-blue-400"
          href="/dpdp-privacy/requests"
        />
        <Stat
          label="Overdue DSRs"
          value={data.dsrMetrics.overdue}
          icon={AlertTriangle}
          color={
            data.dsrMetrics.overdue > 0
              ? "bg-red-500/20 text-red-400"
              : "bg-green-500/20 text-green-400"
          }
          href="/dpdp-privacy/requests"
        />
      </div>

      {/* Body grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Privacy Trust Score */}
        <div className="lg:col-span-1">
          <PrivacyScoreWidget
            initialScore={data.latestScore?.score}
          />
        </div>

        {/* Consent Summary + Recent DSRs */}
        <div className="lg:col-span-2 space-y-4">
          {/* Consent Summary */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-indigo-400" />
                Consent Overview
              </h2>
              <Link
                href="/dpdp-privacy/consents"
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Active", value: data.consentMetrics.active, color: "text-green-400" },
                { label: "Expired", value: data.consentMetrics.expired, color: "text-orange-400" },
                { label: "Withdrawn", value: data.consentMetrics.withdrawn, color: "text-red-400" },
                { label: "Pending", value: data.consentMetrics.pending, color: "text-yellow-400" },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                  <p className="text-xs text-[var(--color-ink-dim)]">{item.label}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent DSRs */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400" />
                Recent DSR Requests
              </h2>
              <Link
                href="/dpdp-privacy/requests"
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {data.recentRequests.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                No open requests.
              </div>
            ) : (
              <div className="space-y-2">
                {data.recentRequests.map((req) => (
                  <Link
                    key={req.id}
                    href="/dpdp-privacy/requests"
                    className="flex items-center justify-between gap-3 rounded-xl p-2 hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{req.subjectName}</p>
                      <p className="text-xs text-[var(--color-ink-dim)] truncate">
                        {req.subjectEmail}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <PrivacyRequestTypeBadge type={req.requestType} />
                      <PrivacyRequestStatusBadge status={req.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/dpdp-privacy/inventory/new">
            <Button variant="outline" size="sm">
              <Database className="h-4 w-4" /> Add Data Asset
            </Button>
          </Link>
          <Link href="/dpdp-privacy/requests/new">
            <Button variant="outline" size="sm">
              <FileSearch className="h-4 w-4" /> New DSR
            </Button>
          </Link>
          <Link href="/dpdp-privacy/assessments/new">
            <Button variant="outline" size="sm">
              <Shield className="h-4 w-4" /> New PIA
            </Button>
          </Link>
          <Link href="/dpdp-privacy/ai">
            <Button variant="outline" size="sm">
              <AlertTriangle className="h-4 w-4" /> AI Privacy Officer
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
