"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { updateTestTargets } from "@/app/actions/profile";
import { deleteScore, logScore, logStudy } from "@/app/actions/testing";
import { Badge, Button, Card, CardHeader, Input, Label } from "@/components/ui";
import { cn, daysUntil, formatDate } from "@/lib/utils";
import type { StudyLog, TestScore, TestType } from "@/lib/types";

const SECTIONS: Record<TestType, { key: string; label: string; min: number; max: number; step: number }[]> = {
  SAT: [
    { key: "ebrw", label: "Reading & Writing", min: 200, max: 800, step: 10 },
    { key: "math", label: "Math", min: 200, max: 800, step: 10 },
  ],
  IELTS: [
    { key: "listening", label: "Listening", min: 0, max: 9, step: 0.5 },
    { key: "reading", label: "Reading", min: 0, max: 9, step: 0.5 },
    { key: "writing", label: "Writing (Task 1 & 2)", min: 0, max: 9, step: 0.5 },
    { key: "speaking", label: "Speaking", min: 0, max: 9, step: 0.5 },
  ],
};

const DESCRIPTORS = {
  "Writing — Task Response": [
    "My position is clear from the introduction to the conclusion",
    "Every body paragraph supports the position with an example",
    "I answer every part of the question",
  ],
  "Writing — Coherence & Cohesion": [
    "One central idea per paragraph",
    "Linking words vary and aren't forced",
    "Pronouns and references are always clear",
  ],
  "Writing — Lexical Resource": [
    "I use some less common words accurately",
    "Collocations sound natural",
    "Spelling errors are rare",
  ],
  "Writing — Grammar": [
    "I mix simple and complex sentences",
    "Most sentences are error-free",
  ],
  Speaking: [
    "I can talk for two minutes in Part 2 without long pauses",
    "I self-correct without stopping the flow",
    "I use idiomatic language where natural",
    "Word and sentence stress is clear",
  ],
};

export function TestingHub({
  type,
  target,
  scores,
  logs,
  guides,
}: {
  type: TestType;
  target: number | null;
  scores: TestScore[];
  logs: StudyLog[];
  guides: { slug: string; title: string; summary: string | null }[];
}) {
  const best = scores.reduce<TestScore | null>((b, s) => (!b || Number(s.total_score) > Number(b.total_score) ? s : b), null);
  const latest = scores.at(-1) ?? null;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <TargetCard type={type} target={target} best={best} latest={latest} />
        <Card>
          <CardHeader title="Score history" description={`${scores.length} logged`} />
          <div className="p-5">
            <ScoreChart scores={scores} type={type} target={target} />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <ScoreLog type={type} scores={scores} />
        <StudyTracker type={type} logs={logs} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {type === "IELTS" && <DescriptorChecklist />}
        <Card className={type === "SAT" ? "lg:col-span-2" : ""}>
          <CardHeader title="Strategy guides" />
          <ul className="divide-y divide-line">
            {guides.map((g) => (
              <li key={g.slug}>
                <Link href={`/guides/${g.slug}`} className="block px-5 py-3 hover:bg-slate-50">
                  <p className="text-sm font-medium">{g.title}</p>
                  {g.summary && <p className="text-xs text-slate-500">{g.summary}</p>}
                </Link>
              </li>
            ))}
            {!guides.length && <li className="px-5 py-4 text-sm text-slate-500">No guides yet.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function TargetCard({ type, target, best, latest }: { type: TestType; target: number | null; best: TestScore | null; latest: TestScore | null }) {
  const [value, setValue] = useState(target?.toString() ?? "");
  const [pending, start] = useTransition();
  const sections = SECTIONS[type];
  const max = type === "SAT" ? 1600 : 9;
  const perSectionTarget = target ? (type === "SAT" ? target / 2 : target) : null;

  return (
    <Card>
      <CardHeader title="Target & gap" description={type === "SAT" ? "Section targets assume an even split." : "Each band compared with your overall target."} />
      <div className="space-y-5 p-5">
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(value) || null;
            start(async () => void (await updateTestTargets(type === "SAT" ? { sat_target: n } : { ielts_target: n })));
          }}
        >
          <div className="flex-1">
            <Label htmlFor="target">Target {type === "SAT" ? "score" : "band"}</Label>
            <Input id="target" type="number" min={type === "SAT" ? 400 : 0} max={max} step={type === "SAT" ? 10 : 0.5} value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
          <Button type="submit" variant="secondary" disabled={pending}>Save</Button>
        </form>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-500">Best</p>
            <p className="text-2xl font-semibold tabular-nums">{best ? Number(best.total_score) : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Gap to target</p>
            <p className={cn("text-2xl font-semibold tabular-nums", best && target && Number(best.total_score) >= target ? "text-emerald-600" : "text-amber-600")}>
              {best && target ? Math.max(0, target - Number(best.total_score)) : "—"}
            </p>
          </div>
        </div>

        {latest && perSectionTarget && (
          <div className="space-y-2.5">
            <p className="text-xs text-slate-500">Latest attempt by section ({formatDate(latest.test_date)})</p>
            {sections.map((s) => {
              const score = latest.section_scores[s.key] ?? 0;
              const gap = perSectionTarget - score;
              return (
                <div key={s.key}>
                  <div className="flex justify-between text-xs">
                    <span>{s.label}</span>
                    <span className={cn("tabular-nums", gap > 0 ? "text-amber-700" : "text-emerald-700")}>
                      {score} {gap > 0 ? `(−${type === "SAT" ? gap : gap.toFixed(1)})` : "✓"}
                    </span>
                  </div>
                  <div className="relative mt-1 h-1.5 rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${((score - s.min) / (s.max - s.min)) * 100}%` }} />
                    <div className="absolute -top-0.5 h-2.5 w-0.5 bg-navy" style={{ left: `${((perSectionTarget - s.min) / (s.max - s.min)) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

function ScoreChart({ scores, type, target }: { scores: TestScore[]; type: TestType; target: number | null }) {
  if (scores.length < 2) return <p className="py-10 text-center text-sm text-slate-500">Log at least two scores to see a trend.</p>;

  const [lo, hi] = type === "SAT" ? [400, 1600] : [4, 9];
  const values = scores.map((s) => Number(s.total_score));
  const min = Math.max(lo, Math.min(...values, target ?? Infinity) - (type === "SAT" ? 60 : 0.5));
  const max = Math.min(hi, Math.max(...values, target ?? 0) + (type === "SAT" ? 60 : 0.5));
  const W = 480, H = 180, P = 28;
  const x = (i: number) => P + (i / (scores.length - 1)) * (W - P * 2);
  const y = (v: number) => H - P - ((v - min) / (max - min)) * (H - P * 2);
  const path = values.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Score trend">
      {target && (
        <>
          <line x1={P} x2={W - P} y1={y(target)} y2={y(target)} stroke="#0f172a" strokeDasharray="4 4" strokeOpacity={0.3} />
          <text x={W - P} y={y(target) - 6} textAnchor="end" className="fill-slate-500 text-[10px]">Target {target}</text>
        </>
      )}
      <path d={path} fill="none" stroke="#4f46e5" strokeWidth={2} strokeLinejoin="round" />
      {scores.map((s, i) => (
        <g key={s.id}>
          <circle cx={x(i)} cy={y(values[i]!)} r={4} fill={s.is_official ? "#4f46e5" : "#fff"} stroke="#4f46e5" strokeWidth={2} />
          <text x={x(i)} y={y(values[i]!) - 10} textAnchor="middle" className="fill-slate-700 text-[10px] font-medium">{values[i]}</text>
          <text x={x(i)} y={H - 8} textAnchor="middle" className="fill-slate-400 text-[10px]">{formatDate(s.test_date, { year: "2-digit", day: undefined })}</text>
        </g>
      ))}
    </svg>
  );
}

function ScoreLog({ type, scores }: { type: TestType; scores: TestScore[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Card>
      <CardHeader title="Score log" description="Filled dots on the chart are official scores." />
      <form
        ref={formRef}
        className="grid grid-cols-2 gap-3 border-b border-line p-5 sm:grid-cols-4"
        action={(form) =>
          start(async () => {
            const res = await logScore(form);
            setError(res?.error ?? null);
            if (!res?.error) formRef.current?.reset();
          })
        }
      >
        <input type="hidden" name="test_type" value={type} />
        {SECTIONS[type].map((s) => (
          <div key={s.key}>
            <Label htmlFor={s.key}>{s.label}</Label>
            <Input id={s.key} name={s.key} type="number" min={s.min} max={s.max} step={s.step} required />
          </div>
        ))}
        <div>
          <Label htmlFor="test_date">Date</Label>
          <Input id="test_date" name="test_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input type="checkbox" name="is_official" className="size-4 accent-accent" />
          Official
        </label>
        <div className="col-span-2 flex items-end justify-end gap-3 sm:col-span-4">
          {error && <span className="text-xs text-rose-600">{error}</span>}
          <Button type="submit" size="sm" disabled={pending}>Log score</Button>
        </div>
      </form>
      <ul className="max-h-72 divide-y divide-line overflow-y-auto">
        {[...scores].reverse().map((s) => (
          <li key={s.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
            <span className="w-24 text-slate-500">{formatDate(s.test_date)}</span>
            <span className="font-semibold tabular-nums">{Number(s.total_score)}</span>
            <span className="truncate text-xs text-slate-500">
              {SECTIONS[type].map((sec) => `${sec.label.split(" ")[0]} ${s.section_scores[sec.key]}`).join(" · ")}
            </span>
            {s.is_official && <Badge tone="indigo" className="ml-auto">Official</Badge>}
            <button
              onClick={() => start(async () => void (await deleteScore(s.id)))}
              className={cn("text-slate-300 hover:text-rose-600", !s.is_official && "ml-auto")}
              aria-label="Delete score"
            >
              <Trash2 className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function StudyTracker({ type, logs }: { type: TestType; logs: StudyLog[] }) {
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const iso = d.toISOString().slice(0, 10);
    return { iso, minutes: logs.filter((l) => l.logged_on === iso).reduce((a, l) => a + l.minutes, 0) };
  });
  const week = logs.filter((l) => daysUntil(l.logged_on) > -7).reduce((a, l) => a + l.minutes, 0);
  const peak = Math.max(60, ...days.map((d) => d.minutes));

  return (
    <Card>
      <CardHeader title="Study tracker" description={`${Math.round((week / 60) * 10) / 10} hours in the last 7 days`} />
      <div className="flex h-24 items-end gap-1.5 px-5 pt-5">
        {days.map((d) => (
          <div key={d.iso} className="flex flex-1 flex-col items-center gap-1" title={`${d.iso}: ${d.minutes} min`}>
            <div className={cn("w-full rounded-sm", d.minutes ? "bg-accent" : "bg-slate-100")} style={{ height: `${Math.max(4, (d.minutes / peak) * 64)}px` }} />
          </div>
        ))}
      </div>
      <form
        ref={formRef}
        className="grid grid-cols-[1fr_90px_auto] gap-2 p-5"
        action={(form) => start(async () => {
          const res = await logStudy(form);
          if (!res?.error) formRef.current?.reset();
        })}
      >
        <input type="hidden" name="test_type" value={type} />
        <input type="hidden" name="logged_on" value={new Date().toISOString().slice(0, 10)} />
        <Input name="focus" placeholder={type === "SAT" ? "e.g. Algebra, module 1 timing" : "e.g. Task 2 essay"} aria-label="Focus" />
        <Input name="minutes" type="number" min={1} placeholder="Min" required aria-label="Minutes" />
        <Button type="submit" variant="secondary" disabled={pending}>Log</Button>
      </form>
      <ul className="max-h-40 divide-y divide-line overflow-y-auto border-t border-line">
        {logs.slice(0, 10).map((l) => (
          <li key={l.id} className="flex gap-3 px-5 py-2 text-xs">
            <span className="w-20 text-slate-500">{formatDate(l.logged_on, { year: undefined })}</span>
            <span className="flex-1 truncate">{l.focus ?? "Study session"}</span>
            <span className="tabular-nums text-slate-500">{l.minutes} min</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function DescriptorChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  useEffect(() => {
    setChecked(JSON.parse(localStorage.getItem("ielts-descriptors") ?? "{}"));
  }, []);
  function toggle(item: string) {
    const next = { ...checked, [item]: !checked[item] };
    setChecked(next);
    localStorage.setItem("ielts-descriptors", JSON.stringify(next));
  }

  return (
    <Card>
      <CardHeader title="Band 7+ self-check" description="Tick what you consistently do in practice." />
      <div className="space-y-4 p-5">
        {Object.entries(DESCRIPTORS).map(([group, items]) => (
          <div key={group}>
            <p className="mb-1.5 text-xs font-medium text-slate-500">{group}</p>
            {items.map((item) => (
              <label key={item} className="flex items-start gap-2 py-1 text-sm">
                <input type="checkbox" checked={Boolean(checked[item])} onChange={() => toggle(item)} className="mt-0.5 size-4 accent-accent" />
                {item}
              </label>
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}
