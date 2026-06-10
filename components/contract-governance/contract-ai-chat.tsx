"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { chatAction } from "@/lib/contract-governance/actions";

type Message = { role: "user" | "model"; content: string };

export function ContractAiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setLoading(true);
    const res = await chatAction(next);
    setLoading(false);
    if (res?.ok && typeof res.data === "string") {
      setMessages([...next, { role: "model", content: res.data }]);
    }
  }

  return (
    <Card className="p-6">
      <h2 className="font-semibold mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-purple-400" />
        Contract Governance Copilot™
      </h2>

      <div className="rounded-xl bg-white/[0.02] border border-[var(--color-line)] p-4 h-72 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 && (
          <p className="text-sm text-[var(--color-ink-dim)] text-center mt-16">
            Ask about expiring contracts, obligations, renewal risks, or portfolio health
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "bg-indigo-500/20 text-indigo-100"
                  : "bg-white/5 text-[var(--color-ink)]"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 rounded-xl px-4 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-xl bg-white/5 border border-[var(--color-line)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-[var(--color-ink-dim)]"
          placeholder="e.g. Which contracts are expiring next month?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          disabled={loading}
        />
        <Button onClick={send} disabled={loading || !input.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </Card>
  );
}
