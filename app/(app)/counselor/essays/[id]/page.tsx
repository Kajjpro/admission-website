import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { getFeedback } from "@/lib/essays";
import { createClient } from "@/lib/supabase/server";
import type { Essay, EssaySubmission } from "@/lib/types";
import { ReviewWorkspace } from "./review-workspace";

export default async function CounselorEssayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireStaff();
  const supabase = await createClient();

  const [{ data: essay }, { data: submissions }, feedback] = await Promise.all([
    supabase.from("user_essays").select("*, student:profiles!user_essays_user_id_fkey(full_name, grade_level)").eq("id", id).single(),
    supabase.from("essay_submissions").select("*").eq("essay_id", id).order("created_at", { ascending: false }),
    getFeedback(id),
  ]);
  if (!essay) notFound();

  return (
    <ReviewWorkspace
      essay={essay as Essay & { student: { full_name: string | null; grade_level: number | null } | null }}
      submissions={(submissions ?? []) as EssaySubmission[]}
      feedback={feedback}
    />
  );
}
