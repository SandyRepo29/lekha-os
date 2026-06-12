"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { chatAction } from "@/lib/executive-reporting/actions";
import { Brain, Send, Loader2 } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "How is our governance posture performing?",
  "What should leadership focus on this quarter?",
  "Which risks are most critical right now?",
  "What changed in our governance metrics?",
];

export function ExecutiveReportingAiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send(text: string) {
    if (!text.trim() || pending) return;
    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    startTransition(async () => {
      const reply = await chatAction(next);
      setMessages([...next, { role: "assistant", content: reply }]);
    });
  }

  return (
    <div className="flex h-[520px] flex-col rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--color-blue)]/10">
              <Brain className="h-6 w-6 text-[var(--color-blue)]" />
            </div>
            <div>
              <p className="font-semibold">AI Executive Analyst™</p>
              <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Ask about your governance posture, risks, trends, and recommendations.</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs hover:border-[var(--color-blue)]/40 hover:bg-[var(--color-blue)]/5 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${m.role === "user" ? "bg-[var(--color-blue)] text-white" : "bg-[var(--color-blue)]/10"}`}>
              {m.role === "user" ? "E" : <Brain className="h-3.5 w-3.5 text-[var(--color-blue)]" />}
            </div>
            <div className={`max-w-[78%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bg-[var(--color-blue)] text-white" : "bg-[var(--color-bg)] border border-[var(--color-line)]"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {pending && (
          <div className="flex gap-3">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--color-blue)]/10">
              <Brain className="h-3.5 w-3.5 text-[var(--color-blue)]" />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-2.5 text-sm text-[var(--color-ink-dim)]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Analyzing governance data…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--color-line)] p-3">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)]"
            placeholder="Ask the AI Executive Analyst™…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
            disabled={pending}
          />
          <button
            disabled={!input.trim() || pending}
            onClick={() => send(input)}
            className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--color-blue)] text-white hover:opacity-90 disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
