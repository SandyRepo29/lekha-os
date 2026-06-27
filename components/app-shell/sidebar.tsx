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
  Settings,
  Shield,
  FileText,
  FileSignature,
  Target,
  GitBranch,
  BarChart3,
  Plug,
  LineChart,
  Bot,
  Users2,
  Brain,
  ChevronRight,
  ChevronDown,
  Cpu,
  Scale,
  Layers,
  ShieldAlert,
  HelpCircle,
  TrendingUp,
  Sparkles,
  Star,
  Network,
  Receipt,
  Zap,
  Terminal,
  FileCode,
} from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  soon?: boolean;
};

type NavGroup = {
  key: string;
  label: string;
  items: NavItem[];
};

// ─── Navigation structure ─────────────────────────────────────────────────────

const navGroups: NavGroup[] = [
  {
    key: "trust-operations-engine",
    label: "Trust Operations",
    items: [
      { href: "/operations",                label: "TOE Dashboard™",      icon: Zap },
      { href: "/operations/command-center", label: "Command Center™",     icon: Terminal },
      { href: "/operations/approvals",      label: "Approval Queue™",     icon: Target },
      { href: "/operations/workflows",      label: "Workflow Engine™",    icon: GitBranch },
      { href: "/operations/automation",     label: "Automation™",         icon: Cpu },
      { href: "/operations/events",         label: "Event Log™",          icon: BarChart3 },
      { href: "/operations/ai",             label: "AI Decision Engine™", icon: Sparkles },
    ],
  },
  {
    key: "vendor-governance",
    label: "Vendor Governance",
    items: [
      { href: "/vendors",             label: "Vendor Hub™",          icon: Building2 },
      { href: "/contract-governance", label: "Contract Governance™", icon: FileSignature },
      { href: "/asset-intelligence",  label: "Asset Intelligence™",  icon: Layers },
    ],
  },
  {
    key: "trust-operations",
    label: "Trust Operations",
    items: [
      { href: "/compliance",            label: "Evidence Vault™",   icon: ShieldCheck },
      { href: "/workflow-studio",       label: "Workflow Studio™",  icon: GitBranch },
      { href: "/issue-hub",             label: "Issue & Remediation Hub™", icon: Target },
      { href: "/trust-exchange",        label: "Trust Exchange™",          icon: Network },
      { href: "/trust-network",         label: "Trust Network™",           icon: Network },
      { href: "/auditor-collaboration", label: "Auditor Workspace™",       icon: Users2 },
    ],
  },
  {
    key: "risk-compliance",
    label: "Risk & Compliance",
    items: [
      { href: "/risks",                   label: "Risk Lens™",              icon: AlertTriangle },
      { href: "/controls",                label: "Control Center™",         icon: Shield },
      { href: "/audits",                  label: "Audit Management™",  icon: ClipboardCheck },
      { href: "/policy-governance",       label: "Policy Governance™",      icon: FileText },
      { href: "/dpdp-privacy",            label: "DPDP Privacy™",           icon: Lock },
      { href: "/continuous-compliance",   label: "Continuous Compliance™",  icon: Cpu },
      { href: "/security-center",         label: "Security Command Center™", icon: ShieldAlert },
      { href: "/regulatory-intelligence", label: "Regulatory Intelligence™", icon: Scale },
    ],
  },
  {
    key: "trust-intelligence",
    label: "Trust Intelligence",
    items: [
      { href: "/trust-score",                 label: "Trust Score™",         icon: TrendingUp },
      { href: "/trust-intelligence/trends",   label: "Trust Analytics™",     icon: Brain },
      { href: "/benchmarking",                label: "Benchmarking™",        icon: BarChart3 },
      { href: "/executive-reporting",         label: "Executive Reporting™", icon: LineChart },
      { href: "/trust-intelligence/executive", label: "Governance Copilot™", icon: Sparkles },
      { href: "/ai-governance",               label: "AI Governance™",       icon: Brain },
      { href: "/agents",                      label: "Governance Agents™",   icon: Bot },
    ],
  },
  {
    key: "reports",
    label: "Reports",
    items: [
      { href: "/executive-reporting",     label: "Executive Reports",  icon: LineChart },
      { href: "/audits/reports",          label: "Audit Reports",      icon: ClipboardCheck },
      { href: "/risks/reports",           label: "Risk Reports",       icon: AlertTriangle },
      { href: "/compliance/reports",      label: "Compliance Reports", icon: ShieldCheck },
      { href: "/vendors/export",          label: "Vendor Reports",     icon: Building2 },
    ],
  },
  {
    key: "administration",
    label: "Administration",
    items: [
      { href: "/integration-hub",  label: "Integration Hub™",       icon: Plug },
      { href: "/finance",          label: "Finance Console",        icon: Receipt },
      { href: "/api/docs/ui",      label: "API Documentation",      icon: FileCode },
      { href: "/settings",         label: "Settings",               icon: Settings },
    ],
  },
];

// ─── Collapse state helpers ───────────────────────────────────────────────────

const STORAGE_KEY = "audt_sidebar_collapsed_v3";

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

// ─── NavGroup component ───────────────────────────────────────────────────────

function SidebarGroup({
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
  const hasActiveChild = group.items.some((item) => isActive(item.href));

  return (
    <div className="mt-1">
      <button
        onClick={onToggle}
        aria-label={`${collapsed ? "Expand" : "Collapse"} ${group.label}`}
        aria-expanded={!collapsed}
        className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors hover:bg-white/[0.04] group"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 shrink-0 text-[var(--color-ink-faint)]" />
        ) : (
          <ChevronDown className="h-3 w-3 shrink-0 text-[var(--color-ink-faint)]" />
        )}
        <span
          className={cn(
            "text-[10px] font-semibold uppercase tracking-widest transition-colors",
            hasActiveChild
              ? "text-[var(--color-blue)]/80"
              : "text-[var(--color-ink-faint)] group-hover:text-[var(--color-ink-dim)]"
          )}
        >
          {group.label}
        </span>
      </button>

      {!collapsed && (
        <div className="mt-0.5 flex flex-col gap-0.5">
          {group.items.length === 0 ? (
            <div className="mx-2 mb-1 rounded-md border border-dashed border-[var(--color-line)] px-3 py-2">
              <p className="text-[10px] text-[var(--color-ink-faint)] italic">Coming soon</p>
            </div>
          ) : (
            group.items.map(({ href, label, icon: Icon, soon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={`${href}-${label}`}
                  href={soon ? "#" : href}
                  aria-disabled={soon}
                  onClick={soon ? (e) => e.preventDefault() : undefined}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium transition-all",
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
            })
          )}
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

        {/* Dashboard */}
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

        {/* Executive Command Center */}
        <Link
          href="/executive-command-center"
          className={cn(
            "group mt-1 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all",
            isActive("/executive-command-center")
              ? "bg-[var(--color-blue)]/10 text-[var(--color-ink)]"
              : "text-[var(--color-ink-dim)] hover:bg-white/[0.04] hover:text-[var(--color-ink)]"
          )}
        >
          <Star
            className={cn(
              "h-4 w-4 shrink-0 transition-colors",
              isActive("/executive-command-center")
                ? "text-[var(--color-blue)]"
                : "text-[var(--color-ink-faint)] group-hover:text-[var(--color-ink-dim)]"
            )}
          />
          <span className="flex-1 truncate">Executive Center</span>
          {isActive("/executive-command-center") && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-blue)]" />
          )}
        </Link>

        {/* Platform pillars */}
        <div className="mt-3 flex flex-col">
          {navGroups.map((group) => (
            <SidebarGroup
              key={group.key}
              group={group}
              isActive={isActive}
              collapsed={isCollapsed(group.key)}
              onToggle={() => toggle(group.key)}
            />
          ))}
        </div>

      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-[var(--color-line)] px-3 py-3 space-y-0.5">
        <div className="flex items-center justify-between px-2.5 py-1">
          <NotificationBell />
        </div>
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
      </div>
    </aside>
  );
}
