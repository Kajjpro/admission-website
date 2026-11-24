import { createClient } from "./supabase/server";
import type { Feedback } from "./types";

export async function getFeedback(essayId: string): Promise<Feedback[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("essay_feedback")
    .select("*, author:profiles!essay_feedback_author_id_fkey(full_name, role)")
    .eq("essay_id", essayId)
    .order("created_at");
  return (data ?? []) as Feedback[];
}
