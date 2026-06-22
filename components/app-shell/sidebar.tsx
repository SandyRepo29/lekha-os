"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Building2,
  ShieldCheck,
  ClipboardCheck,
  AlertTriangle,
  Lock,
  Sparkles,
  Settings,
  Shield,
  FileText,
  FileSignature,
  Target,
  GitBranch,
  Globe,
  BarChart3,
  Plug,
  Network,
  LineChart,
  Bot,
  Users2,
  Zap,
  BadgeCheck,
  Brain,
  ChevronRight,
  ChevronDown,
  Cpu,
  Scale,
  Layers,
  ShieldAlert,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  soon?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

// ─── Platform sections (new architecture — empty placeholders for now) ────────

const PLATFORM_SECTIONS = [
  "VENDOR GOVERNANCE",
  "TRUST OPERATIONS",
  "RISK & COMPLIANCE",
  "TRUST INTELLIGENCE",
] as const;

const UTILITY_SECTIONS = [
  "REPORTS",
  "ADMINISTRATION",
] as const;

// ─── Existing module groups (unchanged — no modules moved yet) ────────────────

const moduleGroups: NavGroup[] = [
  {
    label: "AI & Agents",
    items: [
      { href: "/agents",        label: "Governance Agents™", icon: Bot },
      { href: "/ai-governance", label: "AI Governance™",     icon: Brain },
    ],
  },
  {
    label: "Core GRC",
    items: [
      { href: "/vendors",           label: "Vendor Hub™",        icon: Building2 },
      { href: "/compliance",        label: "Evidence Vault™",    icon: ShieldCheck },
      { href: "/audits",            label: "Audit Management",   icon: ClipboardCheck },
      { href: "/risks",             label: "Risk Lens™",         icon: AlertTriangle },
      { href: "/controls",          label: "Control Center™",    icon: Shield },
      { href: "/policy-governance", label: "Policy Governance™", icon: FileText },
    ],
  },
  {
    label: "Privacy & Legal",
    items: [
      { href: "/dpdp-privacy",        label: "DPDP Privacy™",        icon: Lock },
      { href: "/contract-governance", label: "Contract Governance™", icon: FileSignature },
      { href: "/issue-hub",           label: "Issue Hub™",           icon: Target },
      { href: "/workflow-studio",     label: "Workflow Studio™",     icon: GitBranch },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/trust-intelligence",      label: "Trust Intelligence™",      icon: Brain },
      { href: "/benchmarking",            label: "Benchmarking™",            icon: BarChart3 },
      { href: "/executive-reporting",     label: "Executive Reporting™",     icon: LineChart },
      { href: "/regulatory-intelligence", label: "Regulatory Intelligence™", icon: Scale },
      { href: "/asset-intelligence",      label: "Asset Intelligence™",      icon: Layers },
    ],
  },
  {
    label: "Security",
    items: [
      { href: "/security-center",       label: "Security Command Center™", icon: ShieldAlert },
      { href: "/continuous-compliance", label: "Continuous Compliance™",   icon: Cpu },
    ],
  },
  {
    label: "Trust Network",
    items: [
      { href: "/trust-exchange",        label: "Trust Exchange™",     icon: Globe },
      { href: "/trust-network",         label: "Trust Network™",      icon: Network },
      { href: "/trust-verification",    label: "Trust Verification™", icon: BadgeCheck },
      { href: "/trust-api",             label: "Trust API Platform™", icon: Zap },
      { href: "/auditor-collaboration", label: "Auditor Collab™",     icon: Users2 },
      { href: "/integration-hub",       label: "Integration Hub™",    icon: Plug },
    ],
  },
];

// ─── Collapse state helpers ───────────────────────────────────────────────────

const STORAGE_KEY = "audt_sidebar_collapsed";

function readCollapsed(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeCollapsed(state: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function PlaceholderSection({
  label,
  collapsed,
  onToggle,
}: {
  label: string;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mt-1">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors hover:bg-white/[0.04] group"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 shrink-0 text-[var(--color-ink-faint)] transition-transform" />
        ) : (
          <ChevronDown className="h-3 w-3 shrink-0 text-[var(--color-ink-faint)] transition-transform" />
        )}
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-ink-faint)] group-hover:text-[var(--color-ink-dim)]">
          {label}
        </span>
      </button>
      {!collapsed && (
        <div className="mx-2 mt-0.5 mb-1 rounded-md border border-dashed border-[var(--color-line)] px-3 py-2">
          <p className="text-[10px] text-[var(--color-ink-faint)] italic">
            Modules coming here soon
          </p>
        </div>
      )}
    </div>
  );
}

function ModuleGroup({
  group,
  isActive,
  collapsed,
  onToggle,
}: {
  group: NavGroup;
  isActive: (href: string) => boolean;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mt-4">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-1.5 mb-1 px-2 py-0.5 rounded-md transition-colors hover:bg-white/[0.04] group"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 shrink-0 text-[var(--color-ink-faint)]" />
        ) : (
          <ChevronDown className="h-3 w-3 shrink-0 text-[var(--color-ink-faint)]" />
        )}
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-ink-faint)] group-hover:text-[var(--color-ink-dim)]">
          {group.label}
        </span>
      </button>
      {!collapsed && (
        <div className="flex flex-col gap-0.5">
          {group.items.map(({ href, label, icon: Icon, soon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={soon ? "#" : href}
                aria-disabled={soon}
                onClick={soon ? (e) => e.preventDefault() : undefined}
                className={cn(
                  "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all",
                  active
                    ? "bg-[var(--color-blue)]/10 text-[var(--color-ink)]"
                    : "text-[var(--color-ink-dim)] hover:bg-white/[0.04] hover:text-[var(--color-ink)]",
                  soon && "cursor-not-allowed opacity-50 hover:bg-transparent hover:text-[var(--color-ink-dim)]"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    active
                      ? "text-[var(--color-blue)]"
                      : "text-[var(--color-ink-faint)] group-hover:text-[var(--color-ink-dim)]"
                  )}
                />
                <span className="flex-1 truncate">{label}</span>
                {active && (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-blue)]" />
                )}
                {soon && (
                  <span className="shrink-0 rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-medium text-[var(--color-ink-faint)]">
                    Soon
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCollapsed(readCollapsed());
    setMounted(true);
  }, []);

  const toggle = (key: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      writeCollapsed(next);
      return next;
    });
  };

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));

  // Avoid hydration mismatch: render all sections expanded on server, then apply stored state after mount
  const isCollapsed = (key: string) => mounted && !!collapsed[key];

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--color-line)] bg-[var(--color-bg-2)]/60 md:flex">

      {/* Logo */}
      <Link
        href="/dashboard"
        className="flex h-14 shrink-0 items-center gap-2.5 border-b border-[var(--color-line)] px-5"
      >
        <span className="grid h-7 w-7 place-items-center rounded-[8px] grad-brand shadow-[0_4px_14px_-4px_rgba(99,102,241,.8)]">
          <span className="h-2 w-2 rounded-full bg-white shadow-[0_0_8px_#fff]" />
        </span>
        <span className="font-[family-name:var(--font-display)] text-[15px] font-extrabold tracking-wide">
          AU<span className="text-[var(--color-blue)]">DT</span>
        </span>
      </Link>

      {/* Scrollable nav */}
      <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-3 scrollbar-thin">

        {/* Dashboard — always visible, no group */}
        <div>
          <Link
            href="/dashboard"
            className={cn(
              "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all",
              isActive("/dashboard")
                ? "bg-[var(--color-blue)]/10 text-[var(--color-ink)]"
                : "text-[var(--color-ink-dim)] hover:bg-white/[0.04] hover:text-[var(--color-ink)]"
            )}
          >
            <LayoutDashboard
              className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                isActive("/dashboard")
                  ? "text-[var(--color-blue)]"
                  : "text-[var(--color-ink-faint)] group-hover:text-[var(--color-ink-dim)]"
              )}
            />
            <span className="flex-1 truncate">Dashboard</span>
            {isActive("/dashboard") && (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-blue)]" />
            )}
          </Link>
        </div>

        {/* ── Platform architecture sections (empty placeholders) ── */}
        <div className="mt-5">
          <div className="mb-1.5 px-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-faint)]/60">
            Platform
          </div>
          {PLATFORM_SECTIONS.map((label) => (
            <PlaceholderSection
              key={label}
              label={label}
              collapsed={isCollapsed(label)}
              onToggle={() => toggle(label)}
            />
          ))}
        </div>

        <div className="mt-3">
          {UTILITY_SECTIONS.map((label) => (
            <PlaceholderSection
              key={label}
              label={label}
              collapsed={isCollapsed(label)}
              onToggle={() => toggle(label)}
            />
          ))}
        </div>

        {/* ── Divider ── */}
        <div className="my-4 border-t border-[var(--color-line)]" />

        {/* ── Existing modules (unchanged) ── */}
        <div className="mb-1.5 px-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-faint)]/60">
          All Modules
        </div>

        {moduleGroups.map((group) => (
          <ModuleGroup
            key={group.label}
            group={group}
            isActive={isActive}
            collapsed={isCollapsed(group.label)}
            onToggle={() => toggle(group.label)}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-[var(--color-line)] px-3 py-3 space-y-0.5">
        {/* Copilot CTA */}
        <Link
          href="/trust-intelligence/executive"
          className="flex items-center gap-2.5 rounded-lg border border-[var(--color-blue)]/20 bg-[var(--color-blue)]/[0.06] px-2.5 py-2.5 mb-2 hover:bg-[var(--color-blue)]/[0.10] transition-colors"
        >
          <Sparkles className="h-4 w-4 shrink-0 text-[var(--color-blue)]" />
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-semibold text-[var(--color-blue)]">Governance Copilot™</div>
            <div className="text-[11px] text-[var(--color-ink-faint)] truncate">Ask about your posture</div>
          </div>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--color-ink-faint)]" />
        </Link>

        {/* Help & Docs */}
        <Link
          href="/help"
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
            pathname.startsWith("/help")
              ? "bg-[var(--color-blue)]/10 text-[var(--color-ink)]"
              : "text-[var(--color-ink-dim)] hover:bg-white/[0.04] hover:text-[var(--color-ink)]"
          )}
        >
          <HelpCircle
            className={cn(
              "h-4 w-4 shrink-0",
              pathname.startsWith("/help") ? "text-[var(--color-blue)]" : "text-[var(--color-ink-faint)]"
            )}
          />
          <span>Help &amp; Docs</span>
        </Link>

        {/* Settings */}
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
            pathname.startsWith("/settings")
              ? "bg-[var(--color-blue)]/10 text-[var(--color-ink)]"
              : "text-[var(--color-ink-dim)] hover:bg-white/[0.04] hover:text-[var(--color-ink)]"
          )}
        >
          <Settings
            className={cn(
              "h-4 w-4 shrink-0",
              pathname.startsWith("/settings") ? "text-[var(--color-blue)]" : "text-[var(--color-ink-faint)]"
            )}
          />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
