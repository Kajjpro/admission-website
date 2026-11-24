import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { RESOURCE_SECTIONS } from "@/lib/resources";
import { createClient } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/ui";
import { SourceBadge } from "@/components/source-badge";
import type { Guide } from "@/lib/types";

export const metadata = { title: "Resources" };

export default async function ResourcesPage() {
  await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("guides")
    .select("slug, title, summary, category, source_attribution, reading_time_mins")
    .eq("published", true);
  const guides = (data ?? []) as Guide[];
  const bySlug = new Map(guides.map((g) => [g.slug, g]));

  return (
    <>
      <PageHeader
        title="Resources"
        description="Every guide in this platform and the best free outside resources, in one place. Our guides credit Stoic Edu, College Essay Guy and Hack the College Essay where their methods are used."
      />
      <nav className="mb-6 flex flex-wrap gap-1">
        {RESOURCE_SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-white">{s.title}</a>
        ))}
      </nav>

      <div className="space-y-10">
        {RESOURCE_SECTIONS.map((section) => {
          const ours = section.guideSlugs
            ? section.guideSlugs.map((slug) => bySlug.get(slug)).filter((g): g is Guide => Boolean(g))
            : guides.filter((g) => section.guideCategories?.includes(g.category));
          return (
            <section key={section.id} id={section.id} className="scroll-mt-20">
              <h2 className="font-serif text-2xl font-medium">{section.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{section.description}</p>

              {ours.length > 0 && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {ours.map((g) => (
                    <Link key={g.slug} href={`/guides/${g.slug}`} className="group">
                      <Card className="flex h-full flex-col p-4 transition-colors group-hover:border-slate-300">
                        <p className="text-sm font-semibold">{g.title}</p>
                        {g.summary && <p className="mt-1 flex-1 text-xs text-slate-500">{g.summary}</p>}
                        <div className="mt-3 flex flex-wrap items-center gap-1">
                          <span className="mr-1 text-[11px] text-slate-400">{g.reading_time_mins} min</span>
                          {g.source_attribution.map((s) => <SourceBadge key={s.platform + s.title} source={{ ...s, url: undefined }} />)}
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}

              {section.links.length > 0 && (
                <Card className="mt-4 divide-y divide-line">
                  {section.links.map((l) => (
                    <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{l.title}</p>
                        <p className="text-xs text-slate-500">{l.note}</p>
                      </div>
                      <span className="shrink-0 text-xs text-slate-400">{l.source}</span>
                      <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                    </a>
                  ))}
                </Card>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
