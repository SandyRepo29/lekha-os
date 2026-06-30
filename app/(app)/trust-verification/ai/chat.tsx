"use client";

import { useState, useTransition } from "react";
import { chatAction } from "@/lib/trust-verification/actions";
import { Bot, Send, User } from "lucide-react";

interface Message { role: "user" | "model"; content: string }

export default function TrustVerificationChat({ context }: { context: Record<string, number> }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();

  const send = () => {
    const text = input.trim();
    if (!text || isPending) return;
    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    startTransition(async () => {
      const reply = await chatAction(next);
      setMessages([...next, { role: "model", content: reply }]);
    });
  };

  const STARTERS = [
    "Am I eligible for AUDT Verified™?",
    "What evidence do I need to submit?",
    "How do I improve my verification readiness?",
    "When should I start renewal?",
  ];

  return (
    <div className="space-y-3">
      {messages.length === 0 && (
        <div className="grid grid-cols-2 gap-2">
          {STARTERS.map(s => (
            <button key={s} onClick={() => setInput(s)}
              className="rounded-xl border border-[var(--color-line)]/60 bg-white px-3 py-2 text-xs text-left text-[var(--color-ink-dim)] hover:bg-[#F8F9FB] hover:border-[var(--color-blue)]/30 transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div key={i} className={`flex items-start gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-white ${m.role === "user" ? "bg-[var(--color-blue)]" : "bg-violet-600"}`}>
                {m.role === "user" ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
              </span>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                m.role === "user" ? "bg-[var(--color-blue)]/15 text-right" : "bg-[#F8F9FB]"
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {isPending && (
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-violet-600 text-white">
                <Bot className="h-3 w-3" />
              </span>
              <div className="rounded-2xl bg-[#F8F9FB] px-3 py-2 text-xs text-[var(--color-ink-faint)]">Thinking…</div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Ask about verification eligibility, evidence, certificates…"
          className="flex-1 rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm focus:border-[var(--color-blue)]/50 focus:outline-none"
        />
        <button onClick={send} disabled={!input.trim() || isPending}
          className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--color-blue)]/20 text-[var(--color-blue)] disabled:opacity-40 hover:bg-[var(--color-blue)]/30 transition-colors">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
