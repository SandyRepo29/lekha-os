"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { copilotChatAction } from "@/lib/agents/actions";
import { Bot, Send, User, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function CopilotChat({ examplePrompts }: { examplePrompts: string[] }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm the Governance Copilot™. I have full visibility into your risk posture, vendor trust, compliance gaps, control health, and agent observations. Ask me anything — or pick one of the examples below to get started.",
    },
  ]);
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
    const newMessages: Message[] = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    startTransition(async () => {
      const result = await copilotChatAction(msg, messages, undefined);
      const reply = (result as { data?: string } | null)?.data ?? "I'm unable to respond right now. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    });
  }

  return (
    <div className="flex flex-1 flex-col rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 overflow-hidden" style={{ minHeight: 420 }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex items-start gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-xl ${
              m.role === "assistant" ? "grad-brand" : "bg-[#EEF2F7] border border-[var(--color-line)]"
            }`}>
              {m.role === "assistant"
                ? <Bot className="h-4 w-4 text-white" />
                : <User className="h-4 w-4 text-[var(--color-ink-dim)]" />
              }
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
              m.role === "assistant"
                ? "bg-[#F8F9FB] border border-[var(--color-line)]"
                : "bg-[var(--color-blue)]/[0.12] border border-[var(--color-blue)]/20"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {pending && (
          <div className="flex items-start gap-3">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-xl grad-brand">
              <Loader2 className="h-4 w-4 text-white animate-spin" />
            </div>
            <div className="rounded-2xl bg-[#F8F9FB] border border-[var(--color-line)] px-4 py-3">
              <span className="text-xs text-[var(--color-ink-faint)] animate-pulse">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Example prompts (show only if just the greeting) */}
      {messages.length === 1 && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {examplePrompts.map(p => (
            <button
              key={p}
              onClick={() => send(p)}
              disabled={pending}
              className="rounded-full border border-[var(--color-line)] bg-white px-3 py-1.5 text-xs text-[var(--color-ink-dim)] hover:border-[var(--color-blue)]/40 hover:text-[var(--color-blue)] transition-colors disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-[var(--color-line)] p-3 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask about risks, vendors, compliance, controls…"
          disabled={pending}
          className="flex-1 rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-4 py-2.5 text-sm placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-blue)]/50 disabled:opacity-50"
        />
        <button
          onClick={() => send()}
          disabled={pending || !input.trim()}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl grad-brand text-white shadow transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
