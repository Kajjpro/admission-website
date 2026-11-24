import type { SupabaseClient } from "@supabase/supabase-js";
import { nextDeadline } from "./universities";
import type { Deadline } from "./types";

export interface StudentSummary {
  id: string;
  name: string;
  grade: number | null;
  school: string | null;
  major: string | null;
  spike: string | null;
  regions: string[];
  bestSat: number | null;
  bestIelts: number | null;
  activities: number;
  letters: number;
  lettersSubmitted: number;
  essaysShared: number;
  listCount: number;
  next: { university: string; round: string; date: string } | null;
  lastActive: string | null;
  practicedThisWeek: number;
}

/** One row per student with what a counsellor needs at a glance. Relies on RLS: counsellors read assigned students only. */
export async function getStudentSummaries(supabase: SupabaseClient, students: { id: string; full_name: string | null; grade_level: number | null; school_name: string | null; intended_major: string | null; spike_statement: string | null; target_regions: string[] }[]): Promise<StudentSummary[]> {
  if (!students.length) return [];
  const ids = students.map((s) => s.id);
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

  const [scores, activities, recs, essays, lists, attempts] = await Promise.all([
    supabase.from("test_scores").select("user_id, test_type, total_score").in("user_id", ids),
    supabase.from("activities").select("user_id").in("user_id", ids),
    supabase.from("recommenders").select("user_id, status").in("user_id", ids),
    supabase.from("user_essays").select("user_id").in("user_id", ids).not("submitted_at", "is", null),
    supabase.from("user_universities").select("user_id, round, universities(name, deadlines)").in("user_id", ids),
    supabase.from("sat_attempts").select("user_id, created_at").in("user_id", ids).gte("created_at", weekAgo).order("created_at", { ascending: false }).limit(1000),
  ]);

  const count = (rows: { user_id: string }[] | null, id: string) => (rows ?? []).filter((r) => r.user_id === id).length;
  const best = (id: string, type: string) => {
    const v = (scores.data ?? []).filter((s) => s.user_id === id && s.test_type === type).map((s) => Number(s.total_score));
    return v.length ? Math.max(...v) : null;
  };
  type ListRow = { user_id: string; round: string | null; universities: { name: string; deadlines: Deadline[] } | null };

  return students.map((s) => {
    const list = ((lists.data ?? []) as unknown as ListRow[]).filter((l) => l.user_id === s.id && l.universities);
    const upcoming = list
      .map((l) => ({ name: l.universities!.name, d: nextDeadline(l.universities!, l.round) ?? nextDeadline(l.universities!) }))
      .filter((x) => x.d)
      .sort((a, b) => a.d!.date!.localeCompare(b.d!.date!))[0];
    const mine = (attempts.data ?? []).filter((a) => a.user_id === s.id);
    const studentRecs = (recs.data ?? []).filter((r) => r.user_id === s.id);
    return {
      id: s.id,
      name: s.full_name ?? "Unnamed student",
      grade: s.grade_level,
      school: s.school_name,
      major: s.intended_major,
      spike: s.spike_statement,
      regions: s.target_regions ?? [],
      bestSat: best(s.id, "SAT"),
      bestIelts: best(s.id, "IELTS"),
      activities: count(activities.data, s.id),
      letters: studentRecs.length,
      lettersSubmitted: studentRecs.filter((r) => r.status === "submitted").length,
      essaysShared: count(essays.data, s.id),
      listCount: list.length,
      next: upcoming ? { university: upcoming.name, round: upcoming.d!.round, date: upcoming.d!.date! } : null,
      lastActive: mine[0]?.created_at ?? null,
      practicedThisWeek: mine.length,
    };
  });
}
