"use client";

import { useState, useRef, useEffect } from "react";
import { chatAction } from "@/lib/policy-governance/actions";
import { Button } from "@/components/ui/button";
import { Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "model";
  content: string;
}

export function PolicyAiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const result = await chatAction(next);
      if (result?.data && typeof result.data === "string") {
        setMessages([...next, { role: "model", content: result.data }]);
      } else {
        setMessages([...next, { role: "model", content: result?.error ?? "No response." }]);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-center text-sm text-[var(--color-ink-dim)]">
            <div>
              <Bot className="mx-auto mb-2 h-8 w-8 opacity-40" />
              <p>Ask anything about your policy library.</p>
              <p className="text-xs mt-1 opacity-60">e.g. "Which policies are expired?" or "What's our attestation rate?"</p>
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn("flex gap-3", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
            <div className={cn(
              "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full",
              m.role === "user" ? "bg-indigo-500/20 text-indigo-400" : "bg-purple-500/20 text-purple-400"
            )}>
              {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div className={cn(
              "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
              m.role === "user"
                ? "bg-indigo-500/20 text-[var(--color-ink)]"
                : "bg-[#F8F9FB] text-[var(--color-ink)]"
            )}>
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-purple-400">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl bg-[#F8F9FB] px-4 py-2.5 text-sm text-[var(--color-ink-dim)]">
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-[var(--color-line)] p-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask about policies…"
            className="flex-1 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            disabled={loading}
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()} size="sm">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
