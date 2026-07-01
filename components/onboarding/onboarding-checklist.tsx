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
  Bot,
  Lock,
} from "lucide-react";

const ALL_TASKS = [
  {
    key: "add_vendor",
    title: "Add your first vendor",
    desc: "Start building your supplier registry",
    href: "/vendors/new",
    Icon: Building2,
    goals: [] as string[],
    priority: { vendor_risk: 1 },
  },
  {
    key: "run_assessment",
    title: "Run a security assessment",
    desc: "Score a vendor's security posture",
    href: "/vendors",
    Icon: ShieldCheck,
    goals: ["vendor_risk"],
    priority: { vendor_risk: 2 },
  },
  {
    key: "create_risk",
    title: "Create your first risk",
    desc: "Log a governance risk in Risk Lens™",
    href: "/risks/new",
    Icon: AlertTriangle,
    goals: ["vendor_risk", "audit"],
    priority: { vendor_risk: 3, audit: 2 },
  },
  {
    key: "add_framework",
    title: "Add a compliance framework",
    desc: "ISO 27001, SOC 2, DPDP or custom",
    href: "/compliance/frameworks/new",
    Icon: Scale,
    goals: ["soc2", "dpdp", "audit"],
    priority: { soc2: 1, dpdp: 1, audit: 1 },
  },
  {
    key: "upload_doc",
    title: "Upload a vendor document",
    desc: "Attach a contract, cert or compliance doc",
    href: "/vendors",
    Icon: FileText,
    goals: ["soc2", "dpdp", "vendor_risk"],
    priority: { soc2: 2, dpdp: 2, vendor_risk: 4 },
  },
  {
    key: "explore_ai_governance",
    title: "Explore AI Governance™",
    desc: "Inventory your AI systems and manage risk",
    href: "/ai-governance",
    Icon: Bot,
    goals: ["ai_governance"],
    priority: { ai_governance: 1 },
  },
  {
    key: "explore_executive",
    title: "Generate an executive report",
    desc: "See your governance posture at a glance",
    href: "/executive-reporting",
    Icon: BarChart3,
    goals: ["executive_reporting"],
    priority: { executive_reporting: 1 },
  },
  {
    key: "invite_team",
    title: "Invite a teammate",
    desc: "Bring your compliance or security lead in",
    href: "/settings/team",
    Icon: Users,
    goals: [] as string[],
    priority: {} as Record<string, number>,
  },
  {
    key: "connect_integration",
    title: "Connect an integration",
    desc: "Link Entra ID, Okta, AWS, GitHub or Jira",
    href: "/integration-hub",
    Icon: Plug,
    goals: [] as string[],
    priority: {} as Record<string, number>,
  },
  {
    key: "explore_trust",
    title: "View your Trust Score™",
    desc: "See your Organizational Trust Score™",
    href: "/trust-intelligence",
    Icon: Lock,
    goals: [] as string[],
    priority: {} as Record<string, number>,
  },
] as const;

const GOAL_LABELS: Record<string, string> = {
  vendor_risk: "Vendor Risk",
  soc2: "SOC 2 Compliance",
  dpdp: "DPDP Privacy",
  audit: "Audit Readiness",
  ai_governance: "AI Governance",
  executive_reporting: "Executive Reporting",
};

const GOAL_CHIP_COLORS: Record<string, string> = {
  vendor_risk: "bg-orange-500/15 text-orange-300 border-orange-500/20",
  soc2: "bg-blue-500/15 text-blue-300 border-blue-500/20",
  dpdp: "bg-purple-500/15 text-purple-300 border-purple-500/20",
  audit: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  ai_governance: "bg-indigo-500/15 text-indigo-300 border-indigo-500/20",
  executive_reporting: "bg-cyan-500/15 text-cyan-300 border-cyan-500/20",
};

type TaskKey = (typeof ALL_TASKS)[number]["key"];

function getOrderedTasks(goals: string[]) {
  if (goals.length === 0) return ALL_TASKS.slice();

  const scored = ALL_TASKS.map((task) => {
    const priorities = task.priority as Record<string, number>;
    let score = 999;
    for (const goal of goals) {
      if (priorities[goal] !== undefined) {
        score = Math.min(score, priorities[goal]);
      }
    }
    const isRelevant = (task.goals as readonly string[]).some((g) => goals.includes(g)) || (task.goals as readonly string[]).length === 0;
    return { task, score, isRelevant };
  });

  const relevant = scored.filter((s) => s.isRelevant).sort((a, b) => a.score - b.score);
  const others = scored.filter((s) => !s.isRelevant);

  return [...relevant, ...others].map((s) => s.task);
}

const LS_COMPLETED = "audt_checklist_completed";
const LS_COLLAPSED = "audt_checklist_collapsed";
const LS_ALL_DONE = "audt_checklist_all_done";
const LS_GOALS = "audt_onboarding_goals";

export function OnboardingChecklist() {
  const router = useRouter();
  const [completed, setCompleted] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [goals, setGoals] = useState<string[]>([]);
  const [tasks, setTasks] = useState(ALL_TASKS.slice());

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
    }
    setCollapsed(localStorage.getItem(LS_COLLAPSED) === "1");

    try {
      const storedGoals = JSON.parse(localStorage.getItem(LS_GOALS) ?? "[]");
      if (Array.isArray(storedGoals)) {
        setGoals(storedGoals);
        setTasks(getOrderedTasks(storedGoals));
      }
    } catch {
    }

    setMounted(true);
  }, []);

  if (!mounted || allDone) return null;

  const total = tasks.length;
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
    <div className="rounded-2xl border border-[var(--color-line)] bg-white overflow-hidden">
      <button
        onClick={toggleCollapsed}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white"
      >
        <div className="flex items-center gap-3">
          <span className="text-base leading-none">&#10003;</span>
          <div>
            <span className="font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--color-ink)]">
              Get started
            </span>
            {goals.length > 0 && (
              <span className="ml-2 text-xs text-[var(--color-ink-dim)]">
                Personalized for your goals
              </span>
            )}
          </div>
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

      <div className="h-1 w-full bg-[#F8F9FB]">
        <div
          className="h-full rounded-full bg-[var(--color-blue)] transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      {!collapsed && (
        <>
          {goals.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t border-[var(--color-line)] px-4 py-2.5">
              {goals.map((goal) => (
                <span
                  key={goal}
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${GOAL_CHIP_COLORS[goal] ?? "bg-[#F8F9FB] text-[var(--color-ink-dim)] border-[var(--color-line)]"}`}
                >
                  {GOAL_LABELS[goal] ?? goal}
                </span>
              ))}
            </div>
          )}

          {isAllComplete ? (
            <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
              <span className="text-3xl">&#127881;</span>
              <p className="font-[family-name:var(--font-display)] font-semibold text-[var(--color-ink)]">
                You&apos;re all set! Governance workspace fully configured.
              </p>
              <button
                onClick={dismissAll}
                className="mt-1 rounded-lg border border-[var(--color-line)] px-4 py-2 text-xs font-medium text-[var(--color-ink-dim)] transition-colors hover:bg-[#F8F9FB] hover:text-[var(--color-ink)]"
              >
                Dismiss checklist
              </button>
            </div>
          ) : (
            <div>
              {tasks.map(({ key, title, desc, href, Icon }) => {
                const done = completed.includes(key);
                return (
                  <div
                    key={key}
                    className="flex items-center gap-3 border-t border-[var(--color-line)] px-4 py-2.5"
                  >
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

                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F8F9FB]">
                      <Icon className={`h-3.5 w-3.5 ${done ? "text-[var(--color-ink-faint)]" : "text-[var(--color-blue)]"}`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium leading-tight ${done ? "text-[var(--color-ink-faint)] line-through" : "text-[var(--color-ink)]"}`}
                        dangerouslySetInnerHTML={{ __html: title }}
                      />
                      {!done && (
                        <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]" dangerouslySetInnerHTML={{ __html: desc }} />
                      )}
                    </div>

                    {!done && (
                      <button
                        onClick={() => router.push(href)}
                        aria-label={`Go to ${title}`}
                        className="shrink-0 rounded-lg p-1.5 text-[var(--color-ink-faint)] transition-colors hover:bg-[#EEF2F7] hover:text-[var(--color-blue)]"
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
