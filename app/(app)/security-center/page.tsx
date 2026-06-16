export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getDashboardData, computeSecurityReadiness } from "@/lib/services/security-command-center/security-service";
import { SecSubNav, SecStat, ReadinessRing, SeverityBadge, FeatureRow } from "@/components/security-command-center/sec-ui";
import { Shield, Bot, Eye, Lock, Users, Globe, Cpu, KeyRound, AlertTriangle } from "lucide-react";

export default async function SecurityCommandCenterPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const data = await getDashboardData(orgId).catch(() => null);
  const m = data?.metrics;
  const readiness = m ? computeSecurityReadiness(m) : { score: 0, level: "Unknown", breakdown: {} };
  const alerts = (data?.monAlerts ?? []) as Record<string, unknown>[];

  const moduleNav = [
    { href: "/security-center/identity",    icon: Users,    label: "Identity™",          desc: "MFA, SSO, SCIM provisioning" },
    { href: "/security-center/access",      icon: Lock,     label: "Access Control™",    desc: "IP allow lists, fine-grained permissions" },
    { href: "/security-center/sessions",    icon: Eye,      label: "Sessions™",          desc: "Active session management" },
    { href: "/security-center/evidence",    icon: Shield,   label: "Evidence Security™", desc: "Watermarks, secure shares, access logs" },
    { href: "/security-center/ai",          icon: Cpu,      label: "AI Security™",       desc: "Prompt audit trail, PII detection" },
    { href: "/security-center/encryption",  icon: KeyRound, label: "Encryption™",        desc: "Customer managed keys (CMK)" },
    { href: "/security-center/trust-center",icon: Globe,    label: "Trust Center™",      desc: "Public customer-facing trust portal" },
    { href: "/security-center/monitoring",  icon: AlertTriangle, label: "Monitoring™",   desc: "Continuous vendor security monitoring" },
  ];

  return (
    <div className="space-y-6 p-6">
      <SecSubNav />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 pt-2">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Security Command Center™
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
            Enterprise identity security, evidence protection, AI security governance, and trust controls.
          </p>
        </div>
        <Link
          href="/security-center/ai"
          className="flex items-center gap-2 rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
        >
          <Bot className="h-4 w-4" /> AI Advisor™
        </Link>
      </div>

      {/* Top Strip: Readiness Ring + KPIs */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Readiness Ring */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-6 lg:col-span-1">
          <ReadinessRing score={readiness.score} level={readiness.level} />
          <p className="mt-3 text-center text-xs text-[var(--color-ink-dim)]">Security Readiness Score™</p>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:col-span-4">
          <SecStat label="MFA Coverage"       value={`${m?.mfaPercent ?? 0}%`} accent={(m?.mfaPercent ?? 0) >= 95 ? "good" : (m?.mfaPercent ?? 0) >= 75 ? "warn" : "danger"} href="/security-center/identity" />
          <SecStat label="SSO Providers"      value={m?.ssoActive ?? 0}         accent={m?.ssoActive ? "good" : "warn"} href="/security-center/identity" />
          <SecStat label="Active Sessions"    value={m?.activeSessions ?? 0}    accent="neutral" href="/security-center/sessions" />
          <SecStat label="IP Rules"           value={m?.ipRules ?? 0}           accent={m?.ipRules ? "good" : "warn"} href="/security-center/access" />
          <SecStat label="Active Shares"      value={m?.activeShares ?? 0}      accent="neutral" href="/security-center/evidence" />
          <SecStat label="Sensitive Prompts"  value={m?.sensitivePrompts ?? 0}  accent={(m?.sensitivePrompts ?? 0) > 0 ? "warn" : "good"} href="/security-center/ai" />
          <SecStat label="Blocked Prompts"    value={m?.blockedPrompts ?? 0}    accent={(m?.blockedPrompts ?? 0) > 0 ? "warn" : "good"} href="/security-center/ai" />
          <SecStat label="Monitor Alerts"     value={m?.openMonAlerts ?? 0}     accent={(m?.criticalMonAlerts ?? 0) > 0 ? "danger" : (m?.openMonAlerts ?? 0) > 0 ? "warn" : "good"} href="/security-center/monitoring" />
        </div>
      </div>

      {/* Strategic Banner */}
      <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-5">
        <div className="flex items-start gap-4">
          <Shield className="mt-0.5 h-8 w-8 shrink-0 text-red-400" />
          <div>
            <div className="font-semibold text-sm text-red-400">Security Command Center — Enterprise-Grade Trust Platform</div>
            <p className="mt-1 text-xs text-[var(--color-ink-dim)] leading-relaxed">
              AUDT Security Command Center transforms your Governance OS into a trust-anchored security platform — combining identity security, evidence protection, AI governance, and continuous monitoring into a unified command layer.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["MFA Enforcement", "Enterprise SSO", "SCIM", "IP Allow Lists", "Evidence Watermarks", "Prompt Audit", "CMK", "Trust Center", "Vendor Monitoring"].map(t => (
                <span key={t} className="rounded-full border border-red-500/20 bg-red-500/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-red-400">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feature Status */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-[var(--color-ink-dim)] px-1">Identity & Access</h2>
          <FeatureRow label="Multi-Factor Authentication"   status={(m?.mfaPercent ?? 0) > 0}  href="/security-center/identity" />
          <FeatureRow label="Enterprise SSO"               status={(m?.ssoActive ?? 0) > 0}   href="/security-center/identity" />
          <FeatureRow label="IP Allow Lists"               status={(m?.ipRules ?? 0) > 0}     href="/security-center/access" />
          <FeatureRow label="Session Management"           status={(m?.activeSessions ?? 0) > 0} href="/security-center/sessions" />
        </div>
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-[var(--color-ink-dim)] px-1">Evidence & AI</h2>
          <FeatureRow label="Evidence Protection™"         status={(m?.activeShares ?? 0) > 0} href="/security-center/evidence" />
          <FeatureRow label="AI Prompt Security™"          status={(m?.totalPrompts ?? 0) > 0} href="/security-center/ai" />
          <FeatureRow label="Customer Managed Encryption"  status={false}                      href="/security-center/encryption" />
          <FeatureRow label="Public Trust Center™"         status={false}                      href="/security-center/trust-center" />
        </div>
      </div>

      {/* Open Monitoring Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Open Monitoring Alerts</h2>
          <div className="space-y-2">
            {alerts.slice(0, 5).map((a) => (
              <div key={String(a.id)} className="flex items-center justify-between rounded-xl border border-[var(--color-line)] bg-white/[0.02] px-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{String(a.title)}</div>
                  <div className="text-xs text-[var(--color-ink-dim)] mt-0.5">{String(a.vendor_name ?? "Unknown vendor")}</div>
                </div>
                <SeverityBadge severity={String(a.severity)} />
              </div>
            ))}
          </div>
          <Link href="/security-center/monitoring" className="text-xs text-[var(--color-blue)] hover:underline">
            View all monitoring alerts →
          </Link>
        </div>
      )}

      {/* Module Nav Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {moduleNav.map(({ href, icon: Icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col gap-2 rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-4 hover:bg-white/[0.05] transition-colors"
          >
            <Icon className="h-5 w-5 text-red-400" />
            <div>
              <div className="text-sm font-semibold">{label}</div>
              <div className="mt-0.5 text-[11px] text-[var(--color-ink-dim)]">{desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
