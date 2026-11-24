import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fetchAll } from "@/lib/fetch-all";
import { PageHeader } from "@/components/ui";
import type { AdmissionResult, University, UserUniversity } from "@/lib/types";
import { AdmissionResults } from "./admission-results";
import { UniversityBrowser } from "./university-browser";

export const metadata = { title: "Universities" };

export default async function UniversitiesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const profile = await requireProfile();
  const { q } = await searchParams;
  const supabase = await createClient();

  const [universities, { data: list }, { data: scores }, { data: results }] = await Promise.all([
    fetchAll<University>((from, to) => supabase.from("universities").select("*").order("world_rank", { nullsFirst: false }).order("id").range(from, to)),
    supabase.from("user_universities").select("id, university_id, round, status, notes").eq("user_id", profile.id),
    supabase.from("test_scores").select("test_type, total_score").eq("user_id", profile.id),
    supabase.from("admission_results").select("*").order("class_year", { ascending: false }).order("created_at", { ascending: false }).limit(60),
  ]);

  const best = (type: string) => {
    const values = (scores ?? []).filter((s) => s.test_type === type).map((s) => Number(s.total_score));
    return values.length ? Math.max(...values) : null;
  };

  return (
    <>
      <PageHeader
        title="Universities"
        description={`${universities.length.toLocaleString("en-US")} universities. Acceptance rates, SAT ranges and costs for U.S. colleges come from the U.S. Department of Education. Deadlines and requirements are researched for ${universities.filter((u) => u.curated).length} top universities worldwide.`}
      />
      <AdmissionResults results={(results ?? []) as AdmissionResult[]} />
      <UniversityBrowser
        universities={universities}
        myList={(list ?? []) as UserUniversity[]}
        initialQuery={q ?? ""}
        isStudent={profile.role === "student"}
        isAdmin={profile.role === "admin"}
        targetRegions={profile.target_regions}
        bestSat={best("SAT")}
        bestIelts={best("IELTS")}
      />
    </>
  );
}
