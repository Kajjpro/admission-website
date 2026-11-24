"use server";

import { authedClient } from "@/lib/auth";

export interface SearchItem {
  id: string;
  label: string;
  group: "Guides" | "Essays" | "Universities";
  href: string;
  hint?: string;
}

export async function getSearchIndex(): Promise<SearchItem[]> {
  const { supabase, userId } = await authedClient();
  const [guides, essays, universities] = await Promise.all([
    supabase.from("guides").select("slug, title, category").eq("published", true),
    supabase.from("user_essays").select("id, title").eq("user_id", userId),
    supabase.from("universities").select("id, name, country"),
  ]);

  return [
    ...(guides.data ?? []).map((g) => ({ id: g.slug, label: g.title, group: "Guides" as const, href: `/guides/${g.slug}` })),
    ...(essays.data ?? []).map((e) => ({ id: e.id, label: e.title, group: "Essays" as const, href: `/essays/${e.id}` })),
    ...(universities.data ?? []).map((u) => ({
      id: u.id,
      label: u.name,
      group: "Universities" as const,
      href: `/universities?q=${encodeURIComponent(u.name)}`,
      hint: u.country,
    })),
  ];
}
