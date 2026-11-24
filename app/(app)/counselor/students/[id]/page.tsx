import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { buildSnapshot } from "@/lib/application";
import { getPracticeStats } from "@/lib/practice";
import { createClient } from "@/lib/supabase/server";
import { nextDeadline, percent, satFit } from "@/lib/universities";
import { formatDate, formatDateTime } from "@/lib/utils";
import { APPLICATION_STATUS, REVIEW_STATUS } from "@/lib/constants";
import { Badge, Card, CardHeader } from "@/components/ui";
import { SnapshotView } from "@/components/profile/snapshot-view";
import type { ApplicationStatus, ReviewStatus, University } from "@/lib/types";

export const metadata = { title: "Student" };

export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireStaff();
  const supabase = await createClient();

  // RLS returns the student only to their assigned counsellor (or an admin).
  const { data: student } = await supabase.from("profiles").select("id, full_name, role").eq("id", id).eq("role", "student").maybeSingle();
  if (!student) notFound();

  const [snapshot, stats, { data: essays }, { data: reviews }, { data: list }] = await Promise.all([
    buildSnapshot(supabase, id),
    getPracticeStats(supabase, id),
    supabase.from("user_essays").select("id, title, review_status, submitted_at, meeting_at").eq("user_id", id).not("submitted_at", "is", null).order("submitted_at", { ascending: false }),
    supabase.from("profile_reviews").select("id, status, created_at").eq("student_id", id).order("created_at", { ascending: false }),
    supabase.from("user_universities").select("id, round, status, universities(*)").eq("user_id", id),
  ]);

  const bestSat = snapshot.tests.find((t) => t.type === "SAT")?.best ?? null;
  type ListRow = { id: string; round: string | null; status: ApplicationStatus; universities: University | null };
  const universities = ((list ?? []) as unknown as ListRow[])
    .filter((r) => r.universities)
    .map((r) => ({ ...r, uni: r.universities!, next: nextDeadline(r.universities!, r.round) ?? nextDeadline(r.universities!), fit: satFit(bestSat, r.universities!) }))
    .sort((a, b) => (a.next?.date ?? "9999").localeCompare(b.next?.date ?? "9999"));
  const accuracy = stats.total ? Math.round((stats.correct / stats.total) * 100) : null;

  return (
    <div className="space-y-6">
      <Link href="/counselor" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-navy">
        <ChevronLeft className="size-4" />
        Counsellor dashboard
      </Link>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ["Practice streak", `${stats.streak} days`],
          ["Questions answered", stats.total.toLocaleString("en-US")],
          ["Accuracy", accuracy === null ? "—" : `${accuracy}%`],
          ["Reviews due", String(stats.dueReviews)],
        ].map(([label, value]) => (
          <Card key={label} className="p-5">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <SnapshotView snapshot={snapshot} />

        <div className="space-y-6">
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

          <Card>
            <CardHeader title="Profile reviews" />
            {reviews?.length ? (
              <ul className="divide-y divide-line">
                {reviews.map((r) => (
                  <li key={r.id}>
                    <Link href={`/counselor/profiles/${r.id}`} className="flex items-center gap-2 px-5 py-3 hover:bg-slate-50">
                      <span className="flex-1 text-sm">{formatDateTime(r.created_at)}</span>
                      <Badge tone={r.status === "submitted" ? "indigo" : "emerald"}>{r.status === "submitted" ? "New" : "Done"}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-5 text-sm text-slate-500">Not sent yet.</p>
            )}
          </Card>

          <Card>
            <CardHeader title={`University list (${universities.length})`} />
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
      </div>
    </div>
  );
}
