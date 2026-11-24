"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

// Shown in place from the original sites; nothing is copied into our database.
const SOURCES = [
  {
    id: "sqb",
    label: "SATQuestionBank.org",
    url: "https://satquestionbank.org/",
    note: "Official College Board questions with a timer, Desmos and answer checking.",
  },
  {
    id: "cb",
    label: "College Board Question Bank",
    url: "https://satsuiteeducatorquestionbank.collegeboard.org/",
    note: "The official bank itself. Filter by test, section, skill and difficulty, then export or view.",
  },
] as const;

export function OfficialEmbed() {
  const [active, setActive] = useState<(typeof SOURCES)[number]["id"]>("sqb");
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
    </div>
  );
}
