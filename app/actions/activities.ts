"use server";

import { revalidatePath } from "next/cache";
import { authedClient } from "@/lib/auth";

export async function saveActivity(form: FormData) {
  const { supabase, userId } = await authedClient();
  const id = String(form.get("id") ?? "");
  const row = {
    activity_type: String(form.get("activity_type") ?? "Other"),
    impact_category: String(form.get("impact_category") ?? "") || null,
    role_title: String(form.get("role_title") ?? "").slice(0, 50),
    organization: String(form.get("organization") ?? "").slice(0, 100),
    description: String(form.get("description") ?? "").slice(0, 150),
    grades_participated: form.getAll("grades").map(Number),
    hours_per_week: Number(form.get("hours_per_week")) || 0,
    weeks_per_year: Math.min(52, Number(form.get("weeks_per_year")) || 0),
  };

  if (id) {
    const { error } = await supabase.from("activities").update(row).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { count } = await supabase.from("activities").select("id", { count: "exact", head: true }).eq("user_id", userId);
    const { error } = await supabase.from("activities").insert({ ...row, user_id: userId, position_order: count ?? 0 });
    if (error) return { error: error.message };
  }
  revalidatePath("/activities");
  revalidatePath("/dashboard");
}

export async function deleteActivity(id: string) {
  const { supabase } = await authedClient();
  await supabase.from("activities").delete().eq("id", id);
  revalidatePath("/activities");
  revalidatePath("/dashboard");
}

/** Persists a full ordering after a move in the UI. */
export async function reorderActivities(orderedIds: string[]) {
  const { supabase } = await authedClient();
  await Promise.all(
    orderedIds.map((id, index) => supabase.from("activities").update({ position_order: index }).eq("id", id)),
  );
  revalidatePath("/activities");
  revalidatePath("/dashboard");
}
