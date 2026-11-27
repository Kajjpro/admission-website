"use server";

import { revalidatePath } from "next/cache";
import { authedClient } from "@/lib/auth";
import type { LetterStatus } from "@/lib/types";

const refresh = (id?: string) => {
  revalidatePath("/recommenders");
  revalidatePath("/counselor", "layout");
  if (id) revalidatePath(`/counselor/letters/${id}`);
};

// --- Student ------------------------------------------------------------------

export async function requestCounselorLetter(form: FormData) {
  const { supabase, userId } = await authedClient();
  const counselorId = String(form.get("counselor_id") ?? "");
  if (!counselorId) return { error: "Choose your counsellor." };

  // Asking a counsellor also makes them your counsellor, so they can see your profile.
  const { data: me } = await supabase.from("profiles").select("assigned_counselor_id").eq("id", userId).single();
  if (!me?.assigned_counselor_id) {
    await supabase.from("profiles").update({ assigned_counselor_id: counselorId }).eq("id", userId);
  }

  const { error } = await supabase.from("counselor_letters").insert({
    student_id: userId,
    counselor_id: counselorId,
    student_message: String(form.get("student_message") ?? "").trim().slice(0, 2000) || null,
    due_date: String(form.get("due_date") ?? "") || null,
  });
  if (error) return { error: error.code === "23505" ? "You've already asked for a counsellor letter." : error.message };
  refresh();
}

export async function updateLetterRequest(id: string, input: { message: string; dueDate: string }) {
  const { supabase } = await authedClient();
  const { error } = await supabase
    .from("counselor_letters")
    .update({ student_message: input.message.trim().slice(0, 2000) || null, due_date: input.dueDate || null })
    .eq("id", id);
  if (error) return { error: error.message };
  refresh(id);
}

export async function cancelLetterRequest(id: string) {
  const { supabase } = await authedClient();
  await supabase.from("counselor_letters").delete().eq("id", id).eq("status", "requested");
  refresh();
}

// --- Counsellor -----------------------------------------------------------------

export async function saveLetterBody(id: string, body: string) {
  const { supabase } = await authedClient();
  const { error } = await supabase.from("counselor_letter_bodies").upsert({ letter_id: id, body: body.slice(0, 20000) });
  if (error) return { error: error.message };
  // Typing moves a new request to "Writing" so the student sees progress.
  await supabase.from("counselor_letters").update({ status: "writing" }).eq("id", id).eq("status", "requested");
  return { savedAt: new Date().toISOString() };
}

export async function setLetterStatus(id: string, status: LetterStatus) {
  const { supabase } = await authedClient();
  const { error } = await supabase.from("counselor_letters").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  refresh(id);
}
