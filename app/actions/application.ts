"use server";

import { revalidatePath } from "next/cache";
import { authedClient } from "@/lib/auth";
import { buildSnapshot, REVIEW_SECTIONS } from "@/lib/application";

const text = (form: FormData, key: string, max = 2000) => String(form.get(key) ?? "").trim().slice(0, max) || null;

export async function saveApplicationProfile(form: FormData) {
  const { supabase, userId } = await authedClient();
  const grade = Number(form.get("grade_level"));
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: text(form, "full_name", 120),
      grade_level: grade >= 9 && grade <= 12 ? grade : null,
      school_name: text(form, "school_name", 160),
      intended_major: text(form, "intended_major", 120),
      gpa: text(form, "gpa", 60),
      class_rank: text(form, "class_rank", 60),
      rigor_notes: text(form, "rigor_notes", 1000),
      spike_statement: text(form, "spike_statement", 200),
      target_regions: form.getAll("target_regions").map(String),
    })
    .eq("id", userId);
  if (error) return { error: error.message };
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { savedAt: new Date().toISOString() };
}

export async function addHonor(form: FormData) {
  const { supabase, userId } = await authedClient();
  const title = text(form, "title", 100);
  if (!title) return { error: "Add the honour's name." };
  const grade = Number(form.get("grade"));
  const { error } = await supabase.from("honors").insert({
    user_id: userId,
    title,
    level: String(form.get("level") ?? "school"),
    grade: grade >= 9 && grade <= 12 ? grade : null,
    description: text(form, "description", 300),
  });
  if (error) return { error: error.message };
  revalidatePath("/profile");
  revalidatePath("/dashboard");
}

export async function deleteHonor(id: string) {
  const { supabase } = await authedClient();
  await supabase.from("honors").delete().eq("id", id);
  revalidatePath("/profile");
  revalidatePath("/dashboard");
}

export async function sendProfileForReview(input: { counselorId: string; note: string }) {
  const { supabase, userId } = await authedClient();
  if (!input.counselorId) return { error: "Choose a counsellor." };
  const snapshot = await buildSnapshot(supabase, userId);
  const { error } = await supabase.from("profile_reviews").insert({
    student_id: userId,
    counselor_id: input.counselorId,
    student_note: input.note.trim() || null,
    snapshot,
  });
  if (error) return { error: error.message };
  revalidatePath("/profile");
  revalidatePath("/counselor");
}

export async function respondToProfileReview(
  id: string,
  input: { overall: string; sections: Record<string, string>; markReviewed: boolean },
) {
  const { supabase } = await authedClient();
  const sections = Object.fromEntries(
    REVIEW_SECTIONS.map((s) => [s.key, input.sections[s.key]?.trim() ?? ""]).filter(([, v]) => v),
  );
  const { error } = await supabase
    .from("profile_reviews")
    .update({
      overall_feedback: input.overall.trim() || null,
      section_feedback: sections,
      // Saving a draft leaves the status alone, so a counsellor-started draft stays hidden from the student.
      ...(input.markReviewed ? { status: "reviewed" } : {}),
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/counselor/students", "layout");
  revalidatePath(`/counselor/profiles/${id}`);
  revalidatePath("/counselor");
  revalidatePath("/profile");
}
