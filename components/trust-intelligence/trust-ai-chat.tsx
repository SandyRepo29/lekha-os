"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { chatAction } from "@/backend/src/modules/trust-intelligence/actions";

type Message = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "Why did our trust score change?",
  "Which risks need immediate attention?",
  "What are our weakest controls?",
  "Summarize our governance posture.",
  "What should leadership prioritize?",
];

export function TrustAIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send(question: string) {
    if (!question.trim() || isPending) return;
    const userMsg: Message = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    startTransition(async () => {
      const result = await chatAction(question, [...messages, userMsg]);
      const reply = result.data ?? result.error ?? "Sorry, I couldn't respond.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    });
  }

  return (
    <Card className="flex flex-col" style={{ height: 520 }}>
      <div className="border-b border-[var(--color-line)] px-4 py-3 flex items-center gap-2">
        <Bot className="h-4 w-4 text-[var(--color-blue)]" />
        <span className="text-sm font-semibold">Governance Copilot™</span>
        <span className="ml-auto text-[10px] text-[var(--color-ink-faint)] rounded-full bg-white/5 px-2 py-0.5">AI</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-[var(--color-ink-dim)] mb-3">Ask about your governance posture:</p>
            {STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="block w-full text-left rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-xs text-[var(--color-ink-dim)] hover:bg-[#F8F9FB] hover:text-[var(--color-ink)] transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && <Bot className="h-4 w-4 mt-0.5 shrink-0 text-[var(--color-blue)]" />}
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-[var(--color-blue)]/20 text-[var(--color-ink)]"
                  : "bg-[#F8F9FB] text-[var(--color-ink-dim)]"
              }`}
            >
              {m.content}
            </div>
            {m.role === "user" && <User className="h-4 w-4 mt-0.5 shrink-0 text-[var(--color-ink-faint)]" />}
          </div>
        ))}
        {isPending && (
          <div className="flex gap-2">
            <Bot className="h-4 w-4 mt-0.5 shrink-0 text-[var(--color-blue)]" />
            <div className="flex items-center gap-1.5 rounded-2xl bg-[#F8F9FB] px-3 py-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--color-ink-faint)]" />
              <span className="text-xs text-[var(--color-ink-faint)]">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--color-line)] p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
          placeholder="Ask about governance, risks, controls…"
          className="flex-1 rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)]/50"
        />
        <Button
          variant="primary"
          size="sm"
          onClick={() => send(input)}
          disabled={!input.trim() || isPending}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
