import type { Essay, LetterStatus, Profile, Recommender, ReviewStatus, TestScore } from "./types";

/** One readiness ring: its value, what it's made of, and the single next step that raises it. */
export interface Readiness {
  key: string;
  label: string;
  value: number;
  detail: string;
  rules: string[];
  next: { text: string; href: string } | null;
}

const ESSAY_WEIGHT: Record<ReviewStatus, number> = {
  draft: 25,
  submitted: 50,
  reviewed: 65,
  meeting_scheduled: 80,
  completed: 100,
};

export function essayReadiness(essays: Pick<Essay, "review_status" | "word_count">[]): Readiness {
  const scores = essays.map((e) => (e.word_count === 0 ? 0 : ESSAY_WEIGHT[e.review_status]));
  const value = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const empty = essays.filter((e) => e.word_count === 0).length;
  const drafting = essays.filter((e) => e.word_count > 0 && e.review_status === "draft").length;
  return {
    key: "essays",
    label: "Essays",
    value,
    detail: essays.length ? `${essays.length} essay${essays.length > 1 ? "s" : ""}` : "No essays yet",
    rules: ["Empty essay 0%", "Draft written 25%", "Sent to counsellor 50%", "Feedback received 65%", "Ready for meeting 80%", "Revised 100%", "Ring = average of your essays"],
    next: !essays.length
      ? { text: "Start your personal statement", href: "/essays" }
      : empty
        ? { text: `Write a first draft (${empty} essay${empty > 1 ? "s are" : " is"} empty)`, href: "/essays" }
        : drafting
          ? { text: "Send a draft to your counsellor", href: "/essays" }
          : value < 100
            ? { text: "Revise using your counsellor's feedback", href: "/essays" }
            : null,
  };
}

export function testingReadiness(scores: Pick<TestScore, "test_type" | "total_score" | "is_official">[], profile: Profile): Readiness {
  const parts: number[] = [];
  for (const type of ["SAT", "IELTS"] as const) {
    const ofType = scores.filter((s) => s.test_type === type);
    if (!ofType.length) continue;
    const best = Math.max(...ofType.map((s) => Number(s.total_score)));
    const target = type === "SAT" ? profile.sat_target : profile.ielts_target;
    const official = ofType.some((s) => s.is_official);
    const progress = target ? Math.min(1, best / target) : official ? 1 : 0.5;
    parts.push(progress * (official ? 100 : 85));
  }
  const value = parts.length ? Math.max(...parts) : 0;
  return {
    key: "testing",
    label: "Testing",
    value,
    detail: scores.length ? `${scores.length} score${scores.length > 1 ? "s" : ""} logged` : "No scores yet",
    rules: ["Best score ÷ your target score", "Practice scores count up to 85%", "An official score unlocks 100%", "No target set: 50% for practice, 100% for official"],
    next: !scores.length
      ? { text: "Log a practice SAT or IELTS score", href: "/testing" }
      : !profile.sat_target && !profile.ielts_target
        ? { text: "Set a target score", href: "/testing" }
        : !scores.some((s) => s.is_official)
          ? { text: "Log an official score when you have one", href: "/testing" }
          : value < 100
            ? { text: "Close the gap with daily practice", href: "/practice" }
            : null,
  };
}

export function activityReadiness(count: number): Readiness {
  return {
    key: "activities",
    label: "Activities",
    value: (Math.min(count, 10) / 10) * 100,
    detail: `${count} of 10 listed`,
    rules: ["Each activity adds 10%", "Up to the Common App's 10 slots"],
    next: count < 10 ? { text: count ? "Add your next activity" : "Add your first activity", href: "/activities" } : null,
  };
}

/** The counsellor letter is the main one; teacher letters the student adds also count toward the total. */
export function recReadiness(recs: Pick<Recommender, "status">[], letter: { status: LetterStatus } | null = null): Readiness {
  const points = { not_asked: 0, requested: 0.4, in_progress: 0.7, submitted: 1 };
  const letterPoints = { requested: 0.4, writing: 0.7, done: 1 };
  const total = (letter ? letterPoints[letter.status] : 0) + recs.reduce((sum, r) => sum + points[r.status], 0);
  const needed = 1 + recs.length;
  const submitted = recs.filter((r) => r.status === "submitted").length;
  const counsellor = !letter ? "counsellor letter not asked" : letter.status === "done" ? "counsellor letter written" : "counsellor letter in progress";
  return {
    key: "recs",
    label: "Letters",
    value: (total / needed) * 100,
    detail: recs.length ? `${counsellor} · ${submitted} of ${recs.length} teacher` : counsellor,
    rules: ["Your counsellor's letter, plus any teacher letters you add", "Asked 40% of a letter", "Being written 70%", "Finished 100%"],
    next: !letter
      ? { text: "Fill in your brag sheet and ask your counsellor for a recommendation", href: "/recommenders" }
      : submitted < recs.length
        ? { text: "Update each teacher letter's status as it moves", href: "/recommenders" }
        : null,
  };
}

export interface ProfileFacts {
  profile: Profile;
  scores: number;
  activities: number;
  honors: number;
  essaysWithWords: number;
  recommenders: number;
}

export const PROFILE_CHECKS = (f: ProfileFacts) => [
  { label: "School name", done: Boolean(f.profile.school_name) },
  { label: "Intended major", done: Boolean(f.profile.intended_major) },
  { label: "Grades (GPA or average)", done: Boolean(f.profile.gpa) },
  { label: "Hardest courses taken", done: Boolean(f.profile.rigor_notes) },
  { label: "Your one-line spike", done: Boolean(f.profile.spike_statement) },
  { label: "A test score", done: f.scores > 0 },
  { label: "5+ activities", done: f.activities >= 5 },
  { label: "An honour or award", done: f.honors > 0 },
  { label: "An essay draft", done: f.essaysWithWords > 0 },
  { label: "Recommendation requested", done: f.recommenders >= 1 },
];

export function profileReadiness(f: ProfileFacts): Readiness {
  const checks = PROFILE_CHECKS(f);
  const done = checks.filter((c) => c.done).length;
  const missing = checks.find((c) => !c.done);
  return {
    key: "profile",
    label: "Profile",
    value: (done / checks.length) * 100,
    detail: `${done} of ${checks.length} complete`,
    rules: checks.map((c) => `${c.done ? "✓" : "○"} ${c.label} (10%)`),
    next: missing ? { text: `Add: ${missing.label.toLowerCase()}`, href: "/profile" } : null,
  };
}
