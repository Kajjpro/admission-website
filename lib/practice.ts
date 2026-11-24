import type { SupabaseClient } from "@supabase/supabase-js";
import { locateSkill } from "./sat";

export interface PracticeStats {
  today: number;
  streak: number;
  dueReviews: number;
  total: number;
  correct: number;
  bySkill: { section: string; domain: string; skill: string; attempts: number; correct: number }[];
  /** Questions logged from official sites today (included in `today`). */
  officialToday: number;
}

function localDay(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function getPracticeStats(supabase: SupabaseClient, userId: string): Promise<PracticeStats> {
  const since = new Date(Date.now() - 365 * 86_400_000).toISOString();
  const [{ data: attempts }, { count: dueReviews }, { data: logs }] = await Promise.all([
    supabase
      .from("sat_attempts")
      .select("is_correct, created_at, question:sat_questions(section, domain, skill)")
      .eq("user_id", userId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase
      .from("sat_reviews")
      .select("question_id", { count: "exact", head: true })
      .eq("user_id", userId)
      .lte("due_on", localDay(new Date())),
    supabase
      .from("official_practice_logs")
      .select("skill, attempted, correct, logged_on")
      .eq("user_id", userId)
      .gte("logged_on", since.slice(0, 10))
      .limit(5000),
  ]);
  const official = (logs ?? []) as { skill: string | null; attempted: number; correct: number; logged_on: string }[];

  type Row = { is_correct: boolean; created_at: string; question: { section: string; domain: string; skill: string } | null };
  const rows = (attempts ?? []) as unknown as Row[];
  const todayKey = localDay(new Date());
  const days = new Set([...rows.map((r) => localDay(new Date(r.created_at))), ...official.map((l) => l.logged_on)]);

  // A streak survives until the end of today, so start from yesterday if nothing is logged yet today.
  let streak = 0;
  const cursor = new Date();
  if (!days.has(todayKey)) cursor.setDate(cursor.getDate() - 1);
  while (days.has(localDay(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  const skills = new Map<string, PracticeStats["bySkill"][number]>();
  for (const r of rows) {
    if (!r.question) continue;
    const key = r.question.skill;
    const entry = skills.get(key) ?? { ...r.question, attempts: 0, correct: 0 };
    entry.attempts++;
    if (r.is_correct) entry.correct++;
    skills.set(key, entry);
  }
  for (const l of official) {
    const where = l.skill ? locateSkill(l.skill) : null;
    if (!l.skill || !where) continue;
    const entry = skills.get(l.skill) ?? { ...where, skill: l.skill, attempts: 0, correct: 0 };
    entry.attempts += l.attempted;
    entry.correct += l.correct;
    skills.set(l.skill, entry);
  }
  const officialToday = official.filter((l) => l.logged_on === todayKey).reduce((a, l) => a + l.attempted, 0);

  return {
    today: rows.filter((r) => localDay(new Date(r.created_at)) === todayKey).length + officialToday,
    streak,
    dueReviews: dueReviews ?? 0,
    total: rows.length + official.reduce((a, l) => a + l.attempted, 0),
    correct: rows.filter((r) => r.is_correct).length + official.reduce((a, l) => a + l.correct, 0),
    bySkill: [...skills.values()],
    officialToday,
  };
}
