import Link from "next/link";
import { Flame, RotateCcw, Target } from "lucide-react";
import { Card } from "@/components/ui";
import type { PracticeStats } from "@/lib/practice";
import { cn } from "@/lib/utils";

export function TodayCard({ stats, goal }: { stats: PracticeStats; goal: number }) {
  const pct = Math.min(100, Math.round((stats.today / goal) * 100));
  const done = stats.today >= goal;

  return (
    <Card className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-xs text-slate-500"><Flame className={cn("size-3.5", stats.streak ? "text-orange-500" : "")} />Streak</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{stats.streak}<span className="ml-1 text-sm font-normal text-slate-500">{stats.streak === 1 ? "day" : "days"}</span></p>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-xs text-slate-500"><Target className="size-3.5" />Today</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{stats.today}<span className="text-sm font-normal text-slate-500">/{goal}</span></p>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-100">
            <div className={cn("h-full rounded-full", done ? "bg-emerald-500" : "bg-accent")} style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-xs text-slate-500"><RotateCcw className="size-3.5" />Reviews due</p>
          <p className={cn("mt-1 text-2xl font-semibold tabular-nums", stats.dueReviews && "text-rose-600")}>{stats.dueReviews}</p>
        </div>
      </div>
      <div className="flex gap-2">
        {stats.dueReviews > 0 && (
          <Link href="/practice/session?mode=review" className="inline-flex h-9 items-center rounded-md border border-line bg-white px-3.5 text-sm font-medium hover:bg-slate-50">
            Review
          </Link>
        )}
        <Link href="/practice/session?mode=daily" className="inline-flex h-9 items-center rounded-md bg-navy px-3.5 text-sm font-medium text-white hover:bg-slate-800">
          {done ? "Keep going" : stats.today ? "Continue daily set" : "Start daily set"}
        </Link>
      </div>
    </Card>
  );
}
