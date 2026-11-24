"use server";

import { revalidatePath } from "next/cache";
import { authedClient } from "@/lib/auth";
import type { TaskStatus } from "@/lib/types";

export async function setTaskStatus(taskId: string, status: TaskStatus) {
  const { supabase, userId } = await authedClient();
  const { error } = await supabase
    .from("user_task_progress")
    .upsert({ user_id: userId, task_id: taskId, status }, { onConflict: "user_id,task_id" });
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
}
