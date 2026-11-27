import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, FileText, Mail, MessageSquarePlus } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { buildSnapshot, type ReviewSectionKey } from "@/lib/application";
import { getPracticeStats } from "@/lib/practice";
import { createClient } from "@/lib/supabase/server";
import { nextDeadline, percent, satFit } from "@/lib/universities";
import { daysUntil, formatDate, formatDateTime } from "@/lib/utils";
import { APPLICATION_STATUS, LETTER_STATUS, RECOMMENDER_STATUS, REVIEW_STATUS } from "@/lib/constants";
import { startProfileReview } from "@/app/actions/counselor";
import { Badge, Button, Card, CardHeader, buttonClass } from "@/components/ui";
import { SnapshotView } from "@/components/profile/snapshot-view";
import type { ApplicationStatus, CounselorTask, LetterStatus, RecommenderStatus, ReviewStatus, University } from "@/lib/types";
import { NotesPanel, TaskPanel } from "./student-client";

export const metadata = { title: "Student" };

export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireStaff();
  const supabase = await createClient();

  // RLS returns the student only to their assigned counsellor (or an admin).
  const { data: student } = await supabase.from("profiles").select("id, full_name, email, role").eq("id", id).eq("role", "student").maybeSingle();
  if (!student) notFound();

  const [snapshot, stats, { data: essays }, { data: reviews }, { data: list }, { data: tasks }, { data: notes }, { data: recs }, { data: myLetter }] = await Promise.all([
    buildSnapshot(supabase, id),
    getPracticeStats(supabase, id),
    supabase.from("user_essays").select("id, title, review_status, submitted_at, meeting_at").eq("user_id", id).not("submitted_at", "is", null).order("submitted_at", { ascending: false }),
    supabase.from("profile_reviews").select("id, status, created_at, started_by_counselor, section_feedback").eq("student_id", id).order("created_at", { ascending: false }),
    supabase.from("user_universities").select("id, round, status, universities(*)").eq("user_id", id),
    supabase.from("counselor_tasks").select("*").eq("student_id", id).order("created_at", { ascending: false }),
    supabase.from("counselor_notes").select("id, kind, body, created_at").eq("student_id", id).order("created_at", { ascending: false }),
    supabase.from("recommenders").select("id, teacher_name, subject, email, status, due_date, requested_at, viewed_at").eq("user_id", id).order("created_at"),
    supabase.from("counselor_letters").select("id, status, due_date").eq("student_id", id).maybeSingle(),
  ]);

  const bestSat = snapshot.tests.find((t) => t.type === "SAT")?.best ?? null;
  type ListRow = { id: string; round: string | null; status: ApplicationStatus; universities: University | null };
  const universities = ((list ?? []) as unknown as ListRow[])
    .filter((r) => r.universities)
    .map((r) => ({ ...r, uni: r.universities!, next: nextDeadline(r.universities!, r.round) ?? nextDeadline(r.universities!), fit: satFit(bestSat, r.universities!) }))
    .sort((a, b) => (a.next?.date ?? "9999").localeCompare(b.next?.date ?? "9999"));
  const accuracy = stats.total ? Math.round((stats.correct / stats.total) * 100) : null;
  const openTasks = ((tasks ?? []) as CounselorTask[]).filter((t) => !t.done_at);
  const lastFeedback = (reviews ?? []).find((r) => r.status === "reviewed");
  const draft = (reviews ?? []).find((r) => r.status === "draft");
  const name = student.full_name ?? "Student";

  return (
    <div className="space-y-6">
      <Link href="/counselor" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-navy">
        <ChevronLeft className="size-4" />
        Counsellor dashboard
      </Link>

      <Card className="flex flex-wrap items-center gap-4 p-5">
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-2xl font-medium">{name}</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {[snapshot.student.grade ? `Grade ${snapshot.student.grade}` : null, snapshot.student.school, snapshot.student.intendedMajor && `Intends ${snapshot.student.intendedMajor}`].filter(Boolean).join(" · ") || "Profile not filled in yet"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {student.email && (
            <a href={`mailto:${student.email}`} className={buttonClass("ghost", "sm")}>
              <Mail className="size-3.5" />
              Email
            </a>
          )}
          <Link href={`/counselor/students/${id}/brag-sheet`} className={buttonClass("secondary", "sm")}>
            <FileText className="size-3.5" />
            Brag sheet
          </Link>
          <form action={async () => { "use server"; await startProfileReview(id); }}>
            <Button type="submit" size="sm">
              <MessageSquarePlus className="size-3.5" />
              {draft ? "Continue feedback draft" : "Give feedback on whole profile"}
            </Button>
          </form>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          ["Practice streak", `${stats.streak} days`],
          ["Questions answered", stats.total.toLocaleString("en-US")],
          ["Accuracy", accuracy === null ? "—" : `${accuracy}%`],
          ["Open tasks", String(openTasks.length)],
          ["Letters in", `${(recs ?? []).filter((r) => r.status === "submitted").length} / ${Math.max(2, recs?.length ?? 0)}`],
        ].map(([label, value]) => (
          <Card key={label} className="p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-xs text-slate-500">
              The student's profile right now{lastFeedback ? ", with the comments you last sent under each section" : ""}.
            </p>
            <SnapshotView snapshot={snapshot} feedback={(lastFeedback?.section_feedback ?? {}) as Partial<Record<ReviewSectionKey, string>>} />
          </div>

          <Card>
            <CardHeader title={`Deadlines and fit (${universities.length})`} description="Fit compares the student's best SAT with each university's middle 50%." />
            {universities.length ? (
              <ul className="divide-y divide-line">
                {universities.map((u) => (
                  <li key={u.id} className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <p className="min-w-0 flex-1 truncate text-sm font-medium">{u.uni.name}</p>
                      {u.fit && <Badge tone={u.fit.tone}>{u.fit.label}</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {APPLICATION_STATUS[u.status].label}
                      {u.uni.acceptance_rate !== null && ` · ${percent(u.uni.acceptance_rate, 1)} accepted`}
                      {u.next && ` · ${u.next.round} ${formatDate(u.next.date, { year: undefined })}`}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-5 text-sm text-slate-500">No universities added yet.</p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <TaskPanel studentId={id} tasks={(tasks ?? []) as CounselorTask[]} />

          <Card>
            <CardHeader title="Profile feedback" description="Whole-profile reviews, from the student or started by you." />
            {reviews?.length ? (
              <ul className="divide-y divide-line">
                {reviews.map((r) => (
                  <li key={r.id}>
                    <Link href={`/counselor/profiles/${r.id}`} className="flex items-center gap-2 px-5 py-3 hover:bg-slate-50">
                      <span className="flex-1 text-sm">
                        {formatDateTime(r.created_at)}
                        <span className="block text-xs text-slate-500">{r.started_by_counselor ? "Started by you" : "Sent by the student"}</span>
                      </span>
                      <Badge tone={r.status === "draft" ? "amber" : r.status === "submitted" ? "indigo" : "emerald"}>
                        {r.status === "draft" ? "Draft" : r.status === "submitted" ? "Waiting" : "Sent"}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-5 text-sm text-slate-500">None yet. Use "Give feedback on whole profile" to start one.</p>
            )}
          </Card>

          <Card>
            <CardHeader title="Counsellor recommendation" />
            {myLetter ? (
              <Link href={`/counselor/letters/${myLetter.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                <span className="flex-1 text-sm">{myLetter.status === "done" ? "Letter finished" : "Open the letter workspace"}{myLetter.due_date && <span className="block text-xs text-slate-500">Needed by {formatDate(myLetter.due_date)}</span>}</span>
                <Badge tone={LETTER_STATUS[myLetter.status as LetterStatus].tone}>{LETTER_STATUS[myLetter.status as LetterStatus].label}</Badge>
              </Link>
            ) : (
              <p className="px-5 py-4 text-sm text-slate-500">The student hasn't asked for a counsellor letter yet.</p>
            )}
          </Card>

          <Card>
            <CardHeader title="Teacher letters" />
            {recs?.length ? (
              <ul className="divide-y divide-line">
                {recs.map((r) => {
                  const days = r.due_date ? daysUntil(r.due_date) : null;
                  return (
                    <li key={r.id} className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-sm font-medium">{r.teacher_name}{r.subject && <span className="font-normal text-slate-500"> · {r.subject}</span>}</p>
                        <Badge tone={RECOMMENDER_STATUS[r.status as RecommenderStatus].tone}>{RECOMMENDER_STATUS[r.status as RecommenderStatus].label}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {[
                          r.email ?? "No email",
                          r.viewed_at ? "brag sheet opened" : r.requested_at ? "not opened yet" : null,
                          r.due_date && r.status !== "submitted" ? `due ${formatDate(r.due_date, { year: undefined })}` : null,
                        ].filter(Boolean).join(" · ")}
                        {days !== null && days <= 14 && r.status !== "submitted" && <span className="font-medium text-rose-600"> · {days}d left</span>}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-5 py-5 text-sm text-slate-500">No recommenders added yet.</p>
            )}
          </Card>

          <Card>
            <CardHeader title="Shared essays" />
            {essays?.length ? (
              <ul className="divide-y divide-line">
                {essays.map((e) => (
                  <li key={e.id}>
                    <Link href={`/counselor/essays/${e.id}`} className="block px-5 py-3 hover:bg-slate-50">
                      <p className="truncate text-sm font-medium">{e.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge tone={REVIEW_STATUS[e.review_status as ReviewStatus].tone}>{REVIEW_STATUS[e.review_status as ReviewStatus].label}</Badge>
                        <span className="text-xs text-slate-500">{e.meeting_at ? `Meeting ${formatDateTime(e.meeting_at)}` : `Sent ${formatDate(e.submitted_at, { year: undefined })}`}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-5 text-sm text-slate-500">No essays shared yet. Drafts stay private until the student sends them.</p>
            )}
          </Card>

          <NotesPanel studentId={id} notes={(notes ?? []) as { id: string; kind: "note" | "meeting" | "call"; body: string; created_at: string }[]} />
        </div>
      </div>
    </div>
  );
}
