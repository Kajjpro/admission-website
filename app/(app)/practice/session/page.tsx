import { requireProfile } from "@/lib/auth";
import { aiConfigured } from "@/lib/ai";
import { getPracticeStats } from "@/lib/practice";
import { PUBLIC_QUESTION_COLUMNS, toPublicQuestion, type PublicQuestion } from "@/lib/sat";
import { createClient } from "@/lib/supabase/server";
import { QuestionPlayer } from "@/components/practice/question-player";
import type { TutorMessage } from "@/components/practice/tutor-chat";

export const metadata = { title: "Practice session" };

type Params = { mode?: string; ids?: string; section?: string; domain?: string; skill?: string; difficulty?: string; count?: string };

function shuffle<T>(items: T[]) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export default async function SessionPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const profile = await requireProfile();
  const supabase = await createClient();
  const mode = params.ids ? "ids" : params.mode ?? "custom";
  const today = new Date().toISOString().slice(0, 10);

  let picked: string[] = [];
  let title = "Practice set";

  if (mode === "ids") {
    picked = params.ids!.split(",").slice(0, 30);
    title = "Retry";
  } else if (mode === "review") {
    const { data } = await supabase.from("sat_reviews").select("question_id").eq("user_id", profile.id).lte("due_on", today).order("due_on").limit(20);
    picked = (data ?? []).map((r) => r.question_id);
    title = "Review mistakes";
  } else {
    let query = supabase.from("sat_questions").select("id, skill").eq("verified", true);
    if (params.section) query = query.eq("section", params.section);
    if (params.domain) query = query.eq("domain", params.domain);
    if (params.skill) query = query.eq("skill", params.skill);
    if (params.difficulty) query = query.eq("difficulty", params.difficulty);

    const [{ data: pool }, { data: attempted }] = await Promise.all([
      query.limit(2000),
      supabase.from("sat_attempts").select("question_id").eq("user_id", profile.id).limit(10000),
    ]);
    const seen = new Set((attempted ?? []).map((a) => a.question_id));
    const fresh = shuffle((pool ?? []).filter((q) => !seen.has(q.id)));
    const old = shuffle((pool ?? []).filter((q) => seen.has(q.id)));

    if (mode === "daily") {
      title = "Daily set";
      const stats = await getPracticeStats(supabase, profile.id);
      const size = Math.max(5, Math.min(20, profile.daily_goal - stats.today));
      const accuracy = new Map(stats.bySkill.map((s) => [s.skill, s.correct / s.attempts]));
      const { data: due } = await supabase.from("sat_reviews").select("question_id").eq("user_id", profile.id).lte("due_on", today).limit(Math.ceil(size / 2));
      const dueIds = (due ?? []).map((d) => d.question_id);
      // Weakest skills first; skills never tried count as 50% so they still come up.
      const ranked = [...fresh].sort((a, b) => (accuracy.get(a.skill) ?? 0.5) - (accuracy.get(b.skill) ?? 0.5) + (Math.random() - 0.5) * 0.3);
      picked = [...new Set([...dueIds, ...ranked.map((q) => q.id), ...old.map((q) => q.id)])].slice(0, size);
    } else {
      title = params.skill ?? params.domain ?? (params.section === "math" ? "Math" : params.section === "rw" ? "Reading & Writing" : "Mixed practice");
      const size = Math.min(30, Math.max(1, Number(params.count) || 10));
      picked = [...fresh, ...old].map((q) => q.id).slice(0, size);
    }
  }

  let questions: PublicQuestion[] = [];
  const history: Record<string, TutorMessage[]> = {};
  if (picked.length) {
    const [{ data }, { data: messages }] = await Promise.all([
      supabase.from("sat_questions").select(PUBLIC_QUESTION_COLUMNS).in("id", picked),
      supabase.from("tutor_messages").select("question_id, role, content").eq("user_id", profile.id).in("question_id", picked).order("created_at"),
    ]);
    const byId = new Map(((data ?? []) as unknown as PublicQuestion[]).map((q) => [q.id, toPublicQuestion(q)]));
    questions = picked.map((id) => byId.get(id)).filter((q): q is PublicQuestion => Boolean(q));
    for (const m of messages ?? []) (history[m.question_id] ??= []).push({ role: m.role, content: m.content });
  }

  return <QuestionPlayer questions={questions} title={title} tutorHistory={history} aiEnabled={aiConfigured()} />;
}
