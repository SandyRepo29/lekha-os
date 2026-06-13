"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Bot, Send, Sparkles, Code2, BookOpen, Zap, RefreshCw } from "lucide-react";
import { generatePlatformSummaryAction, generateApiDocsAction, chatAction } from "@/lib/trust-api/actions";
import type { ApiPlatformSummary, ApiDocs } from "@/lib/services/trust-api/ai-trust-api-service";

const PRODUCTS = [
  { slug: "trust-score",       name: "Trust Score API™" },
  { slug: "vendor-trust",      name: "Vendor Trust API™" },
  { slug: "ai-trust",          name: "AI Trust API™" },
  { slug: "benchmarking",      name: "Benchmark API™" },
  { slug: "verification",      name: "Verification API™" },
  { slug: "trust-network",     name: "Trust Network API™" },
];

type Message = { role: "user" | "assistant"; content: string };

export default function TrustApiAiPage() {
  const [isPending, startTransition] = useTransition();
  const [summary, setSummary] = useState<ApiPlatformSummary | null>(null);
  const [docs, setDocs] = useState<ApiDocs | null>(null);
  const [selectedProduct, setSelectedProduct] = useState("trust-score");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  function handleGenerateSummary() {
    startTransition(async () => {
      const res = await generatePlatformSummaryAction();
      if (res.data) setSummary(res.data);
    });
  }

  function handleGenerateDocs() {
    startTransition(async () => {
      const res = await generateApiDocsAction(selectedProduct);
      if (res.data) setDocs(res.data);
    });
  }

  function handleChat() {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", content: input };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    startTransition(async () => {
      const res = await chatAction(nextMessages);
      if (res.data) setMessages([...nextMessages, { role: "assistant", content: (res.data as { content: string }).content }]);
    });
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <div className="mb-1 text-xs text-[var(--color-ink-faint)]">
          <Link href="/trust-api" className="hover:underline">Trust API Platform™</Link> / AI Advisor
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">AI API Advisor™</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
          AI-powered platform insights, API documentation generator, and integration guidance.
        </p>
      </div>

      {/* Platform Summary */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--color-blue)]" />
            <h2 className="font-semibold">Platform Intelligence Summary</h2>
          </div>
          <button
            onClick={handleGenerateSummary}
            disabled={isPending}
            className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-1.5 text-xs font-medium hover:bg-white/[0.07] disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
            {summary ? "Regenerate" : "Generate"}
          </button>
        </div>

        {summary ? (
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-ink-dim)]">{summary.summary}</p>
            <div className="rounded-xl border border-[var(--color-line)]/50 bg-white/[0.02] p-3">
              <div className="text-xs font-semibold text-[var(--color-ink-dim)] mb-1">Integration Health</div>
              <p className="text-sm">{summary.integrationHealth}</p>
            </div>
            {summary.topOpportunities?.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-[var(--color-ink-dim)] mb-2">Top Opportunities</div>
                <ul className="space-y-1">
                  {summary.topOpportunities.map((o: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" /> {o}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {summary.recommendations?.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-[var(--color-ink-dim)] mb-2">Recommendations</div>
                <ul className="space-y-1">
                  {summary.recommendations.map((r: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Bot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-blue)]" /> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Bot className="mx-auto mb-2 h-8 w-8 text-[var(--color-ink-faint)]" />
            <p className="text-sm text-[var(--color-ink-faint)]">Click Generate to get AI-powered platform insights.</p>
          </div>
        )}
      </div>

      {/* AI API Builder */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Code2 className="h-4 w-4 text-emerald-400" />
          <h2 className="font-semibold">AI API Builder™</h2>
        </div>
        <p className="mb-4 text-sm text-[var(--color-ink-dim)]">Generate documentation, code samples, and integration guides for any API product.</p>

        <div className="mb-4 flex items-center gap-3">
          <select
            value={selectedProduct}
            onChange={e => setSelectedProduct(e.target.value)}
            className="flex-1 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm outline-none"
          >
            {PRODUCTS.map(p => <option key={p.slug} value={p.slug}>{p.name}</option>)}
          </select>
          <button
            onClick={handleGenerateDocs}
            disabled={isPending}
            className="flex items-center gap-2 rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {isPending ? "Building…" : "Generate Docs"}
          </button>
        </div>

        {docs && (
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-[var(--color-ink-dim)] mb-1">Endpoint</div>
              <code className="text-sm font-mono text-[var(--color-blue)]">{docs.endpoint}</code>
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--color-ink-dim)] mb-1">Description</div>
              <p className="text-sm text-[var(--color-ink-dim)]">{docs.description}</p>
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--color-ink-dim)] mb-1">cURL Example</div>
              <pre className="overflow-x-auto rounded-xl bg-black/30 p-3 text-[11px] font-mono text-[var(--color-ink-dim)] whitespace-pre-wrap">{docs.exampleRequest}</pre>
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--color-ink-dim)] mb-1">Example Response</div>
              <pre className="overflow-x-auto rounded-xl bg-black/30 p-3 text-[11px] font-mono text-[var(--color-ink-dim)] whitespace-pre-wrap">{docs.exampleResponse}</pre>
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--color-ink-dim)] mb-1">SDK Sample</div>
              <pre className="overflow-x-auto rounded-xl bg-black/30 p-3 text-[11px] font-mono text-[var(--color-ink-dim)] whitespace-pre-wrap">{docs.sdkSample}</pre>
            </div>
          </div>
        )}
      </div>

      {/* AI Chat */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Bot className="h-4 w-4 text-violet-400" />
          <h2 className="font-semibold">AI Integration Advisor™</h2>
        </div>

        <div className="mb-4 h-64 overflow-y-auto space-y-3 rounded-xl bg-black/20 p-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <Bot className="mx-auto mb-2 h-8 w-8 text-[var(--color-ink-faint)]" />
                <p className="text-xs text-[var(--color-ink-faint)]">Ask about API integration, webhooks, authentication, or platform strategy.</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {["How do I authenticate?", "Which API should I use?", "How do webhooks work?"].map(q => (
                    <button key={q} onClick={() => setInput(q)} className="rounded-lg border border-[var(--color-line)]/50 px-2.5 py-1 text-[11px] text-[var(--color-ink-dim)] hover:border-[var(--color-blue)]/40 hover:text-[var(--color-blue)] transition-colors">{q}</button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${m.role === "user" ? "bg-[var(--color-blue)]/20 text-[var(--color-ink)]" : "bg-white/[0.06] text-[var(--color-ink-dim)]"}`}>
                  {m.content}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChat(); } }}
            placeholder="Ask about API integration, authentication, or webhook strategy…"
            className="flex-1 rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-blue)]/50"
          />
          <button onClick={handleChat} disabled={isPending || !input.trim()} className="flex items-center gap-2 rounded-xl grad-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
