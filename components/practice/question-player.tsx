"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calculator, Check, ChevronRight, Clock, Lightbulb, RotateCcw, X } from "lucide-react";
import { submitAttempt } from "@/app/actions/practice";
import { Badge, Button, Card } from "@/components/ui";
import type { GradedResult, PublicQuestion } from "@/lib/sat";
import { cn } from "@/lib/utils";
import { MathText } from "./math-text";
import { TutorChat, type TutorMessage } from "./tutor-chat";

const DIFFICULTY_TONE = { easy: "emerald", medium: "amber", hard: "rose" } as const;

interface Outcome {
  id: string;
  correct: boolean;
  seconds: number;
}

export function QuestionPlayer({
  questions,
  title,
  tutorHistory,
  aiEnabled,
}: {
  questions: PublicQuestion[];
  title: string;
  tutorHistory: Record<string, TutorMessage[]>;
  aiEnabled: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<GradedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [showTutor, setShowTutor] = useState(false);
  const [pending, start] = useTransition();

  const q = questions[index];
  const finished = index >= questions.length;

  useEffect(() => {
    if (result || finished) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [startedAt, result, finished]);

  const check = useCallback(() => {
    if (!q || result || !answer.trim()) return;
    const seconds = (Date.now() - startedAt) / 1000;
    start(async () => {
      const res = await submitAttempt(q.id, answer, seconds);
      if ("error" in res) return setError(res.error);
      setError(null);
      setResult(res);
      setOutcomes((o) => [...o, { id: q.id, correct: res.isCorrect, seconds }]);
    });
  }, [q, result, answer, startedAt]);

  const next = useCallback(() => {
    setIndex((i) => i + 1);
    setAnswer("");
    setResult(null);
    setShowTutor(false);
    setStartedAt(Date.now());
    setElapsed(0);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA" || (target.tagName === "INPUT" && e.key !== "Enter")) return;
      if (!q) return;
      if (!result && q.answer_type === "mcq" && /^[a-d]$/i.test(e.key)) setAnswer(e.key.toUpperCase());
      if (e.key === "Enter") {
        e.preventDefault();
        if (result) next();
        else check();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q, result, check, next]);

  if (!questions.length) {
    return (
      <Card className="p-10 text-center">
        <p className="font-medium">No questions match.</p>
        <p className="mt-1 text-sm text-slate-500">Try a different skill or difficulty.</p>
        <Link href="/practice" className="mt-4 inline-block text-sm font-medium text-accent">Back to practice</Link>
      </Card>
    );
  }

  if (finished) return <Summary title={title} questions={questions} outcomes={outcomes} />;

  const correctKey = result?.correctAnswer.toUpperCase();
  const suggestions = result
    ? result.isCorrect
      ? ["Is there a faster way to solve this?", "Give me a harder question like this one", "What trap should I watch for here?"]
      : ["Why is my answer wrong?", "Explain the correct answer step by step", "Give me a similar question to practice"]
    : ["Give me a hint without telling me the answer", "What is this question testing?"];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/practice" className="text-sm text-slate-500 hover:text-navy">Exit</Link>
        <div className="flex min-w-40 flex-1 items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
            <motion.div className="h-full bg-accent" animate={{ width: `${(index / questions.length) * 100}%` }} />
          </div>
          <span className="text-xs tabular-nums text-slate-500">{index + 1} / {questions.length}</span>
        </div>
        <span className="flex items-center gap-1 text-xs tabular-nums text-slate-500">
          <Clock className="size-3.5" />
          {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
        </span>
        {q.section === "math" && (
          <a
            href="https://www.desmos.com/calculator"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-white px-2.5 text-xs font-medium hover:bg-slate-50"
          >
            <Calculator className="size-3.5" />
            Desmos
          </a>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone="indigo">{q.section === "rw" ? "Reading & Writing" : "Math"}</Badge>
        <Badge>{q.skill}</Badge>
        <Badge tone={DIFFICULTY_TONE[q.difficulty]} className="capitalize">{q.difficulty}</Badge>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={cn("grid gap-4", q.passage && "lg:grid-cols-2")}
        >
          {q.passage && (
            <Card className="h-fit p-6 lg:sticky lg:top-20">
              <MathText className="font-serif text-[17px] leading-relaxed">{q.passage}</MathText>
            </Card>
          )}

          <div className="space-y-4">
            <Card className="p-6">
              <MathText className="text-[15px] font-medium">{q.stem}</MathText>

              {q.answer_type === "mcq" ? (
                <div className="mt-5 space-y-2">
                  {q.choices.map((c) => {
                    const graded = result?.choices.find((g) => g.key === c.key);
                    const isCorrect = result && c.key === correctKey;
                    const isWrongPick = result && c.key === answer && !isCorrect;
                    return (
                      <div key={c.key}>
                        <button
                          disabled={Boolean(result)}
                          onClick={() => setAnswer(c.key)}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors",
                            !result && answer === c.key && "border-accent bg-accent-soft",
                            !result && answer !== c.key && "border-line bg-white hover:border-slate-300",
                            isCorrect && "border-emerald-500 bg-emerald-50",
                            isWrongPick && "border-rose-400 bg-rose-50",
                            result && !isCorrect && !isWrongPick && "border-line bg-white opacity-70",
                          )}
                        >
                          <span
                            className={cn(
                              "grid size-6 shrink-0 place-items-center rounded-full border text-xs font-semibold",
                              answer === c.key && !result ? "border-accent bg-accent text-white" : "border-slate-300",
                              isCorrect && "border-emerald-600 bg-emerald-600 text-white",
                              isWrongPick && "border-rose-500 bg-rose-500 text-white",
                            )}
                          >
                            {isCorrect ? <Check className="size-3.5" /> : isWrongPick ? <X className="size-3.5" /> : c.key}
                          </span>
                          <MathText inline className="flex-1 pt-0.5 text-[15px]">{c.text}</MathText>
                        </button>
                        {graded?.rationale && (isCorrect || isWrongPick || result) && (
                          <p className={cn("ml-12 mt-1.5 text-[13px] leading-relaxed", isCorrect ? "text-emerald-800" : isWrongPick ? "text-rose-800" : "text-slate-500")}>
                            {graded.rationale}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5">
                  <input
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value.replace(/[^0-9./-]/g, "").slice(0, 6))}
                    disabled={Boolean(result)}
                    placeholder="Your answer"
                    inputMode="decimal"
                    className={cn(
                      "h-11 w-40 rounded-md border px-3 text-lg tabular-nums outline-none focus:border-accent",
                      result ? (result.isCorrect ? "border-emerald-500 bg-emerald-50" : "border-rose-400 bg-rose-50") : "border-line",
                    )}
                  />
                  <p className="mt-1.5 text-xs text-slate-500">Enter a number, fraction (3/4) or decimal (.75). Up to 5 characters, 6 for negatives.</p>
                  {result && !result.isCorrect && <p className="mt-2 text-sm text-emerald-800">Correct answer: <strong>{result.correctAnswer}</strong></p>}
                </div>
              )}

              {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

              <div className="mt-6 flex flex-wrap items-center gap-2">
                {!result ? (
                  <>
                    <Button onClick={check} disabled={!answer.trim() || pending}>{pending ? "Checking…" : "Check answer"}</Button>
                    {aiEnabled && (
                      <Button variant="ghost" onClick={() => setShowTutor(true)}>
                        <Lightbulb className="size-4" />
                        Hint
                      </Button>
                    )}
                    <span className="ml-auto hidden text-xs text-slate-400 sm:block">Keys A–D to choose · Enter to check</span>
                  </>
                ) : (
                  <>
                    <Badge tone={result.isCorrect ? "emerald" : "rose"} className="px-2 py-1 text-sm">
                      {result.isCorrect ? "Correct" : "Not quite"}
                    </Badge>
                    <Button onClick={next} className="ml-auto">
                      {index + 1 === questions.length ? "Finish" : "Next question"}
                      <ChevronRight className="size-4" />
                    </Button>
                  </>
                )}
              </div>
            </Card>

            {result && (
              <Card className="p-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Explanation</p>
                <MathText className="text-[15px] leading-relaxed">{result.explanation}</MathText>
              </Card>
            )}

            {aiEnabled && (result || showTutor) && (
              <Card className="p-5">
                <p className="mb-3 text-sm font-semibold">Ask the tutor</p>
                <TutorChat key={q.id} questionId={q.id} initial={tutorHistory[q.id] ?? []} suggestions={suggestions} />
              </Card>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Summary({ title, questions, outcomes }: { title: string; questions: PublicQuestion[]; outcomes: Outcome[] }) {
  const correct = outcomes.filter((o) => o.correct).length;
  const avg = outcomes.length ? Math.round(outcomes.reduce((a, o) => a + o.seconds, 0) / outcomes.length) : 0;
  const missed = outcomes.filter((o) => !o.correct).map((o) => questions.find((q) => q.id === o.id)!);

  return (
    <Card className="mx-auto max-w-xl p-8 text-center">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-5xl font-semibold tabular-nums">
        {correct}<span className="text-2xl text-slate-400">/{outcomes.length}</span>
      </p>
      <p className="mt-2 text-sm text-slate-500">{avg}s average per question</p>
      {missed.length > 0 && (
        <div className="mt-6 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Missed. These are in your review queue for tomorrow.</p>
          <ul className="mt-2 divide-y divide-line rounded-md border border-line">
            {missed.map((q) => (
              <li key={q.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                <span className="flex-1 truncate">{q.skill}</span>
                <Link href={`/practice/session?ids=${q.id}`} className="text-xs font-medium text-accent">Retry</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-6 flex justify-center gap-2">
        <Link href="/practice" className="inline-flex h-9 items-center rounded-md border border-line px-3.5 text-sm font-medium hover:bg-slate-50">Done</Link>
        <Link href="/practice/session?mode=daily" className="inline-flex h-9 items-center gap-1.5 rounded-md bg-navy px-3.5 text-sm font-medium text-white">
          <RotateCcw className="size-4" />
          Another set
        </Link>
      </div>
    </Card>
  );
}
