import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ESSAY_TYPES, REVIEW_STATUS } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import { Badge, Card, CardHeader, EmptyState, PageHeader } from "@/components/ui";
import type { EssayType, ReviewStatus } from "@/lib/types";

export const metadata = { title: "Essay queue" };

const FILTERS: { id: string; label: string; statuses: ReviewStatus[] }[] = [
  { id: "open", label: "Needs feedback", statuses: ["submitted"] },
  { id: "meeting", label: "In-person", statuses: ["meeting_scheduled"] },
  { id: "reviewed", label: "Feedback given", statuses: ["reviewed"] },
  { id: "all", label: "All", statuses: ["submitted", "reviewed", "meeting_scheduled", "completed"] },
];

type QueueRow = {
  id: string;
  title: string;
  essay_type: EssayType;
  review_status: ReviewStatus;
  word_count: number;
  submitted_at: string;
  needs_in_person_meeting: boolean;
  student: { full_name: string | null; grade_level: number | null } | null;
};

export default async function CounselorPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const profile = await requireStaff();
  const { filter = "open" } = await searchParams;
  const active = FILTERS.find((f) => f.id === filter) ?? FILTERS[0];
  const supabase = await createClient();

  let query = supabase
    .from("user_essays")
    .select("id, title, essay_type, review_status, word_count, submitted_at, needs_in_person_meeting, student:profiles!user_essays_user_id_fkey(full_name, grade_level)")
    .not("submitted_at", "is", null)
    .in("review_status", active.statuses)
    .order("submitted_at", { ascending: true });
  if (profile.role !== "admin") query = query.eq("counselor_id", profile.id);

  let profileQuery = supabase
    .from("profile_reviews")
    .select("id, status, created_at, student_note, student:profiles!profile_reviews_student_id_fkey(full_name, grade_level)")
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(30);
  if (profile.role !== "admin") profileQuery = profileQuery.eq("counselor_id", profile.id);

  const [{ data: essays }, { data: students }, { data: profileReviews }] = await Promise.all([
    query,
    supabase
      .from("profiles")
      .select("id, full_name, grade_level, target_regions")
      .eq("assigned_counselor_id", profile.id)
      .order("full_name"),
    profileQuery,
  ]);
  type ProfileReviewRow = { id: string; status: string; created_at: string; student_note: string | null; student: { full_name: string | null; grade_level: number | null } | null };
  const profileRows = (profileReviews ?? []) as unknown as ProfileReviewRow[];
  const rows = (essays ?? []) as unknown as QueueRow[];

  return (
    <>
      <PageHeader title="Essay queue" description="Essays students have sent you, oldest first." />

      <div className="mb-4 flex gap-1">
        {FILTERS.map((f) => (
          <Link
            key={f.id}
            href={`/counselor/essays?filter=${f.id}`}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm",
              f.id === active.id ? "bg-navy text-white" : "text-slate-600 hover:bg-white",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {rows.length ? (
          <Card className="h-fit divide-y divide-line">
            {rows.map((e) => (
              <Link key={e.id} href={`/counselor/essays/${e.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {e.student?.full_name ?? "Student"}
                    {e.student?.grade_level ? ` · Grade ${e.student.grade_level}` : ""} · {ESSAY_TYPES[e.essay_type].label} · {e.word_count} words
                  </p>
                </div>
                {e.needs_in_person_meeting && <Badge tone="sky">Meeting requested</Badge>}
                <Badge tone={REVIEW_STATUS[e.review_status].tone}>{REVIEW_STATUS[e.review_status].label}</Badge>
                <span className="w-20 text-right text-xs text-slate-400">{formatDate(e.submitted_at, { year: undefined })}</span>
              </Link>
            ))}
          </Card>
        ) : (
          <EmptyState title="Nothing here">No essays match this filter.</EmptyState>
        )}

        <div className="space-y-6">
        <Card className="h-fit">
          <CardHeader title="Profile reviews" description={`${profileRows.filter((r) => r.status === "submitted").length} waiting`} />
          <ul className="divide-y divide-line">
            {profileRows.map((r) => (
              <li key={r.id}>
                <Link href={`/counselor/profiles/${r.id}`} className="flex items-center gap-2 px-5 py-2.5 hover:bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{r.student?.full_name ?? "Student"}</p>
                    <p className="text-xs text-slate-500">{formatDate(r.created_at, { year: undefined })}{r.student?.grade_level ? ` · Grade ${r.student.grade_level}` : ""}</p>
                  </div>
                  <Badge tone={r.status === "submitted" ? "indigo" : "emerald"}>{r.status === "submitted" ? "New" : "Done"}</Badge>
                </Link>
              </li>
            ))}
            {!profileRows.length && <li className="px-5 py-4 text-sm text-slate-500">Students send their full profile from My application.</li>}
          </ul>
        </Card>
        <Card className="h-fit">
          <CardHeader title="My students" description={`${students?.length ?? 0} assigned`} />
          <ul className="divide-y divide-line">
            {(students ?? []).map((s) => (
              <li key={s.id} className="px-5 py-2.5">
                <p className="text-sm">{s.full_name}</p>
                <p className="text-xs text-slate-500">
                  Grade {s.grade_level ?? "—"}
                  {s.target_regions?.length ? ` · ${s.target_regions.join(", ")}` : ""}
                </p>
              </li>
            ))}
            {!students?.length && <li className="px-5 py-4 text-sm text-slate-500">Students choose you during onboarding.</li>}
          </ul>
        </Card>
        </div>
      </div>
    </>
  );
}
