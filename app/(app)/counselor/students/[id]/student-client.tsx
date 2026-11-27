"use client";

import { useRef, useState, useTransition } from "react";
import { Check, Trash2 } from "lucide-react";
import { addNote, assignTask, deleteNote, deleteTask, setTaskDone } from "@/app/actions/counselor";
import { Badge, Button, Card, CardHeader, Input, Select, Textarea } from "@/components/ui";
import { cn, daysUntil, formatDate, formatDateTime } from "@/lib/utils";
import type { CounselorTask } from "@/lib/types";

export function TaskPanel({ studentId, tasks }: { studentId: string; tasks: CounselorTask[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const open = tasks.filter((t) => !t.done_at);
  const done = tasks.filter((t) => t.done_at);

  return (
    <Card>
      <CardHeader title="Tasks for the student" description={`${open.length} open · shows on their dashboard`} />
      <form
        ref={formRef}
        className="space-y-2 border-b border-line p-4"
        action={(form) =>
          start(async () => {
            const res = await assignTask(studentId, form);
            setError(res?.error ?? null);
            if (!res?.error) formRef.current?.reset();
          })
        }
      >
        <Input name="title" placeholder="e.g. Rewrite activity #3 with numbers" required maxLength={160} />
        <div className="flex gap-2">
          <Input name="due_date" type="date" className="w-40" aria-label="Due date" />
          <Button type="submit" disabled={pending} className="flex-1">Assign</Button>
        </div>
        <Textarea name="details" rows={2} placeholder="Details (optional)" maxLength={1000} />
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </form>
      <ul className="divide-y divide-line">
        {[...open, ...done].map((t) => (
          <TaskRow key={t.id} task={t} studentId={studentId} />
        ))}
        {!tasks.length && <li className="px-5 py-4 text-sm text-slate-500">No tasks yet.</li>}
      </ul>
    </Card>
  );
}

function TaskRow({ task, studentId }: { task: CounselorTask; studentId: string }) {
  const [pending, start] = useTransition();
  const days = task.due_date ? daysUntil(task.due_date) : null;
  return (
    <li className={cn("flex items-start gap-3 px-5 py-3", pending && "opacity-60")}>
      <button
        onClick={() => start(async () => void (await setTaskDone(task.id, !task.done_at)))}
        className={cn("mt-0.5 grid size-4 shrink-0 place-items-center rounded border", task.done_at ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300")}
        aria-label={task.done_at ? "Mark not done" : "Mark done"}
      >
        {task.done_at && <Check className="size-3" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm", task.done_at && "text-slate-400 line-through")}>{task.title}</p>
        {task.details && <p className="text-xs text-slate-500">{task.details}</p>}
        <p className="mt-0.5 text-xs text-slate-500">
          {task.done_at ? `Done ${formatDate(task.done_at, { year: undefined })}` : task.due_date ? (
            <span className={cn(days !== null && days < 0 && "font-medium text-rose-600")}>
              {days !== null && days < 0 ? `Overdue · was due ${formatDate(task.due_date, { year: undefined })}` : `Due ${formatDate(task.due_date, { year: undefined })}`}
            </span>
          ) : "No due date"}
        </p>
      </div>
      <button onClick={() => start(() => deleteTask(task.id, studentId))} className="text-slate-300 hover:text-rose-600" aria-label="Delete task">
        <Trash2 className="size-3.5" />
      </button>
    </li>
  );
}

const KINDS = { note: "Note", meeting: "Meeting", call: "Call" } as const;

export function NotesPanel({ studentId, notes }: { studentId: string; notes: { id: string; kind: keyof typeof KINDS; body: string; created_at: string }[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <Card>
      <CardHeader title="Private notes" description="Only counsellors see these. Log meetings, calls and things to remember." />
      <form
        ref={formRef}
        className="space-y-2 border-b border-line p-4"
        action={(form) =>
          start(async () => {
            const res = await addNote(studentId, form);
            setError(res?.error ?? null);
            if (!res?.error) formRef.current?.reset();
          })
        }
      >
        <Textarea name="body" rows={3} placeholder="What did you discuss? What's next?" required maxLength={4000} />
        <div className="flex gap-2">
          <Select name="kind" className="w-32" aria-label="Type">
            {Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Button type="submit" variant="secondary" disabled={pending} className="flex-1">Save note</Button>
        </div>
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </form>
      <ul className="max-h-[28rem] divide-y divide-line overflow-y-auto">
        {notes.map((n) => (
          <li key={n.id} className="group px-5 py-3">
            <div className="flex items-center gap-2">
              <Badge tone={n.kind === "meeting" ? "sky" : n.kind === "call" ? "indigo" : "neutral"}>{KINDS[n.kind]}</Badge>
              <span className="text-xs text-slate-500">{formatDateTime(n.created_at)}</span>
              <button
                onClick={() => confirm("Delete this note?") && start(() => deleteNote(n.id, studentId))}
                className="ml-auto text-slate-300 opacity-0 hover:text-rose-600 group-hover:opacity-100"
                aria-label="Delete note"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
            <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700">{n.body}</p>
          </li>
        ))}
        {!notes.length && <li className="px-5 py-4 text-sm text-slate-500">No notes yet.</li>}
      </ul>
    </Card>
  );
}
