"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { MathText } from "./math-text";
import { cn } from "@/lib/utils";

export interface TutorMessage {
  role: "user" | "assistant";
  content: string;
}

export function TutorChat({
  questionId,
  initial,
  suggestions,
  className,
  placeholder = "Ask the tutor anything about this question",
}: {
  questionId: string | null;
  initial: TutorMessage[];
  suggestions: string[];
  className?: string;
  placeholder?: string;
}) {
  const [messages, setMessages] = useState<TutorMessage[]>(initial);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest" });
  }, [messages]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setInput("");
    setBusy(true);
    setMessages((m) => [...m, { role: "user", content: message }, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, questionId }),
      });
      setRemaining(res.headers.get("X-Tutor-Remaining"));
      if (!res.ok || !res.body) {
        const err = await res.text();
        setMessages((m) => [...m.slice(0, -1), { role: "assistant", content: err || "The tutor couldn't answer right now." }]);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let reply = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        setMessages((m) => [...m.slice(0, -1), { role: "assistant", content: reply }]);
      }
    } catch {
      setMessages((m) => [...m.slice(0, -1), { role: "assistant", content: "Connection lost. Try again." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex-1 space-y-4 overflow-y-auto">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-line bg-white px-3 py-1.5 text-xs text-slate-700 hover:border-accent hover:text-accent"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="ml-8 rounded-lg bg-navy px-3.5 py-2.5 text-sm text-white">{m.content}</div>
          ) : (
            <div key={i} className="flex gap-2.5">
              <span className="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                <Sparkles className="size-3.5" />
              </span>
              {m.content ? (
                <MathText className="min-w-0 flex-1 text-[14px] leading-relaxed">{m.content}</MathText>
              ) : (
                <p className="text-sm text-slate-400">Working through it…</p>
              )}
            </div>
          ),
        )}
        <div ref={bottom} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3"
      >
        <div className="flex items-end gap-2 rounded-lg border border-line bg-white p-1.5 focus-within:border-accent">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder={placeholder}
            className="max-h-40 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none field-sizing-content"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="grid size-8 shrink-0 place-items-center rounded-md bg-navy text-white disabled:opacity-30"
            aria-label="Send"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
        {remaining !== null && <p className="mt-1 text-right text-[11px] text-slate-400">{remaining} tutor messages left today</p>}
      </form>
    </div>
  );
}
