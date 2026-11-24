"use client";

import { useRef, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { addRecommender, deleteRecommender, updateRecommender } from "@/app/actions/recommenders";
import { Button, Card, CardHeader, Input, Label, Select, Textarea } from "@/components/ui";
import { RECOMMENDER_STATUS } from "@/lib/constants";
import { cn, daysUntil, formatDate } from "@/lib/utils";
import type { Recommender, RecommenderStatus } from "@/lib/types";

export function RecommenderTracker({ recommenders }: { recommenders: Recommender[] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Recommenders" description="Most universities want two teachers plus your counselor." />
        <ul className="divide-y divide-line">
          {recommenders.map((r) => (
            <RecommenderRow key={r.id} rec={r} />
          ))}
          {!recommenders.length && <li className="px-5 py-6 text-sm text-slate-500">No recommenders yet.</li>}
        </ul>
      </Card>

      <Card>
        <CardHeader title="Add recommender" />
        <form
          ref={formRef}
          className="grid gap-3 p-5 sm:grid-cols-2"
          action={(form) =>
            start(async () => {
              const res = await addRecommender(form);
              setError(res?.error ?? null);
              if (!res?.error) formRef.current?.reset();
            })
          }
        >
          <div>
            <Label htmlFor="teacher_name">Name</Label>
            <Input id="teacher_name" name="teacher_name" required />
          </div>
          <div>
            <Label htmlFor="subject">Subject / role</Label>
            <Input id="subject" name="subject" placeholder="e.g. AP Chemistry" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="relationship_context">How they know you</Label>
            <Input id="relationship_context" name="relationship_context" placeholder="e.g. Grade 11 teacher, robotics club advisor" />
          </div>
          <div>
            <Label htmlFor="due_date">Letter due</Label>
            <Input id="due_date" name="due_date" type="date" />
          </div>
          <div className="flex items-end justify-end gap-3">
            {error && <span className="text-xs text-rose-600">{error}</span>}
            <Button type="submit" disabled={pending}>Add</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function RecommenderRow({ rec }: { rec: Recommender }) {
  const [pending, start] = useTransition();
  const [notes, setNotes] = useState(rec.brag_sheet_notes ?? "");
  const [open, setOpen] = useState(false);
  const days = rec.due_date ? daysUntil(rec.due_date) : null;
  const update = (patch: Partial<Recommender>) => start(async () => void (await updateRecommender(rec.id, patch)));

  return (
    <li className={cn("px-5 py-4", pending && "opacity-70")}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{rec.teacher_name}</p>
          <p className="text-xs text-slate-500">{[rec.subject, rec.relationship_context].filter(Boolean).join(" · ")}</p>
        </div>
        {rec.due_date && rec.status !== "submitted" && (
          <span className={cn("text-xs", days !== null && days <= 14 ? "font-medium text-rose-600" : "text-slate-500")}>
            Due {formatDate(rec.due_date, { year: undefined })}
          </span>
        )}
        <Select
          value={rec.status}
          onChange={(e) => update({ status: e.target.value as RecommenderStatus })}
          className="h-8 w-36 text-xs"
          aria-label="Status"
        >
          {(Object.keys(RECOMMENDER_STATUS) as RecommenderStatus[]).map((s) => (
            <option key={s} value={s}>{RECOMMENDER_STATUS[s].label}</option>
          ))}
        </Select>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs">
        <label className={cn("flex items-center gap-1.5", rec.status !== "submitted" && "text-slate-400")}>
          <input
            type="checkbox"
            checked={rec.thank_you_sent}
            onChange={(e) => update({ thank_you_sent: e.target.checked })}
            className="size-3.5 accent-emerald-600"
          />
          Thank-you note sent
        </label>
        <button onClick={() => setOpen(!open)} className="font-medium text-accent">
          {open ? "Hide notes" : rec.brag_sheet_notes ? "Notes for this recommender" : "Add notes"}
        </button>
        <button
          onClick={() => confirm(`Remove ${rec.teacher_name}?`) && start(async () => deleteRecommender(rec.id))}
          className="ml-auto text-slate-400 hover:text-rose-600"
          aria-label="Remove recommender"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
      {open && (
        <div className="mt-3 space-y-2">
          <Textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Specific moments from this class you'd like them to remember"
          />
          <Button size="sm" variant="secondary" onClick={() => update({ brag_sheet_notes: notes.trim() || null })}>
            Save notes
          </Button>
        </div>
      )}
    </li>
  );
}
