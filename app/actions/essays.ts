"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authedClient } from "@/lib/auth";
import { ESSAY_TYPES } from "@/lib/constants";
import { countWords } from "@/lib/utils";
import type { EssayType, ReviewStatus } from "@/lib/types";

export async function createEssay(form: FormData) {
  const { supabase, userId } = await authedClient();
  const essayType = String(form.get("essay_type")) as EssayType;
  const limit = Number(form.get("word_limit")) || ESSAY_TYPES[essayType]?.defaultLimit || null;

  const { data, error } = await supabase
    .from("user_essays")
    .insert({
      user_id: userId,
      essay_type: essayType,
      title: String(form.get("title") ?? "").trim() || ESSAY_TYPES[essayType].label,
      prompt: String(form.get("prompt") ?? "").trim() || null,
      word_limit: limit,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  redirect(`/essays/${data.id}`);
}

export async function saveEssay(
  id: string,
  patch: { title?: string; content?: string; prompt?: string | null; word_limit?: number | null },
) {
  const { supabase } = await authedClient();
  const { error } = await supabase.from("user_essays").update(patch).eq("id", id);
  if (error) return { error: error.message };
  return { savedAt: new Date().toISOString() };
}

export async function deleteEssay(id: string) {
  const { supabase } = await authedClient();
  await supabase.from("user_essays").delete().eq("id", id);
  revalidatePath("/essays");
  redirect("/essays");
}

export async function submitForReview(
  essayId: string,
  input: { counselorId: string; focusAreas: string[]; note: string; requestMeeting: boolean },
) {
  const { supabase } = await authedClient();
  const { data: essay, error: readError } = await supabase
    .from("user_essays")
    .select("content")
    .eq("id", essayId)
    .single();
  if (readError || !essay) return { error: readError?.message ?? "Essay not found" };
  if (!essay.content.trim()) return { error: "Write something before sending it for review." };

  const { error: snapError } = await supabase.from("essay_submissions").insert({
    essay_id: essayId,
    counselor_id: input.counselorId,
    content: essay.content,
    word_count: countWords(essay.content),
    focus_areas: input.focusAreas,
    student_note: input.note.trim() || null,
  });
  if (snapError) return { error: snapError.message };

  const { error } = await supabase
    .from("user_essays")
    .update({
      counselor_id: input.counselorId,
      review_status: "submitted",
      submitted_at: new Date().toISOString(),
      needs_in_person_meeting: input.requestMeeting,
    })
    .eq("id", essayId);
  if (error) return { error: error.message };

  revalidatePath(`/essays/${essayId}`);
  revalidatePath("/counselor");
}

export async function markEssayStatus(essayId: string, status: Extract<ReviewStatus, "draft" | "completed">) {
  const { supabase } = await authedClient();
  const { error } = await supabase.from("user_essays").update({ review_status: status }).eq("id", essayId);
  if (error) return { error: error.message };
  revalidatePath(`/essays/${essayId}`);
}

export async function addFeedback(input: {
  essayId: string;
  comment: string;
  submissionId?: string | null;
  paragraphIndex?: number | null;
  excerpt?: string | null;
}) {
  const { supabase, userId } = await authedClient();
  if (!input.comment.trim()) return { error: "Comment can't be empty." };

  const { error } = await supabase.from("essay_feedback").insert({
    essay_id: input.essayId,
    author_id: userId,
    comment: input.comment.trim(),
    submission_id: input.submissionId ?? null,
    paragraph_index: input.paragraphIndex ?? null,
    excerpt_quote: input.excerpt?.trim() || null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/essays/${input.essayId}`);
  revalidatePath(`/counselor/essays/${input.essayId}`);
}

export async function setFeedbackResolved(id: string, essayId: string, resolved: boolean) {
  const { supabase } = await authedClient();
  const { error } = await supabase.from("essay_feedback").update({ is_resolved: resolved }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/essays/${essayId}`);
  revalidatePath(`/counselor/essays/${essayId}`);
}

export async function updateReview(
  essayId: string,
  patch: {
    review_status?: ReviewStatus;
    needs_in_person_meeting?: boolean;
    meeting_notes?: string | null;
    meeting_at?: string | null;
  },
) {
  const { supabase } = await authedClient();
  const { error } = await supabase.from("user_essays").update(patch).eq("id", essayId);
  if (error) return { error: error.message };
  revalidatePath(`/counselor/essays/${essayId}`);
  revalidatePath(`/essays/${essayId}`);
  revalidatePath("/counselor");
}
