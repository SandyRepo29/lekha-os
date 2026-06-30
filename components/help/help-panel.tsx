"use client";

import { usePathname } from "next/navigation";
import { X, CheckCircle2, Lightbulb, ExternalLink } from "lucide-react";
import { HELP_CONTENT } from "./help-content";

interface HelpPanelProps {
  open: boolean;
  onClose: () => void;
}

function matchModule(pathname: string) {
  // Try longest prefix match first
  const routes = Object.keys(HELP_CONTENT).sort((a, b) => b.length - a.length);
  for (const route of routes) {
    if (route === "/dashboard") {
      if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
        return HELP_CONTENT[route];
      }
    } else if (pathname === route || pathname.startsWith(route + "/")) {
      return HELP_CONTENT[route];
    }
  }
  return null;
}

export function HelpPanel({ open, onClose }: HelpPanelProps) {
  const pathname = usePathname();
  const module = matchModule(pathname);

  const title = module?.title ?? "AUDT Help";
  const overview =
    module?.overview ??
    "AUDT is the AI-Native Trust, Risk & Compliance Platform — the Governance OS for modern organisations. Use the sidebar to navigate to any module and open this panel for contextual help.";
  const features = module?.features ?? [
    "Vendor Hub™ — vendor registry, documents, assessments, Trust Score™",
    "Evidence Vault™ — compliance frameworks, controls, evidence, gaps",
    "Risk Lens™ — risk register, heat map, treatments, AI Risk Officer",
    "Control Center™ — control library, health scoring, testing",
    "Trust Intelligence™ — Org Trust Score™, recommendations, Governance Copilot™",
  ];
  const tips = module?.tips ?? [
    "Use the topbar search to find vendors with plain English queries.",
    "Check Trust Intelligence → Executive View for a board-ready governance summary.",
  ];
  const route = module?.route;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Slide-over panel */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-80 flex-col border-l border-[var(--color-line)] bg-[var(--color-bg-2)] shadow-2xl transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Help panel"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-line)] px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[var(--color-blue)]/15">
              <span className="h-2 w-2 rounded-full bg-[var(--color-blue)]" />
            </span>
            <span className="font-[family-name:var(--font-display)] text-sm font-bold text-[var(--color-ink)] truncate">
              {title}
            </span>
          </div>
          <button
            onClick={onClose}
            className="ml-2 shrink-0 rounded-md p-1 text-[var(--color-ink-faint)] transition-colors hover:bg-[#F8F9FB] hover:text-[var(--color-ink)]"
            aria-label="Close help panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 scrollbar-thin">
          {/* Overview */}
          <section>
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
              Overview
            </h3>
            <p className="text-[13px] leading-relaxed text-[var(--color-ink-dim)]">
              {overview}
            </p>
          </section>

          {/* Features */}
          <section>
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
              Features
            </h3>
            <ul className="space-y-2">
              {features.map((feat, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-blue)]" />
                  <span className="text-[13px] leading-snug text-[var(--color-ink-dim)]">
                    {feat}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Tips */}
          <section>
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
              Tips
            </h3>
            <ul className="space-y-2">
              {tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 rounded-lg border border-[var(--color-line)] bg-white px-3 py-2">
                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                  <span className="text-[12px] leading-snug text-[var(--color-ink-dim)]">
                    {tip}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[var(--color-line)] px-4 py-3">
          <a
            href={`/help${route ? "#" + route.replace(/^\//, "") : ""}`}
            className="flex items-center justify-center gap-2 rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-[13px] font-medium text-[var(--color-ink-dim)] transition-colors hover:bg-[#F8F9FB] hover:text-[var(--color-ink)]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View full docs
          </a>
        </div>
      </div>
    </>
  );
}
