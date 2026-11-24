import Link from "next/link";
import { BookmarkCheck, CircleCheck } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { GUIDE_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Card, PageHeader } from "@/components/ui";
import { SourceBadge } from "@/components/source-badge";
import type { Guide, GuideCategory } from "@/lib/types";

export const metadata = { title: "Guides" };

export default async function GuidesPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const profile = await requireProfile();
  const { category } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("guides").select("id, slug, category, title, summary, source_attribution, reading_time_mins").eq("published", true).order("created_at");
  if (category === "saved") {
    const { data: saved } = await supabase.from("guide_progress").select("guide_id").eq("user_id", profile.id).eq("bookmarked", true);
    query = query.in("id", (saved ?? []).map((s) => s.guide_id));
  } else if (category) {
    query = query.eq("category", category);
  }

  const [{ data: guides }, { data: progress }] = await Promise.all([
    query,
    supabase.from("guide_progress").select("guide_id, bookmarked, completed_at").eq("user_id", profile.id),
  ]);
  const progressById = new Map((progress ?? []).map((p) => [p.guide_id, p]));
  const completed = (progress ?? []).filter((p) => p.completed_at).length;

  const tabs: [string | undefined, string][] = [[undefined, "All"], ...(Object.entries(GUIDE_CATEGORIES) as [GuideCategory, string][]), ["saved", "Saved"]];

  return (
    <>
      <PageHeader
        title="Guides"
        description={`Frameworks and strategies, with every source credited. ${completed} read so far.`}
      />
      <div className="mb-5 flex flex-wrap gap-1">
        {tabs.map(([id, label]) => (
          <Link
            key={label}
            href={id ? `?category=${id}` : "/guides"}
            className={cn("rounded-md px-3 py-1.5 text-sm", category === id ? "bg-navy text-white" : "text-slate-600 hover:bg-white")}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {((guides ?? []) as Guide[]).map((g) => {
          const p = progressById.get(g.id);
          return (
            <Link key={g.id} href={`/guides/${g.slug}`} className="group">
              <Card className="flex h-full flex-col p-5 transition-colors group-hover:border-slate-300">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  {GUIDE_CATEGORIES[g.category]} · {g.reading_time_mins} min
                  <span className="ml-auto flex gap-1.5">
                    {p?.bookmarked && <BookmarkCheck className="size-4 text-accent" />}
                    {p?.completed_at && <CircleCheck className="size-4 text-emerald-600" />}
                  </span>
                </div>
                <h2 className="mt-2 font-serif text-xl font-medium leading-snug">{g.title}</h2>
                {g.summary && <p className="mt-1.5 flex-1 text-sm text-slate-500">{g.summary}</p>}
                {g.source_attribution.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1">
                    {g.source_attribution.map((s) => (
                      <SourceBadge key={s.platform + s.title} source={{ ...s, url: undefined }} />
                    ))}
                  </div>
                )}
              </Card>
            </Link>
          );
        })}
      </div>
      {!guides?.length && <p className="text-sm text-slate-500">No guides here yet.</p>}
    </>
  );
}
