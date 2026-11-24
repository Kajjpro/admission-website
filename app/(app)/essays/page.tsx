import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ESSAY_TYPES, REVIEW_STATUS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import type { Essay } from "@/lib/types";
import { NewEssayForm } from "./new-essay-form";

export const metadata = { title: "Essay Studio" };

export default async function EssaysPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_essays")
    .select("id, title, essay_type, word_count, word_limit, review_status, needs_in_person_meeting, updated_at")
    .eq("user_id", profile.id)
    .order("updated_at", { ascending: false });
  const essays = (data ?? []) as Essay[];

  return (
    <>
      <PageHeader
        title="Essay Studio"
        description="Draft personal statements, study plans and supplements. Send a draft to your counselor when you want feedback."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {essays.length ? (
            <Card className="divide-y divide-line">
              {essays.map((e) => {
                const status = REVIEW_STATUS[e.review_status];
                return (
                  <Link key={e.id} href={`/essays/${e.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-serif text-[17px] font-medium">{e.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {ESSAY_TYPES[e.essay_type].label} · {e.word_count}
                        {e.word_limit ? ` / ${e.word_limit}` : ""} words · edited {formatDate(e.updated_at, { year: undefined })}
                      </p>
                    </div>
                    {e.needs_in_person_meeting && <Badge tone="sky">Meeting</Badge>}
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </Link>
                );
              })}
            </Card>
          ) : (
            <EmptyState title="No essays yet">Start with your personal statement or a study plan.</EmptyState>
          )}
        </div>
        <NewEssayForm />
      </div>
    </>
  );
}
