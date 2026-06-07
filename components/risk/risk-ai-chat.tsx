"use client";

import { useState, useRef, useEffect } from "react";
import { SendHorizonal, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { riskAiChatAction } from "@/lib/risk/actions";

type Message = { role: "user" | "model"; text: string };

const STARTERS = [
  "What are our most critical risks?",
  "Which risks are overdue for review?",
  "Summarize risks by category",
  "Which vendor risks need attention?",
];

export function RiskAiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const history = [...messages, userMsg];
    const { reply, error } = await riskAiChatAction(text, history);
    setMessages((prev) => [
      ...prev,
      { role: "model", text: error ? `Error: ${error}` : reply },
    ]);
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {messages.length === 0 && (
        <div className="grid grid-cols-2 gap-2">
          {STARTERS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-xl border border-[var(--color-line)] bg-white/[0.02] px-3 py-2.5 text-left text-xs text-[var(--color-ink-dim)] hover:bg-white/[0.05] hover:text-[var(--color-ink)] transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto rounded-xl border border-[var(--color-line)] bg-white/[0.02] p-4">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
              <span
                className={
                  m.role === "user"
                    ? "inline-block rounded-2xl rounded-tr-sm bg-[var(--color-blue)]/20 px-3 py-2 text-sm text-[var(--color-ink)]"
                    : "inline-block rounded-2xl rounded-tl-sm bg-white/[0.05] px-3 py-2 text-sm text-[var(--color-ink-dim)]"
                }
              >
                {m.text}
              </span>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-[var(--color-ink-faint)]">
              <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Sparkles className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-blue)]/60" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about risks, mitigations, trends…"
            className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.03] py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--color-blue)]/60"
          />
        </div>
        <Button type="submit" variant="primary" size="sm" disabled={loading || !input.trim()}>
          <SendHorizonal className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
