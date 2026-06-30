"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Send, Bot, User } from "lucide-react";
import { chatAction } from "@/lib/privacy/actions";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "model"; content: string };

export function PrivacyAiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isPending) return;

    const userMessage: Message = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");

    startTransition(async () => {
      const result = await chatAction(nextMessages);
      if (result?.ok && typeof result.data === "string") {
        setMessages([...nextMessages, { role: "model", content: result.data }]);
      } else if (result?.error) {
        setMessages([
          ...nextMessages,
          { role: "model", content: `Error: ${result.error}` },
        ]);
      }
    });
  }

  return (
    <div className="flex flex-col h-[500px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
              <Bot className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <p className="font-medium text-sm">AI Privacy Officer</p>
              <p className="text-xs text-[var(--color-ink-dim)] mt-1 max-w-xs">
                Ask me about DPDP Act obligations, consent management, DSR workflows, cross-border transfers, or your privacy posture.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
              {[
                "What are my overdue DSR requests?",
                "Summarise our DPDP compliance gaps",
                "How should we handle cross-border transfers?",
                "What consents are expiring soon?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="text-left rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-xs text-[var(--color-ink-dim)] hover:bg-[#F8F9FB] transition-colors"
                  onClick={() => {
                    setInput(suggestion);
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-3",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {msg.role === "model" && (
              <div className="w-7 h-7 flex-shrink-0 rounded-xl bg-indigo-500/20 flex items-center justify-center mt-0.5">
                <Bot className="h-4 w-4 text-indigo-400" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                msg.role === "user"
                  ? "bg-indigo-600/30 text-[var(--color-ink)]"
                  : "bg-[#F8F9FB] text-[var(--color-ink)]"
              )}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 flex-shrink-0 rounded-xl bg-[#F8F9FB] flex items-center justify-center mt-0.5">
                <User className="h-4 w-4 text-[var(--color-ink-dim)]" />
              </div>
            )}
          </div>
        ))}

        {isPending && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 flex-shrink-0 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Bot className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="bg-[#F8F9FB] rounded-2xl px-4 py-2.5">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--color-line)] p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about DPDP compliance, DSRs, consent management..."
            className="flex-1 rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-4 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            disabled={isPending}
          />
          <Button onClick={handleSend} disabled={isPending || !input.trim()} size="sm">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
