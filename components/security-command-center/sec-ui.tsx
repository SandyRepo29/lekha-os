"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, AlertTriangle, Shield, Clock } from "lucide-react";

// ─── Sub-nav ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: "/security-center",            label: "Overview" },
  { href: "/security-center/identity",   label: "Identity™" },
  { href: "/security-center/access",     label: "Access Control™" },
  { href: "/security-center/sessions",   label: "Sessions™" },
  { href: "/security-center/evidence",   label: "Evidence Security™" },
  { href: "/security-center/ai",         label: "AI Security™" },
  { href: "/security-center/encryption", label: "Encryption™" },
  { href: "/security-center/trust-center", label: "Trust Center™" },
  { href: "/security-center/monitoring", label: "Monitoring™" },
  { href: "/security-center/reports",    label: "Reports" },
];

export function SecSubNav() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white p-1 scrollbar-thin">
      {NAV_ITEMS.map(({ href, label }) => {
        const active =
          href === "/security-center"
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-[#EEF2F7] text-[var(--color-ink)]"
                : "text-[var(--color-ink-dim)] hover:bg-[#F8F9FB] hover:text-[var(--color-ink)]"
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

type Accent = "neutral" | "good" | "warn" | "danger" | "purple" | "blue";

const ACCENT_MAP: Record<Accent, { bar: string; bg: string; text: string }> = {
  neutral: { bar: "border-l-[var(--color-line)]",  bg: "bg-[var(--color-bg-2)]/60",    text: "text-[var(--color-ink)]" },
  good:    { bar: "border-l-emerald-500",           bg: "bg-emerald-500/[0.06]",         text: "text-emerald-700" },
  warn:    { bar: "border-l-amber-500",             bg: "bg-amber-500/[0.06]",           text: "text-amber-700" },
  danger:  { bar: "border-l-red-500",               bg: "bg-red-500/[0.06]",             text: "text-red-700" },
  purple:  { bar: "border-l-violet-500",            bg: "bg-violet-500/[0.06]",          text: "text-violet-700" },
  blue:    { bar: "border-l-blue-500",              bg: "bg-blue-500/[0.06]",            text: "text-blue-700" },
};

export function SecStat({
  label, value, accent = "neutral", href, sub,
}: { label: string; value: string | number; accent?: Accent; href?: string; sub?: string }) {
  const { bar, bg, text } = ACCENT_MAP[accent];
  const inner = (
    <div className={cn("rounded-2xl border-l-2 p-4", bar, bg)}>
      <div className={cn("text-2xl font-bold tabular-nums", text)}>{value}</div>
      <div className="mt-0.5 text-xs text-[var(--color-ink-dim)]">{label}</div>
      {sub && <div className="mt-1 text-[10px] text-[var(--color-ink-muted)]">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ─── Readiness Ring ───────────────────────────────────────────────────────────

export function ReadinessRing({ score, level }: { score: number; level: string }) {
  const r = 40, c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  const color = score >= 90 ? "#10b981" : score >= 75 ? "#3b82f6" : score >= 60 ? "#f59e0b" : score >= 40 ? "#f97316" : "#ef4444";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-28 w-28">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(30,41,59,0.12)" strokeWidth="8" />
          <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${dash} ${c}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums">{score}</span>
          <span className="text-[10px] text-[var(--color-ink-dim)]">/100</span>
        </div>
      </div>
      <span className="text-xs font-semibold" style={{ color }}>{level}</span>
    </div>
  );
}

// ─── Status Badges ────────────────────────────────────────────────────────────

const SEV_STYLES: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high:     "bg-orange-100 text-orange-700 border-orange-200",
  medium:   "bg-amber-100 text-amber-700 border-amber-200",
  low:      "bg-emerald-100 text-emerald-700 border-emerald-200",
  info:     "bg-blue-100 text-blue-700 border-blue-200",
};

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize", SEV_STYLES[severity] ?? SEV_STYLES.info)}>
      {severity}
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  active:         "bg-emerald-100 text-emerald-700 border-emerald-200",
  open:           "bg-red-100 text-red-700 border-red-200",
  acknowledged:   "bg-amber-100 text-amber-700 border-amber-200",
  resolved:       "bg-emerald-100 text-emerald-700 border-emerald-200",
  revoked:        "bg-zinc-100 text-zinc-700 border-zinc-200",
  enabled:        "bg-emerald-100 text-emerald-700 border-emerald-200",
  disabled:       "bg-zinc-100 text-zinc-700 border-zinc-200",
  clean:          "bg-emerald-100 text-emerald-700 border-emerald-200",
  low:            "bg-blue-100 text-blue-700 border-blue-200",
  medium:         "bg-amber-100 text-amber-700 border-amber-200",
  high:           "bg-orange-100 text-orange-700 border-orange-200",
  blocked:        "bg-red-100 text-red-700 border-red-200",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize", STATUS_STYLES[status] ?? STATUS_STYLES.clean)}>
      {status}
    </span>
  );
}

// ─── Provider Badge ───────────────────────────────────────────────────────────

const PROVIDER_LABELS: Record<string, string> = {
  entra_id:        "Entra ID",
  okta:            "Okta",
  google_workspace:"Google Workspace",
  ping_identity:   "Ping Identity",
  saml2:           "SAML 2.0",
  oidc:            "OIDC",
  aws_kms:         "AWS KMS",
  azure_key_vault: "Azure Key Vault",
  google_kms:      "Google KMS",
  platform:        "AUDT Platform",
};

export function ProviderBadge({ type }: { type: string }) {
  return (
    <span className="rounded-full border border-[var(--color-line)] bg-[#F8F9FB] px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-ink-dim)]">
      {PROVIDER_LABELS[type] ?? type}
    </span>
  );
}

// ─── MFA Coverage Bar ─────────────────────────────────────────────────────────

export function MfaCoverageBar({ percent }: { percent: number }) {
  const color = percent >= 95 ? "bg-emerald-500" : percent >= 75 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-[var(--color-ink-dim)]">
        <span>MFA Coverage</span>
        <span className="font-semibold">{percent}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-[#F8F9FB]">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

// ─── Feature Status Row ───────────────────────────────────────────────────────

export function FeatureRow({ label, status, href }: { label: string; status: boolean; href: string }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-xl border border-[var(--color-line)] bg-white px-4 py-3 hover:bg-[#F8F9FB] transition-colors">
      <span className="text-sm font-medium">{label}</span>
      {status
        ? <span className="flex items-center gap-1.5 text-xs text-emerald-700"><CheckCircle className="h-4 w-4" /> Active</span>
        : <span className="flex items-center gap-1.5 text-xs text-[var(--color-ink-dim)]"><XCircle className="h-4 w-4" /> Not configured</span>
      }
    </Link>
  );
}

// ─── Enforcement Badge ────────────────────────────────────────────────────────

const ENFORCEMENT_STYLES: Record<string, string> = {
  optional:        "bg-zinc-100 text-zinc-700 border-zinc-200",
  required_admins: "bg-amber-100 text-amber-700 border-amber-200",
  required_all:    "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const ENFORCEMENT_LABELS: Record<string, string> = {
  optional:        "Optional",
  required_admins: "Required for Admins",
  required_all:    "Required for All",
};

export function EnforcementBadge({ mode }: { mode: string }) {
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium", ENFORCEMENT_STYLES[mode] ?? ENFORCEMENT_STYLES.optional)}>
      {ENFORCEMENT_LABELS[mode] ?? mode}
    </span>
  );
}
