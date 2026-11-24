import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, X } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { getFeedback } from "@/lib/essays";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, splitParagraphs } from "@/lib/utils";
import type { Essay } from "@/lib/types";

export const metadata = { title: "Meeting view" };

export default async function MeetingView({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ version?: string }>;
}) {
  const { id } = await params;
  const { version } = await searchParams;
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase.from("user_essays").select("*").eq("id", id).single();
  if (!data) notFound();

  const essay = data as Essay;
  const [allFeedback, { data: submission }] = await Promise.all([
    getFeedback(id),
    supabase.from("essay_submissions").select("id, content, created_at").eq("essay_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  // Paragraph comments are anchored to the version the counselor reviewed, so show that by default.
  const showSubmitted = Boolean(submission) && version !== "current";
  const feedback = allFeedback.filter((f) => !f.is_resolved && (!showSubmitted || !f.submission_id || f.submission_id === submission!.id));
  const paragraphs = splitParagraphs(showSubmitted ? submission!.content : essay.content);
  const general = feedback.filter((f) => f.paragraph_index === null);
  const back = essay.user_id === profile.id ? `/essays/${id}` : `/counselor/essays/${id}`;

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-line bg-white/90 px-6 py-3 backdrop-blur">
        <p className="text-sm font-medium">{essay.title}</p>
        {essay.meeting_at && (
          <span className="flex items-center gap-1 text-xs text-sky-700">
            <CalendarClock className="size-3.5" />
            {formatDateTime(essay.meeting_at)}
          </span>
        )}
        <div className="ml-auto flex items-center gap-4">
          {submission && (
            <Link href={showSubmitted ? "?version=current" : "?"} className="text-xs font-medium text-accent hover:underline">
              {showSubmitted ? `Reviewed version (${formatDateTime(submission.created_at)}) · show current draft` : "Current draft · show reviewed version"}
            </Link>
          )}
          <Link href={back} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-navy">
            <X className="size-4" />
            Exit
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-12">
        {(essay.meeting_notes || general.length > 0) && (
          <div className="mx-auto mb-12 max-w-3xl rounded-lg border border-sky-200 bg-sky-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-800">Discussion points</p>
            {essay.meeting_notes && <p className="mt-2 whitespace-pre-wrap text-[15px] text-sky-950">{essay.meeting_notes}</p>}
            {general.map((f) => (
              <p key={f.id} className="mt-2 text-[15px] text-sky-950">— {f.comment}</p>
            ))}
          </div>
        )}

        <h1 className="mx-auto max-w-3xl font-serif text-4xl font-medium tracking-tight">{essay.title}</h1>
        {essay.prompt && <p className="mx-auto mt-3 max-w-3xl text-sm text-slate-500">{essay.prompt}</p>}

        <div className="mt-10 space-y-8">
          {paragraphs.map((p, i) => {
            const notes = feedback.filter((f) => f.paragraph_index === i);
            return (
              <div key={i} className="grid gap-4 lg:grid-cols-[3rem_minmax(0,48rem)_1fr]">
                <span className="pt-1.5 text-right font-sans text-xs tabular-nums text-slate-300">¶{i + 1}</span>
                <p className={`font-serif text-[22px] leading-[1.7] ${notes.length ? "rounded bg-amber-50/70 -mx-2 px-2" : ""}`}>{p}</p>
                <div className="space-y-2">
                  {notes.map((f) => (
                    <div key={f.id} className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
                      {f.excerpt_quote && <p className="mb-1 font-serif italic text-amber-900">“{f.excerpt_quote}”</p>}
                      <p>{f.comment}</p>
                      <p className="mt-1 text-xs text-slate-500">{f.author?.full_name}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
