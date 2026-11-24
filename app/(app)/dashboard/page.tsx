import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarClock, MapPin } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { getGradeView } from "@/lib/grade";
import { createClient } from "@/lib/supabase/server";
import { activityReadiness, essayReadiness, recReadiness, testingReadiness } from "@/lib/readiness";
import { nextDeadline } from "@/lib/universities";
import { daysUntil, formatDate, formatDateTime } from "@/lib/utils";
import { Badge, Card, CardHeader, ProgressRing } from "@/components/ui";
import type { Essay, RoadmapTask, TaskStatus, University } from "@/lib/types";
import { getPracticeStats } from "@/lib/practice";
import { TodayCard } from "@/components/practice/today-card";
import { RoadmapChecklist } from "./roadmap-checklist";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const profile = await requireProfile();
  if (profile.role !== "student") redirect("/counselor");

  const grade = await getGradeView(profile);
  const supabase = await createClient();

  const [practice, tasks, progress, essays, scores, activities, recs, list] = await Promise.all([
    getPracticeStats(supabase, profile.id),
    supabase.from("roadmap_tasks").select("*").eq("grade_level", grade).order("sort_order"),
    supabase.from("user_task_progress").select("task_id, status").eq("user_id", profile.id),
    supabase.from("user_essays").select("id, title, review_status, word_count, meeting_at, needs_in_person_meeting").eq("user_id", profile.id),
    supabase.from("test_scores").select("test_type, total_score, is_official").eq("user_id", profile.id),
    supabase.from("activities").select("id", { count: "exact", head: true }).eq("user_id", profile.id),
    supabase.from("recommenders").select("status").eq("user_id", profile.id),
    supabase.from("user_universities").select("round, universities(id, name, country, deadlines)").eq("user_id", profile.id),
  ]);

  const statusByTask = Object.fromEntries((progress.data ?? []).map((p) => [p.task_id, p.status as TaskStatus]));
  const essayRows = (essays.data ?? []) as Pick<Essay, "id" | "title" | "review_status" | "word_count" | "meeting_at" | "needs_in_person_meeting">[];

  const readiness = [
    { label: "Essays", value: essayReadiness(essayRows), detail: `${essayRows.length} in progress` },
    { label: "Testing", value: testingReadiness(scores.data ?? [], profile), detail: `${scores.data?.length ?? 0} scores logged` },
    { label: "Activities", value: activityReadiness(activities.count ?? 0), detail: `${activities.count ?? 0} of 10 listed` },
    { label: "Recommendations", value: recReadiness(recs.data ?? []), detail: `${recs.data?.filter((r) => r.status === "submitted").length ?? 0} of 2 submitted` },
  ];

  type ListRow = { round: string | null; universities: Pick<University, "id" | "name" | "country" | "deadlines"> };
  const deadlines = ((list.data ?? []) as unknown as ListRow[])
    .map((row) => ({ uni: row.universities, deadline: nextDeadline(row.universities, row.round) ?? nextDeadline(row.universities) }))
    .filter((d): d is { uni: ListRow["universities"]; deadline: NonNullable<typeof d.deadline> } => Boolean(d.deadline))
    .sort((a, b) => a.deadline.date!.localeCompare(b.deadline.date!))
    .slice(0, 5);

  const meetings = essayRows
    .filter((e) => e.meeting_at && daysUntil(e.meeting_at) >= 0)
    .sort((a, b) => a.meeting_at!.localeCompare(b.meeting_at!));

  const firstName = profile.full_name?.split(" ")[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{firstName ? `Hi, ${firstName}` : "Dashboard"}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Showing the grade {grade} roadmap{grade !== profile.grade_level && profile.grade_level ? ` (you're in grade ${profile.grade_level})` : ""}.
        </p>
      </div>

      <TodayCard stats={practice} goal={profile.daily_goal} />

      <Card className="grid grid-cols-2 gap-6 p-5 lg:grid-cols-4">
        {readiness.map((r) => (
          <ProgressRing key={r.label} {...r} />
        ))}
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader
            title={`Grade ${grade} roadmap`}
            description={`${(tasks.data ?? []).filter((t) => statusByTask[t.id] === "completed").length} of ${tasks.data?.length ?? 0} done`}
          />
          <RoadmapChecklist tasks={(tasks.data ?? []) as RoadmapTask[]} statusByTask={statusByTask} />
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Upcoming deadlines" action={<Link href="/universities" className="text-xs font-medium text-accent">All universities</Link>} />
            {deadlines.length ? (
              <ul className="divide-y divide-line">
                {deadlines.map(({ uni, deadline }) => (
                  <DeadlineRow key={uni.id} title={uni.name} subtitle={`${deadline.round} · ${formatDate(deadline.date)}`} days={daysUntil(deadline.date!)} />
                ))}
              </ul>
            ) : (
              <p className="px-5 py-6 text-sm text-slate-500">
                Add universities to your list to see their deadlines here.
              </p>
            )}
          </Card>

          <Card>
            <CardHeader title="Counselor meetings" />
            {meetings.length ? (
              <ul className="divide-y divide-line">
                {meetings.map((e) => (
                  <li key={e.id}>
                    <Link href={`/essays/${e.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                      <CalendarClock className="size-4 shrink-0 text-sky-600" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{e.title}</p>
                        <p className="text-xs text-slate-500">{formatDateTime(e.meeting_at)}</p>
                      </div>
                      <Badge tone="sky" className="ml-auto">In person</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-6 text-sm text-slate-500">No meetings scheduled.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function DeadlineRow({ title, subtitle, days }: { title: string; subtitle: string; days: number }) {
  const tone = days <= 14 ? "rose" : days <= 45 ? "amber" : "neutral";
  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <MapPin className="size-4 shrink-0 text-slate-400" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="truncate text-xs text-slate-500">{subtitle}</p>
      </div>
      <Badge tone={tone} className="tabular-nums">{days === 0 ? "Today" : `${days}d`}</Badge>
    </li>
  );
}

