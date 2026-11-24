"use server";

import { revalidatePath } from "next/cache";
import { authedClient } from "@/lib/auth";
import type { UserUniversity } from "@/lib/types";

export async function addToList(universityId: string, round: string | null) {
  const { supabase, userId } = await authedClient();
  const { error } = await supabase
    .from("user_universities")
    .upsert({ user_id: userId, university_id: universityId, round }, { onConflict: "user_id,university_id" });
  if (error) return { error: error.message };
  revalidatePath("/universities");
  revalidatePath("/dashboard");
}

export async function updateListItem(id: string, patch: Partial<Pick<UserUniversity, "round" | "status" | "notes">>) {
  const { supabase } = await authedClient();
  const { error } = await supabase.from("user_universities").update(patch).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/universities");
  revalidatePath("/dashboard");
}

export async function removeFromList(id: string) {
  const { supabase } = await authedClient();
  await supabase.from("user_universities").delete().eq("id", id);
  revalidatePath("/universities");
  revalidatePath("/dashboard");
}
