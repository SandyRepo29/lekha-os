"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Link2, Unlink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  mapEvidenceToControlAction,
  unmapEvidenceFromControlAction,
} from "@/lib/compliance/actions";

type Control = {
  id: string;
  controlRef: string;
  name: string;
  category: string | null;
  status: string;
};

type Framework = {
  id: string;
  name: string;
  controls: Control[];
};

interface Props {
  evidenceId: string;
  frameworks: Framework[];
  /** IDs of controls already mapped to this evidence item. */
  mappedControlIds: string[];
}

export function EvidenceMapper({ evidenceId, frameworks, mappedControlIds }: Props) {
  const [mapped, setMapped] = useState<Set<string>>(new Set(mappedControlIds));
  const [expanded, setExpanded] = useState<Set<string>>(new Set(frameworks.map((f) => f.id)));
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [, startTransition] = useTransition();
  const router = useRouter();

  const [search, setSearch] = useState("");

  const toggle = (controlId: string) => {
    const isMapped = mapped.has(controlId);
    setLoading((prev) => new Set(prev).add(controlId));
    setErrors((prev) => { const n = { ...prev }; delete n[controlId]; return n; });

    startTransition(async () => {
      const res = isMapped
        ? await unmapEvidenceFromControlAction(evidenceId, controlId)
        : await mapEvidenceToControlAction(evidenceId, controlId);

      setLoading((prev) => { const n = new Set(prev); n.delete(controlId); return n; });

      if (res?.error) {
        setErrors((prev) => ({ ...prev, [controlId]: res.error! }));
      } else {
        setMapped((prev) => {
          const n = new Set(prev);
          isMapped ? n.delete(controlId) : n.add(controlId);
          return n;
        });
        router.refresh();
      }
    });
  };

  const toggleFramework = (id: string) => {
    setExpanded((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const totalFrameworks = frameworks.length;
  const totalMapped = mapped.size;

  if (totalFrameworks === 0) {
    return (
      <p className="py-6 text-center text-sm text-[var(--color-ink-faint)]">
        No frameworks yet — add a framework first to map controls.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--color-ink-faint)]">
          {totalMapped} control{totalMapped !== 1 ? "s" : ""} mapped across {totalFrameworks} framework{totalFrameworks !== 1 ? "s" : ""}
        </p>
        <input
          type="text"
          placeholder="Search controls…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-44 rounded-lg border border-[var(--color-line)] bg-white px-3 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)]"
        />
      </div>

      {/* Frameworks */}
      {frameworks.map((fw) => {
        const filtered = fw.controls.filter(
          (c) =>
            !search ||
            c.controlRef.toLowerCase().includes(search.toLowerCase()) ||
            c.name.toLowerCase().includes(search.toLowerCase())
        );
        if (filtered.length === 0) return null;

        const isOpen = expanded.has(fw.id);
        const mappedInFw = filtered.filter((c) => mapped.has(c.id)).length;

        return (
          <div
            key={fw.id}
            className="rounded-xl border border-[var(--color-line)] overflow-hidden"
          >
            {/* Framework header */}
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-white transition-colors"
              onClick={() => toggleFramework(fw.id)}
            >
              <div className="flex items-center gap-2">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-[var(--color-ink-faint)]" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-[var(--color-ink-faint)]" />
                )}
                <span className="font-medium text-sm">{fw.name}</span>
                <span className="text-xs text-[var(--color-ink-faint)]">
                  ({filtered.length} controls)
                </span>
              </div>
              {mappedInFw > 0 && (
                <span className="rounded-full bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-xs text-emerald-700">
                  {mappedInFw} mapped
                </span>
              )}
            </button>

            {/* Controls list */}
            {isOpen && (
              <div className="border-t border-[var(--color-line)] divide-y divide-[var(--color-line)]">
                {filtered.map((control) => {
                  const isMapped = mapped.has(control.id);
                  const isLoading = loading.has(control.id);
                  const err = errors[control.id];

                  return (
                    <div
                      key={control.id}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 transition-colors",
                        isMapped ? "bg-emerald-500/[0.03]" : "hover:bg-white"
                      )}
                    >
                      {/* Checkbox */}
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => toggle(control.id)}
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all",
                          isMapped
                            ? "border-emerald-500 bg-emerald-500"
                            : "border-[var(--color-line-strong)] bg-transparent hover:border-[var(--color-blue)]",
                          isLoading && "opacity-40"
                        )}
                        aria-label={isMapped ? "Unmap" : "Map"}
                      >
                        {isMapped && (
                          <svg viewBox="0 0 12 10" className="h-3 w-3 fill-none stroke-white stroke-2">
                            <polyline points="1,5 4,9 11,1" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>

                      {/* Control info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-[var(--color-ink-faint)]">
                            {control.controlRef}
                          </span>
                          <span className="truncate text-sm text-[var(--color-ink)]">
                            {control.name}
                          </span>
                        </div>
                        {control.category && (
                          <p className="text-xs text-[var(--color-ink-faint)]">{control.category}</p>
                        )}
                      </div>

                      {/* Mapped indicator / loading */}
                      <div className="shrink-0 w-20 text-right">
                        {isLoading ? (
                          <span className="text-xs text-[var(--color-ink-faint)]">Saving…</span>
                        ) : isMapped ? (
                          <span className="flex items-center justify-end gap-1 text-xs text-emerald-700">
                            <Link2 className="h-3 w-3" /> Mapped
                          </span>
                        ) : (
                          <span className="flex items-center justify-end gap-1 text-xs text-[var(--color-ink-faint)] opacity-0 group-hover:opacity-100">
                            <Unlink className="h-3 w-3" />
                          </span>
                        )}
                        {err && <p className="text-xs text-red-700">{err}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
