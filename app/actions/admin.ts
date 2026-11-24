"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authedClient } from "@/lib/auth";
import type { Deadline, Role, SourceAttribution } from "@/lib/types";

function parseJson<T>(raw: FormDataEntryValue | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(String(raw)) as T) : fallback;
  } catch {
    throw new Error("Invalid JSON");
  }
}

export async function saveGuide(form: FormData) {
  const { supabase } = await authedClient();
  const id = String(form.get("id") ?? "");
  const sources = parseJson<SourceAttribution[]>(form.get("source_attribution"), []).filter((s) => s.platform?.trim());
  const content = String(form.get("content_markdown") ?? "");

  const row = {
    slug: String(form.get("slug")).trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
    title: String(form.get("title")).trim(),
    category: String(form.get("category")),
    summary: String(form.get("summary") ?? "").trim() || null,
    content_markdown: content,
    source_attribution: sources,
    reading_time_mins: Math.max(1, Math.round(content.split(/\s+/).length / 200)),
    published: form.get("published") === "on",
  };

  const { error } = id
    ? await supabase.from("guides").update(row).eq("id", id)
    : await supabase.from("guides").insert(row);
  if (error) throw new Error(error.message);

  revalidatePath("/guides", "layout");
  redirect("/admin?tab=guides");
}

export async function deleteGuide(id: string) {
  const { supabase } = await authedClient();
  await supabase.from("guides").delete().eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/guides", "layout");
}

export async function addTask(form: FormData) {
  const { supabase } = await authedClient();
  const { error } = await supabase.from("roadmap_tasks").insert({
    grade_level: Number(form.get("grade_level")),
    category: String(form.get("category")),
    title: String(form.get("title")).trim(),
    description: String(form.get("description") ?? "").trim() || null,
    priority: String(form.get("priority")),
    sort_order: 100,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

export async function deleteTask(id: string) {
  const { supabase } = await authedClient();
  await supabase.from("roadmap_tasks").delete().eq("id", id);
  revalidatePath("/admin");
}

export async function saveUniversity(form: FormData) {
  const { supabase } = await authedClient();
  const id = String(form.get("id") ?? "");
  const text = (key: string) => String(form.get(key) ?? "").trim() || null;

  const row = {
    name: String(form.get("name")).trim(),
    country: String(form.get("country")).trim(),
    region: String(form.get("region")),
    city: text("city"),
    world_rank: Number(form.get("world_rank")) || null,
    rank_confirmed: form.get("rank_confirmed") === "on",
    platform: text("platform"),
    deadlines: parseJson<Deadline[]>(form.get("deadlines"), []),
    testing: text("testing"),
    english: text("english"),
    app_fee: text("app_fee"),
    financial_aid: text("financial_aid"),
    notes: text("notes"),
    website: text("website"),
    deadline_status: form.get("deadline_status") === "confirmed" ? "confirmed" : "estimated",
    last_reviewed: new Date().toISOString().slice(0, 10),
  };

  const { error } = id
    ? await supabase.from("universities").update(row).eq("id", id)
    : await supabase.from("universities").insert(row);
  if (error) throw new Error(error.message);

  revalidatePath("/universities");
  redirect("/admin?tab=universities");
}

export async function updateUser(userId: string, patch: { role?: Role; assigned_counselor_id?: string | null }) {
  const { supabase } = await authedClient();
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (error) return { error: error.message };
  revalidatePath("/admin");
}

export async function inviteStaff(form: FormData) {
  const { supabase } = await authedClient();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid email." };
  const { error } = await supabase.from("staff_invites").upsert({
    email,
    role: form.get("role") === "admin" ? "admin" : "counselor",
    full_name: String(form.get("full_name") ?? "").trim() || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin");
}

export async function removeInvite(email: string) {
  const { supabase } = await authedClient();
  await supabase.from("staff_invites").delete().eq("email", email);
  revalidatePath("/admin");
}
