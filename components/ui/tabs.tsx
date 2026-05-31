"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  count?: number;
  badge?: "warn" | "danger";
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  children: (activeTab: string) => React.ReactNode;
  className?: string;
}

export function Tabs({ tabs, defaultTab, children, className }: TabsProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);

  return (
    <div className={cn("space-y-5", className)}>
      {/* Tab bar */}
      <div className="flex items-center gap-1 rounded-xl border border-[var(--color-line)] bg-white/[0.02] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
              active === tab.id
                ? "bg-white/[0.08] text-[var(--color-ink)] shadow-sm"
                : "text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:bg-white/[0.04]"
            )}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                tab.badge === "danger" ? "bg-red-500/20 text-red-400"
                  : tab.badge === "warn" ? "bg-amber-500/20 text-amber-400"
                  : "bg-white/10 text-[var(--color-ink-faint)]"
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {children(active)}
    </div>
  );
}
