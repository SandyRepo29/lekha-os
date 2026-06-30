export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getDashboardData, computeSecurityReadiness } from "@/lib/services/security-command-center/security-service";
import { SecSubNav, ReadinessRing } from "@/components/security-command-center/sec-ui";
import { FileText, Download, Shield, Users, Key, Globe, Cpu, Lock } from "lucide-react";

export default async function SecurityReportsPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const data = await getDashboardData(orgId).catch(() => null);
  const m = data?.metrics;
  const readiness = m ? computeSecurityReadiness(m) : { score: 0, level: "Unknown", breakdown: {} };

  const REPORTS = [
    { icon: Shield,  title: "Security Posture Report",        desc: "Full overview of identity, access, evidence, and monitoring security status.", href: "#" },
    { icon: Users,   title: "MFA Compliance Report",          desc: "Per-user MFA enrollment status and enforcement policy audit.", href: "#" },
    { icon: Key,     title: "Session Activity Report",        desc: "Active and revoked sessions with IP, device, and location details.", href: "#" },
    { icon: Lock,    title: "Evidence Access Audit Report",   desc: "All evidence downloads, shares, and access events.", href: "#" },
    { icon: Cpu,     title: "AI Prompt Security Report",      desc: "Sensitive prompt detections, blocked prompts, and PII events (30 days).", href: "#" },
    { icon: Globe,   title: "Vendor Monitoring Report",       desc: "Domain, SSL, and reputation monitoring alerts and resolutions.", href: "#" },
  ];

  const CRITERIA = [
    { label: "SSO Enabled",                 met: (m?.ssoActive ?? 0) > 0 },
    { label: "MFA Coverage > 95%",          met: (m?.mfaPercent ?? 0) >= 95 },
    { label: "No Critical Monitor Alerts",  met: (m?.criticalMonAlerts ?? 0) === 0 },
    { label: "No Dormant Admins",           met: true },
    { label: "CMK Enabled",                 met: false },
    { label: "Trust Center Published",      met: false },
  ];
  const metCount = CRITERIA.filter(c => c.met).length;

  return (
    <div className="space-y-6 p-6">
      <SecSubNav />
      <div className="pt-2">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Reports</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Security compliance reports, audit exports, and Enterprise Readiness Score.</p>
      </div>

      {/* Enterprise Readiness Score */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--color-line)] bg-white p-6">
          <ReadinessRing score={readiness.score} level={readiness.level} />
          <p className="mt-3 text-center text-xs text-[var(--color-ink-dim)]">Security Readiness Score™</p>
        </div>
        <div className="lg:col-span-2 rounded-2xl border border-[var(--color-line)] bg-white p-5 space-y-3">
          <h2 className="font-semibold text-sm">Enterprise Readiness Checklist</h2>
          <p className="text-xs text-[var(--color-ink-dim)]">{metCount}/{CRITERIA.length} criteria met</p>
          <div className="space-y-2">
            {CRITERIA.map(c => (
              <div key={c.label} className="flex items-center gap-3 text-sm">
                <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${c.met ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                  {c.met ? "✓" : "✗"}
                </span>
                <span className={c.met ? "text-[var(--color-ink)]" : "text-[var(--color-ink-dim)]"}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Report Downloads */}
      <div className="space-y-3">
        <h2 className="font-semibold">Security Reports</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {REPORTS.map(({ icon: Icon, title, desc, href }) => (
            <div key={title} className="flex flex-col gap-3 rounded-2xl border border-[var(--color-line)] bg-white p-4">
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                <div>
                  <div className="text-sm font-semibold">{title}</div>
                  <div className="mt-0.5 text-xs text-[var(--color-ink-dim)]">{desc}</div>
                </div>
              </div>
              <a
                href={href}
                className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] px-3 py-2 text-xs font-medium text-[var(--color-ink-dim)] hover:bg-[#F8F9FB] transition-colors mt-auto"
              >
                <Download className="h-3.5 w-3.5" /> Export PDF / CSV
              </a>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--color-ink-dim)]">
          Full report exports are available on the Growth and Enterprise plans. PDF reports include AUDT branding, organization logo, and timestamp.
        </p>
      </div>
    </div>
  );
}
