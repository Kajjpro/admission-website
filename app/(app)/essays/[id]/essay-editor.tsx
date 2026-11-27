"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock, Presentation, Trash2 } from "lucide-react";
import { addFeedback, deleteEssay, markEssayStatus, saveEssay, submitForReview } from "@/app/actions/essays";
import { FeedbackList } from "@/components/essays/feedback-list";
import { SourceBadge } from "@/components/source-badge";
import { Badge, Button, Label, Select, Textarea } from "@/components/ui";
import { ESSAY_TYPES, FOCUS_AREAS, REVIEW_STATUS } from "@/lib/constants";
import { ESSAY_HELP } from "@/lib/essay-prompts";
import { cn, countWords, formatDateTime } from "@/lib/utils";
import type { Essay, EssaySubmission, Feedback, Guide, ReviewStatus } from "@/lib/types";

type Tab = "guide" | "feedback" | "review";
type SaveState = { kind: "saved"; at: string } | { kind: "dirty" } | { kind: "saving" } | { kind: "error"; message: string };

export function EssayEditor({
  essay,
  feedback,
  counselors,
  defaultCounselorId,
  guides,
  latestSubmission,
}: {
  essay: Essay;
  feedback: Feedback[];
  counselors: { id: string; full_name: string | null; email?: string | null }[];
  defaultCounselorId: string | null;
  guides: Guide[];
  latestSubmission: EssaySubmission | null;
}) {
  const [title, setTitle] = useState(essay.title);
  const [content, setContent] = useState(essay.content);
  const [save, setSave] = useState<SaveState>({ kind: "saved", at: essay.updated_at });
  const [tab, setTab] = useState<Tab>(feedback.some((f) => !f.is_resolved) ? "feedback" : "guide");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSave({ kind: "dirty" });
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setSave({ kind: "saving" });
      const result = await saveEssay(essay.id, { title: title.trim() || "Untitled essay", content });
      setSave("error" in result && result.error ? { kind: "error", message: result.error } : { kind: "saved", at: new Date().toISOString() });
    }, 900);
    return () => clearTimeout(timer.current);
  }, [title, content, essay.id]);

  useEffect(() => {
    if (save.kind !== "dirty" && save.kind !== "saving") return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [save.kind]);

  const words = countWords(content);
  const limit = essay.word_limit;
  const over = limit ? words > limit : false;
  const openComments = feedback.filter((f) => !f.is_resolved).length;
  const status = REVIEW_STATUS[essay.review_status];

  return (
    <div className="-mx-4 -my-6 md:-mx-8 md:-my-8">
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-white px-4 py-3 md:px-8">
        <Badge tone={status.tone}>{status.label}</Badge>
        {essay.needs_in_person_meeting && <Badge tone="sky">Bring to meeting</Badge>}
        <span className="text-xs text-slate-400">{ESSAY_TYPES[essay.essay_type].label}</span>
        <div className="ml-auto flex items-center gap-2">
          <SaveIndicator state={save} />
          <Link
            href={`/essays/${essay.id}/meeting`}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line px-2.5 text-xs font-medium hover:bg-slate-50"
          >
            <Presentation className="size-3.5" />
            Meeting view
          </Link>
          <form action={deleteEssay.bind(null, essay.id)} onSubmit={(e) => !confirm("Delete this essay?") && e.preventDefault()}>
            <Button type="submit" variant="danger" size="sm" aria-label="Delete essay">
              <Trash2 className="size-3.5" />
            </Button>
          </form>
        </div>
      </div>

      <div className="grid lg:h-[calc(100vh-7.5rem)] lg:grid-cols-[minmax(0,1fr)_400px]">
        <section className="flex min-h-[60vh] flex-col overflow-y-auto bg-white">
          <div className="mx-auto w-full max-w-[680px] flex-1 px-6 py-10">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent font-serif text-3xl font-medium tracking-tight outline-none placeholder:text-slate-300"
              placeholder="Untitled essay"
              aria-label="Essay title"
            />
            {essay.prompt && <p className="mt-3 text-sm leading-relaxed text-slate-500">{essay.prompt}</p>}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing. Leave a blank line between paragraphs."
              className="mt-8 min-h-[50vh] w-full resize-none bg-transparent font-serif text-[19px] leading-[1.75] outline-none placeholder:text-slate-300 field-sizing-content"
              aria-label="Essay body"
            />
          </div>
          <div className="sticky bottom-0 flex items-center gap-4 border-t border-line bg-white/90 px-6 py-2.5 text-xs text-slate-500 backdrop-blur">
            <span className={cn("tabular-nums", over && "font-medium text-rose-600")}>
              {words}
              {limit ? ` / ${limit}` : ""} words
            </span>
            <span className="tabular-nums">{content.length.toLocaleString()} characters</span>
            {limit && (
              <div className="h-1 max-w-40 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn("h-full rounded-full transition-all", over ? "bg-rose-500" : "bg-accent")}
                  style={{ width: `${Math.min(100, (words / limit) * 100)}%` }}
                />
              </div>
            )}
          </div>
        </section>

        <aside className="flex flex-col border-l border-line bg-canvas lg:overflow-hidden">
          <div className="flex border-b border-line bg-white px-2">
            {(
              [
                ["guide", "Prompt & frameworks"],
                ["feedback", `Feedback${openComments ? ` (${openComments})` : ""}`],
                ["review", "Review"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  "relative px-3 py-3 text-xs font-medium",
                  tab === id ? "text-navy" : "text-slate-500 hover:text-navy",
                )}
              >
                {label}
                {tab === id && <motion.span layoutId="tab" className="absolute inset-x-2 -bottom-px h-0.5 bg-accent" />}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                {tab === "guide" && <GuidePanel essay={essay} guides={guides} />}
                {tab === "feedback" && <FeedbackPanel essay={essay} feedback={feedback} />}
                {tab === "review" && (
                  <ReviewPanel
                    essay={essay}
                    counselors={counselors}
                    defaultCounselorId={defaultCounselorId}
                    latestSubmission={latestSubmission}
                    dirty={save.kind !== "saved"}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  const text =
    state.kind === "saved"
      ? `Saved ${formatDateTime(state.at)}`
      : state.kind === "saving"
        ? "Saving…"
        : state.kind === "dirty"
          ? "Unsaved changes"
          : `Couldn't save: ${state.message}`;
  return <span className={cn("hidden text-xs sm:inline", state.kind === "error" ? "text-rose-600" : "text-slate-400")}>{text}</span>;
}

function GuidePanel({ essay, guides }: { essay: Essay; guides: Guide[] }) {
  const help = ESSAY_HELP[essay.essay_type];
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">What readers look for</h3>
        <ul className="mt-2 space-y-2 text-sm leading-relaxed">
          {help.breakdown.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-slate-400" />
              {line}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Brainstorm</h3>
        <ol className="mt-2 space-y-2">
          {help.brainstorm.map((q, i) => (
            <li key={q} className="rounded-md border border-line bg-white px-3 py-2 text-sm">
              <span className="mr-1.5 text-xs text-slate-400">{i + 1}.</span>
              {q}
            </li>
          ))}
        </ol>
      </section>
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Frameworks</h3>
        <div className="mt-2 space-y-2">
          {guides.map((g) => (
            <Link key={g.slug} href={`/guides/${g.slug}`} target="_blank" className="block rounded-md border border-line bg-white p-3 hover:border-slate-300">
              <p className="text-sm font-medium">{g.title}</p>
              {g.summary && <p className="mt-0.5 text-xs text-slate-500">{g.summary}</p>}
              {g.source_attribution.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {g.source_attribution.map((s) => (
                    <SourceBadge key={s.platform + s.title} source={{ ...s, url: undefined }} />
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function FeedbackPanel({ essay, feedback }: { essay: Essay; feedback: Feedback[] }) {
  const [reply, setReply] = useState("");
  const [pending, start] = useTransition();
  return (
    <div className="space-y-4">
      {!feedback.length && essay.review_status === "draft" && (
        <p className="text-sm text-slate-500">Send this essay to your counselor from the Review tab to get comments.</p>
      )}
      <FeedbackList items={feedback} essayId={essay.id} />
      {essay.submitted_at && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await addFeedback({ essayId: essay.id, comment: reply });
              if (!res?.error) setReply("");
            });
          }}
          className="space-y-2"
        >
          <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} placeholder="Reply or ask your counselor a question" />
          <Button type="submit" size="sm" disabled={pending || !reply.trim()}>Post reply</Button>
        </form>
      )}
    </div>
  );
}

const STEPS: ReviewStatus[] = ["draft", "submitted", "reviewed", "meeting_scheduled", "completed"];

function ReviewPanel({
  essay,
  counselors,
  defaultCounselorId,
  latestSubmission,
  dirty,
}: {
  essay: Essay;
  counselors: { id: string; full_name: string | null; email?: string | null }[];
  defaultCounselorId: string | null;
  latestSubmission: EssaySubmission | null;
  dirty: boolean;
}) {
  const [counselorId, setCounselorId] = useState(essay.counselor_id ?? defaultCounselorId ?? "");
  const [focus, setFocus] = useState<string[]>(essay.essay_type === "study_plan" ? ["Study plan alignment"] : ["Structure"]);
  const [note, setNote] = useState("");
  const [meeting, setMeeting] = useState(essay.needs_in_person_meeting);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const currentStep = STEPS.indexOf(essay.review_status);

  return (
    <div className="space-y-6">
      <ol className="space-y-2.5">
        {STEPS.map((step, i) => (
          <li key={step} className="flex items-center gap-2.5 text-sm">
            <span
              className={cn(
                "size-2 rounded-full",
                i < currentStep ? "bg-emerald-500" : i === currentStep ? "bg-accent ring-4 ring-accent/15" : "bg-slate-200",
              )}
            />
            <span className={cn(i === currentStep ? "font-medium" : "text-slate-500")}>{REVIEW_STATUS[step].label}</span>
          </li>
        ))}
      </ol>

      {(essay.meeting_at || essay.meeting_notes) && (
        <div className="rounded-md border border-sky-200 bg-sky-50 p-3 text-sm">
          {essay.meeting_at && (
            <p className="flex items-center gap-1.5 font-medium text-sky-800">
              <CalendarClock className="size-4" />
              {formatDateTime(essay.meeting_at)}
            </p>
          )}
          {essay.meeting_notes && <p className="mt-1.5 whitespace-pre-wrap text-sky-900">{essay.meeting_notes}</p>}
        </div>
      )}

      {(essay.review_status === "reviewed" || essay.review_status === "meeting_scheduled") && (
        <Button variant="secondary" size="sm" disabled={pending} onClick={() => start(async () => void (await markEssayStatus(essay.id, "completed")))}>
          Mark as revised
        </Button>
      )}

      <form
        className="space-y-4 border-t border-line pt-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!counselorId) return setMessage({ ok: false, text: "Choose a counselor." });
          start(async () => {
            const res = await submitForReview(essay.id, { counselorId, focusAreas: focus, note, requestMeeting: meeting });
            setMessage(res?.error ? { ok: false, text: res.error } : { ok: true, text: "Sent. Your counselor will see this version." });
            if (!res?.error) setNote("");
          });
        }}
      >
        <h3 className="text-sm font-semibold">{latestSubmission ? "Send an updated draft" : "Send to counselor"}</h3>
        {latestSubmission && (
          <p className="text-xs text-slate-500">
            Last sent {formatDateTime(latestSubmission.created_at)} ({latestSubmission.word_count} words).
          </p>
        )}
        <div>
          <Label htmlFor="counselor">Counselor</Label>
          <Select id="counselor" value={counselorId} onChange={(e) => setCounselorId(e.target.value)}>
            <option value="">Choose a counselor</option>
            {counselors.map((c) => (
              <option key={c.id} value={c.id}>{c.full_name ?? c.email ?? "Counsellor"}</option>
            ))}
          </Select>
        </div>
        <fieldset>
          <legend className="mb-1.5 text-xs font-medium text-slate-600">What should they focus on?</legend>
          <div className="flex flex-wrap gap-1.5">
            {FOCUS_AREAS.map((area) => {
              const on = focus.includes(area);
              return (
                <button
                  type="button"
                  key={area}
                  onClick={() => setFocus(on ? focus.filter((f) => f !== area) : [...focus, area])}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs",
                    on ? "border-accent bg-accent-soft text-accent" : "border-line bg-white text-slate-600",
                  )}
                >
                  {area}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div>
          <Label htmlFor="note">Note</Label>
          <Textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. I'm not sure the ending connects back to the opening." />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={meeting} onChange={(e) => setMeeting(e.target.checked)} className="size-4 accent-accent" />
          I'd like to go over this in person
        </label>
        {dirty && <p className="text-xs text-amber-700">Waiting for your latest changes to save…</p>}
        {message && <p className={cn("text-sm", message.ok ? "text-emerald-700" : "text-rose-600")}>{message.text}</p>}
        <Button type="submit" disabled={pending || dirty}>{pending ? "Sending…" : "Send draft"}</Button>
      </form>
    </div>
  );
}
