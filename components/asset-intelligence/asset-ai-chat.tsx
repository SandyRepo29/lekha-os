"use client";

import { useState, useRef, useEffect } from "react";
import { chatAction } from "@/lib/asset-intelligence/actions";
import { Brain, Send } from "lucide-react";

type Msg = { role: "user" | "model"; content: string };

export function AssetAiChat({ context }: { context: { totalAssets: number; criticalAssets: number; openAlerts: number; assetsWithPii: number } }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    const handler = (e: Event) => {
      const q = (e.target as HTMLElement).dataset.question;
      if (q) setInput(q);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const reply = await chatAction(next);
      setMessages([...next, { role: "model", content: reply }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-white flex flex-col" style={{ height: "420px" }}>
      <div className="flex items-center gap-2 border-b border-[var(--color-line)] px-4 py-3">
        <Brain className="h-4 w-4 text-[var(--color-blue)]" />
        <span className="text-sm font-medium">AI Asset Advisor™</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
        {messages.length === 0 && (
          <p className="text-xs text-[var(--color-ink-dim)] text-center mt-8">Ask me about your assets, dependencies, PII exposure, or governance gaps.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-[var(--color-blue)] text-white" : "bg-[#F8F9FB] text-[var(--color-ink)]"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-[#F8F9FB] px-4 py-2.5 text-sm text-[var(--color-ink-dim)]">Thinking…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-[var(--color-line)] px-4 py-3 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Ask about assets, dependencies, PII…"
          className="flex-1 rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm focus:border-[var(--color-blue)] outline-none"
        />
        <button onClick={send} disabled={!input.trim() || loading}
          className="rounded-xl bg-[var(--color-blue)] px-4 py-2 text-white hover:opacity-90 disabled:opacity-40 transition-opacity">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
