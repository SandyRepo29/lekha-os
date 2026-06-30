"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User } from "lucide-react";
import { chatAction } from "@/lib/control-center/actions";

interface Message {
  role: "user" | "model";
  text: string;
}

const SUGGESTIONS = [
  "Show weak controls",
  "Which controls failed testing?",
  "Which controls lack evidence?",
  "Which controls support our compliance frameworks?",
  "Which controls need review?",
];

export function ControlAiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const next: Message[] = [...messages, { role: "user", text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await chatAction(next);
      const reply = (res?.data as string) ?? "Unable to get a response.";
      setMessages([...next, { role: "model", text: reply }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[var(--color-ink-dim)] text-sm">
              <Bot className="h-4 w-4" />
              AI Control Advisor is ready. Ask about your control library.
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--color-line)] text-xs text-[var(--color-ink-dim)] hover:border-[var(--color-blue)]/40 hover:text-white transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "model" && (
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--color-blue)]/20 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-[var(--color-blue)]" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                m.role === "user"
                  ? "bg-[var(--color-blue)]/20 text-white border border-[var(--color-blue)]/20"
                  : "bg-[#F8F9FB] text-[var(--color-ink)] border border-[var(--color-line)]"
              }`}
            >
              {m.text}
            </div>
            {m.role === "user" && (
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-white/60" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[var(--color-blue)]/20 flex items-center justify-center">
              <Loader2 className="h-3.5 w-3.5 text-[var(--color-blue)] animate-spin" />
            </div>
            <div className="text-sm text-[var(--color-ink-dim)] italic">Analysing controls…</div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-[var(--color-line)] p-4">
        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your controls…"
            disabled={loading}
            className="flex-1 rounded-xl border border-[var(--color-line)] bg-white px-4 py-2 text-sm outline-none focus:border-[var(--color-blue)]/60 focus:ring-1 focus:ring-[var(--color-blue)]/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2 rounded-xl bg-[var(--color-blue)] text-white text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
