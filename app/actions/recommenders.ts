"use server";

import { revalidatePath } from "next/cache";
import { authedClient } from "@/lib/auth";
import type { Recommender } from "@/lib/types";

export async function addRecommender(form: FormData) {
  const { supabase, userId } = await authedClient();
  const name = String(form.get("teacher_name") ?? "").trim();
  if (!name) return { error: "Add the recommender's name." };

  const { error } = await supabase.from("recommenders").insert({
    user_id: userId,
    teacher_name: name,
    subject: String(form.get("subject") ?? "").trim() || null,
    relationship_context: String(form.get("relationship_context") ?? "").trim() || null,
    due_date: String(form.get("due_date") ?? "") || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/recommenders");
}

export async function updateRecommender(id: string, patch: Partial<Omit<Recommender, "id">>) {
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
