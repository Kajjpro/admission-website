"use server";

import { revalidatePath } from "next/cache";
import { authedClient } from "@/lib/auth";
import type { Recommender } from "@/lib/types";

export async function addRecommender(form: FormData) {
  const { supabase, userId } = await authedClient();
  const teacherId = String(form.get("teacher_id") ?? "");
  const { data: teacher } = teacherId
    ? await supabase.from("teachers").select("full_name, email, subject").eq("id", teacherId).maybeSingle()
    : { data: null };
  const name = teacher?.full_name ?? String(form.get("teacher_name") ?? "").trim();
  if (!name) return { error: "Choose a teacher or type their name." };
  const email = teacher?.email ?? (String(form.get("email") ?? "").trim().toLowerCase() || null);
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return { error: "That email doesn't look right." };

  const { error } = await supabase.from("recommenders").insert({
    user_id: userId,
    teacher_name: name,
    teacher_id: teacher ? teacherId : null,
    email,
    subject: String(form.get("subject") ?? "").trim() || teacher?.subject || null,
    relationship_context: String(form.get("relationship_context") ?? "").trim() || null,
    due_date: String(form.get("due_date") ?? "") || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/recommenders");
}

export async function updateRecommender(id: string, patch: Partial<Omit<Recommender, "id" | "share_token" | "viewed_at">>) {
  const { supabase } = await authedClient();
  const { error } = await supabase.from("recommenders").update(patch).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/recommenders");
  revalidatePath("/dashboard");
}

export async function deleteRecommender(id: string) {
  const { supabase } = await authedClient();
  await supabase.from("recommenders").delete().eq("id", id);
  revalidatePath("/recommenders");
}

export async function saveBragSheet(answers: Record<string, string>) {
  const { supabase, userId } = await authedClient();
  const { error } = await supabase.from("brag_sheets").upsert({ user_id: userId, answers });
  if (error) return { error: error.message };
  return { savedAt: new Date().toISOString() };
}

/** A fresh link stops the old one working, e.g. if it was sent to the wrong person. */
export async function resetShareLink(id: string) {
  const { supabase } = await authedClient();
  const { error } = await supabase.from("recommenders").update({ share_token: crypto.randomUUID(), viewed_at: null }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/recommenders");
}
