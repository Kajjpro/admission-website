"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

type Rating = 1 | 2 | 3 | 4;

interface Question {
  id: "academic" | "testing" | "english" | "activities" | "personal";
  label: string;
  question: string;
  options: [string, string, string, string];
  lift: { text: string; href: string };
}

const QUESTIONS: Question[] = [
  {
    id: "academic",
    label: "Academic",
    question: "Your grades and courses",
    options: ["Top of my class in the hardest courses my school offers", "Top grades, mostly in the hardest courses", "Good grades in standard courses", "Uneven grades"],
    lift: { text: "Take the most rigorous courses you can handle next term, and ask for help early in the hardest one.", href: "/dashboard" },
  },
  {
    id: "testing",
    label: "Testing",
    question: "Your best SAT",
    options: ["1530 or higher", "1450–1520", "1300–1440", "Below 1300, or not taken yet"],
    lift: { text: "A daily practice set on your weakest skills moves scores faster than full tests.", href: "/practice" },
  },
  {
    id: "english",
    label: "English",
    question: "Your best IELTS (or TOEFL equivalent)",
    options: ["7.5 or higher", "7.0", "6.5", "Below 6.5, or not taken yet"],
    lift: { text: "Most selective universities want 7.0+. Practice Writing Task 2 three times a week against the band descriptors.", href: "/testing?test=IELTS" },
  },
  {
    id: "activities",
    label: "Extracurricular",
    question: "Your strongest activity on the Spike Test",
    options: ["5 of 5 markers", "4 of 5", "3 of 5", "2 or fewer"],
    lift: { text: "Fill the missing markers on your strongest activity: an output, outside recognition, or a people edge.", href: "/guides/spike-test" },
  },
  {
    id: "personal",
    label: "Personal",
    question: "Your essays and letters",
    options: [
      "Essay full of specific moments and reflection, reviewed; teachers who can name 3+ moments",
      "Strong draft; teachers who know me well",
      "Early draft; teachers who mostly know my grades",
      "Not started",
    ],
    lift: { text: "Start a story bank for two teachers and send your essay draft to your counsellor.", href: "/guides/recommendation-letters" },
  },
];

const TONE: Record<Rating, string> = {
  1: "bg-emerald-600 text-white",
  2: "bg-accent text-white",
  3: "bg-amber-500 text-white",
  4: "bg-slate-300 text-slate-700",
};

function fromSat(score: number | null): Rating | null {
  if (!score) return null;
  return score >= 1530 ? 1 : score >= 1450 ? 2 : score >= 1300 ? 3 : 4;
}
function fromIelts(band: number | null): Rating | null {
  if (!band) return null;
  return band >= 7.5 ? 1 : band >= 7 ? 2 : band >= 6.5 ? 3 : 4;
}

function verdict(overall: number) {
  if (overall <= 1.5) return { title: "Competitive at the most selective universities", body: "Your file has the profile of admitted students at colleges under 10%. Even so, those are reaches for everyone, so keep your list balanced." };
  if (overall <= 2.25) return { title: "Strong: competitive at highly selective universities", body: "You're in range for many top-100 universities. One category moving up a level would make the most selective ones realistic reaches." };
  if (overall <= 3) return { title: "Solid: competitive at selective universities", body: "A good foundation. Pick the one category below with the biggest lift and work on it this term." };
  return { title: "Building: you have time to grow", body: "Most students start here. Focus on one category at a time, beginning with the suggestion below." };
}

export function ReaderSimulator({
  name,
  bestSat,
  bestIelts,
  activityCount,
  submittedLetters,
}: {
  name: string;
  bestSat: number | null;
  bestIelts: number | null;
  activityCount: number;
  submittedLetters: number;
}) {
  const [answers, setAnswers] = useState<Partial<Record<Question["id"], Rating>>>(() => ({
    ...(fromSat(bestSat) ? { testing: fromSat(bestSat)! } : {}),
    ...(fromIelts(bestIelts) ? { english: fromIelts(bestIelts)! } : {}),
  }));

  const core = (["academic", "testing", "activities", "personal"] as const).map((id) => answers[id]);
  const complete = core.every(Boolean);
  const overall = complete ? core.reduce<number>((a, b) => a + b!, 0) / core.length : null;
  const weakest = complete
    ? QUESTIONS.filter((q) => answers[q.id]).sort((a, b) => answers[b.id]! - answers[a.id]!)[0]
    : null;
  const v = overall !== null ? verdict(overall) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4">
        {QUESTIONS.map((q) => (
          <Card key={q.id} className="p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold">{q.question}</p>
              <span className="text-xs text-slate-500">
                {q.id === "testing" && bestSat ? `From your scores: ${bestSat}` : null}
                {q.id === "english" && bestIelts ? `From your scores: IELTS ${bestIelts}` : null}
                {q.id === "activities" ? `${activityCount} activities listed` : null}
                {q.id === "personal" ? `${submittedLetters} letters submitted` : null}
              </span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {q.options.map((option, i) => {
                const rating = (i + 1) as Rating;
                const active = answers[q.id] === rating;
                return (
                  <button
                    key={option}
                    onClick={() => setAnswers({ ...answers, [q.id]: rating })}
                    className={cn(
                      "flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-left text-sm transition-colors",
                      active ? "border-accent bg-accent-soft" : "border-line bg-white hover:border-slate-300",
                    )}
                  >
                    <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-semibold", active ? TONE[rating] : "bg-slate-100 text-slate-500")}>{rating}</span>
                    {option}
                  </button>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      <div className="lg:sticky lg:top-20 lg:h-fit">
        <Card className="overflow-hidden shadow-sm">
          <div className="border-b border-line bg-navy px-5 py-4 text-white">
            <p className="text-[11px] uppercase tracking-[0.16em] text-indigo-200">Reader card</p>
            <p className="mt-1 font-serif text-xl">{name}</p>
            <p className="text-xs text-slate-300">International applicant</p>
          </div>
          <div className="space-y-3 p-5">
            {QUESTIONS.map((q) => {
              const r = answers[q.id];
              return (
                <div key={q.id} className="flex items-center gap-3">
                  <span className="w-28 text-sm text-slate-600">{q.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      className={cn("h-full rounded-full", r ? TONE[r].split(" ")[0] : "")}
                      initial={false}
                      animate={{ width: r ? `${((5 - r) / 4) * 100}%` : "0%" }}
                      transition={{ type: "spring", stiffness: 200, damping: 26 }}
                    />
                  </div>
                  <span className={cn("grid size-6 place-items-center rounded-full text-xs font-semibold", r ? TONE[r] : "bg-slate-100 text-slate-400")}>{r ?? "–"}</span>
                </div>
              );
            })}
          </div>
          <div className="border-t border-line p-5">
            {v && overall !== null ? (
              <>
                <p className="text-xs text-slate-500">Overall, roughly <strong className="text-navy">{overall.toFixed(1)}</strong> on a 1–4 scale</p>
                <p className="mt-1 font-semibold">{v.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{v.body}</p>
                {answers.english === 4 && (
                  <p className="mt-3 rounded-md bg-amber-50 p-2.5 text-xs text-amber-900">Your English score may fall below many universities' minimums, which can stop a file before it's rated.</p>
                )}
                {weakest && (
                  <Link href={weakest.lift.href} className="group mt-4 block rounded-md border border-line p-3 hover:border-accent">
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent">Biggest lift: {weakest.label}</p>
                    <p className="mt-1 text-sm text-slate-700">{weakest.lift.text}</p>
                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent">Start <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" /></span>
                  </Link>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500">Answer the academic, testing, extracurricular and personal questions to see how a reader might summarize your file.</p>
            )}
            <p className="mt-4 text-[11px] leading-relaxed text-slate-400">A simplified teaching model based on publicly described reading practices. Real readers weigh context, and no tool can predict a decision.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
