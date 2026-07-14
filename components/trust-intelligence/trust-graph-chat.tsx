"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { graphChatAction } from "@/backend/src/modules/trust-graph/actions";
import { Bot, Send, User, Loader2 } from "lucide-react";

interface Message { role: "user" | "model"; text: string }

export function TrustGraphChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", text: "I'm the Governance Reasoner™. Ask me about governance relationships, root causes, or the impact of any change on your trust posture." },
  ]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = () => {
    const msg = input.trim();
    if (!msg || isPending) return;
    setInput("");
    const history = messages.slice(1).map(m => ({ role: m.role, text: m.text }));
    setMessages(prev => [...prev, { role: "user", text: msg }]);
    startTransition(async () => {
      const res = await graphChatAction(msg, history);
      setMessages(prev => [...prev, { role: "model", text: res.data ?? res.error ?? "No response." }]);
    });
  };

  return (
    <div className="flex flex-col rounded-2xl border border-[var(--color-line)] bg-white" style={{ height: 420 }}>
      <div className="flex items-center gap-2 border-b border-[var(--color-line)] px-4 py-3">
        <Bot className="h-4 w-4 text-[var(--color-blue)]" />
        <span className="text-sm font-semibold">Governance Reasoner™</span>
        <span className="ml-auto rounded-full bg-[var(--color-blue)]/15 px-2 py-0.5 text-[10px] text-[var(--color-blue)]">AI</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "model" && <div className="h-6 w-6 shrink-0 rounded-full bg-[var(--color-blue)]/20 flex items-center justify-center mt-0.5"><Bot className="h-3.5 w-3.5 text-[var(--color-blue)]" /></div>}
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${m.role === "user" ? "bg-[var(--color-blue)]/20 text-[var(--color-ink)]" : "bg-[#F8F9FB] text-[var(--color-ink-dim)]"}`}>
              {m.text}
            </div>
            {m.role === "user" && <div className="h-6 w-6 shrink-0 rounded-full bg-[#EEF2F7] flex items-center justify-center mt-0.5"><User className="h-3.5 w-3.5" /></div>}
          </div>
        ))}
        {isPending && (
          <div className="flex gap-2 justify-start">
            <div className="h-6 w-6 shrink-0 rounded-full bg-[var(--color-blue)]/20 flex items-center justify-center"><Loader2 className="h-3.5 w-3.5 text-[var(--color-blue)] animate-spin" /></div>
            <div className="rounded-2xl bg-[#F8F9FB] px-3 py-2 text-sm text-[var(--color-ink-faint)]">Thinking…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-[var(--color-line)] p-3 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Why did trust drop? Which controls are critical?…"
          className="flex-1 rounded-xl bg-[#F8F9FB] border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-blue)]/50"
        />
        <button
          onClick={send}
          disabled={!input.trim() || isPending}
          className="rounded-xl bg-[var(--color-blue)]/20 border border-[var(--color-blue)]/30 p-2 hover:bg-[var(--color-blue)]/30 disabled:opacity-40 transition-colors"
        >
          <Send className="h-4 w-4 text-[var(--color-blue)]" />
        </button>
      </div>
    </div>
  );
}
