"use client";

import { useState, useRef, useEffect } from "react";
import { chatAction } from "@/lib/toe/actions";
import { Bot, Send, User } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What workflows are currently running?",
  "Show me pending approvals",
  "What automation rules are active?",
  "Which governance events happened today?",
];

export function ToeAiChat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setInput("");
    setLoading(true);
    try {
      const res = await chatAction(next);
      setMsgs([...next, { role: "assistant", content: res.data ?? res.error ?? "No response." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[480px] flex-col rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[var(--color-line)] p-4">
        <Bot className="h-5 w-5 text-[var(--color-blue)]" />
        <span className="text-sm font-semibold">Operations AI</span>
        <span className="ml-auto rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">Live</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {msgs.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-[var(--color-ink-dim)]">Ask about your governance workflows, approvals, automation rules, or events.</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-1.5 text-xs text-[var(--color-ink-dim)] hover:bg-[#F8F9FB] hover:text-[var(--color-ink)] transition-colors text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
              m.role === "user" ? "bg-[var(--color-blue)]/20" : "bg-purple-500/20"
            }`}>
              {m.role === "user"
                ? <User className="h-3.5 w-3.5 text-[var(--color-blue)]" />
                : <Bot className="h-3.5 w-3.5 text-purple-400" />
              }
            </div>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
              m.role === "user"
                ? "bg-[var(--color-blue)]/10 text-[var(--color-ink)]"
                : "bg-[#F8F9FB] text-[var(--color-ink-dim)]"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/20">
              <Bot className="h-3.5 w-3.5 text-purple-400" />
            </div>
            <div className="rounded-2xl bg-[#F8F9FB] px-3 py-2 text-sm text-[var(--color-ink-dim)]">
              <span className="animate-pulse">Thinking&#8230;</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--color-line)] p-3 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send(input)}
          placeholder="Ask about workflows, approvals, automation&#8230;"
          className="flex-1 rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-dim)] focus:outline-none focus:border-[var(--color-blue)]"
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
          className="flex items-center justify-center rounded-xl bg-[var(--color-blue)] px-3 py-2 disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          <Send className="h-4 w-4 text-white" />
        </button>
      </div>
    </div>
  );
}
