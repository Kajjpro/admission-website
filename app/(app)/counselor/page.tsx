import Link from "next/link";
import { ArrowRight, CalendarClock, Download, FileText, IdCard, ListTodo, PenLine, Search, Users } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { FLAG_LABELS, getStudentSummaries, type FlagKey } from "@/lib/counselor";
import { createClient } from "@/lib/supabase/server";
import { daysUntil, formatDate, formatDateTime } from "@/lib/utils";
import { Badge, Card, CardHeader, EmptyState, Input, Select, buttonClass } from "@/components/ui";

export const metadata = { title: "Counsellor dashboard" };

export default async function CounselorDashboard({ searchParams }: { searchParams: Promise<{ q?: string; grade?: string; flag?: string }> }) {
  const profile = await requireStaff();
  const { q = "", grade = "", flag = "" } = await searchParams;
  const supabase = await createClient();
  const isAdmin = profile.role === "admin";

  let studentQuery = supabase
    .from("profiles")
    .select("id, full_name, grade_level, school_name, intended_major, spike_statement, target_regions")
    .eq("role", "student")
    .order("full_name");
  if (!isAdmin) studentQuery = studentQuery.eq("assigned_counselor_id", profile.id);

  let essayQuery = supabase
    .from("user_essays")
    .select("id, title, submitted_at, needs_in_person_meeting, meeting_at, review_status, student:profiles!user_essays_user_id_fkey(full_name)")
    .not("submitted_at", "is", null)
    .in("review_status", ["submitted", "meeting_scheduled"]);
  if (!isAdmin) essayQuery = essayQuery.eq("counselor_id", profile.id);

  let reviewQuery = supabase
    .from("profile_reviews")
    .select("id, created_at, student:profiles!profile_reviews_student_id_fkey(full_name)")
    .eq("status", "submitted");
  if (!isAdmin) reviewQuery = reviewQuery.eq("counselor_id", profile.id);

  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  // RLS limits both to the counsellor's own students (admins see everyone).
  const lettersQuery = supabase
    .from("recommenders")
    .select("id, user_id, teacher_name, due_date, status, viewed_at, student:profiles!recommenders_user_id_fkey(full_name)")
    .neq("status", "submitted")
    .lte("due_date", in30)
    .order("due_date");
  const overdueQuery = supabase
    .from("counselor_tasks")
    .select("id, student_id, title, due_date, student:profiles!counselor_tasks_student_id_fkey(full_name)")
    .is("done_at", null)
    .lt("due_date", today)
    .order("due_date");

  let recQuery = supabase
    .from("counselor_letters")
    .select("id, status, due_date, requested_at, student:profiles!counselor_letters_student_id_fkey(full_name)")
    .neq("status", "done");
  if (!isAdmin) recQuery = recQuery.eq("counselor_id", profile.id);

  const [{ data: students }, { data: essays }, { data: reviews }, { data: letters }, { data: overdue }, { data: toWrite }] = await Promise.all([studentQuery, essayQuery, reviewQuery, lettersQuery, overdueQuery, recQuery]);
  type ToWriteRow = { id: string; status: string; due_date: string | null; requested_at: string; student: { full_name: string | null } | null };
  const lettersToWrite = (toWrite ?? []) as unknown as ToWriteRow[];
  const summaries = await getStudentSummaries(supabase, students ?? []);
  const mine = new Set(summaries.map((s) => s.id));
  type LetterRow = { id: string; user_id: string; teacher_name: string; due_date: string; status: string; viewed_at: string | null; student: { full_name: string | null } | null };
  type OverdueRow = { id: string; student_id: string; title: string; due_date: string; student: { full_name: string | null } | null };
  const lettersDue = ((letters ?? []) as unknown as LetterRow[]).filter((l) => mine.has(l.user_id));
  const overdueTasks = ((overdue ?? []) as unknown as OverdueRow[]).filter((t) => mine.has(t.student_id));

  const needle = q.trim().toLowerCase();
  const filtered = summaries.filter(
    (s) =>
      (!needle || [s.name, s.school, s.major].some((v) => v?.toLowerCase().includes(needle))) &&
      (!grade || String(s.grade) === grade) &&
      (!flag || (flag === "any" ? s.flags.length > 0 : s.flags.includes(flag as FlagKey))),
  );

  type EssayRow = { id: string; title: string; submitted_at: string; needs_in_person_meeting: boolean; meeting_at: string | null; review_status: string; student: { full_name: string | null } | null };
  type ReviewRow = { id: string; created_at: string; student: { full_name: string | null } | null };
  const essayRows = (essays ?? []) as unknown as EssayRow[];
  const reviewRows = (reviews ?? []) as unknown as ReviewRow[];

  const attention = [
    ...essayRows.filter((e) => e.review_status === "submitted").map((e) => ({ id: e.id, href: `/counselor/essays/${e.id}`, kind: "Essay", title: e.title, who: e.student?.full_name, since: e.submitted_at, meeting: e.needs_in_person_meeting })),
    ...reviewRows.map((r) => ({ id: r.id, href: `/counselor/profiles/${r.id}`, kind: "Profile", title: "Full profile review", who: r.student?.full_name, since: r.created_at, meeting: false })),
    ...lettersToWrite.map((l) => ({ id: l.id, href: `/counselor/letters/${l.id}`, kind: "Letter", title: l.due_date ? `Recommendation · needed by ${formatDate(l.due_date, { year: undefined })}` : "Recommendation letter", who: l.student?.full_name, since: l.requested_at, meeting: false })),
  ].sort((a, b) => a.since.localeCompare(b.since));

  const meetings = essayRows
    .filter((e) => e.meeting_at && daysUntil(e.meeting_at) >= 0)
    .sort((a, b) => a.meeting_at!.localeCompare(b.meeting_at!));

  const deadlines = summaries
    .filter((s) => s.next && daysUntil(s.next.date) <= 30)
    .sort((a, b) => a.next!.date.localeCompare(b.next!.date));

  const stats = [
    { label: isAdmin ? "Students" : "My students", value: summaries.length, icon: Users },
    { label: "Essays waiting", value: essayRows.filter((e) => e.review_status === "submitted").length, icon: FileText },
    { label: "Profiles waiting", value: reviewRows.length, icon: IdCard },
    { label: "Letters to write", value: lettersToWrite.length, icon: PenLine },
    { label: "Meetings ahead", value: meetings.length, icon: CalendarClock },
    { label: "Overdue tasks", value: overdueTasks.length, icon: ListTodo },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Hi, {profile.full_name?.split(" ")[0] ?? "there"}</h1>
        <p className="mt-1 text-sm text-slate-500">Here's what your students need from you.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <p className="flex items-center gap-1.5 text-xs text-slate-500"><s.icon className="size-3.5" />{s.label}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader title="Needs your attention" description="Oldest first" action={<Link href="/counselor/essays" className="text-xs font-medium text-accent">All essays</Link>} />
          {attention.length ? (
            <ul className="divide-y divide-line">
              {attention.map((a) => {
                const waiting = -daysUntil(a.since);
                return (
                  <li key={a.kind + a.id}>
                    <Link href={a.href} className="group flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                      <Badge tone={a.kind === "Essay" ? "indigo" : a.kind === "Letter" ? "emerald" : "sky"}>{a.kind}</Badge>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{a.title}</p>
                        <p className="text-xs text-slate-500">{a.who ?? "Student"}{a.meeting ? " · wants to meet in person" : ""}</p>
                      </div>
                      <span className={`text-xs tabular-nums ${waiting >= 5 ? "font-medium text-rose-600" : "text-slate-500"}`}>{waiting === 0 ? "Today" : `${waiting}d waiting`}</span>
                      <ArrowRight className="size-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-slate-500">You're all caught up.</p>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Upcoming meetings" />
            {meetings.length ? (
              <ul className="divide-y divide-line">
                {meetings.map((m) => (
                  <li key={m.id}>
                    <Link href={`/essays/${m.id}/meeting`} className="block px-5 py-3 hover:bg-slate-50">
                      <p className="truncate text-sm font-medium">{m.student?.full_name} · {m.title}</p>
                      <p className="text-xs text-sky-700">{formatDateTime(m.meeting_at)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-5 text-sm text-slate-500">No meetings scheduled.</p>
            )}
          </Card>
          {overdueTasks.length > 0 && (
            <Card>
              <CardHeader title="Overdue tasks" />
              <ul className="divide-y divide-line">
                {overdueTasks.slice(0, 8).map((t) => (
                  <li key={t.id}>
                    <Link href={`/counselor/students/${t.student_id}`} className="block px-5 py-3 hover:bg-slate-50">
                      <p className="truncate text-sm font-medium">{t.title}</p>
                      <p className="text-xs text-slate-500">{t.student?.full_name} · <span className="text-rose-600">was due {formatDate(t.due_date, { year: undefined })}</span></p>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <Card>
            <CardHeader title="Letters due in 30 days" description="Not submitted yet" />
            {lettersDue.length ? (
              <ul className="divide-y divide-line">
                {lettersDue.map((l) => (
                  <li key={l.id}>
                    <Link href={`/counselor/students/${l.user_id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{l.student?.full_name} · {l.teacher_name}</p>
                        <p className="text-xs text-slate-500">{l.status === "not_asked" ? "Not asked yet" : l.viewed_at ? "Teacher opened the brag sheet" : "Teacher hasn't opened it"}</p>
                      </div>
                      <Badge tone={daysUntil(l.due_date) <= 7 ? "rose" : "amber"}>{daysUntil(l.due_date) < 0 ? "Late" : `${daysUntil(l.due_date)}d`}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-5 text-sm text-slate-500">No letters due soon.</p>
            )}
          </Card>
          <Card>
            <CardHeader title="Student deadlines in 30 days" />
            {deadlines.length ? (
              <ul className="divide-y divide-line">
                {deadlines.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{s.name}</p>
                      <p className="truncate text-xs text-slate-500">{s.next!.university} · {s.next!.round}</p>
                    </div>
                    <Badge tone={daysUntil(s.next!.date) <= 14 ? "rose" : "amber"}>{daysUntil(s.next!.date)}d</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-5 text-sm text-slate-500">No deadlines in the next 30 days.</p>
            )}
          </Card>
        </div>
      </div>

      <Card className="overflow-x-auto">
        <CardHeader
          title={`Students${filtered.length !== summaries.length ? ` (${filtered.length} of ${summaries.length})` : ` (${summaries.length})`}`}
          description="Live from each student's own pages. Click a name to open their profile, tasks and notes."
          action={
            <a href="/counselor/export" className={buttonClass("secondary", "sm")}>
              <Download className="size-3.5" />
              CSV
            </a>
          }
        />
        <form className="flex flex-wrap gap-2 border-b border-line px-5 py-3">
          <div className="relative min-w-48 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input name="q" defaultValue={q} placeholder="Search name, school, major" className="pl-8" />
          </div>
          <Select name="grade" defaultValue={grade} className="w-32" aria-label="Grade">
            <option value="">All grades</option>
            {[9, 10, 11, 12].map((g) => <option key={g} value={g}>Grade {g}</option>)}
          </Select>
          <Select name="flag" defaultValue={flag} className="w-52" aria-label="Needs attention">
            <option value="">Everyone</option>
            <option value="any">Needs attention</option>
            {Object.entries(FLAG_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <button className={buttonClass("primary")}>Filter</button>
          {(q || grade || flag) && <Link href="/counselor" className={buttonClass("ghost")}>Clear</Link>}
        </form>
        {filtered.length ? (
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                {["Student", "Flags", "SAT", "IELTS", "Activities", "Letters", "Essays shared", "Tasks", "Next deadline", "Practice (7d)"].map((h) => (
                  <th key={h} className="px-4 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3">
                    <Link href={`/counselor/students/${s.id}`} className="font-medium text-accent hover:underline">{s.name}</Link>
                    <p className="text-xs text-slate-500">{[s.grade ? `Grade ${s.grade}` : null, s.school, s.major].filter(Boolean).join(" · ") || "Profile not filled in"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex max-w-52 flex-wrap gap-1">
                      {s.flags.map((f) => (
                        <Badge key={f} tone={f === "deadline" || f === "overdue" ? "rose" : "amber"}>{FLAG_LABELS[f]}</Badge>
                      ))}
                      {!s.flags.length && <span className="text-xs text-slate-400">On track</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{s.bestSat ?? "—"}</td>
                  <td className="px-4 py-3 tabular-nums">{s.bestIelts ?? "—"}</td>
                  <td className="px-4 py-3 tabular-nums">{s.activities}/10</td>
                  <td className="px-4 py-3 tabular-nums">{s.lettersSubmitted}/{Math.max(2, s.letters)}</td>
                  <td className="px-4 py-3 tabular-nums">{s.essaysShared}</td>
                  <td className={`px-4 py-3 tabular-nums ${s.overdueTasks ? "font-medium text-rose-600" : ""}`}>{s.openTasks ? `${s.openTasks} open` : "—"}</td>
                  <td className="px-4 py-3 text-xs">{s.next ? `${s.next.university} · ${formatDate(s.next.date, { year: undefined })}` : "—"}</td>
                  <td className={`px-4 py-3 tabular-nums ${s.practicedThisWeek ? "" : "text-slate-400"}`}>{s.practicedThisWeek} q</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : summaries.length ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">No students match these filters.</p>
        ) : (
          <div className="p-5">
            <EmptyState title="No students yet">Students appear here when they choose you as their counsellor during sign-up or in My application.</EmptyState>
          </div>
        )}
      </Card>
    </div>
  );
}
