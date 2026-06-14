"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { chatAction } from "@/lib/regulatory-intelligence/actions";
import { Bot, Send, User } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

export function RegAiAdvisorClient({
  context,
}: {
  context: { totalRegulations: number; newChanges: number; openAlerts: number; openObligations: number };
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, start] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Allow clicking suggested questions
  useEffect(() => {
    function handleClick(e: Event) {
      const el = (e.target as HTMLElement).closest("[data-question]") as HTMLElement | null;
      if (el?.dataset.question) setInput(el.dataset.question);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  async function send() {
    const text = input.trim();
    if (!text) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    start(async () => {
      const res = await chatAction(
        text,
        [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
      );
      const reply = (res as { data?: string }).data ?? "Unable to generate response.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 flex flex-col" style={{ minHeight: 400, maxHeight: 600 }}>
      <div className="border-b border-[var(--color-line)] px-5 py-3 flex items-center gap-2">
        <Bot className="h-4 w-4 text-[var(--color-blue)]" />
        <span className="text-sm font-semibold">Regulatory Advisor™ Chat</span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-[var(--color-line)]/60 bg-white/[0.02] px-4 py-3">
            <Bot className="h-5 w-5 shrink-0 text-[var(--color-blue)]" />
            <p className="text-xs text-[var(--color-ink-dim)]">
              Hello! I&apos;m your Regulatory Intelligence Advisor™. Ask me about applicable regulations,
              recent changes, obligations, or your regulatory readiness.
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="h-7 w-7 shrink-0 grid place-items-center rounded-full bg-[var(--color-blue)]/20">
                <Bot className="h-4 w-4 text-[var(--color-blue)]" />
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
              m.role === "user"
                ? "bg-[var(--color-blue)]/20 text-[var(--color-ink)]"
                : "bg-white/[0.05] border border-[var(--color-line)]/60 text-[var(--color-ink-dim)]"
            }`}>
              {m.content}
            </div>
            {m.role === "user" && (
              <div className="h-7 w-7 shrink-0 grid place-items-center rounded-full bg-white/[0.08]">
                <User className="h-4 w-4 text-[var(--color-ink-dim)]" />
              </div>
            )}
          </div>
        ))}
        {pending && (
          <div className="flex gap-3">
            <div className="h-7 w-7 shrink-0 grid place-items-center rounded-full bg-[var(--color-blue)]/20">
              <Bot className="h-4 w-4 text-[var(--color-blue)]" />
            </div>
            <div className="rounded-2xl border border-[var(--color-line)]/60 bg-white/[0.05] px-4 py-2.5 text-xs text-[var(--color-ink-faint)]">
              Analyzing regulations…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-[var(--color-line)] p-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask about regulations, changes, obligations…"
            className="flex-1 rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)]"
          />
          <button
            onClick={send}
            disabled={pending || !input.trim()}
            className="grid place-items-center rounded-xl grad-brand px-3 py-2 text-white shadow transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
