"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { saveBragSheet } from "@/app/actions/recommenders";
import { BRAG_QUESTIONS as QUESTIONS } from "@/lib/brag-sheet";
import { Card, CardHeader, Textarea } from "@/components/ui";

export function BragSheet({ initial }: { initial: Record<string, string> }) {
  const [answers, setAnswers] = useState(initial);
  const [status, setStatus] = useState<string>("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const saved = useRef(JSON.stringify(initial));

  useEffect(() => {
    const json = JSON.stringify(answers);
    if (json === saved.current) return;
    setStatus("Unsaved");
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const res = await saveBragSheet(answers);
      if ("error" in res && res.error) return setStatus(`Couldn't save: ${res.error}`);
      saved.current = json;
      setStatus("Saved");
    }, 1000);
    return () => clearTimeout(timer.current);
  }, [answers]);

  const done = QUESTIONS.filter((q) => answers[q.id]?.trim()).length;

  return (
    <Card className="h-fit">
      <CardHeader
        title="Brag sheet"
        description={`${done} of ${QUESTIONS.length} answered${status ? ` · ${status}` : ""}`}
        action={<Link href="/recommenders/brag-sheet" className="text-xs font-medium text-accent">Preview</Link>}
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
