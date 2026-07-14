"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { chatAction } from "@/backend/src/modules/trust-exchange/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, Send, User, Bot } from "lucide-react";

type Msg = { role: "user" | "model"; text: string };

const STARTERS = [
  "What's missing from my Trust Profile?",
  "How can I improve my trust score?",
  "Which documents should I upload first?",
  "Can this vendor be trusted based on their profile?",
  "How does the Trust Exchange work?",
];

export function TrustExchangeAiChat({ context }: { context: Record<string, unknown> }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || pending) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", text: msg }];
    setMessages(next);
    startTransition(async () => {
      const reply = await chatAction(next);
      setMessages([...next, { role: "model", text: reply }]);
    });
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-blue)]/20 flex items-center justify-center flex-shrink-0">
          <Zap className="h-4 w-4 text-[var(--color-blue)]" />
        </div>
        <div className="text-sm text-[var(--color-ink-dim)]">
          <strong className="text-[var(--color-ink)]">AI Trust Analyst™</strong> — Ask me about your trust posture, the vendor directory, document gaps, or how to improve your Exchange profile.
        </div>
      </Card>

      <Card className="flex flex-col" style={{ minHeight: 400 }}>
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 480 }}>
          {messages.length === 0 ? (
            <div className="space-y-2 pt-4">
              <p className="text-xs text-[var(--color-ink-dim)] text-center mb-4">Suggested questions</p>
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="block w-full text-left text-sm px-4 py-2.5 rounded-xl bg-white border border-[var(--color-line)] hover:border-[var(--color-blue)]/40 hover:bg-[#F8F9FB] transition-colors text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === "user" ? "bg-[var(--color-blue)]/20" : "bg-slate-100"}`}>
                  {m.role === "user" ? <User className="h-3.5 w-3.5 text-[var(--color-blue)]" /> : <Bot className="h-3.5 w-3.5 text-[var(--color-ink-dim)]" />}
                </div>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bg-[var(--color-blue)]/20 text-[var(--color-ink)]" : "bg-[#F8F9FB] text-[var(--color-ink-dim)]"}`}>
                  {m.text}
                </div>
              </div>
            ))
          )}
          {pending && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Bot className="h-3.5 w-3.5 text-[var(--color-ink-dim)]" />
              </div>
              <div className="bg-[#F8F9FB] rounded-2xl px-4 py-2.5 text-sm text-[var(--color-ink-dim)]">Analysing…</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-[var(--color-line)] p-3 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the AI Trust Analyst…"
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            disabled={pending}
            className="flex-1"
          />
          <Button size="sm" onClick={() => send()} disabled={pending || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
