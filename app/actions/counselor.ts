"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authedClient } from "@/lib/auth";
import { buildSnapshot } from "@/lib/application";

const text = (form: FormData, key: string, max: number) => String(form.get(key) ?? "").trim().slice(0, max) || null;
const studentPath = (id: string) => `/counselor/students/${id}`;

// --- Tasks ------------------------------------------------------------------

export async function assignTask(studentId: string, form: FormData) {
  const { supabase } = await authedClient();
  const title = text(form, "title", 160);
  if (!title) return { error: "Write the task." };
  const { error } = await supabase.from("counselor_tasks").insert({
    student_id: studentId,
    title,
    details: text(form, "details", 1000),
    due_date: String(form.get("due_date") ?? "") || null,
  });
  if (error) return { error: error.message };
  revalidatePath(studentPath(studentId));
  revalidatePath("/counselor");
}

/** Students tick their own tasks; counsellors can too. */
export async function setTaskDone(id: string, done: boolean) {
  const { supabase } = await authedClient();
  const { error } = await supabase.from("counselor_tasks").update({ done_at: done ? new Date().toISOString() : null }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/counselor", "layout");
}

export async function deleteTask(id: string, studentId: string) {
  const { supabase } = await authedClient();
  await supabase.from("counselor_tasks").delete().eq("id", id);
  revalidatePath(studentPath(studentId));
  revalidatePath("/counselor");
}

// --- Private notes ----------------------------------------------------------

export async function addNote(studentId: string, form: FormData) {
  const { supabase } = await authedClient();
  const body = text(form, "body", 4000);
  if (!body) return { error: "Write the note." };
  const kind = String(form.get("kind") ?? "note");
  const { error } = await supabase.from("counselor_notes").insert({
    student_id: studentId,
    body,
    kind: ["note", "meeting", "call"].includes(kind) ? kind : "note",
  });
  if (error) return { error: error.message };
  revalidatePath(studentPath(studentId));
}

export async function deleteNote(id: string, studentId: string) {
  const { supabase } = await authedClient();
  await supabase.from("counselor_notes").delete().eq("id", id);
  revalidatePath(studentPath(studentId));
}

// --- Whole-profile feedback the counsellor starts ---------------------------

export async function startProfileReview(studentId: string) {
  const { supabase, userId } = await authedClient();
  const { data: existing } = await supabase
    .from("profile_reviews")
    .select("id")
    .eq("student_id", studentId)
    .eq("counselor_id", userId)
    .eq("status", "draft")
    .maybeSingle();
  if (existing) redirect(`/counselor/profiles/${existing.id}`);

  const snapshot = await buildSnapshot(supabase, studentId);
  const { data, error } = await supabase
    .from("profile_reviews")
    .insert({ student_id: studentId, counselor_id: userId, snapshot, status: "draft", started_by_counselor: true })
    .select("id")
    .single();
  if (error) return { error: error.message };
  redirect(`/counselor/profiles/${data.id}`);
}

export async function discardDraftReview(id: string, studentId: string) {
  const { supabase } = await authedClient();
  await supabase.from("profile_reviews").delete().eq("id", id).eq("status", "draft");
  revalidatePath(studentPath(studentId));
  redirect(studentPath(studentId));
}

// --- Teacher directory ------------------------------------------------------

/** One teacher per line: "Name, email, subject" (subject optional). Existing emails are updated. */
export async function importTeachers(form: FormData) {
  const { supabase } = await authedClient();
  const lines = String(form.get("lines") ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  const rows: { full_name: string; email: string; subject: string | null }[] = [];
  const bad: string[] = [];
  for (const line of lines) {
    const parts = line.split(/[,;\t]/).map((p) => p.trim());
    const emailIndex = parts.findIndex((p) => /^\S+@\S+\.\S+$/.test(p));
    if (emailIndex < 0) {
      bad.push(line);
      continue;
    }
    const email = parts[emailIndex]!.toLowerCase();
    const others = parts.filter((_, i) => i !== emailIndex && parts[i]);
    rows.push({ full_name: (others[0] ?? email.split("@")[0]!).slice(0, 120), email, subject: others[1]?.slice(0, 120) ?? null });
  }
  if (!rows.length) return { error: bad.length ? "No email found on any line." : "Paste at least one teacher." };
  const unique = [...new Map(rows.map((r) => [r.email, r])).values()];
  const { error } = await supabase.from("teachers").upsert(unique, { onConflict: "email" });
  if (error) return { error: error.message };
  revalidatePath("/counselor/teachers");
  revalidatePath("/recommenders");
  return { added: unique.length, skipped: bad };
}

export async function deleteTeacher(id: string) {
  const { supabase } = await authedClient();
  await supabase.from("teachers").delete().eq("id", id);
  revalidatePath("/counselor/teachers");
  revalidatePath("/recommenders");
}
