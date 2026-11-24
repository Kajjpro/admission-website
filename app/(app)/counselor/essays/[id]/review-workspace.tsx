"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { MessageSquare, Presentation } from "lucide-react";
import { addFeedback, updateReview } from "@/app/actions/essays";
import { FeedbackList } from "@/components/essays/feedback-list";
import { Badge, Button, Card, CardHeader, Input, Label, Select, Textarea } from "@/components/ui";
import { ESSAY_TYPES, REVIEW_STATUS } from "@/lib/constants";
import { cn, formatDateTime, splitParagraphs } from "@/lib/utils";
import type { Essay, EssaySubmission, Feedback, ReviewStatus } from "@/lib/types";

type Props = {
  essay: Essay & { student: { full_name: string | null; grade_level: number | null } | null };
  submissions: EssaySubmission[];
  feedback: Feedback[];
};

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function ReviewWorkspace({ essay, submissions, feedback }: Props) {
  const [versionId, setVersionId] = useState(submissions[0]?.id ?? "");
  const version = submissions.find((s) => s.id === versionId) ?? submissions[0];
  const paragraphs = splitParagraphs(version?.content ?? essay.content);
  const [target, setTarget] = useState<{ index: number | null; quote: string } | null>(null);

  function pickParagraph(index: number) {
    const selection = window.getSelection()?.toString().trim() ?? "";
    const fallback = paragraphs[index]!.slice(0, 140) + (paragraphs[index]!.length > 140 ? "…" : "");
    setTarget({ index, quote: selection && paragraphs[index]!.includes(selection) ? selection : fallback });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-serif text-2xl font-medium">{essay.title}</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {essay.student?.full_name}
              {essay.student?.grade_level ? ` · Grade ${essay.student.grade_level}` : ""} · {ESSAY_TYPES[essay.essay_type].label}
            </p>
          </div>
          {submissions.length > 1 && (
            <Select value={versionId} onChange={(e) => setVersionId(e.target.value)} className="w-auto">
              {submissions.map((s, i) => (
                <option key={s.id} value={s.id}>
                  {i === 0 ? "Latest" : `Version ${submissions.length - i}`} · {formatDateTime(s.created_at)}
                </option>
              ))}
            </Select>
          )}
          <Link
            href={`/essays/${essay.id}/meeting`}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line bg-white px-3 text-sm font-medium hover:bg-slate-50"
          >
            <Presentation className="size-4" />
            Meeting view
          </Link>
        </div>

        {version && (version.student_note || version.focus_areas.length > 0) && (
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-500">Student asked for feedback on</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {version.focus_areas.map((f) => (
                <Badge key={f} tone="indigo">{f}</Badge>
              ))}
            </div>
            {version.student_note && <p className="mt-2 text-sm">{version.student_note}</p>}
          </Card>
        )}

        {essay.prompt && <p className="text-sm text-slate-500">Prompt: {essay.prompt}</p>}

        <Card className="px-4 py-6 sm:px-8">
          <p className="mb-4 text-xs text-slate-400">
            Select a phrase and click the comment icon to quote it, or click the icon to comment on the whole paragraph.
          </p>
          <div className="space-y-5">
            {paragraphs.map((p, i) => {
              const count = feedback.filter((f) => f.paragraph_index === i && !f.is_resolved).length;
              return (
                <div key={i} className={cn("group relative rounded-md pr-10", target?.index === i && "bg-amber-50 ring-1 ring-amber-200")}>
                  <span className="absolute -left-1 top-1 hidden -translate-x-full pr-2 text-[11px] tabular-nums text-slate-300 sm:block">{i + 1}</span>
                  <p className="font-serif text-[18px] leading-[1.75]">{p}</p>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickParagraph(i)}
                    className={cn(
                      "absolute right-0 top-1 flex items-center gap-1 rounded-md px-1.5 py-1 text-xs",
                      count ? "text-amber-700" : "text-slate-300 opacity-0 group-hover:opacity-100 hover:text-navy",
                    )}
                    aria-label={`Comment on paragraph ${i + 1}`}
                  >
                    <MessageSquare className="size-4" />
                    {count > 0 && count}
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <ReviewControls essay={essay} />
        <Composer
          key={target ? `${target.index}-${target.quote}` : "general"}
          essayId={essay.id}
          submissionId={version?.id ?? null}
          target={target}
          onDone={() => setTarget(null)}
        />
        <div>
          <h2 className="mb-2 text-sm font-semibold">Comments</h2>
          <FeedbackList items={feedback} essayId={essay.id} />
        </div>
      </div>
    </div>
  );
}

function Composer({
  essayId,
  submissionId,
  target,
  onDone,
}: {
  essayId: string;
  submissionId: string | null;
  target: { index: number | null; quote: string } | null;
  onDone: () => void;
}) {
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <Card>
      <CardHeader
        title={target ? `Comment on paragraph ${(target.index ?? 0) + 1}` : "Overall feedback"}
        action={target && <button onClick={onDone} className="text-xs text-slate-500 hover:text-navy">Switch to overall</button>}
      />
      <form
        className="space-y-3 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await addFeedback({
              essayId,
              submissionId,
              comment,
              paragraphIndex: target?.index ?? null,
              excerpt: target?.quote ?? null,
            });
            if (res?.error) return setError(res.error);
            setComment("");
            onDone();
          });
        }}
      >
        {target && (
          <blockquote className="border-l-2 border-amber-300 pl-2 font-serif text-sm italic text-slate-600">{target.quote}</blockquote>
        )}
        <Textarea
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={target ? "What should change here?" : "Big-picture notes on structure, voice, and next steps"}
          autoFocus={Boolean(target)}
        />
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <Button type="submit" size="sm" disabled={pending || !comment.trim()}>Post comment</Button>
      </form>
    </Card>
  );
}

function ReviewControls({ essay }: { essay: Essay }) {
  const [status, setStatus] = useState<ReviewStatus>(essay.review_status);
  const [meeting, setMeeting] = useState(essay.needs_in_person_meeting);
  const [meetingAt, setMeetingAt] = useState(toLocalInput(essay.meeting_at));
  const [notes, setNotes] = useState(essay.meeting_notes ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <Card>
      <CardHeader title="Review status" />
      <form
        className="space-y-4 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await updateReview(essay.id, {
              review_status: status,
              needs_in_person_meeting: meeting,
              meeting_at: meetingAt ? new Date(meetingAt).toISOString() : null,
              meeting_notes: notes.trim() || null,
            });
            setMessage(res?.error ?? "Saved");
          });
        }}
      >
        <div>
          <Label htmlFor="status">Status</Label>
          <Select id="status" value={status} onChange={(e) => setStatus(e.target.value as ReviewStatus)}>
            {(Object.keys(REVIEW_STATUS) as ReviewStatus[]).map((s) => (
              <option key={s} value={s}>{REVIEW_STATUS[s].label}</option>
            ))}
          </Select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={meeting}
            onChange={(e) => {
              setMeeting(e.target.checked);
              if (e.target.checked && status !== "completed") setStatus("meeting_scheduled");
            }}
            className="size-4 accent-accent"
          />
          Bring to in-person meeting
        </label>
        {meeting && (
          <>
            <div>
              <Label htmlFor="meeting_at">Meeting time</Label>
              <Input id="meeting_at" type="datetime-local" value={meetingAt} onChange={(e) => setMeetingAt(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="meeting_notes">Discussion notes</Label>
              <Textarea id="meeting_notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Points to walk through together" />
            </div>
          </>
        )}
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" disabled={pending}>Save</Button>
          {message && <span className="text-xs text-slate-500">{message}</span>}
        </div>
      </form>
    </Card>
  );
}
