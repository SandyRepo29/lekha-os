export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/services/trust-verification/trust-verification-service";
import {
  ShieldCheck, Award, CheckCircle, Clock, XCircle, AlertTriangle,
  RefreshCw, Globe, Bot, FileText, ArrowRight,
  Star, Lock, Activity, Sparkles,
} from "lucide-react";
import { VerificationStat, VerificationStatusBadge } from "@/components/trust-verification/verification-ui";

const NAV = [
  { href: "/trust-verification/programs",    icon: Star,        label: "Verification Programs™",  description: "Browse & create verification programs" },
  { href: "/trust-verification/applications", icon: FileText,    label: "Applications",             description: "Apply and track verification status" },
  { href: "/trust-verification/certificates", icon: Award,       label: "Trust Certificates™",      description: "Issued certificates & verification proofs" },
  { href: "/trust-verification/badges",       icon: ShieldCheck, label: "Trust Badges™",            description: "Active trust badges & lifecycle" },
  { href: "/trust-verification/registry",     icon: Globe,       label: "Trust Registry™",          description: "Public searchable trust registry" },
  { href: "/trust-verification/passports",    icon: Lock,        label: "Trust Passports™",         description: "Public trust profile & proof of governance" },
  { href: "/trust-verification/monitoring",   icon: Activity,    label: "Verification Monitoring™", description: "Continuous monitoring & alerts" },
  { href: "/trust-verification/renewals",     icon: RefreshCw,   label: "Renewals",                 description: "Certification renewal management" },
  { href: "/trust-verification/ai",           icon: Bot,         label: "AI Verification Advisor™", description: "Eligibility analysis, assessment & chat" },
];

export default async function TrustVerificationPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const data = await getDashboardData(orgId).catch(() => null);
  const m = data?.metrics;
  const certs = data?.certs ?? [];
  const badges = data?.badges ?? [];
  const events = data?.recentEvents ?? [];

  const activeCerts = certs.filter((c: any) => c.status === "active").length;
  const activeBadges = badges.filter((b: any) => b.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Trust Verification Authority™
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
            Verify, certify, and publish trust — transform AUDT into a Trust Authority.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/trust-verification/ai" className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] px-3 py-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:bg-[#F8F9FB] transition-colors">
            <Sparkles className="h-3.5 w-3.5" />
            AI Verification Advisor™
          </Link>
          <Link
            href="/trust-verification/registry"
            className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-4 py-2 text-sm font-medium hover:bg-[#F8F9FB] transition-colors"
          >
            <Globe className="h-4 w-4" /> Registry
          </Link>
          <Link
            href="/trust-verification/applications/new"
            className="flex items-center gap-2 rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
          >
            <ShieldCheck className="h-4 w-4" /> Apply for Verification
          </Link>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <VerificationStat label="Applications"  value={m?.total ?? 0}        accent="neutral"  href="/trust-verification/applications" />
        <VerificationStat label="Approved"      value={m?.approved ?? 0}     accent="good"     href="/trust-verification/applications" />
        <VerificationStat label="Pending"       value={m?.pending ?? 0}      accent="warn"     href="/trust-verification/applications" />
        <VerificationStat label="Rejected"      value={m?.rejected ?? 0}     accent={(m?.rejected ?? 0) > 0 ? "danger" : "neutral"} />
        <VerificationStat label="Suspended"     value={m?.suspended ?? 0}    accent={(m?.suspended ?? 0) > 0 ? "warn" : "neutral"} />
        <VerificationStat label="Active Certs"  value={activeCerts}          accent="good"     href="/trust-verification/certificates" />
        <VerificationStat label="Active Badges" value={activeBadges}         accent="good"     href="/trust-verification/badges" />
        <VerificationStat label="Trust Leaders" value={m?.trustLeaders ?? 0} accent="neutral"  />
      </div>

      {/* Strategic Callout */}
      <div className="rounded-2xl border border-[var(--color-blue)]/30 bg-[var(--color-blue)]/[0.05] p-5">
        <div className="flex items-start gap-4">
          <ShieldCheck className="mt-0.5 h-8 w-8 shrink-0 text-[var(--color-blue)]" />
          <div>
            <div className="font-semibold text-sm text-[var(--color-blue)]">AUDT is now a Trust Authority™</div>
            <p className="mt-1 text-xs text-[var(--color-ink-dim)] leading-relaxed">
              Beyond measuring governance — AUDT now <strong>verifies</strong>, <strong>certifies</strong>, and <strong>publishes</strong> trust.
              Organizations can apply for AUDT Verified™, Trusted Vendor™, Privacy Ready™, AI Governed™ and more.
              Every certificate is publicly verifiable at <code className="rounded bg-[#EEF2F7] px-1 py-0.5 text-[11px]">audt.tech/verify/[ID]</code>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["AUDT Verified™","Trusted Vendor™","Privacy Ready™","AI Governed™","Enterprise Ready™"].map(b => (
                <span key={b} className="rounded-full border border-[var(--color-blue)]/30 bg-[var(--color-blue)]/[0.08] px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-blue)]">{b}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Module Nav */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-[var(--color-ink-dim)] uppercase tracking-wider">Platform Modules</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {NAV.map(({ href, icon: Icon, label, description }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-start gap-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5 transition-colors hover:border-[var(--color-blue)]/40 hover:bg-[var(--color-blue)]/[0.04]"
            >
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#F8F9FB]">
                <Icon className="h-5 w-5 text-[var(--color-blue)]" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm">{label}</span>
                  <ArrowRight className="h-4 w-4 text-[var(--color-ink-faint)] transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Applications */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Recent Applications</h3>
            <Link href="/trust-verification/applications" className="text-xs text-[var(--color-blue)] hover:underline">View all →</Link>
          </div>
          {(m?.recentApplications?.length ?? 0) > 0 ? (
            <div className="space-y-2">
              {m!.recentApplications.map((v: any) => (
                <Link key={v.id} href={`/trust-verification/applications/${v.id}`}
                  className="flex items-center justify-between rounded-xl border border-[var(--color-line)]/60 bg-white px-3 py-2.5 hover:bg-[#F8F9FB]">
                  <div>
                    <div className="text-sm font-medium">{(v as any).programName ?? "Verification"}</div>
                    <div className="text-xs text-[var(--color-ink-dim)] mt-0.5">Applied {new Date(v.appliedAt).toLocaleDateString()}</div>
                  </div>
                  <VerificationStatusBadge status={v.status} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-[var(--color-ink-faint)]">
              No applications yet. <Link href="/trust-verification/applications/new" className="text-[var(--color-blue)] hover:underline">Apply now →</Link>
            </div>
          )}
        </div>

        {/* Recent Events */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Verification Events</h3>
            <div className="flex items-center gap-3">
              <Link href="/trust-verification/monitoring" className="text-xs text-[var(--color-blue)] hover:underline">View all →</Link>
            </div>
          </div>
          {events.length > 0 ? (
            <div className="space-y-2">
              {events.slice(0, 6).map((ev: any) => (
                <div key={ev.id} className="flex items-start gap-3 rounded-xl border border-[var(--color-line)]/60 bg-white px-3 py-2.5">
                  <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-blue)]" />
                  <div>
                    <div className="text-xs font-medium font-mono">{ev.eventType}</div>
                    <div className="text-[11px] text-[var(--color-ink-faint)] mt-0.5">{new Date(ev.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-xs text-[var(--color-ink-faint)]">No events yet.</p>
          )}
        </div>
      </div>

      {/* Expiring Certifications */}
      {(m?.expiringSoon ?? 0) > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <div>
              <div className="font-semibold text-sm text-amber-400">{m!.expiringSoon} certification{m!.expiringSoon > 1 ? "s" : ""} expiring within 30 days</div>
              <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">Start renewal to maintain your verified status without interruption.</p>
            </div>
            <Link href="/trust-verification/renewals" className="ml-auto rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20">
              Manage Renewals →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
