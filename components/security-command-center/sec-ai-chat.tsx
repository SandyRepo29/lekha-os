"use client";

import { useState } from "react";
import { Bot, Send, User } from "lucide-react";
import { securityChatAction } from "@/lib/security-command-center/actions";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTED = [
  "What are our top security risks?",
  "How can we improve MFA coverage?",
  "Are there any active session anomalies?",
  "What vendor monitoring alerts need attention?",
];

export default function SecAiChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function send(text: string) {
    if (!text.trim()) return;
    const newMessages: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const result = await securityChatAction(newMessages);
      const reply = result.ok ? (result.response ?? "No response.") : (result.error ?? "Error.");
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {messages.length === 0 && (
        <div className="grid grid-cols-2 gap-2">
          {SUGGESTED.map(q => (
            <button
              key={q}
              onClick={() => send(q)}
              data-question={q}
              className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2.5 text-left text-xs text-[var(--color-ink-dim)] hover:bg-[#F8F9FB] hover:text-[var(--color-ink)] transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`shrink-0 rounded-full p-1.5 ${m.role === "user" ? "bg-[var(--color-blue)]/20" : "bg-violet-500/20"}`}>
                {m.role === "user" ? <User className="h-3.5 w-3.5 text-[var(--color-blue)]" /> : <Bot className="h-3.5 w-3.5 text-violet-400" />}
              </div>
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-[var(--color-blue)]/10 text-[var(--color-ink)]"
                  : "bg-[#F8F9FB] text-[var(--color-ink-dim)]"
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="shrink-0 rounded-full p-1.5 bg-violet-500/20">
                <Bot className="h-3.5 w-3.5 text-violet-400" />
              </div>
              <div className="rounded-2xl bg-[#F8F9FB] px-3.5 py-2.5 text-sm text-[var(--color-ink-dim)]">
                <span className="animate-pulse">Analysing…</span>
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask the Security Advisor…"
          className="flex-1 rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-blue)]/50 focus:ring-1 focus:ring-[var(--color-blue)]/20 placeholder:text-[var(--color-ink-muted)]"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl grad-brand px-4 py-2.5 text-sm font-semibold text-white shadow disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
