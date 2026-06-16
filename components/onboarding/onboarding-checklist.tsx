"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  FileText,
  ShieldCheck,
  Scale,
  AlertTriangle,
  Users,
  Plug,
  BarChart3,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Check,
} from "lucide-react";

const TASKS = [
  {
    key: "add_vendor",
    title: "Add your first vendor",
    desc: "Start building your supplier registry",
    href: "/vendors/new",
    Icon: Building2,
  },
  {
    key: "upload_doc",
    title: "Upload a vendor document",
    desc: "Attach a contract, cert or compliance doc",
    href: "/vendors",
    Icon: FileText,
  },
  {
    key: "run_assessment",
    title: "Run a security assessment",
    desc: "Score a vendor's security posture",
    href: "/vendors",
    Icon: ShieldCheck,
  },
  {
    key: "add_framework",
    title: "Add a compliance framework",
    desc: "ISO 27001, SOC 2, DPDP or custom",
    href: "/compliance/frameworks/new",
    Icon: Scale,
  },
  {
    key: "create_risk",
    title: "Create your first risk",
    desc: "Log a governance risk in Risk Lens™",
    href: "/risks/new",
    Icon: AlertTriangle,
  },
  {
    key: "invite_team",
    title: "Invite a teammate",
    desc: "Bring your compliance or security lead in",
    href: "/settings/team",
    Icon: Users,
  },
  {
    key: "connect_integration",
    title: "Connect an integration",
    desc: "Link Entra ID, Okta, AWS, GitHub or Jira",
    href: "/integration-hub",
    Icon: Plug,
  },
  {
    key: "explore_trust",
    title: "View your Trust Score™",
    desc: "See your Organizational Trust Score™",
    href: "/trust-intelligence",
    Icon: BarChart3,
  },
] as const;

const LS_COMPLETED = "audt_checklist_completed";
const LS_COLLAPSED = "audt_checklist_collapsed";
const LS_ALL_DONE = "audt_checklist_all_done";

export function OnboardingChecklist() {
  const router = useRouter();
  const [completed, setCompleted] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(LS_ALL_DONE) === "1") {
      setAllDone(true);
      setMounted(true);
      return;
    }
    try {
      const stored = JSON.parse(localStorage.getItem(LS_COMPLETED) ?? "[]");
      if (Array.isArray(stored)) setCompleted(stored);
    } catch {
      // ignore
    }
    setCollapsed(localStorage.getItem(LS_COLLAPSED) === "1");
    setMounted(true);
  }, []);

  if (!mounted || allDone) return null;

  const total = TASKS.length;
  const doneCount = completed.length;
  const percent = Math.round((doneCount / total) * 100);

  function toggleTask(key: string) {
    setCompleted((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      localStorage.setItem(LS_COMPLETED, JSON.stringify(next));
      return next;
    });
  }

  function toggleCollapsed() {
    setCollapsed((prev) => {
      localStorage.setItem(LS_COLLAPSED, prev ? "" : "1");
      return !prev;
    });
  }

  function dismissAll() {
    localStorage.setItem(LS_ALL_DONE, "1");
    setAllDone(true);
  }

  const isAllComplete = doneCount === total;

  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] overflow-hidden">
      {/* Header */}
      <button
        onClick={toggleCollapsed}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
      >
        <div className="flex items-center gap-3">
          <span className="text-base leading-none">✅</span>
          <span className="font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--color-ink)]">
            Get started
          </span>
          <span className="text-xs text-[var(--color-ink-dim)]">
            {doneCount} of {total} complete
          </span>
        </div>
        {collapsed ? (
          <ChevronDown className="h-4 w-4 text-[var(--color-ink-faint)]" />
        ) : (
          <ChevronUp className="h-4 w-4 text-[var(--color-ink-faint)]" />
        )}
      </button>

      {/* Progress bar */}
      <div className="h-1 w-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-[var(--color-blue)] transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Task list */}
      {!collapsed && (
        <>
          {isAllComplete ? (
            <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
              <span className="text-3xl">🎉</span>
              <p className="font-[family-name:var(--font-display)] font-semibold text-[var(--color-ink)]">
                You&apos;re all set! Governance workspace fully configured.
              </p>
              <button
                onClick={dismissAll}
                className="mt-1 rounded-lg border border-[var(--color-line)] px-4 py-2 text-xs font-medium text-[var(--color-ink-dim)] transition-colors hover:bg-white/[0.06] hover:text-[var(--color-ink)]"
              >
                Dismiss checklist
              </button>
            </div>
          ) : (
            <div>
              {TASKS.map(({ key, title, desc, href, Icon }) => {
                const done = completed.includes(key);
                return (
                  <div
                    key={key}
                    className="flex items-center gap-3 border-t border-[var(--color-line)] px-4 py-2.5"
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleTask(key)}
                      aria-label={done ? `Mark ${title} incomplete` : `Mark ${title} complete`}
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        done
                          ? "border-emerald-500 bg-emerald-500/20"
                          : "border-white/20 hover:border-white/40"
                      }`}
                    >
                      {done && <Check className="h-3 w-3 text-emerald-400" strokeWidth={3} />}
                    </button>

                    {/* Icon */}
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
                      <Icon className={`h-3.5 w-3.5 ${done ? "text-[var(--color-ink-faint)]" : "text-[var(--color-blue)]"}`} />
                    </div>

                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium leading-tight ${done ? "text-[var(--color-ink-faint)] line-through" : "text-[var(--color-ink)]"}`}>
                        {title}
                      </p>
                      {!done && (
                        <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">{desc}</p>
                      )}
                    </div>

                    {/* Arrow link */}
                    {!done && (
                      <button
                        onClick={() => router.push(href)}
                        aria-label={`Go to ${title}`}
                        className="shrink-0 rounded-lg p-1.5 text-[var(--color-ink-faint)] transition-colors hover:bg-white/[0.08] hover:text-[var(--color-blue)]"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
