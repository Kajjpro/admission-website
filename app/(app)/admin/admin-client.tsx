"use client";

import { useRef, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { addTask, updateUser } from "@/app/actions/admin";
import { Button, Card, CardHeader, Input, Label, Select, Textarea } from "@/components/ui";
import { GRADES, TASK_CATEGORIES } from "@/lib/constants";
import type { Profile, Role } from "@/lib/types";

export function DeleteButton({ action, label }: { action: () => Promise<unknown>; label: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => confirm(`Delete “${label}”?`) && start(async () => void (await action()))}
      className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
      aria-label={`Delete ${label}`}
    >
      <Trash2 className="size-4" />
    </button>
  );
}

export function TaskForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLFormElement>(null);
  return (
    <Card className="h-fit">
      <CardHeader title="Add task" />
      <form
        ref={ref}
        className="space-y-3 p-5"
        action={(form) =>
          start(async () => {
            const res = await addTask(form);
            setError(res?.error ?? null);
            if (!res?.error) ref.current?.reset();
          })
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="grade_level">Grade</Label>
            <Select id="grade_level" name="grade_level">{GRADES.map((g) => <option key={g}>{g}</option>)}</Select>
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select id="priority" name="priority" defaultValue="medium">
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select id="category" name="category">
            {Object.entries(TASK_CATEGORIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={3} />
        </div>
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <Button type="submit" disabled={pending}>Add task</Button>
      </form>
    </Card>
  );
}

export function UserRow({ user, staff }: { user: Profile; staff: { id: string; name: string }[] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const save = (patch: { role?: Role; assigned_counselor_id?: string | null }) =>
    start(async () => setError((await updateUser(user.id, patch))?.error ?? null));

  return (
    <div className={`flex flex-wrap items-center gap-3 px-5 py-2.5 ${pending ? "opacity-60" : ""}`}>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{user.full_name ?? "Unnamed"}</p>
        <p className="truncate text-xs text-slate-500">
          {user.email}
          {user.grade_level ? ` · Grade ${user.grade_level}` : ""}
        </p>
      </div>
      {error && <span className="text-xs text-rose-600">{error}</span>}
      {user.role === "student" && (
        <Select
          value={user.assigned_counselor_id ?? ""}
          onChange={(e) => save({ assigned_counselor_id: e.target.value || null })}
          className="h-8 w-44 text-xs"
          aria-label="Assigned counselor"
        >
          <option value="">No counselor</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      )}
      <Select value={user.role} onChange={(e) => save({ role: e.target.value as Role })} className="h-8 w-32 text-xs" aria-label="Role">
        <option value="student">Student</option>
        <option value="counselor">Counselor</option>
        <option value="admin">Admin</option>
      </Select>
    </div>
  );
}
