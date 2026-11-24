import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import type { Recommender } from "@/lib/types";
import { BragSheet } from "./brag-sheet";
import { RecommenderTracker } from "./recommender-tracker";

export const metadata = { title: "Recommendations" };

export default async function RecommendersPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const [{ data: recs }, { data: sheet }] = await Promise.all([
    supabase.from("recommenders").select("*").eq("user_id", profile.id).order("created_at"),
    supabase.from("brag_sheets").select("answers").eq("user_id", profile.id).maybeSingle(),
  ]);

  return (
    <>
      <PageHeader
        title="Recommendations"
        description="Track who you've asked and give them what they need to write a specific letter."
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <RecommenderTracker recommenders={(recs ?? []) as Recommender[]} />
        <BragSheet initial={(sheet?.answers ?? {}) as Record<string, string>} studentName={profile.full_name ?? ""} />
      </div>
    </>
  );
}
