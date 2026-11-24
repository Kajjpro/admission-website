import Link from "next/link";
import { Card } from "@/components/ui";
import { percent } from "@/lib/universities";

export interface ComparedUniversity {
  id: string;
  name: string;
  sat_25: number;
  sat_75: number;
  acceptance_rate: number | null;
}

const MIN = 900;
const MAX = 1600;
const pos = (v: number) => `${((Math.min(MAX, Math.max(MIN, v)) - MIN) / (MAX - MIN)) * 100}%`;

export function ScoreComparison({ universities, bestSat }: { universities: ComparedUniversity[]; bestSat: number | null }) {
  if (!universities.length) {
    return (
      <Card className="p-8 text-center">
        <p className="font-medium">Add U.S. universities to your list to compare</p>
        <p className="mt-1 text-sm text-slate-500">You'll see where your SAT falls against each one's admitted students.</p>
        <Link href="/universities" className="mt-4 inline-block text-sm font-medium text-accent">Browse universities</Link>
      </Card>
    );
  }

  const sorted = [...universities].sort((a, b) => b.sat_75 - a.sat_75);
  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-6 rounded-sm bg-indigo-200" />Middle 50% of admitted students</span>
        {bestSat ? (
          <span className="flex items-center gap-1.5"><span className="h-3 w-0.5 bg-navy" />You: {bestSat}</span>
        ) : (
          <Link href="/testing" className="font-medium text-accent">Log an SAT score to see your marker</Link>
        )}
      </div>
      <div className="space-y-3">
        {sorted.map((u) => {
          const inRange = bestSat !== null && bestSat >= u.sat_25;
          return (
            <div key={u.id} className="grid grid-cols-[minmax(0,180px)_1fr_64px] items-center gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{u.name}</p>
                <p className="text-[11px] text-slate-500">{percent(u.acceptance_rate, 1)} accepted</p>
              </div>
              <div className="relative h-7 rounded-md bg-slate-50">
                <div className="absolute inset-y-1.5 rounded bg-indigo-200" style={{ left: pos(u.sat_25), width: `calc(${pos(u.sat_75)} - ${pos(u.sat_25)})` }} />
                {bestSat && <div className="absolute inset-y-0 w-0.5 bg-navy" style={{ left: pos(bestSat) }} />}
              </div>
              <span className={`text-right text-xs tabular-nums ${bestSat ? (inRange ? "text-emerald-700" : "text-rose-600") : "text-slate-500"}`}>
                {u.sat_25}–{u.sat_75}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 grid grid-cols-[minmax(0,180px)_1fr_64px] gap-3 text-[10px] tabular-nums text-slate-400">
        <span />
        <div className="relative h-3">
          {[MIN, 1100, 1300, 1500, MAX].map((t) => (
            <span key={t} className="absolute -translate-x-1/2" style={{ left: pos(t) }}>{t}</span>
          ))}
        </div>
        <span />
      </div>
    </Card>
  );
}
