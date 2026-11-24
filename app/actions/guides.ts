"use server";

import { revalidatePath } from "next/cache";
import { authedClient } from "@/lib/auth";

export async function updateGuideProgress(guideId: string, patch: { bookmarked?: boolean; completed?: boolean }) {
  const { supabase, userId } = await authedClient();
  const row: Record<string, unknown> = { user_id: userId, guide_id: guideId };
  if (patch.bookmarked !== undefined) row.bookmarked = patch.bookmarked;
  if (patch.completed !== undefined) row.completed_at = patch.completed ? new Date().toISOString() : null;

  const { error } = await supabase.from("guide_progress").upsert(row, { onConflict: "user_id,guide_id" });
  if (error) return { error: error.message };
  revalidatePath("/guides", "layout");
}
