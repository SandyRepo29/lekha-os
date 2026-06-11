"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { chatAction } from "@/lib/trust-network/actions";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "How can I improve my Trust Network Reputation score?",
  "What's my current governance maturity level?",
  "Which trust relationships should I prioritize?",
  "How does my automation coverage compare to peers?",
  "What badges would most improve my reputation?",
];

export function TrustNetworkAiChat({ context }: { context: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg) return;
    const next: Message[] = [...messages, { role: "user" as const, content: msg }];
    setMessages(next);
    setInput("");
    startTransition(async () => {
      const reply = await chatAction(context, next);
      setMessages([...next, { role: "assistant" as const, content: reply }]);
    });
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <div className="border-b border-[var(--color-line)] px-4 py-3 flex items-center gap-2">
        <Bot className="h-5 w-5 text-[var(--color-blue)]" />
        <span className="font-semibold text-sm">AI Trust Network Advisor™</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-thin">
        {messages.length === 0 && (
          <div className="py-4">
            <p className="text-sm text-[var(--color-ink-dim)] text-center mb-4">
              Ask about your Trust Network presence, reputation strategy, or network growth.
            </p>
            <div className="grid grid-cols-1 gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-xs px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex items-start gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === "user" ? "bg-[var(--color-blue)]" : "bg-white/10"}`}>
              {m.role === "user" ? <User className="h-3.5 w-3.5 text-white" /> : <Bot className="h-3.5 w-3.5 text-[var(--color-blue)]" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${m.role === "user" ? "bg-[var(--color-blue)] text-white rounded-tr-sm" : "bg-white/[0.06] text-[var(--color-ink)] rounded-tl-sm"}`}>
              <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
            </div>
          </div>
        ))}

        {isPending && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <Bot className="h-3.5 w-3.5 text-[var(--color-blue)]" />
            </div>
            <div className="bg-white/[0.06] rounded-2xl rounded-tl-sm px-3.5 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--color-blue)]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-[var(--color-line)] p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask about your trust network..."
          className="flex-1 rounded-xl bg-white/[0.04] border border-[var(--color-line)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-blue)]/50 placeholder:text-[var(--color-ink-faint)]"
        />
        <Button size="sm" onClick={() => send()} disabled={isPending || !input.trim()} className="rounded-xl px-3">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
