"use client";

import { useEffect, useRef, useState } from "react";
import { Copy } from "lucide-react";
import { saveBragSheet } from "@/app/actions/recommenders";
import { Button, Card, CardHeader, Textarea } from "@/components/ui";

const QUESTIONS = [
  { id: "adjectives", q: "Three words that describe you, and why", hint: "Pick words a teacher could back up with an example." },
  { id: "meaningful_class", q: "Your most meaningful class so far", hint: "What made it stick? What did you do beyond the requirements?" },
  { id: "class_moment", q: "A specific classroom moment you're proud of", hint: "A question you asked, a presentation, a lab that went wrong and how you fixed it." },
  { id: "project", q: "A project that shows how you think", hint: "Explain your process, not just the result." },
  { id: "challenge", q: "A challenge you faced and how you responded", hint: "Academic or personal. Focus on what you did." },
  { id: "growth", q: "Where you've grown most in the last two years", hint: "Recommenders love to describe a growth arc." },
  { id: "outside", q: "What you do outside class that teachers may not know", hint: "Jobs, family responsibilities, hobbies, community roles." },
  { id: "goals", q: "What you hope to study and why", hint: "Even if you're unsure, describe the questions you're drawn to." },
  { id: "mention", q: "Anything you'd like your recommender to mention", hint: "Context they should know, e.g. a hard semester." },
];

export function BragSheet({ initial, studentName }: { initial: Record<string, string>; studentName: string }) {
  const [answers, setAnswers] = useState(initial);
  const [status, setStatus] = useState<string>("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setStatus("Unsaved");
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const res = await saveBragSheet(answers);
      setStatus("error" in res && res.error ? `Couldn't save: ${res.error}` : "Saved");
    }, 1000);
    return () => clearTimeout(timer.current);
  }, [answers]);

  const done = QUESTIONS.filter((q) => answers[q.id]?.trim()).length;

  async function copy() {
    const text = [`Brag sheet — ${studentName}`, "", ...QUESTIONS.flatMap((q) => (answers[q.id]?.trim() ? [q.q, answers[q.id]!.trim(), ""] : []))].join("\n");
    await navigator.clipboard.writeText(text);
    setStatus("Copied to clipboard");
  }

  return (
    <Card className="h-fit">
      <CardHeader
        title="Brag sheet"
        description={`${done} of ${QUESTIONS.length} answered${status ? ` · ${status}` : ""}`}
        action={
          <Button size="sm" variant="secondary" onClick={copy} disabled={!done}>
            <Copy className="size-3.5" />
            Copy
          </Button>
        }
      />
      <div className="space-y-5 p-5">
        {QUESTIONS.map((q, i) => (
          <div key={q.id}>
            <label htmlFor={q.id} className="text-sm font-medium">
              <span className="mr-1.5 text-slate-400">{i + 1}.</span>
              {q.q}
            </label>
            <p className="mb-1.5 mt-0.5 text-xs text-slate-500">{q.hint}</p>
            <Textarea
              id={q.id}
              rows={3}
              value={answers[q.id] ?? ""}
              onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
