import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import type { ProfileSnapshot, ReviewSectionKey } from "@/lib/application";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import { Badge, Card } from "@/components/ui";
import { discardDraftReview } from "@/app/actions/counselor";
import { SnapshotView } from "@/components/profile/snapshot-view";
import { ProfileFeedbackForm } from "./feedback-form";

export const metadata = { title: "Profile review" };

export default async function ProfileReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireStaff();
  const supabase = await createClient();
  const { data } = await supabase.from("profile_reviews").select("*").eq("id", id).single();
  if (!data) notFound();

  const snapshot = data.snapshot as ProfileSnapshot;
  const sections = (data.section_feedback ?? {}) as Partial<Record<ReviewSectionKey, string>>;

  return (
    <div className="space-y-4">
      <Link href={`/counselor/students/${data.student_id}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-navy">
        <ChevronLeft className="size-4" />
        {snapshot.student.name ?? "Student"}
      </Link>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            {data.started_by_counselor ? (
              <>
                <Badge tone={data.status === "draft" ? "amber" : "emerald"}>{data.status === "draft" ? "Draft · student can't see it yet" : "Sent"}</Badge>
                <span>Profile as it was {formatDateTime(data.created_at)}</span>
                {data.status === "draft" && (
                  <form action={discardDraftReview.bind(null, data.id, data.student_id)} className="ml-auto">
                    <button className="text-xs text-slate-500 hover:text-rose-600">Discard draft</button>
                  </form>
                )}
              </>
            ) : (
              <span>Sent by the student {formatDateTime(data.created_at)}</span>
            )}
          </div>
          {data.student_note && (
            <Card className="border-indigo-200 bg-indigo-50 p-4 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Student's question</p>
              <p className="mt-1 text-indigo-950">{data.student_note}</p>
            </Card>
          )}
          <SnapshotView snapshot={snapshot} feedback={sections} />
        </div>
        <div className="lg:sticky lg:top-20 lg:h-fit">
          <ProfileFeedbackForm id={data.id} overall={data.overall_feedback ?? ""} sections={sections} reviewed={data.status === "reviewed"} draft={data.status === "draft"} />
        </div>
      </div>
    </div>
  );
}
