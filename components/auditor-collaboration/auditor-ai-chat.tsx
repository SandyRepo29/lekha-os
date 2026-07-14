"use client";

import { useState } from "react";
import { chatAction } from "@/backend/src/modules/auditor-collaboration/actions";
import { Send, Loader2 } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What evidence is still pending?",
  "Summarize our open findings",
  "Which auditors are active?",
  "What's our audit readiness status?",
];

export default function AuditorAiChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(text?: string) {
    const content = text ?? input.trim();
    if (!content) return;
    const updated: Msg[] = [...messages, { role: "user", content }];
    setMessages(updated);
    setInput("");
    setLoading(true);
    try {
      const result = await chatAction(updated);
      if (result.data) {
        setMessages([...updated, { role: "assistant", content: result.data }]);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Suggestions */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => send(s)}
              className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs text-[var(--color-ink-dim)] hover:border-[var(--color-blue)]/50 hover:text-[var(--color-ink)] transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bg-[var(--color-blue)] text-white" : "bg-white/5 text-[var(--color-ink)]"}`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-xl bg-white/5 px-4 py-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-[var(--color-ink-dim)]" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask about audits, evidence, findings..."
          disabled={loading}
          className="flex-1 rounded-lg border border-[var(--color-line)] bg-white/5 px-3 py-2 text-sm focus:border-[var(--color-blue)] focus:outline-none disabled:opacity-50"
        />
        <button onClick={() => send()} disabled={loading || !input.trim()}
          className="rounded-lg bg-[var(--color-blue)] px-3 py-2 text-white hover:opacity-90 disabled:opacity-40">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
