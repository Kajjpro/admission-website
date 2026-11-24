import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui";
import type { StudyLog, TestScore, TestType } from "@/lib/types";
import { TestingHub } from "./testing-hub";

export const metadata = { title: "Testing" };

export default async function TestingPage({ searchParams }: { searchParams: Promise<{ test?: string }> }) {
  const profile = await requireProfile();
  const { test } = await searchParams;
  const type: TestType = test === "IELTS" ? "IELTS" : "SAT";
  const supabase = await createClient();

  const [scores, logs, guides] = await Promise.all([
    supabase.from("test_scores").select("*").eq("user_id", profile.id).eq("test_type", type).order("test_date"),
    supabase.from("study_logs").select("*").eq("user_id", profile.id).eq("test_type", type).order("logged_on", { ascending: false }).limit(30),
    supabase.from("guides").select("slug, title, summary").eq("category", type.toLowerCase()).eq("published", true),
  ]);

  return (
    <>
      <PageHeader title="Testing" description="Log practice and official scores, track the gap to your target, and keep a study streak." />
      <div className="mb-6 flex gap-1">
        {(["SAT", "IELTS"] as const).map((t) => (
          <Link key={t} href={`?test=${t}`} className={cn("rounded-md px-4 py-1.5 text-sm font-medium", t === type ? "bg-navy text-white" : "text-slate-600 hover:bg-white")}>
            {t}
          </Link>
        ))}
      </div>
      <TestingHub
        key={type}
        type={type}
        target={type === "SAT" ? profile.sat_target : profile.ielts_target}
        scores={(scores.data ?? []) as TestScore[]}
        logs={(logs.data ?? []) as StudyLog[]}
        guides={guides.data ?? []}
      />
    </>
  );
}
