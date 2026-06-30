"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Send, Sparkles, User } from "lucide-react";
import { aiChatAction } from "@/lib/audit/actions";
import { Button } from "@/components/ui/button";

type Message = { role: "user" | "model"; text: string };

const QUICK_PROMPTS = [
  "Show all critical findings",
  "Which CAPAs are overdue?",
  "Summarize my audit posture",
  "Which audits need attention?",
  "What findings are unresolved?",
];

export function AuditAiChat({ aiEnabled }: { aiEnabled: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  const send = (text: string) => {
    if (!text.trim() || pending || !aiEnabled) return;
    const userMsg: Message = { role: "user", text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setError(null);

    startTransition(async () => {
      const res = await aiChatAction("", text.trim(), messages);
      if ("error" in res) {
        setError(res.error);
      } else {
        setMessages((prev) => [...prev, { role: "model", text: res.reply }]);
      }
    });
  };

  return (
    <div className="flex flex-col" style={{ minHeight: 400 }}>
      <div className="flex-1 space-y-4 overflow-y-auto p-4" style={{ maxHeight: 500 }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-blue)]/10">
              <Sparkles className="h-7 w-7 text-[var(--color-blue)]" />
            </div>
            <div>
              <p className="font-[family-name:var(--font-display)] font-semibold text-[var(--color-ink)]">
                AI Auditor Assistant
              </p>
              <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
                {aiEnabled
                  ? "Ask anything about your audits, findings, or CAPAs."
                  : "Add GEMINI_API_KEY to enable AI features."}
              </p>
            </div>
            {aiEnabled && (
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="rounded-full border border-[var(--color-line)] bg-white px-3 py-1.5 text-xs text-[var(--color-ink-dim)] transition-colors hover:border-[var(--color-blue)]/40 hover:bg-[var(--color-blue)]/5 hover:text-[var(--color-ink)]"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                msg.role === "user" ? "bg-[var(--color-blue)]/20" : "bg-[var(--color-blue)]/10"
              }`}
            >
              {msg.role === "user" ? (
                <User className="h-4 w-4 text-[var(--color-blue)]" />
              ) : (
                <Sparkles className="h-4 w-4 text-[var(--color-blue)]" />
              )}
            </div>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[var(--color-blue)]/10 text-[var(--color-ink)]"
                  : "border border-[var(--color-line)] bg-white text-[var(--color-ink-dim)]"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {pending && (
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-blue)]/10">
              <Sparkles className="h-4 w-4 animate-pulse text-[var(--color-blue)]" />
            </div>
            <div className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-blue)]/40 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-blue)]/40 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-blue)]/40 [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-[var(--color-line)] p-4">
        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!aiEnabled || pending}
            placeholder={
              aiEnabled ? "Ask about audits, findings, CAPAs…" : "GEMINI_API_KEY required"
            }
            className="flex-1 rounded-xl border border-[var(--color-line-strong)] bg-white px-4 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)]/30 disabled:opacity-50"
          />
          <Button
            type="submit"
            variant="primary"
            size="icon"
            disabled={!aiEnabled || pending || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        {messages.length > 0 && (
          <button
            className="mt-2 text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-ink-dim)]"
            onClick={() => { setMessages([]); setError(null); }}
          >
            Clear conversation
          </button>
        )}
      </div>
    </div>
  );
}
