"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Send, Loader2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { chatAction } from "@/backend/src/modules/integration-hub/actions";

type Message = { role: "user" | "model"; text: string };

const SUGGESTIONS = [
  "Which integrations should I connect first?",
  "What evidence gaps do I have?",
  "How can I improve my sync success rate?",
  "What controls are not monitored by any integration?",
];

export function IntegrationAiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setInput("");
    const next: Message[] = [...messages, { role: "user", text: msg }];
    setMessages(next);
    startTransition(async () => {
      const res = await chatAction(msg, messages);
      setMessages([...next, { role: "model", text: res.data ?? res.error ?? "Error" }]);
    });
  }

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[var(--color-blue)]" /> AI Integration Advisor™ Chat
      </h2>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs hover:bg-[#F8F9FB] text-[var(--color-ink-dim)] transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-[var(--color-blue)] text-white" : "bg-[#F8F9FB] text-[var(--color-ink)]"}`}>
                <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
              </div>
            </div>
          ))}
          {pending && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-[#F8F9FB] px-4 py-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-[var(--color-ink-dim)]" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Ask about integrations, coverage gaps, or sync health…"
          className="flex-1 rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/50"
        />
        <button
          onClick={() => send()}
          disabled={pending || !input.trim()}
          className="px-3 py-2 rounded-xl bg-[var(--color-blue)] text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}
