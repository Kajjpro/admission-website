"use client";

import { useOptimistic, useTransition } from "react";
import { Check } from "lucide-react";
import { setTaskStatus } from "@/app/actions/roadmap";
import { TASK_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { RoadmapTask, TaskStatus } from "@/lib/types";

const NEXT: Record<TaskStatus, TaskStatus> = { todo: "in_progress", in_progress: "completed", completed: "todo" };

export function RoadmapChecklist({
  tasks,
  statusByTask,
}: {
  tasks: RoadmapTask[];
  statusByTask: Record<string, TaskStatus>;
}) {
  const [, start] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(statusByTask, (state, update: { id: string; status: TaskStatus }) => ({
    ...state,
    [update.id]: update.status,
  }));

  if (!tasks.length) return <p className="px-5 py-6 text-sm text-slate-500">No tasks for this grade yet.</p>;

  return (
    <ul className="divide-y divide-line">
      {tasks.map((task) => {
        const status = optimistic[task.id] ?? "todo";
        return (
          <li key={task.id} className="flex gap-3 px-5 py-3.5">
            <button
              onClick={() =>
                start(async () => {
                  setOptimistic({ id: task.id, status: NEXT[status] });
                  await setTaskStatus(task.id, NEXT[status]);
                })
              }
              aria-label={`Mark ${task.title} as ${NEXT[status].replace("_", " ")}`}
              className={cn(
                "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
                status === "completed" && "border-emerald-600 bg-emerald-600 text-white",
                status === "in_progress" && "border-amber-500 bg-amber-50",
                status === "todo" && "border-slate-300 hover:border-slate-400",
              )}
            >
              {status === "completed" && <Check className="size-3" strokeWidth={3} />}
              {status === "in_progress" && <span className="size-2 rounded-full bg-amber-500" />}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className={cn("text-sm font-medium", status === "completed" && "text-slate-400 line-through")}>{task.title}</p>
                {task.priority === "high" && status !== "completed" && (
                  <span className="text-[11px] font-medium text-rose-600">High priority</span>
                )}
              </div>
              {task.description && <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{task.description}</p>}
            </div>
            <span className="hidden shrink-0 text-xs text-slate-400 sm:block">{TASK_CATEGORIES[task.category]}</span>
          </li>
        );
      })}
    </ul>
  );
}
