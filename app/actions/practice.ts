"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { aiConfigured, generateJson } from "@/lib/ai";
import { authedClient } from "@/lib/auth";
import { SAT_TAXONOMY, sectionOfDomain, type Choice, type Difficulty, type GradedResult } from "@/lib/sat";

export async function submitAttempt(questionId: string, response: string, seconds: number): Promise<GradedResult | { error: string }> {
  const { supabase, userId } = await authedClient();
  const answer = response.trim();
  if (!answer) return { error: "Choose or enter an answer first." };

  // is_correct is computed by a database trigger; the value sent here is ignored.
  const { data: attempt, error } = await supabase
    .from("sat_attempts")
    .insert({ user_id: userId, question_id: questionId, response: answer, seconds: Math.max(0, Math.round(seconds)) })
    .select("is_correct")
    .single();
  if (error) return { error: error.message };

  const { data: q } = await supabase
    .from("sat_questions")
    .select("correct_answer, choices, explanation")
    .eq("id", questionId)
    .single();
  if (!q) return { error: "Question not found." };

  return {
    isCorrect: attempt.is_correct,
    correctAnswer: q.correct_answer,
    choices: q.choices as Choice[],
    explanation: q.explanation,
  };
}

export async function setDailyGoal(goal: number) {
  const { supabase, userId } = await authedClient();
  const value = Math.min(100, Math.max(1, Math.round(goal)));
  await supabase.from("profiles").update({ daily_goal: value }).eq("id", userId);
  revalidatePath("/practice");
  revalidatePath("/dashboard");
}

// ---------------------------------------------------------------------------
// Question generation (staff only). Every generated question is solved again in a
// separate call that never sees the answer key; only questions where both agree are kept.
// ---------------------------------------------------------------------------

const GeneratedQuestion = z.object({
  passage: z.string().describe("Passage, notes, or table in Markdown. Empty string for math questions that need none."),
  stem: z.string(),
  answer_type: z.enum(["mcq", "spr"]),
  choices: z
    .array(z.object({ key: z.enum(["A", "B", "C", "D"]), text: z.string(), rationale: z.string() }))
    .describe("Exactly four choices A–D for mcq; empty array for spr."),
  correct_answer: z.string().describe("Letter for mcq; the simplest exact value for spr, e.g. 5, -12, 3/4"),
  accepted_answers: z.array(z.string()).describe("For spr, every equivalent form a student could enter, e.g. [\"3/4\", \".75\", \"0.75\"]. Empty for mcq."),
  explanation: z.string().describe("Step-by-step solution in Markdown; LaTeX for math. End with the trap students fall into."),
});

const GeneratedSet = z.object({ questions: z.array(GeneratedQuestion) });

const Verification = z.object({
  answer: z.string().describe("Letter for multiple choice, or the exact value for a student-produced response"),
  exactly_one_correct_answer: z.boolean().describe("False if the question is ambiguous, has no correct answer, or has more than one"),
  problem: z.string().describe("Any error in the question, or an empty string"),
});

function normalize(answer: string) {
  const a = answer.trim().toUpperCase().replace(/\s+/g, "");
  const fraction = a.match(/^(-?\d+)\/(\d+)$/);
  if (fraction && Number(fraction[2]) !== 0) return String(Number(fraction[1]) / Number(fraction[2]));
  return /^-?(\d+\.?\d*|\.\d+)$/.test(a) ? String(Number(a)) : a;
}

export async function generateQuestions(input: { skill: string; domain: string; difficulty: Difficulty; count: number }) {
  const { supabase, userId } = await authedClient();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", userId).single();
  if (me?.role === "student") return { error: "Only counselors and admins can generate questions." };
  if (!aiConfigured()) return { error: "GEMINI_API_KEY is not set." };

  const section = sectionOfDomain(input.domain);
  if (!section || !SAT_TAXONOMY[section].domains[input.domain]?.includes(input.skill)) return { error: "Unknown skill." };
  const count = Math.min(5, Math.max(1, input.count));

  const { data: examples } = await supabase
    .from("sat_questions")
    .select("passage, stem, answer_type, choices, correct_answer, explanation")
    .eq("skill", input.skill)
    .eq("verified", true)
    .limit(2);
  const { data: existing } = await supabase.from("sat_questions").select("stem").eq("skill", input.skill).limit(40);

  const generated = await generateJson(
    GeneratedSet,
    `Write ${count} new, original Digital SAT practice questions.

Section: ${SAT_TAXONOMY[section].label}
Domain: ${input.domain}
Skill: ${input.skill}
Difficulty: ${input.difficulty}

Requirements:
- Match the real Digital SAT format for this skill: passage length (25–150 words for Reading & Writing), question wording, and four answer choices. For math, about one in four questions may be student-produced response (spr).
- Every question must have exactly one defensible correct answer. Wrong choices should reflect real student mistakes, and each rationale must say precisely why that choice is right or wrong.
- Solve each question fully before finalizing it, and check the arithmetic.
- Original content only: do not copy College Board or other published questions. Vary topics (science, history, literature, social science for R&W; realistic contexts for math).
- Don't repeat these existing stems: ${(existing ?? []).map((e) => e.stem.slice(0, 80)).join(" | ") || "none"}

Style reference from our bank (do not copy):
${JSON.stringify(examples ?? [], null, 1).slice(0, 6000)}`,
  );

  const candidates = generated?.questions ?? [];
  if (!candidates.length) return { error: "The model didn't return any questions. Try again." };

  const checks = await Promise.all(
    candidates.map(async (q) => {
      const shown = [
        q.passage && `Passage:\n${q.passage}`,
        `Question: ${q.stem}`,
        q.answer_type === "mcq" ? q.choices.map((c) => `${c.key}) ${c.text}`).join("\n") : "Student-produced response: give the exact value.",
      ]
        .filter(Boolean)
        .join("\n\n");
      try {
        const v = await generateJson(
          Verification,
          `Solve this SAT question independently and carefully. Then judge whether it has exactly one correct answer.\n\n${shown}`,
        );
        const keys = [q.correct_answer, ...q.accepted_answers].map(normalize);
        const ok =
          v !== null &&
          v.exactly_one_correct_answer &&
          !v.problem.trim() &&
          keys.includes(normalize(v.answer)) &&
          (q.answer_type === "spr" || q.choices.length === 4);
        return { q, ok };
      } catch {
        return { q, ok: false };
      }
    }),
  );

  const passed = checks.filter((c) => c.ok).map((c) => c.q);
  if (passed.length) {
    const { error } = await supabase.from("sat_questions").insert(
      passed.map((q) => ({
        section,
        domain: input.domain,
        skill: input.skill,
        difficulty: input.difficulty,
        passage: q.passage.trim() || null,
        stem: q.stem,
        answer_type: q.answer_type,
        choices: q.answer_type === "mcq" ? q.choices : [],
        correct_answer: q.correct_answer.trim(),
        accepted_answers: q.answer_type === "spr" ? [q.correct_answer.trim(), ...q.accepted_answers] : [],
        explanation: q.explanation,
        source: "ai",
        verified: true,
        created_by: userId,
      })),
    );
    if (error) return { error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/practice");
  return { added: passed.length, rejected: candidates.length - passed.length };
}

const ImportedQuestion = z.object({
  section: z.enum(["rw", "math"]),
  domain: z.string(),
  skill: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  passage: z.string().nullish(),
  stem: z.string().min(1),
  answer_type: z.enum(["mcq", "spr"]).default("mcq"),
  choices: z.array(z.object({ key: z.string(), text: z.string(), rationale: z.string().default("") })).default([]),
  correct_answer: z.string().min(1),
  accepted_answers: z.array(z.string()).default([]),
  explanation: z.string().min(1),
});

/** Admins can import questions the school has the rights to use, as a JSON array. */
export async function importQuestions(json: string) {
  const { supabase, userId } = await authedClient();
  let parsed;
  try {
    parsed = z.array(ImportedQuestion).safeParse(JSON.parse(json));
  } catch {
    return { error: "That isn't valid JSON." };
  }
  if (!parsed.success) return { error: parsed.error.issues.slice(0, 3).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };

  const { error } = await supabase
    .from("sat_questions")
    .insert(parsed.data.map((q) => ({ ...q, passage: q.passage || null, source: "imported", verified: true, created_by: userId })));
  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/practice");
  return { added: parsed.data.length };
}
