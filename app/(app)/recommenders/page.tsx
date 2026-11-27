import Link from "next/link";
import { FileText } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, buttonClass } from "@/components/ui";
import { BRAG_QUESTIONS } from "@/lib/brag-sheet";
import type { CounselorLetter, Recommender, Teacher } from "@/lib/types";
import { CounselorLetterCard } from "./counselor-letter";
import { BragSheet } from "./brag-sheet";
import { RecommenderTracker } from "./recommender-tracker";

export const metadata = { title: "Recommendations" };

export default async function RecommendersPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const [{ data: recs }, { data: sheet }, { data: teachers }, { data: letter }, { data: counselors }] = await Promise.all([
    supabase.from("recommenders").select("*").eq("user_id", profile.id).order("created_at"),
    supabase.from("brag_sheets").select("answers").eq("user_id", profile.id).maybeSingle(),
    supabase.from("teachers").select("id, full_name, email, subject").order("full_name"),
    supabase.from("counselor_letters").select("*").eq("student_id", profile.id).maybeSingle(),
    supabase.from("profiles").select("id, full_name, email").in("role", ["counselor", "admin"]).order("full_name"),
  ]);
  const answers = (sheet?.answers ?? {}) as Record<string, string>;
  const writer = (counselors ?? []).find((c) => c.id === letter?.counselor_id);

  return (
    <>
      <PageHeader
        title="Recommendations"
        description="Fill in your brag sheet, then ask your counsellor for a recommendation. They write it with your brag sheet, activities, honours and university list in front of them."
        action={
          <Link href="/recommenders/brag-sheet" className={buttonClass("secondary")}>
            <FileText className="size-4" />
            Preview brag sheet
          </Link>
        }
      />
      <div className="mb-6">
        <CounselorLetterCard
          letter={(letter ?? null) as CounselorLetter | null}
          counselorName={writer ? writer.full_name ?? writer.email : null}
          counselors={(counselors ?? []).filter((c) => c.id !== profile.id)}
          defaultCounselorId={profile.assigned_counselor_id}
          bragAnswered={BRAG_QUESTIONS.filter((q) => answers[q.id]?.trim()).length}
          bragTotal={BRAG_QUESTIONS.length}
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <RecommenderTracker recommenders={(recs ?? []) as Recommender[]} teachers={(teachers ?? []) as Teacher[]} studentName={profile.full_name ?? ""} />
        <BragSheet initial={answers} />
      </div>
    </>
  );
}
