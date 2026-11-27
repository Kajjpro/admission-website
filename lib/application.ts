import type { SupabaseClient } from "@supabase/supabase-js";

export const REVIEW_SECTIONS = [
  { key: "academics", label: "Academics" },
  { key: "spike", label: "Spike" },
  { key: "testing", label: "Testing" },
  { key: "activities", label: "Activities" },
  { key: "honors", label: "Honours" },
  { key: "essays", label: "Essays" },
  { key: "letters", label: "Letters" },
  { key: "universities", label: "University list" },
] as const;
export type ReviewSectionKey = (typeof REVIEW_SECTIONS)[number]["key"];

export const HONOR_LEVELS: Record<string, string> = {
  school: "School",
  district: "District",
  city_aimag: "City / aimag",
  national: "National",
  international: "International",
};

export interface ProfileSnapshot {
  student: { name: string | null; grade: number | null; school: string | null; intendedMajor: string | null; regions: string[] };
  academics: { gpa: string | null; classRank: string | null; rigor: string | null };
  spike: string | null;
  tests: { type: string; best: number; official: boolean; attempts: number }[];
  activities: { role: string; organization: string; description: string; type: string; impact: string | null; hours: number; weeks: number; grades: number[] }[];
  honors: { title: string; level: string; grade: number | null; description: string | null }[];
  essays: { title: string; type: string; status: string; words: number; limit: number | null }[];
  letters: { name: string; subject: string | null; status: string }[];
  /** Absent in snapshots sent before the list was included. */
  universities?: { name: string; country: string; round: string | null; status: string }[];
}

/** Collects everything a counsellor needs to review the whole application in one read. */
export async function buildSnapshot(supabase: SupabaseClient, userId: string): Promise<ProfileSnapshot> {
  const [{ data: p }, scores, activities, honors, essays, recs, list, letter] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("test_scores").select("test_type, total_score, is_official").eq("user_id", userId),
    supabase.from("activities").select("*").eq("user_id", userId).order("position_order"),
    supabase.from("honors").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("user_essays").select("title, essay_type, review_status, word_count, word_limit").eq("user_id", userId).order("updated_at", { ascending: false }),
    supabase.from("recommenders").select("teacher_name, subject, status").eq("user_id", userId),
    supabase.from("user_universities").select("round, status, universities(name, country)").eq("user_id", userId),
    supabase.from("counselor_letters").select("status, counselor:profiles!counselor_letters_counselor_id_fkey(full_name)").eq("student_id", userId).maybeSingle(),
  ]);
  const counselorLetter = letter.data as unknown as { status: "requested" | "writing" | "done"; counselor: { full_name: string | null } | null } | null;
  const letterStatus = { requested: "requested", writing: "in_progress", done: "submitted" } as const;
  type ListRow = { round: string | null; status: string; universities: { name: string; country: string } | null };

  const tests = (["SAT", "IELTS"] as const)
    .map((type) => {
      const rows = (scores.data ?? []).filter((s) => s.test_type === type);
      return rows.length
        ? { type, best: Math.max(...rows.map((r) => Number(r.total_score))), official: rows.some((r) => r.is_official), attempts: rows.length }
        : null;
    })
    .filter((t): t is NonNullable<typeof t> => t !== null);

  return {
    student: { name: p?.full_name ?? null, grade: p?.grade_level ?? null, school: p?.school_name ?? null, intendedMajor: p?.intended_major ?? null, regions: p?.target_regions ?? [] },
    academics: { gpa: p?.gpa ?? null, classRank: p?.class_rank ?? null, rigor: p?.rigor_notes ?? null },
    spike: p?.spike_statement ?? null,
    tests,
    activities: (activities.data ?? []).map((a) => ({
      role: a.role_title, organization: a.organization, description: a.description, type: a.activity_type,
      impact: a.impact_category, hours: Number(a.hours_per_week), weeks: a.weeks_per_year, grades: a.grades_participated,
    })),
    honors: (honors.data ?? []).map((h) => ({ title: h.title, level: h.level, grade: h.grade, description: h.description })),
    essays: (essays.data ?? []).map((e) => ({ title: e.title, type: e.essay_type, status: e.review_status, words: e.word_count, limit: e.word_limit })),
    letters: [
      ...(counselorLetter ? [{ name: counselorLetter.counselor?.full_name ?? "Counsellor", subject: "Counsellor letter", status: letterStatus[counselorLetter.status] }] : []),
      ...(recs.data ?? []).map((r) => ({ name: r.teacher_name, subject: r.subject, status: r.status })),
    ],
    universities: ((list.data ?? []) as unknown as ListRow[])
      .filter((r) => r.universities)
      .map((r) => ({ name: r.universities!.name, country: r.universities!.country, round: r.round, status: r.status }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}
