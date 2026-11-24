"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ExternalLink } from "lucide-react";
import { logOfficialPractice } from "@/app/actions/practice";
import { Button, Input, Select } from "@/components/ui";
import { SAT_TAXONOMY, type Section } from "@/lib/sat";
import { cn } from "@/lib/utils";

// Shown in place from the original sites; nothing is copied into our database.
const SOURCES = [
  {
    id: "sat_question_bank",
    label: "SATQuestionBank.org",
    url: "https://satquestionbank.org/",
    note: "Official College Board questions with a timer, Desmos and answer checking.",
  },
  {
    id: "college_board",
    label: "College Board Question Bank",
    url: "https://satsuiteeducatorquestionbank.collegeboard.org/",
    note: "The official bank itself. Filter by test, section, skill and difficulty, then export or view.",
  },
] as const;

export function OfficialEmbed({ officialToday, today, goal }: { officialToday: number; today: number; goal: number }) {
  const [active, setActive] = useState<(typeof SOURCES)[number]["id"]>("sat_question_bank");
  const source = SOURCES.find((s) => s.id === active)!;

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100vh-3.5rem)] flex-col md:-mx-8 md:-my-8">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-white px-4 py-2.5 md:px-6">
        <Link href="/practice" className="mr-2 text-sm text-slate-500 hover:text-navy">SAT Practice</Link>
        {SOURCES.map((s) => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className={cn("rounded-md px-3 py-1.5 text-sm", s.id === active ? "bg-navy text-white" : "text-slate-600 hover:bg-slate-100")}
          >
            {s.label}
          </button>
        ))}
        <span className="hidden flex-1 truncate px-2 text-xs text-slate-500 lg:block">{source.note}</span>
        <a href={source.url} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-accent">
          Open in new tab
          <ExternalLink className="size-3" />
        </a>
      </div>
      <iframe key={source.id} src={source.url} title={source.label} className="w-full flex-1 bg-white" />
      <LogBar source={source.id} officialToday={officialToday} today={today} goal={goal} />
    </div>
  );
}

function LogBar({ source, officialToday, today, goal }: { source: string; officialToday: number; today: number; goal: number }) {
  const [section, setSection] = useState<Section | "">("");
  const [skill, setSkill] = useState("");
  const [attempted, setAttempted] = useState("");
  const [correct, setCorrect] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const skills = section ? Object.values(SAT_TAXONOMY[section].domains).flat() : [];

  return (
    <form
      className="flex flex-wrap items-center gap-2 border-t border-line bg-white px-4 py-2.5 md:px-6"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await logOfficialPractice({ source, section: section || null, skill: skill || null, attempted: Number(attempted), correct: Number(correct) });
          if (res?.error) return setMessage({ ok: false, text: res.error });
          setMessage({ ok: true, text: `Logged ${attempted} questions.` });
          setAttempted("");
          setCorrect("");
        });
      }}
    >
      <span className="text-sm font-medium">Log what you did</span>
      <Select value={section} onChange={(e) => { setSection(e.target.value as Section | ""); setSkill(""); }} className="h-8 w-40 text-xs" aria-label="Section">
        <option value="">Section</option>
        <option value="rw">Reading & Writing</option>
        <option value="math">Math</option>
      </Select>
      <Select value={skill} onChange={(e) => setSkill(e.target.value)} disabled={!section} className="h-8 w-56 text-xs" aria-label="Skill">
        <option value="">Skill (optional)</option>
        {skills.map((s) => <option key={s}>{s}</option>)}
      </Select>
      <Input value={attempted} onChange={(e) => setAttempted(e.target.value)} type="number" min={1} max={500} required placeholder="Questions" className="h-8 w-28 text-xs" aria-label="Questions done" />
      <Input value={correct} onChange={(e) => setCorrect(e.target.value)} type="number" min={0} max={500} required placeholder="Correct" className="h-8 w-24 text-xs" aria-label="Number correct" />
      <Button type="submit" size="sm" disabled={pending}>Log</Button>
      {message && <span className={cn("text-xs", message.ok ? "text-emerald-700" : "text-rose-600")}>{message.text}</span>}
      <span className="ml-auto text-xs tabular-nums text-slate-500">
        Today: {today}/{goal} questions{officialToday ? ` (${officialToday} official)` : ""}
      </span>
    </form>
  );
}
