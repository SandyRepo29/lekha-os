"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

export function WelcomeBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isWelcome = searchParams.get("welcome") === "1";
    const dismissed = localStorage.getItem("audt_welcome_dismissed") === "1";
    if (isWelcome && !dismissed) {
      setVisible(true);
    }
  }, [searchParams]);

  function dismiss() {
    localStorage.setItem("audt_welcome_dismissed", "1");
    setVisible(false);
    router.replace("/dashboard");
  }

  if (!visible) return null;

  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-purple-500/10 px-5 py-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-xl leading-none">🎉</span>
        <div>
          <p className="font-[family-name:var(--font-display)] font-bold text-[var(--color-ink)]">
            Welcome to AUDT!
          </p>
          <p className="mt-0.5 text-sm text-[var(--color-ink-dim)]">
            Your governance workspace is ready. We&apos;ve set up your modules based on your goals. Start with the checklist below.
          </p>
        </div>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss welcome banner"
        className="shrink-0 rounded-lg p-1.5 text-[var(--color-ink-faint)] transition-colors hover:bg-white/[0.08] hover:text-[var(--color-ink)]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
