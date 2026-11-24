"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { aiConfigured, isRateLimit } from "@/lib/ai";
import { generateVerifiedBatch, sectionFor } from "@/lib/question-gen";
import { authedClient } from "@/lib/auth";
import type { Choice, Difficulty, GradedResult } from "@/lib/sat";

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

/** Staff-only: generate and verify a small batch for one skill from the admin page. */
export async function generateQuestions(input: { skill: string; domain: string; difficulty: Difficulty; count: number }) {
  const { supabase, userId } = await authedClient();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", userId).single();
  if (me?.role === "student") return { error: "Only counselors and admins can generate questions." };
  if (!aiConfigured()) return { error: "GEMINI_API_KEY is not set." };
  if (!sectionFor(input.domain, input.skill)) return { error: "Unknown skill." };

  const [{ data: examples }, { data: existing }] = await Promise.all([
    supabase.from("sat_questions").select("passage, stem, answer_type, choices, correct_answer, explanation").eq("skill", input.skill).eq("verified", true).limit(2),
    supabase.from("sat_questions").select("stem").eq("skill", input.skill).order("created_at", { ascending: false }).limit(30),
  ]);

  let result;
  try {
    result = await generateVerifiedBatch({
      ...input,
      count: Math.min(5, Math.max(1, input.count)),
      examples: examples ?? [],
      existingStems: (existing ?? []).map((e) => e.stem),
    });
  } catch (error) {
    return { error: isRateLimit(error) ? "Gemini's rate limit was reached. Try again later." : "Generation failed. Try again." };
  }

  if (result.passed.length) {
    const { error } = await supabase.from("sat_questions").insert(result.passed.map((q) => ({ ...q, created_by: userId })));
    if (error) return { error: error.message };
  }
  revalidatePath("/admin");
  revalidatePath("/practice");
  return { added: result.passed.length, rejected: result.rejected };
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

const SOURCES = ["sat_question_bank", "college_board", "bluebook", "khan", "other"] as const;

/** Record practice done on an official site so it counts toward streaks and skill progress. */
export async function logOfficialPractice(input: { source: string; section: string | null; skill: string | null; attempted: number; correct: number }) {
  const { supabase, userId } = await authedClient();
  const attempted = Math.round(input.attempted);
  const correct = Math.round(input.correct);
  if (!SOURCES.includes(input.source as (typeof SOURCES)[number])) return { error: "Unknown source." };
  if (!(attempted >= 1 && attempted <= 500)) return { error: "Questions must be between 1 and 500." };
  if (!(correct >= 0 && correct <= attempted)) return { error: "Correct can't be more than the number of questions." };

  const today = new Date();
  const { error } = await supabase.from("official_practice_logs").insert({
    user_id: userId,
    source: input.source,
    section: input.section === "rw" || input.section === "math" ? input.section : null,
    skill: input.skill || null,
    attempted,
    correct,
    logged_on: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`,
  });
  if (error) return { error: error.message };
  revalidatePath("/practice");
  revalidatePath("/dashboard");
}
