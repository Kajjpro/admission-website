"use client";

import { useOptimistic, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteActivity, reorderActivities, saveActivity } from "@/app/actions/activities";
import { Badge, Button, Card, EmptyState, Input, Label, Select, Textarea } from "@/components/ui";
import { GRADES, IMPACT_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Activity, ImpactCategory } from "@/lib/types";

const ACTIVITY_TYPES = [
  "Academic", "Art", "Athletics: Club", "Athletics: JV/Varsity", "Career-Oriented", "Community Service (Volunteer)",
  "Computer/Technology", "Cultural", "Dance", "Debate/Speech", "Environmental", "Family Responsibilities",
  "Journalism/Publication", "Music: Instrumental", "Music: Vocal", "Research", "Robotics", "School Spirit",
  "Science/Math", "Student Government", "Theater/Drama", "Work (Paid)", "Other",
];

export function ActivityList({ activities }: { activities: Activity[] }) {
  const [editing, setEditing] = useState<string | "new" | null>(activities.length ? null : "new");
  const [order, setOrder] = useOptimistic(activities);
  const [, start] = useTransition();

  function move(index: number, dir: -1 | 1) {
    const next = [...order];
    const [item] = next.splice(index, 1);
    next.splice(index + dir, 0, item!);
    start(async () => {
      setOrder(next);
      await reorderActivities(next.map((a) => a.id));
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          <span className={cn("font-medium", order.length > 10 ? "text-rose-600" : "text-navy")}>{order.length}</span> of 10
        </p>
        {editing !== "new" && (
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="size-4" />
            Add activity
          </Button>
        )}
      </div>

      {editing === "new" && <ActivityForm onDone={() => setEditing(null)} />}
      {!order.length && editing !== "new" && <EmptyState title="No activities yet" />}

      {order.map((a, i) =>
        editing === a.id ? (
          <ActivityForm key={a.id} activity={a} onDone={() => setEditing(null)} />
        ) : (
          <motion.div key={a.id} layout transition={{ duration: 0.2 }}>
            <Card className="flex gap-4 p-4">
              <span className="w-5 pt-0.5 text-right text-sm font-semibold tabular-nums text-slate-300">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{a.role_title || "Untitled role"}</p>
                  <span className="text-sm text-slate-500">{a.organization}</span>
                  {a.impact_category && <Badge tone="indigo">{IMPACT_CATEGORIES[a.impact_category]}</Badge>}
                </div>
                <p className="mt-1 text-sm text-slate-700">{a.description}</p>
                <p className="mt-1.5 text-xs text-slate-500">
                  {a.activity_type} · Grades {a.grades_participated.join(", ") || "—"} · {Number(a.hours_per_week)} hr/wk · {a.weeks_per_year} wk/yr
                </p>
              </div>
              <div className="flex shrink-0 items-start gap-0.5">
                <IconButton label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="size-4" /></IconButton>
                <IconButton label="Move down" disabled={i === order.length - 1} onClick={() => move(i, 1)}><ArrowDown className="size-4" /></IconButton>
                <IconButton label="Edit" onClick={() => setEditing(a.id)}><Pencil className="size-4" /></IconButton>
                <IconButton label="Delete" onClick={() => confirm("Delete this activity?") && start(async () => deleteActivity(a.id))}>
                  <Trash2 className="size-4" />
                </IconButton>
              </div>
            </Card>
          </motion.div>
        ),
      )}
    </div>
  );
}

function IconButton({ label, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button aria-label={label} title={label} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy disabled:opacity-30" {...props}>
      {children}
    </button>
  );
}

function ActivityForm({ activity, onDone }: { activity?: Activity; onDone: () => void }) {
  const [description, setDescription] = useState(activity?.description ?? "");
  const [role, setRole] = useState(activity?.role_title ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <Card className="p-5">
      <form
        className="grid gap-4 sm:grid-cols-2"
        action={(form) =>
          start(async () => {
            const res = await saveActivity(form);
            if (res?.error) return setError(res.error);
            onDone();
          })
        }
      >
        {activity && <input type="hidden" name="id" value={activity.id} />}
        <div>
          <Label htmlFor="activity_type">Activity type</Label>
          <Select id="activity_type" name="activity_type" defaultValue={activity?.activity_type ?? "Other"}>
            {ACTIVITY_TYPES.map((t) => <option key={t}>{t}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="impact_category">Impact category</Label>
          <Select id="impact_category" name="impact_category" defaultValue={activity?.impact_category ?? ""}>
            <option value="">—</option>
            {(Object.entries(IMPACT_CATEGORIES) as [ImpactCategory, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="role_title">Position / leadership <Counter value={role.length} max={50} /></Label>
          <Input id="role_title" name="role_title" maxLength={50} value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Captain, Founder, Volunteer" />
        </div>
        <div>
          <Label htmlFor="organization">Organization</Label>
          <Input id="organization" name="organization" maxLength={100} defaultValue={activity?.organization} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="description">Description <Counter value={description.length} max={150} /></Label>
          <Textarea
            id="description"
            name="description"
            rows={2}
            maxLength={150}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Action verb + what you did + result. e.g. Built a tutoring rota for 40 students; average math grade up 12%."
          />
        </div>
        <fieldset>
          <legend className="mb-1.5 text-xs font-medium text-slate-600">Grades</legend>
          <div className="flex gap-1.5">
            {GRADES.map((g) => (
              <label key={g} className="cursor-pointer">
                <input type="checkbox" name="grades" value={g} defaultChecked={activity?.grades_participated.includes(g)} className="peer sr-only" />
                <span className="block rounded border border-line px-2.5 py-1 text-sm peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-accent">{g}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="hours_per_week">Hours / week</Label>
            <Input id="hours_per_week" name="hours_per_week" type="number" min={0} max={168} step={0.5} defaultValue={activity?.hours_per_week ?? ""} />
          </div>
          <div>
            <Label htmlFor="weeks_per_year">Weeks / year</Label>
            <Input id="weeks_per_year" name="weeks_per_year" type="number" min={0} max={52} defaultValue={activity?.weeks_per_year ?? ""} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 sm:col-span-2">
          {error && <span className="mr-auto text-sm text-rose-600">{error}</span>}
          <Button variant="ghost" onClick={onDone}>Cancel</Button>
          <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save activity"}</Button>
        </div>
      </form>
    </Card>
  );
}

function Counter({ value, max }: { value: number; max: number }) {
  return <span className={cn("float-right tabular-nums font-normal", value >= max ? "text-rose-600" : "text-slate-400")}>{value}/{max}</span>;
}
