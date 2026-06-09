"use client";

import { useState, useTransition } from "react";
import { draftPolicyAction, generateGapAnalysisAction, generateExecutiveSummaryAction } from "@/lib/policy-governance/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Search, BarChart2, Loader2 } from "lucide-react";

export function PolicyAiPanels() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <DraftPanel />
      <GapPanel />
      <ExecutiveSummaryPanel />
    </div>
  );
}

function DraftPanel() {
  const [pending, startTransition] = useTransition();
  const [topic, setTopic] = useState("");
  const [context, setContext] = useState("");
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    if (!topic.trim()) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("topic", topic);
      fd.set("context", context);
      const result = await draftPolicyAction(undefined, fd);
      if (result?.error) setError(result.error);
      else if (result?.data) setDraft(result.data as string);
    });
  }

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-indigo-400" />
        <h3 className="font-semibold">AI Policy Draft™</h3>
      </div>
      <p className="text-xs text-[var(--color-ink-dim)]">
        Generate a complete, professional policy document from a topic description.
      </p>
      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium">Policy Topic</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Remote Work Security Policy"
            className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium">Additional Context (optional)</label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={2}
            placeholder="Industry, compliance requirements, specific scope…"
            className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
        <Button size="sm" onClick={handleGenerate} disabled={pending || !topic.trim()} className="w-full">
          {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Drafting…</> : "Generate Draft"}
        </Button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {draft && (
        <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.02] p-4 max-h-96 overflow-y-auto">
          <pre className="text-xs text-[var(--color-ink)] whitespace-pre-wrap font-sans">{draft}</pre>
        </div>
      )}
    </Card>
  );
}

function GapPanel() {
  const [pending, startTransition] = useTransition();
  const [gaps, setGaps] = useState<{ missing: string[]; weak: string[]; outdated: string[]; unmapped: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleAnalyse() {
    startTransition(async () => {
      const result = await generateGapAnalysisAction();
      if (result?.error) setError(result.error);
      else if (result?.data) setGaps(result.data as typeof gaps);
    });
  }

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-yellow-400" />
        <h3 className="font-semibold">AI Gap Analysis™</h3>
      </div>
      <p className="text-xs text-[var(--color-ink-dim)]">
        Detect missing, weak, outdated, and unmapped policies across your library.
      </p>
      <Button size="sm" onClick={handleAnalyse} disabled={pending} className="w-full">
        {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Analysing…</> : "Run Gap Analysis"}
      </Button>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {gaps && (
        <div className="space-y-3">
          {(Object.entries(gaps) as [string, string[]][]).map(([key, items]) => (
            items.length > 0 && (
              <div key={key}>
                <p className="text-xs font-semibold capitalize mb-1 text-[var(--color-ink-dim)]">
                  {key === "missing" ? "Missing Policies" : key === "weak" ? "Weak Policies" : key === "outdated" ? "Outdated Policies" : "Unmapped Policies"}
                </p>
                <ul className="space-y-1">
                  {items.map((item, i) => (
                    <li key={i} className="text-xs text-[var(--color-ink)] flex items-start gap-1.5">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-orange-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )
          ))}
        </div>
      )}
    </Card>
  );
}

function ExecutiveSummaryPanel() {
  const [pending, startTransition] = useTransition();
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateExecutiveSummaryAction();
      if (result?.error) setError(result.error);
      else if (result?.data) setSummary(result.data as string);
    });
  }

  return (
    <Card className="p-5 space-y-4 sm:col-span-2">
      <div className="flex items-center gap-2">
        <BarChart2 className="h-4 w-4 text-green-400" />
        <h3 className="font-semibold">AI Executive Summary</h3>
      </div>
      <p className="text-xs text-[var(--color-ink-dim)]">
        Board-ready summary of your policy governance posture (cached 24h).
      </p>
      <Button size="sm" onClick={handleGenerate} disabled={pending}>
        {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : "Generate Summary"}
      </Button>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {summary && (
        <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.02] p-4">
          <p className="text-sm text-[var(--color-ink)] whitespace-pre-wrap">{summary}</p>
        </div>
      )}
    </Card>
  );
}
