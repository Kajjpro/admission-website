"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Called from the teacher's private link; works signed out. The token is the only key. */
export async function teacherMarkSubmitted(token: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("teacher_mark_submitted", { token });
  if (error || !data) return { error: "This link is no longer valid." };
  revalidatePath(`/brag/${token}`);
}
