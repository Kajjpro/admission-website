"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authedClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

export async function completeOnboarding(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { supabase, userId } = await authedClient();
  const grade = Number(form.get("grade_level"));
  const counselor = String(form.get("assigned_counselor_id") ?? "");

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: String(form.get("full_name") ?? "").trim() || null,
      grade_level: grade >= 9 && grade <= 12 ? grade : null,
      target_regions: form.getAll("target_regions").map(String),
      assigned_counselor_id: counselor || null,
      onboarded: true,
    })
    .eq("id", userId);

  if (error) return { error: error.message };
  redirect("/dashboard");
}

export async function setGradeView(grade: number) {
  const store = await cookies();
  store.set("grade_view", String(grade), { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}

export async function updateTestTargets(targets: { sat_target?: number | null; ielts_target?: number | null }) {
  const { supabase, userId } = await authedClient();
  const { error } = await supabase.from("profiles").update(targets).eq("id", userId);
  if (error) return { error: error.message };
  revalidatePath("/testing");
  revalidatePath("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
