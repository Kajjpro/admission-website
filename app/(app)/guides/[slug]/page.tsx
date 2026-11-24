import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronLeft } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { GUIDE_CATEGORIES } from "@/lib/constants";
import { SourceBadge } from "@/components/source-badge";
import type { Guide } from "@/lib/types";
import { GuideActions } from "./guide-actions";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("guides").select("title").eq("slug", slug).maybeSingle();
  return { title: data?.title ?? "Guide" };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data } = await supabase.from("guides").select("*").eq("slug", slug).single();
  if (!data) notFound();
  const guide = data as Guide;

  const [{ data: progress }, { data: related }] = await Promise.all([
    supabase.from("guide_progress").select("bookmarked, completed_at").eq("user_id", profile.id).eq("guide_id", guide.id).maybeSingle(),
    supabase.from("guides").select("slug, title").eq("category", guide.category).eq("published", true).neq("id", guide.id).limit(4),
  ]);

  return (
    <article className="mx-auto max-w-[720px]">
      <Link href="/guides" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-navy">
        <ChevronLeft className="size-4" />
        Guides
      </Link>

      <header className="mt-6 border-b border-line pb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-accent">{GUIDE_CATEGORIES[guide.category]}</p>
        <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight">{guide.title}</h1>
        {guide.summary && <p className="mt-3 text-lg text-slate-600">{guide.summary}</p>}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">{guide.reading_time_mins} min read</span>
          {guide.source_attribution.map((s) => (
            <SourceBadge key={s.platform + s.title} source={s} />
          ))}
          <GuideActions
            guide={guide}
            related={related ?? []}
            bookmarked={progress?.bookmarked ?? false}
            completed={Boolean(progress?.completed_at)}
          />
        </div>
      </header>

      <div className="prose-guide mt-8">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{guide.content_markdown}</ReactMarkdown>
      </div>

      {guide.source_attribution.length > 0 && (
        <p className="mt-12 border-t border-line pt-4 text-xs leading-relaxed text-slate-500">
          This guide summarizes methods from{" "}
          {guide.source_attribution.map((s, i) => (
            <span key={s.platform + s.title}>
              {i > 0 && (i === guide.source_attribution.length - 1 ? " and " : ", ")}
              <span className="font-medium text-slate-700">{s.platform}</span>
              {s.author && ` (${s.author})`}
            </span>
          ))}
          . See the original sources for the full material.
        </p>
      )}
    </article>
  );
}
