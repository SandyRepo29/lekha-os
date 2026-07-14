"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { chatAction } from "@/backend/src/modules/benchmarking/actions";

type Message = { role: "user" | "model"; text: string };

interface Props {
  context: {
    overallScore: number | null;
    overallPercentile: number | null;
    maturityLevel: string;
    industry: string | null;
    topCategories: string[];
    weakCategories: string[];
  };
}

const SUGGESTIONS = [
  "How do we compare to industry peers?",
  "Where are we strongest compared to competitors?",
  "What's our biggest governance gap?",
  "What should we improve first for the best ROI?",
  "How can we reach the top quartile?",
];

export function BenchmarkAiChat({ context }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send(text: string) {
    if (!text.trim() || isPending) return;
    const updated: Message[] = [...messages, { role: "user", text }];
    setMessages(updated);
    setInput("");
    startTransition(async () => {
      const reply = await chatAction(context, updated);
      setMessages((prev) => [...prev, { role: "model", text: reply }]);
    });
  }

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Bot className="h-5 w-5 text-[var(--color-blue)]" />
        <h3 className="font-semibold">AI Benchmark Analyst™</h3>
      </div>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-xs px-3 py-1.5 rounded-full border border-[var(--color-line)] hover:border-[var(--color-blue)]/50 hover:bg-[var(--color-blue)]/[0.04] transition-colors text-[var(--color-ink-dim)]"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "model" && (
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--color-blue)]/20 flex items-center justify-center">
                  <Bot className="h-3.5 w-3.5 text-[var(--color-blue)]" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-[var(--color-blue)] text-white"
                    : "bg-[#F8F9FB] text-[var(--color-ink)]"
                }`}
              >
                {m.text}
              </div>
              {m.role === "user" && (
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                  <User className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          ))}
          {isPending && (
            <div className="flex gap-2.5">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--color-blue)]/20 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-[var(--color-blue)]" />
              </div>
              <div className="bg-[#F8F9FB] rounded-xl px-3.5 py-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-[var(--color-ink-dim)]" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your governance benchmark..."
          className="flex-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--color-blue)] placeholder:text-[var(--color-ink-faint)]"
          disabled={isPending}
        />
        <Button type="submit" size="sm" disabled={!input.trim() || isPending}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
}
