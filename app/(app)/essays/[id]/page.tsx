import { notFound, redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { getFeedback } from "@/lib/essays";
import { ESSAY_HELP } from "@/lib/essay-prompts";
import { createClient } from "@/lib/supabase/server";
import type { Essay, EssaySubmission, Guide } from "@/lib/types";
import { EssayEditor } from "./essay-editor";

export default async function EssayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: essay } = await supabase.from("user_essays").select("*").eq("id", id).single();
  if (!essay) notFound();
  if (essay.user_id !== profile.id) redirect(`/counselor/essays/${id}`);

  const help = ESSAY_HELP[(essay as Essay).essay_type];
  const [feedback, counselors, guides, submission] = await Promise.all([
    getFeedback(id),
    supabase.from("profiles").select("id, full_name").in("role", ["counselor", "admin"]).order("full_name"),
    supabase
      .from("guides")
      .select("slug, title, summary, category, source_attribution, reading_time_mins")
      .in("category", help.guideCategories)
      .eq("published", true),
    supabase.from("essay_submissions").select("*").eq("essay_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  return (
    <EssayEditor
      essay={essay as Essay}
      feedback={feedback}
      counselors={counselors.data ?? []}
      defaultCounselorId={profile.assigned_counselor_id}
      guides={(guides.data ?? []) as Guide[]}
      latestSubmission={submission.data as EssaySubmission | null}
    />
  );
}
