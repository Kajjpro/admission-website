import type { Essay, Profile, Recommender, ReviewStatus, TestScore } from "./types";

const ESSAY_WEIGHT: Record<ReviewStatus, number> = {
  draft: 25,
  submitted: 50,
  reviewed: 65,
  meeting_scheduled: 80,
  completed: 100,
};

export function essayReadiness(essays: Pick<Essay, "review_status" | "word_count">[]) {
  if (!essays.length) return 0;
  const scores = essays.map((e) => (e.word_count === 0 ? 0 : ESSAY_WEIGHT[e.review_status]));
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

export function testingReadiness(scores: Pick<TestScore, "test_type" | "total_score" | "is_official">[], profile: Profile) {
  if (!scores.length) return 0;
  const ratios: number[] = [];
  for (const type of ["SAT", "IELTS"] as const) {
    const ofType = scores.filter((s) => s.test_type === type);
    if (!ofType.length) continue;
    const best = Math.max(...ofType.map((s) => Number(s.total_score)));
    const target = type === "SAT" ? profile.sat_target : profile.ielts_target;
    const hasOfficial = ofType.some((s) => s.is_official);
    const progress = target ? Math.min(1, best / target) : hasOfficial ? 1 : 0.5;
    ratios.push(progress * (hasOfficial ? 100 : 85));
  }
  return Math.max(...ratios);
}

export function activityReadiness(count: number) {
  return (Math.min(count, 10) / 10) * 100;
}

export function recReadiness(recs: Pick<Recommender, "status">[]) {
  const points = { not_asked: 0, requested: 0.4, in_progress: 0.7, submitted: 1 };
  const total = recs.reduce((sum, r) => sum + points[r.status], 0);
  return (Math.min(total, 2) / 2) * 100;
}
