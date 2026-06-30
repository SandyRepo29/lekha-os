"use client";

import { useState, useRef, useEffect } from "react";
import { chatAction } from "@/lib/continuous-compliance/actions";
import { Bot, Send, Loader2 } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "What controls are currently failing?",
  "Which frameworks are at risk?",
  "What should we fix first?",
  "Show me overdue training assignments.",
];

export function CcAiChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const reply = await chatAction([...messages, userMsg]);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {STARTERS.map(s => (
            <button key={s} onClick={() => send(s)}
              className="rounded-full border border-[var(--color-line)] bg-white px-3 py-1 text-xs text-[var(--color-ink-dim)] hover:bg-[#F8F9FB] hover:text-[var(--color-ink)] transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="max-h-80 overflow-y-auto space-y-3 rounded-xl bg-white p-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              {m.role === "assistant" && <Bot className="mt-1 h-4 w-4 shrink-0 text-[var(--color-blue)]" />}
              <div className={`rounded-xl px-3 py-2 text-sm max-w-[85%] ${
                m.role === "user"
                  ? "bg-[var(--color-blue)]/10 text-[var(--color-ink)] ml-auto"
                  : "bg-[#F8F9FB] text-[var(--color-ink-dim)]"
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <Bot className="mt-1 h-4 w-4 shrink-0 text-[var(--color-blue)]" />
              <div className="rounded-xl bg-[#F8F9FB] px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-[var(--color-ink-faint)]" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send(input))}
          placeholder="Ask about compliance posture, check results, signals…"
          className="flex-1 rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-blue)]"
        />
        <button onClick={() => send(input)} disabled={loading || !input.trim()}
          className="grid h-9 w-9 place-items-center rounded-xl grad-brand text-white disabled:opacity-40 transition-opacity hover:opacity-90">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
