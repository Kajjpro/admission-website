"use client";

import { useRef, useState, useTransition } from "react";
import { Check, Eye, Link2, Mail, RotateCcw, Trash2 } from "lucide-react";
import { addRecommender, deleteRecommender, resetShareLink, updateRecommender } from "@/app/actions/recommenders";
import { Badge, Button, Card, CardHeader, Input, Label, Select, Textarea } from "@/components/ui";
import { RECOMMENDER_STATUS } from "@/lib/constants";
import { bragEmail, bragShareUrl } from "@/lib/brag-sheet";
import { cn, daysUntil, formatDate, formatDateTime } from "@/lib/utils";
import type { Recommender, RecommenderStatus, Teacher } from "@/lib/types";

export function RecommenderTracker({ recommenders, teachers, studentName }: { recommenders: Recommender[]; teachers: Teacher[]; studentName: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [teacherId, setTeacherId] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const manual = !teacherId;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Teacher letters (optional)" description="If a university also asks for a teacher letter, add the teacher here. They get a private link to your brag sheet." />
        <ul className="divide-y divide-line">
          {recommenders.map((r) => (
            <RecommenderRow key={r.id} rec={r} studentName={studentName} />
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
              if (!res?.error) {
                formRef.current?.reset();
                setTeacherId("");
              }
            })
          }
        >
          {teachers.length > 0 && (
            <div className="sm:col-span-2">
              <Label htmlFor="teacher_id">Teacher</Label>
              <Select id="teacher_id" name="teacher_id" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                <option value="">Someone not on the list…</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.full_name}{t.subject ? ` · ${t.subject}` : ""}</option>
                ))}
              </Select>
            </div>
          )}
          {manual && (
            <>
              <div>
                <Label htmlFor="teacher_name">Name</Label>
                <Input id="teacher_name" name="teacher_name" required />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="teacher@school.mn" />
              </div>
            </>
          )}
          <div>
            <Label htmlFor="subject">Subject / role</Label>
            <Input id="subject" name="subject" placeholder={manual ? "e.g. AP Chemistry" : "Leave blank to use their subject"} />
          </div>
          <div>
            <Label htmlFor="due_date">Letter due</Label>
            <Input id="due_date" name="due_date" type="date" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="relationship_context">How they know you</Label>
            <Input id="relationship_context" name="relationship_context" placeholder="e.g. Grade 11 teacher, robotics club advisor" />
          </div>
          <div className="flex items-end justify-end gap-3 sm:col-span-2">
            {error && <span className="text-xs text-rose-600">{error}</span>}
            <Button type="submit" disabled={pending}>Add</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function RecommenderRow({ rec, studentName }: { rec: Recommender; studentName: string }) {
  const [pending, start] = useTransition();
  const [notes, setNotes] = useState(rec.brag_sheet_notes ?? "");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const days = rec.due_date ? daysUntil(rec.due_date) : null;
  const update = (patch: Parameters<typeof updateRecommender>[1]) => start(async () => void (await updateRecommender(rec.id, patch)));

  const link = () => bragShareUrl(window.location.origin, rec.share_token);

  async function copyLink() {
    await navigator.clipboard.writeText(link());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function emailTeacher() {
    const { subject, body } = bragEmail({
      teacher: rec.teacher_name,
      student: studentName || "Your student",
      subject: rec.subject,
      due: rec.due_date ? formatDate(rec.due_date) : null,
      link: link(),
    });
    window.location.href = `mailto:${rec.email ?? ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    if (rec.status === "not_asked") update({ status: "requested", requested_at: new Date().toISOString() });
  }

  return (
    <li className={cn("px-5 py-4", pending && "opacity-70")}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{rec.teacher_name}</p>
          <p className="truncate text-xs text-slate-500">{[rec.email, rec.subject, rec.relationship_context].filter(Boolean).join(" · ") || "No email yet"}</p>
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

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={emailTeacher}>
          <Mail className="size-3.5" />
          {rec.requested_at ? "Email again" : "Email request"}
        </Button>
        <Button size="sm" variant="secondary" onClick={copyLink}>
          {copied ? <Check className="size-3.5" /> : <Link2 className="size-3.5" />}
          {copied ? "Copied" : "Copy link"}
        </Button>
        <a href={`/brag/${rec.share_token}`} target="_blank" rel="noreferrer" className="text-xs font-medium text-accent">
          See their view
        </a>
        {rec.viewed_at ? (
          <Badge tone="emerald" className="ml-auto"><Eye className="size-3" />Opened {formatDateTime(rec.viewed_at)}</Badge>
        ) : rec.requested_at ? (
          <span className="ml-auto text-xs text-slate-500">Asked {formatDate(rec.requested_at, { year: undefined })} · not opened yet</span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
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
          {open ? "Hide notes" : rec.brag_sheet_notes ? "Notes for this teacher" : "Add notes for this teacher"}
        </button>
        <button
          onClick={() => confirm("Make a new link? The old one will stop working.") && start(async () => void (await resetShareLink(rec.id)))}
          className="flex items-center gap-1 text-slate-400 hover:text-navy"
          title="Use if the link went to the wrong person"
        >
          <RotateCcw className="size-3" />
          New link
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
            placeholder="Specific moments from this class you'd like them to remember. Only this teacher sees these, at the top of your brag sheet."
          />
          <Button size="sm" variant="secondary" onClick={() => update({ brag_sheet_notes: notes.trim() || null })}>
            Save notes
          </Button>
        </div>
      )}
    </li>
  );
}
