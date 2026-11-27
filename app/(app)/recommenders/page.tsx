import Link from "next/link";
import { FileText } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, buttonClass } from "@/components/ui";
import type { Recommender, Teacher } from "@/lib/types";
import { BragSheet } from "./brag-sheet";
import { RecommenderTracker } from "./recommender-tracker";

export const metadata = { title: "Recommendations" };

export default async function RecommendersPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const [{ data: recs }, { data: sheet }, { data: teachers }] = await Promise.all([
    supabase.from("recommenders").select("*").eq("user_id", profile.id).order("created_at"),
    supabase.from("brag_sheets").select("answers").eq("user_id", profile.id).maybeSingle(),
    supabase.from("teachers").select("id, full_name, email, subject").order("full_name"),
  ]);

  return (
    <>
      <PageHeader
        title="Recommendations"
        description="Fill in your brag sheet once. Each teacher gets a private link with it, plus your activities, honours and university list, so their letter can be specific."
        action={
          <Link href="/recommenders/brag-sheet" className={buttonClass("secondary")}>
            <FileText className="size-4" />
            Preview brag sheet
          </Link>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <RecommenderTracker recommenders={(recs ?? []) as Recommender[]} teachers={(teachers ?? []) as Teacher[]} studentName={profile.full_name ?? ""} />
        <BragSheet initial={(sheet?.answers ?? {}) as Record<string, string>} />
      </div>
    </>
  );
}
