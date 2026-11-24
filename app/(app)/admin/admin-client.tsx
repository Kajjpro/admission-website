"use client";

import { useRef, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { addResult, addTask, inviteStaff, updateUser } from "@/app/actions/admin";
import { generateQuestions, importQuestions } from "@/app/actions/practice";
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

export function InviteForm() {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={ref}
      className="flex flex-wrap items-end gap-2 p-4"
      action={(form) =>
        start(async () => {
          const res = await inviteStaff(form);
          setMessage(res?.error ?? "Saved. They become staff when they sign up (or right away if they already have an account).");
          if (!res?.error) ref.current?.reset();
        })
      }
    >
      <div className="min-w-40 flex-1">
        <Label htmlFor="invite_name">Name</Label>
        <Input id="invite_name" name="full_name" placeholder="Munkhbold" />
      </div>
      <div className="min-w-52 flex-1">
        <Label htmlFor="invite_email">Email</Label>
        <Input id="invite_email" name="email" type="email" required />
      </div>
      <Select name="role" className="w-32" aria-label="Role">
        <option value="counselor">Counselor</option>
        <option value="admin">Admin</option>
      </Select>
      <Button type="submit" disabled={pending}>Add</Button>
      {message && <p className="w-full text-xs text-slate-500">{message}</p>}
    </form>
  );
}

export function QuestionGenerator({ skills }: { skills: { section: string; domain: string; skill: string }[] }) {
  const [skill, setSkill] = useState(`${skills[0]!.domain}::${skills[0]!.skill}`);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [count, setCount] = useState(3);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <Card>
      <CardHeader title="Generate questions with AI" description="Each question is solved again independently. Only questions where both answers match are added." />
      <div className="space-y-3 p-5">
        <Select value={skill} onChange={(e) => setSkill(e.target.value)} aria-label="Skill">
          {skills.map((s) => (
            <option key={s.skill} value={`${s.domain}::${s.skill}`}>{s.section === "rw" ? "R&W" : "Math"} · {s.skill}</option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-2">
          <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)} aria-label="Difficulty">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Select>
          <Select value={count} onChange={(e) => setCount(Number(e.target.value))} aria-label="How many">
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} question{n > 1 ? "s" : ""}</option>)}
          </Select>
        </div>
        <Button
          className="w-full"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setMessage(null);
              const [domain, name] = skill.split("::");
              const res = await generateQuestions({ domain: domain!, skill: name!, difficulty, count });
              setMessage("error" in res ? res.error! : `Added ${res.added}${res.rejected ? `, discarded ${res.rejected} that failed verification` : ""}.`);
            })
          }
        >
          {pending ? "Writing and checking… (about a minute)" : "Generate"}
        </Button>
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </div>
    </Card>
  );
}

export function QuestionImporter() {
  const [json, setJson] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <Card>
      <CardHeader title="Import questions" description="Paste a JSON array. Only import questions your school has the right to use." />
      <div className="space-y-3 p-5">
        <Textarea
          rows={6}
          value={json}
          onChange={(e) => setJson(e.target.value)}
          className="font-mono text-xs"
          placeholder={'[{"section":"math","domain":"Algebra","skill":"Linear functions","difficulty":"easy","stem":"...","answer_type":"mcq","choices":[{"key":"A","text":"...","rationale":"..."}],"correct_answer":"A","explanation":"..."}]'}
        />
        <Button
          variant="secondary"
          disabled={pending || !json.trim()}
          onClick={() =>
            start(async () => {
              const res = await importQuestions(json);
              setMessage("error" in res ? res.error! : `Imported ${res.added} questions.`);
              if (!("error" in res)) setJson("");
            })
          }
        >
          Import
        </Button>
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </div>
    </Card>
  );
}

export function ResultForm({ universities }: { universities: string[] }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const ref = useRef<HTMLFormElement>(null);
  return (
    <Card className="h-fit">
      <CardHeader title="Add an admission result" description="Shown on the Universities page to motivate students. Get the student's permission first." />
      <form
        ref={ref}
        className="space-y-3 p-5"
        action={(form) =>
          start(async () => {
            const res = await addResult(form);
            setMessage(res?.error ?? "Added.");
            if (!res?.error) ref.current?.reset();
          })
        }
      >
        <div>
          <Label htmlFor="student_name">Student (as it should appear)</Label>
          <Input id="student_name" name="student_name" placeholder="e.g. Munkh-Erdene A." required />
        </div>
        <div>
          <Label htmlFor="university_name">University</Label>
          <Input id="university_name" name="university_name" list="university-names" required />
          <datalist id="university-names">{universities.map((u) => <option key={u} value={u} />)}</datalist>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="class_year">Class of</Label>
            <Input id="class_year" name="class_year" type="number" min={2000} max={2100} placeholder="2030" />
          </div>
          <div>
            <Label htmlFor="scholarship">Scholarship</Label>
            <Input id="scholarship" name="scholarship" placeholder="Full ride" />
          </div>
        </div>
        <div>
          <Label htmlFor="note">Note</Label>
          <Input id="note" name="note" placeholder="Early Decision, CS major" />
        </div>
        <Button type="submit" disabled={pending}>Add</Button>
        {message && <p className="text-xs text-slate-500">{message}</p>}
      </form>
    </Card>
  );
}
