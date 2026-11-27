"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { Check, MessageSquare } from "lucide-react";
import { setTaskDone } from "@/app/actions/counselor";
import { Card, CardHeader } from "@/components/ui";
import { cn, daysUntil, formatDate } from "@/lib/utils";
import type { CounselorTask } from "@/lib/types";

export function CounselorTasks({ tasks, feedbackAt }: { tasks: CounselorTask[]; feedbackAt: string | null }) {
  const [, start] = useTransition();
  const [items, toggle] = useOptimistic(tasks, (state, id: string) =>
    state.map((t) => (t.id === id ? { ...t, done_at: t.done_at ? null : new Date().toISOString() } : t)),
  );
  if (!items.length && !feedbackAt) return null;
  const open = items.filter((t) => !t.done_at).length;

  return (
    <Card>
      <CardHeader title="From your counsellor" description={items.length ? `${open} to do` : undefined} />
      {feedbackAt && (
        <Link href="/profile?view=preview" className="flex items-center gap-3 border-b border-line bg-amber-50 px-5 py-3 text-sm text-amber-950 hover:bg-amber-100">
          <MessageSquare className="size-4 shrink-0 text-amber-600" />
          <span className="flex-1">New feedback on your application ({formatDate(feedbackAt, { year: undefined })}). See comments on each section.</span>
        </Link>
      )}
      <ul className="divide-y divide-line">
        {items.map((t) => {
          const days = t.due_date ? daysUntil(t.due_date) : null;
          return (
            <li key={t.id} className="flex items-start gap-3 px-5 py-3">
              <button
                onClick={() => start(async () => { toggle(t.id); await setTaskDone(t.id, !t.done_at); })}
                className={cn("mt-0.5 grid size-4 shrink-0 place-items-center rounded border transition-colors", t.done_at ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 hover:border-accent")}
                aria-label={t.done_at ? "Mark not done" : "Mark done"}
              >
                {t.done_at && <Check className="size-3" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm", t.done_at && "text-slate-400 line-through")}>{t.title}</p>
                {t.details && !t.done_at && <p className="text-xs text-slate-500">{t.details}</p>}
              </div>
              {t.due_date && !t.done_at && (
                <span className={cn("text-xs tabular-nums", days !== null && days <= 3 ? "font-medium text-rose-600" : "text-slate-500")}>
                  {days !== null && days < 0 ? "Overdue" : `Due ${formatDate(t.due_date, { year: undefined })}`}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
