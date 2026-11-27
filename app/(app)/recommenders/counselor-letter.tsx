"use client";

import { useState, useTransition } from "react";
import { Check, Lock, Send } from "lucide-react";
import { cancelLetterRequest, requestCounselorLetter, updateLetterRequest } from "@/app/actions/letters";
import { Badge, Button, Card, Input, Label, Select, Textarea } from "@/components/ui";
import { LETTER_STATUS } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import type { CounselorLetter, LetterStatus } from "@/lib/types";

const STEPS: LetterStatus[] = ["requested", "writing", "done"];

export function CounselorLetterCard({
  letter,
  counselorName,
  counselors,
  defaultCounselorId,
  bragAnswered,
  bragTotal,
}: {
  letter: CounselorLetter | null;
  counselorName: string | null;
  counselors: { id: string; full_name: string | null; email?: string | null }[];
  defaultCounselorId: string | null;
  bragAnswered: number;
  bragTotal: number;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState(letter?.student_message ?? "");
  const [due, setDue] = useState(letter?.due_date ?? "");
  const thinSheet = bragAnswered < 5;

  if (!letter) {
    return (
      <Card className="p-5">
        <div className="flex flex-wrap items-start gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">Recommendation from your counsellor</h2>
            <p className="mt-1 max-w-xl text-sm text-slate-600">
              Your counsellor writes your recommendation using your brag sheet, activities, honours and university list. The more you fill in below, the more specific your letter.
            </p>
            <p className={cn("mt-2 text-xs", thinSheet ? "font-medium text-amber-700" : "text-slate-500")}>
              Brag sheet: {bragAnswered} of {bragTotal} answered{thinSheet ? ". Answer at least 5 before you ask." : ""}
            </p>
          </div>
        </div>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px]"
          action={(form) =>
            start(async () => {
              const res = await requestCounselorLetter(form);
              setError(res?.error ?? null);
            })
          }
        >
          <div>
            <Label htmlFor="counselor_id">Counsellor</Label>
            <Select id="counselor_id" name="counselor_id" defaultValue={defaultCounselorId ?? ""} required>
              <option value="" disabled>Choose…</option>
              {counselors.map((c) => <option key={c.id} value={c.id}>{c.full_name ?? c.email ?? "Counsellor"}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="due_date">Needed by</Label>
            <Input id="due_date" name="due_date" type="date" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="student_message">Message (optional)</Label>
            <Textarea id="student_message" name="student_message" rows={2} maxLength={2000} placeholder="Anything your counsellor should know, e.g. which universities need it first, or a story you'd like included." />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <Button type="submit" disabled={pending || !counselors.length}>
              <Send className="size-4" />
              Ask for a recommendation
            </Button>
            {error && <span className="text-xs text-rose-600">{error}</span>}
          </div>
        </form>
      </Card>
    );
  }

  const step = STEPS.indexOf(letter.status);
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">Recommendation from {counselorName ?? "your counsellor"}</h2>
          <p className="mt-1 text-sm text-slate-600">
            Asked {formatDate(letter.requested_at, { year: undefined })}
            {letter.due_date ? ` · needed by ${formatDate(letter.due_date)}` : ""}
          </p>
        </div>
        <Badge tone={LETTER_STATUS[letter.status].tone}>{LETTER_STATUS[letter.status].student}</Badge>
      </div>

      <ol className="mt-4 grid grid-cols-3 gap-2">
        {STEPS.map((s, i) => (
          <li key={s} className="text-xs">
            <div className={cn("h-1.5 rounded-full", i <= step ? "bg-accent" : "bg-slate-100")} />
            <p className={cn("mt-1.5 flex items-center gap-1", i <= step ? "font-medium text-navy" : "text-slate-400")}>
              {i < step && <Check className="size-3" />}
              {["Asked", "Being written", "Done"][i]}
            </p>
          </li>
        ))}
      </ol>

      <p className="mt-4 flex items-start gap-2 text-xs text-slate-500">
        <Lock className="mt-0.5 size-3.5 shrink-0" />
        Recommendation letters are confidential, so you won't see the text. Universities trust letters more when students haven't read them. Keep your brag sheet up to date while it's being written.
      </p>

      {letter.status !== "done" && (
        editing ? (
          <div className="mt-4 space-y-2">
            <Textarea rows={2} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message to your counsellor" maxLength={2000} />
            <div className="flex flex-wrap items-center gap-2">
              <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="w-44" aria-label="Needed by" />
              <Button
                size="sm"
                disabled={pending}
                onClick={() => start(async () => {
                  const res = await updateLetterRequest(letter.id, { message, dueDate: due });
                  setError(res?.error ?? null);
                  if (!res?.error) setEditing(false);
                })}
              >
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
            <button onClick={() => setEditing(true)} className="font-medium text-accent">Edit message or date</button>
            {letter.status === "requested" && (
              <button
                onClick={() => confirm("Withdraw your request?") && start(() => cancelLetterRequest(letter.id))}
                className="text-slate-500 hover:text-rose-600"
              >
                Withdraw request
              </button>
            )}
          </div>
        )
      )}
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </Card>
  );
}
