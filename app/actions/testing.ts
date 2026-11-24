"use server";

import { revalidatePath } from "next/cache";
import { authedClient } from "@/lib/auth";
import type { TestType } from "@/lib/types";

const SECTIONS: Record<TestType, string[]> = {
  SAT: ["ebrw", "math"],
  IELTS: ["listening", "reading", "writing", "speaking"],
};

function ieltsOverall(bands: number[]) {
  const avg = bands.reduce((a, b) => a + b, 0) / bands.length;
  return Math.round(avg * 2) / 2; // IELTS rounds to the nearest half band (.25 rounds up, .75 rounds up)
}

export async function logScore(form: FormData) {
  const { supabase, userId } = await authedClient();
  const testType = String(form.get("test_type")) as TestType;
  const sections = Object.fromEntries(SECTIONS[testType].map((s) => [s, Number(form.get(s))]));
  const values = Object.values(sections);
  if (values.some((v) => Number.isNaN(v))) return { error: "Fill in every section score." };

  const total = testType === "SAT" ? values.reduce((a, b) => a + b, 0) : ieltsOverall(values);

  const { error } = await supabase.from("test_scores").insert({
    user_id: userId,
    test_type: testType,
    test_date: String(form.get("test_date")),
    is_official: form.get("is_official") === "on",
    total_score: total,
    section_scores: sections,
  });
  if (error) return { error: error.message };
  revalidatePath("/testing");
  revalidatePath("/dashboard");
}

export async function deleteScore(id: string) {
  const { supabase } = await authedClient();
  await supabase.from("test_scores").delete().eq("id", id);
  revalidatePath("/testing");
}

export async function logStudy(form: FormData) {
  const { supabase, userId } = await authedClient();
  const minutes = Number(form.get("minutes"));
  if (!minutes || minutes < 1) return { error: "Enter the minutes you studied." };

  const { error } = await supabase.from("study_logs").insert({
    user_id: userId,
    test_type: String(form.get("test_type")),
    logged_on: String(form.get("logged_on")),
    minutes,
    focus: String(form.get("focus") ?? "").trim() || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/testing");
}
