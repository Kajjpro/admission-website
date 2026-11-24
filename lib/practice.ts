import type { SupabaseClient } from "@supabase/supabase-js";

export interface PracticeStats {
  today: number;
  streak: number;
  dueReviews: number;
  total: number;
  correct: number;
  bySkill: { section: string; domain: string; skill: string; attempts: number; correct: number }[];
}

function localDay(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function getPracticeStats(supabase: SupabaseClient, userId: string): Promise<PracticeStats> {
  const since = new Date(Date.now() - 365 * 86_400_000).toISOString();
  const [{ data: attempts }, { count: dueReviews }] = await Promise.all([
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
  ]);

  type Row = { is_correct: boolean; created_at: string; question: { section: string; domain: string; skill: string } | null };
  const rows = (attempts ?? []) as unknown as Row[];
  const todayKey = localDay(new Date());
  const days = new Set(rows.map((r) => localDay(new Date(r.created_at))));

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

  return {
    today: rows.filter((r) => localDay(new Date(r.created_at)) === todayKey).length,
    streak,
    dueReviews: dueReviews ?? 0,
    total: rows.length,
    correct: rows.filter((r) => r.is_correct).length,
    bySkill: [...skills.values()],
  };
}
