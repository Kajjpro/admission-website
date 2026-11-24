import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import type { University, UserUniversity } from "@/lib/types";
import { UniversityBrowser } from "./university-browser";

export const metadata = { title: "Universities" };

export default async function UniversitiesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const profile = await requireProfile();
  const { q } = await searchParams;
  const supabase = await createClient();

  const [{ data: universities }, { data: list }] = await Promise.all([
    supabase.from("universities").select("*").order("world_rank", { nullsFirst: false }),
    supabase.from("user_universities").select("id, university_id, round, status, notes").eq("user_id", profile.id),
  ]);

  return (
    <>
      <PageHeader
        title="Universities & deadlines"
        description="Fall 2027 entry deadlines for top universities worldwide, ranked by Times Higher Education. Dates marked “estimated” follow last year's pattern; always confirm on the official site before you apply."
      />
      <UniversityBrowser
        universities={(universities ?? []) as University[]}
        myList={(list ?? []) as UserUniversity[]}
        initialQuery={q ?? ""}
        isStudent={profile.role === "student"}
        isAdmin={profile.role === "admin"}
        targetRegions={profile.target_regions}
      />
    </>
  );
}
