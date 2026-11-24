import Link from "next/link";
import { ArrowRight, CalendarClock, FileText, IdCard, Users } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { getStudentSummaries } from "@/lib/counselor";
import { createClient } from "@/lib/supabase/server";
import { daysUntil, formatDate, formatDateTime } from "@/lib/utils";
import { Badge, Card, CardHeader, EmptyState } from "@/components/ui";

export const metadata = { title: "Counsellor dashboard" };

export default async function CounselorDashboard() {
  const profile = await requireStaff();
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

  const [{ data: students }, { data: essays }, { data: reviews }] = await Promise.all([studentQuery, essayQuery, reviewQuery]);
  const summaries = await getStudentSummaries(supabase, students ?? []);

  type EssayRow = { id: string; title: string; submitted_at: string; needs_in_person_meeting: boolean; meeting_at: string | null; review_status: string; student: { full_name: string | null } | null };
  type ReviewRow = { id: string; created_at: string; student: { full_name: string | null } | null };
  const essayRows = (essays ?? []) as unknown as EssayRow[];
  const reviewRows = (reviews ?? []) as unknown as ReviewRow[];

  const attention = [
    ...essayRows.filter((e) => e.review_status === "submitted").map((e) => ({ id: e.id, href: `/counselor/essays/${e.id}`, kind: "Essay", title: e.title, who: e.student?.full_name, since: e.submitted_at, meeting: e.needs_in_person_meeting })),
    ...reviewRows.map((r) => ({ id: r.id, href: `/counselor/profiles/${r.id}`, kind: "Profile", title: "Full profile review", who: r.student?.full_name, since: r.created_at, meeting: false })),
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
    { label: "Meetings ahead", value: meetings.length, icon: CalendarClock },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Hi, {profile.full_name?.split(" ")[0] ?? "there"}</h1>
        <p className="mt-1 text-sm text-slate-500">Here's what your students need from you.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
                      <Badge tone={a.kind === "Essay" ? "indigo" : "sky"}>{a.kind}</Badge>
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
        <CardHeader title="Students" description="Live from each student's own pages. Essays show only after a student shares them." />
        {summaries.length ? (
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                {["Student", "SAT", "IELTS", "Activities", "Letters", "Essays shared", "Universities", "Next deadline", "Practice (7d)"].map((h) => (
                  <th key={h} className="px-4 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {summaries.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3">
                    <Link href={`/counselor/students/${s.id}`} className="font-medium text-accent hover:underline">{s.name}</Link>
                    <p className="text-xs text-slate-500">{[s.grade ? `Grade ${s.grade}` : null, s.school, s.major].filter(Boolean).join(" · ") || "Profile not filled in"}</p>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{s.bestSat ?? "—"}</td>
                  <td className="px-4 py-3 tabular-nums">{s.bestIelts ?? "—"}</td>
                  <td className="px-4 py-3 tabular-nums">{s.activities}/10</td>
                  <td className="px-4 py-3 tabular-nums">{s.lettersSubmitted}/{Math.max(2, s.letters)}</td>
                  <td className="px-4 py-3 tabular-nums">{s.essaysShared}</td>
                  <td className="px-4 py-3 tabular-nums">{s.listCount}</td>
                  <td className="px-4 py-3 text-xs">{s.next ? `${s.next.university} · ${formatDate(s.next.date, { year: undefined })}` : "—"}</td>
                  <td className={`px-4 py-3 tabular-nums ${s.practicedThisWeek ? "" : "text-slate-400"}`}>{s.practicedThisWeek} q</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-5">
            <EmptyState title="No students yet">Students appear here when they choose you as their counsellor during sign-up or in My application.</EmptyState>
          </div>
        )}
      </Card>
    </div>
  );
}
