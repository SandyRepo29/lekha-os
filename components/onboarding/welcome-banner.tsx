"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, ArrowRight } from "lucide-react";

const GOAL_MESSAGES: Record<string, { text: string; cta: string; href: string }> = {
  soc2: {
    text: "Your SOC 2 journey starts here. Begin with the Evidence Vault™.",
    cta: "Start with Evidence Vault™",
    href: "/compliance",
  },
  dpdp: {
    text: "Your DPDP Privacy compliance journey starts here. Begin with the Evidence Vault™.",
    cta: "Start with Evidence Vault™",
    href: "/compliance",
  },
  audit: {
    text: "Your Audit Readiness journey starts here. Begin with the Evidence Vault™.",
    cta: "Start with Evidence Vault™",
    href: "/compliance",
  },
  vendor_risk: {
    text: "Your Vendor Risk program starts here. Add your first supplier to Vendor Hub™.",
    cta: "Start with Vendor Hub™",
    href: "/vendors",
  },
  ai_governance: {
    text: "Your AI Governance program starts here. Inventory your AI systems.",
    cta: "Start with AI Governance™",
    href: "/ai-governance",
  },
  executive_reporting: {
    text: "Your executive visibility journey starts here. Explore your governance analytics.",
    cta: "Start with Executive Reporting™",
    href: "/executive-reporting",
  },
};

const GOAL_PRIORITY = ["soc2", "dpdp", "audit", "vendor_risk", "ai_governance", "executive_reporting"];

export function WelcomeBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [goalMessage, setGoalMessage] = useState<{ text: string; cta: string; href: string } | null>(null);

  useEffect(() => {
    const isWelcome = searchParams.get("welcome") === "1";
    const dismissed = localStorage.getItem("audt_welcome_dismissed") === "1";
    if (isWelcome && !dismissed) {
      setVisible(true);
      try {
        const stored = JSON.parse(localStorage.getItem("audt_onboarding_goals") ?? "[]");
        if (Array.isArray(stored) && stored.length > 0) {
          const primaryGoal = GOAL_PRIORITY.find((g) => stored.includes(g));
          if (primaryGoal && GOAL_MESSAGES[primaryGoal]) {
            setGoalMessage(GOAL_MESSAGES[primaryGoal]);
          }
        }
      } catch {
      }
    }
  }, [searchParams]);

  function dismiss() {
    localStorage.setItem("audt_welcome_dismissed", "1");
    setVisible(false);
    router.replace("/dashboard");
  }

  function navigateCta(href: string) {
    localStorage.setItem("audt_welcome_dismissed", "1");
    setVisible(false);
    router.push(href);
  }

  if (!visible) return null;

  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-purple-500/10 px-5 py-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-xl leading-none">&#127881;</span>
        <div className="flex-1">
          <p className="font-[family-name:var(--font-display)] font-bold text-[var(--color-ink)]">
            Welcome to AUDT!
          </p>
          <p
            className="mt-0.5 text-sm text-[var(--color-ink-dim)]"
            dangerouslySetInnerHTML={{
              __html: goalMessage
                ? goalMessage.text
                : "Your governance workspace is ready. We&#8217;ve set up your modules based on your goals. Start with the checklist below.",
            }}
          />
          {goalMessage && (
            <button
              onClick={() => navigateCta(goalMessage.href)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-blue)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <span dangerouslySetInnerHTML={{ __html: goalMessage.cta }} />
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss welcome banner"
        className="shrink-0 rounded-lg p-1.5 text-[var(--color-ink-faint)] transition-colors hover:bg-[#EEF2F7] hover:text-[var(--color-ink)]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
